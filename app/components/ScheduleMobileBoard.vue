<template>
    <div class="smb-root">
        <div class="smb-grid" :style="{ gridTemplateColumns: `52px repeat(${staffMembers.length}, minmax(150px, 1fr))` }">
            <div class="smb-corner"></div>

            <div v-for="staff in staffMembers" :key="`head-${staff.id}`" class="smb-head">
                <span class="smb-head-avatar">
                    <img
                        v-if="isPro && staff.avatar_url"
                        :src="staff.avatar_url"
                        :style="{ objectPosition: staff.avatar_position }"
                        :alt="staff.name"
                    />
                    <template v-else>{{ initials(staff.name) }}</template>
                </span>
                <span class="smb-head-name">{{ staff.name }}</span>
            </div>

            <div class="smb-time-axis" :style="{ height: `${totalHeight}px` }">
                <span
                    v-for="slot in timeSlots"
                    v-show="slot.minutes > 0"
                    :key="slot.minutes"
                    class="smb-time-label"
                    :style="{ top: `${slot.minutes * PX_PER_MINUTE}px` }"
                >
                    {{ slot.label }}
                </span>
            </div>

            <div
                v-for="staff in staffMembers"
                :key="`col-${staff.id}`"
                class="smb-column"
                :style="{ height: `${totalHeight}px`, '--smb-slot-height': `${slotHeightPx}px` }"
                @click.self="(event) => handleColumnClick(event, staff.id)"
            >
                <div
                    v-for="wh in workingHoursByStaff[staff.id] || []"
                    :key="`wh-${wh.id}`"
                    class="smb-working-hour"
                    :style="workingHourStyle(wh)"
                ></div>

                <div
                    v-for="item in layoutItemsByStaff[staff.id] || []"
                    :key="item.key"
                    class="smb-event"
                    :style="eventStyle(
                        item.start_at,
                        item.end_at,
                        item.type === 'block'
                            ? blockColors
                            : getAppointmentColors(item.source as Appointment, (item.source as Appointment).id === nextAppointmentId),
                        item.column,
                        item.columnCount
                    )"
                    @click="item.type === 'block' ? $emit('open-block', item.source as StaffBlock) : $emit('open-appointment', item.source as Appointment)"
                >
                    <template v-if="item.type === 'block'">
                        <strong>{{ (item.source as StaffBlock).reason || 'Bloqueado' }}</strong>
                    </template>
                    <template v-else>
                        <strong>{{ (item.source as Appointment).service_name || 'Marcação' }}</strong>
                        <span>{{ (item.source as Appointment).customer_name }}</span>
                    </template>
                </div>
            </div>

            <div v-if="nowLineTop !== null" class="smb-now-line" :style="{ top: `${HEADER_HEIGHT + nowLineTop}px` }">
                <span class="smb-now-dot"></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getAppointmentColors, getBlockColors, findNextAppointmentId } from '~/utils/scheduleColors'
import type {
    Appointment,
    StaffBlock,
    StaffMember,
    WorkingHour,
} from '~/types/schedule'

const props = defineProps<{
    staffMembers: StaffMember[]
    appointments: Appointment[]
    blocks: StaffBlock[]
    workingHours: WorkingHour[]
    date: string
    slotIntervalMinutes: number
    isPro: boolean
}>()

const emit = defineEmits<{
    'open-appointment': [appointment: Appointment]
    'open-block': [block: StaffBlock]
    'create-at': [payload: { staffId: number; time: string }]
}>()

const START_HOUR = 7
const END_HOUR = 22
const PX_PER_MINUTE = 1.4
const HEADER_HEIGHT = 56
const totalHeight = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE
const slotHeightPx = computed(() => (props.slotIntervalMinutes > 0 ? props.slotIntervalMinutes : 30) * PX_PER_MINUTE)

const blockColors = getBlockColors()

const timeSlots = computed(() => {
    const slots: { minutes: number; label: string }[] = []
    const totalMinutes = (END_HOUR - START_HOUR) * 60
    const interval = props.slotIntervalMinutes > 0 ? props.slotIntervalMinutes : 30

    for (let minutes = 0; minutes < totalMinutes; minutes += interval) {
        const hour = START_HOUR + Math.floor(minutes / 60)
        const minute = minutes % 60

        slots.push({
            minutes,
            label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        })
    }

    return slots
})

const groupByStaff = <T extends { staff_member: number }>(items: T[]) => {
    const grouped: Record<number, T[]> = {}

    for (const item of items) {
        if (!grouped[item.staff_member]) {
            grouped[item.staff_member] = []
        }

        grouped[item.staff_member]!.push(item)
    }

    return grouped
}

