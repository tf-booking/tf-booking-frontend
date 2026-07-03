<template>
    <div class="smb-root">
        <div class="smb-grid" :style="{ gridTemplateColumns: `52px repeat(${staffMembers.length}, minmax(150px, 1fr))` }">
            <div class="smb-corner"></div>

            <div v-for="staff in staffMembers" :key="`head-${staff.id}`" class="smb-head">
                <span class="smb-head-avatar">{{ initials(staff.name) }}</span>
                <span class="smb-head-name">{{ staff.name }}</span>
            </div>

            <div class="smb-time-axis" :style="{ height: `${totalHeight}px` }">
                <span
                    v-for="slot in timeSlots"
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
                :style="{ height: `${totalHeight}px` }"
            >
                <div
                    v-for="wh in workingHoursByStaff[staff.id] || []"
                    :key="`wh-${wh.id}`"
                    class="smb-working-hour"
                    :style="workingHourStyle(wh)"
                ></div>

                <div
                    v-for="block in blocksByStaff[staff.id] || []"
                    :key="`block-${block.uuid}`"
                    class="smb-event"
                    :style="eventStyle(block.start_at, block.end_at, blockColors)"
                    @click="$emit('open-block', block)"
                >
                    <strong>{{ block.reason || 'Bloqueado' }}</strong>
                </div>

                <div
                    v-for="appointment in appointmentsByStaff[staff.id] || []"
                    :key="`appt-${appointment.uuid}`"
                    class="smb-event"
                    :style="eventStyle(
                        appointment.start_at,
                        appointment.end_at,
                        getAppointmentColors(appointment, appointment.id === nextAppointmentId)
                    )"
                    @click="$emit('open-appointment', appointment)"
                >
                    <strong>{{ appointment.service_name || 'Marcação' }}</strong>
                    <span>{{ appointment.customer_name }}</span>
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
}>()

defineEmits<{
    'open-appointment': [appointment: Appointment]
    'open-block': [block: StaffBlock]
}>()

const START_HOUR = 7
const END_HOUR = 22
const PX_PER_MINUTE = 1.4
const HEADER_HEIGHT = 56
const totalHeight = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE

const blockColors = getBlockColors()

const timeSlots = computed(() => {
    const slots: { minutes: number; label: string }[] = []

    for (let hour = START_HOUR; hour <= END_HOUR; hour += 1) {
        for (const minute of [0, 30]) {
            if (hour === END_HOUR && minute === 30) {
                continue
            }

            const totalMinutes = (hour - START_HOUR) * 60 + minute
            slots.push({
                minutes: totalMinutes,
                label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            })
        }
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

const eventStyle = (startAt: string, endAt: string, colors: { backgroundColor: string; borderColor: string; textColor: string }) => {
    const startMinutes = minutesFromMidnight(startAt) - START_HOUR * 60
    const endMinutes = minutesFromMidnight(endAt) - START_HOUR * 60

    const clampedStart = Math.max(0, Math.min(startMinutes, (END_HOUR - START_HOUR) * 60))
    const clampedEnd = Math.max(clampedStart, Math.min(endMinutes, (END_HOUR - START_HOUR) * 60))

    return {
        top: `${clampedStart * PX_PER_MINUTE}px`,
        height: `${Math.max(18, (clampedEnd - clampedStart) * PX_PER_MINUTE)}px`,
        background: colors.backgroundColor,
        borderColor: colors.borderColor,
        color: colors.textColor,
    }
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
        transparent 42px
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
    left: 3px;
    right: 3px;
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