const workingHoursByStaff = computed(() => groupByStaff(props.workingHours))
const blocksByStaff = computed(() => groupByStaff(props.blocks))
const appointmentsByStaff = computed(() => groupByStaff(props.appointments))

const nextAppointmentId = computed(() => findNextAppointmentId(props.appointments))

type LayoutItem = {
    key: string
    type: 'block' | 'appointment'
    start_at: string
    end_at: string
    source: StaffBlock | Appointment
    column: number
    columnCount: number
}

// Algoritmo de "sweep": agrupa eventos que se sobrepõem no tempo (mesmo
// colaborador) em clusters, e dentro de cada cluster atribui uma coluna a
// cada evento para ficarem lado-a-lado em vez de empilhados uns por cima
// dos outros (o que tornava alguns impossíveis de clicar).
const layoutStaffEvents = (blocksForStaff: StaffBlock[], appointmentsForStaff: Appointment[]): LayoutItem[] => {
    const raw = [
        ...blocksForStaff.map((block) => ({
            key: `block-${block.uuid}`,
            type: 'block' as const,
            source: block as StaffBlock | Appointment,
            start_at: block.start_at,
            end_at: block.end_at,
            startMinutes: minutesFromMidnight(block.start_at),
            endMinutes: minutesFromMidnight(block.end_at),
        })),
        ...appointmentsForStaff.map((appointment) => ({
            key: `appt-${appointment.uuid}`,
            type: 'appointment' as const,
            source: appointment as StaffBlock | Appointment,
            start_at: appointment.start_at,
            end_at: appointment.end_at,
            startMinutes: minutesFromMidnight(appointment.start_at),
            endMinutes: minutesFromMidnight(appointment.end_at),
        })),
    ].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)

    const result: LayoutItem[] = []
    let group: (typeof raw[number] & { column: number })[] = []
    let groupEnd = -Infinity
    let columnEnds: number[] = []

    const flushGroup = () => {
        if (!group.length) {
            return
        }

        const columnCount = Math.max(...group.map((item) => item.column)) + 1

        for (const item of group) {
            result.push({
                key: item.key,
                type: item.type,
                start_at: item.start_at,
                end_at: item.end_at,
                source: item.source,
                column: item.column,
                columnCount,
            })
        }

        group = []
    }

    for (const item of raw) {
        if (item.startMinutes >= groupEnd) {
            flushGroup()
            columnEnds = []
            groupEnd = -Infinity
        }

        let column = columnEnds.findIndex((end) => item.startMinutes >= end)

        if (column === -1) {
            column = columnEnds.length
        }

        columnEnds[column] = item.endMinutes
        groupEnd = Math.max(groupEnd, item.endMinutes)

        group.push({ ...item, column })
    }

    flushGroup()

    return result
}

const layoutItemsByStaff = computed(() => {
    const map: Record<number, LayoutItem[]> = {}

    for (const staff of props.staffMembers) {
        map[staff.id] = layoutStaffEvents(
            blocksByStaff.value[staff.id] || [],
            appointmentsByStaff.value[staff.id] || [],
        )
    }

    return map
})

const formatDateInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const now = ref(new Date())
let nowIntervalId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
    nowIntervalId = setInterval(() => {
        now.value = new Date()
    }, 30000)
})

onBeforeUnmount(() => {
    if (nowIntervalId) {
        clearInterval(nowIntervalId)
    }
})

const nowLineTop = computed(() => {
    if (props.date !== formatDateInput(now.value)) {
        return null
    }

    const minutes = now.value.getHours() * 60 + now.value.getMinutes() - START_HOUR * 60

    if (minutes < 0 || minutes > (END_HOUR - START_HOUR) * 60) {
        return null
    }

    return minutes * PX_PER_MINUTE
})

const initials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean)

    if (!words.length) {
        return 'TF'
    }

    return words
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
}

const minutesFromMidnight = (iso: string) => {
    const date = new Date(iso)
    return date.getHours() * 60 + date.getMinutes()
}

const workingHourStyle = (wh: WorkingHour) => {
    const [startHour, startMinute] = wh.start_time.split(':').map(Number)
    const [endHour, endMinute] = wh.end_time.split(':').map(Number)

    const startMinutes = startHour * 60 + startMinute - START_HOUR * 60
    const endMinutes = endHour * 60 + endMinute - START_HOUR * 60

    const top = Math.max(0, startMinutes) * PX_PER_MINUTE
    const height = Math.max(0, endMinutes - Math.max(0, startMinutes)) * PX_PER_MINUTE

    return {
        top: `${top}px`,
        height: `${height}px`,
    }
}

const eventStyle = (
    startAt: string,
    endAt: string,
    colors: { backgroundColor: string; borderColor: string; textColor: string },
    column = 0,
    columnCount = 1,
) => {
    const startMinutes = minutesFromMidnight(startAt) - START_HOUR * 60
    const endMinutes = minutesFromMidnight(endAt) - START_HOUR * 60

    const clampedStart = Math.max(0, Math.min(startMinutes, (END_HOUR - START_HOUR) * 60))
    const clampedEnd = Math.max(clampedStart, Math.min(endMinutes, (END_HOUR - START_HOUR) * 60))

    const widthPercent = 100 / columnCount
    const leftPercent = widthPercent * column

    return {
        top: `${clampedStart * PX_PER_MINUTE}px`,
        height: `${Math.max(18, (clampedEnd - clampedStart) * PX_PER_MINUTE)}px`,
        left: `calc(${leftPercent}% + 3px)`,
        width: `calc(${widthPercent}% - 6px)`,
        background: colors.backgroundColor,
        borderColor: colors.borderColor,
        color: colors.textColor,
    }
}

// Clicar numa área vazia da coluna (não num evento já existente, por isso o
// listener usa `.self`) calcula a que hora corresponde essa posição e avisa
// o pai para abrir a modal de criar já com essa hora preenchida.
const handleColumnClick = (event: MouseEvent, staffId: number) => {
    const column = event.currentTarget as HTMLElement
    const rect = column.getBoundingClientRect()
    const offsetMinutes = (event.clientY - rect.top) / PX_PER_MINUTE

    const interval = props.slotIntervalMinutes > 0 ? props.slotIntervalMinutes : 30
    const maxMinutes = (END_HOUR - START_HOUR) * 60 - interval
    const roundedMinutes = Math.min(
        Math.max(0, Math.round(offsetMinutes / interval) * interval),
        Math.max(0, maxMinutes)
    )

    const hour = START_HOUR + Math.floor(roundedMinutes / 60)
    const minute = roundedMinutes % 60
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    emit('create-at', { staffId, time })
}
</script>

<style scoped>
.smb-root {
    width: 100%;
    height: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: var(--tf-white);
}

.smb-grid {
    position: relative;
    display: grid;
    grid-template-rows: 56px auto;
    width: max-content;
    min-width: 100%;
}

.smb-corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 4;
    background: var(--tf-white);
    border-bottom: 1px solid var(--tf-border);
    border-right: 1px solid var(--tf-border);
    box-shadow: 2px 0 6px rgba(11, 11, 15, 0.08);
}

.smb-head {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 150px;
    padding: 0 10px;
    background: var(--tf-white);
    border-bottom: 1px solid var(--tf-border);
    border-left: 1px solid var(--tf-border);
}

.smb-head-avatar {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 10px;
    font-weight: 900;
    overflow: hidden;
}

.smb-head-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.smb-head-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 800;
}

.smb-time-axis {
    position: sticky;
    left: 0;
    z-index: 2;
    width: 52px;
    background: var(--tf-white);
    border-right: 1px solid var(--tf-border);
    box-shadow: 2px 0 6px rgba(11, 11, 15, 0.08);
}

.smb-time-label {
    position: absolute;
    transform: translateY(-50%);
    padding-right: 8px;
    width: 100%;
    text-align: right;
    font-family: var(--tf-mono);
    font-size: 9px;
    color: var(--tf-muted);
}

.smb-column {
    position: relative;
    min-width: 150px;
    border-left: 1px solid var(--tf-border);
    background-image: repeating-linear-gradient(
        to bottom,
        var(--tf-border) 0,
        var(--tf-border) 1px,
        transparent 1px,
        transparent var(--smb-slot-height, 42px)
    );
}

.smb-working-hour {
    position: absolute;
    left: 0;
    right: 0;
    background: rgba(194, 232, 0, 0.16);
    pointer-events: none;
}

.smb-event {
    position: absolute;
    overflow: hidden;
    padding: 4px 6px;
    border: 1px solid;
    border-radius: 8px;
    cursor: pointer;
}

.smb-event strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.2;
}

.smb-event span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    opacity: 0.8;
}

.smb-now-line {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 6;
    height: 0;
    border-top: 2px solid #ff5c35;
    pointer-events: none;
}

.smb-now-dot {
    position: absolute;
    top: -4px;
    left: 46px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff5c35;
}
</style>
