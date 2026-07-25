<template>
    <Teleport to="body">
        <div v-if="open" class="dp-overlay" @click.self="close">
            <div class="dp-card">
                <button class="dp-close" type="button" aria-label="Fechar" @click="close">×</button>

                <div class="dp-header">
                    <button type="button" class="dp-nav" aria-label="Mês anterior" :disabled="!canGoPrevMonth" @click="prevMonth">‹</button>
                    <span class="dp-title">{{ monthLabel }}</span>
                    <button type="button" class="dp-nav" aria-label="Mês seguinte" :disabled="!canGoNextMonth" @click="nextMonth">›</button>
                </div>

                <div class="dp-weekdays">
                    <span v-for="(label, index) in weekdayLabels" :key="index">{{ label }}</span>
                </div>

                <div class="dp-days">
                    <button
                        v-for="cell in dayCells"
                        :key="cell.iso"
                        type="button"
                        class="dp-day"
                        :class="{
                            'dp-day-muted': !cell.inMonth,
                            'dp-day-selected': cell.iso === selected,
                            'dp-day-today': cell.iso === todayIso && cell.iso !== selected,
                            'dp-day-disabled': cell.disabled,
                        }"
                        :disabled="cell.disabled"
                        @click="pick(cell.iso)"
                    >
                        {{ cell.day }}
                    </button>
                </div>

                <div class="dp-footer">
                    <button type="button" class="dp-link" :disabled="isTodayDisabled" @click="pick(todayIso)">Hoje</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
    open: boolean
    selected: string
    minIso?: string
    maxIso?: string
    unavailableDates?: string[]
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    select: [iso: string]
    'visible-range-change': [range: { start: string; end: string }]
}>()

const formatIso = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const todayIso = formatIso(new Date())

const parseIso = (iso: string) => {
    return iso ? new Date(`${iso}T00:00:00`) : new Date()
}

const viewDate = ref(parseIso(props.selected))

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            viewDate.value = parseIso(props.selected)
        }
    }
)

const monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(viewDate.value)
    return label.charAt(0).toUpperCase() + label.slice(1)
})

const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const unavailableSet = computed(() => new Set(props.unavailableDates || []))

const isDisabledIso = (iso: string) => {
    return Boolean(
        (props.minIso && iso < props.minIso)
        || (props.maxIso && iso > props.maxIso)
        || unavailableSet.value.has(iso)
    )
}

const dayCells = computed(() => {
    const year = viewDate.value.getFullYear()
    const month = viewDate.value.getMonth()

    const firstOfMonth = new Date(year, month, 1)
    // weekdayLabels começa ao domingo (getDay() já devolve 0 para domingo),
    // por isso não se remapeia para semana começada à segunda-feira.
    const startOffset = firstOfMonth.getDay()
    const gridStart = new Date(year, month, 1 - startOffset)

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + index)
        const iso = formatIso(date)

        return {
            day: date.getDate(),
            iso,
            inMonth: date.getMonth() === month,
            disabled: isDisabledIso(iso),
        }
    })
})

const isTodayDisabled = computed(() => isDisabledIso(todayIso))

// Emite os limites do mês visível (não a grelha de 42 células, que
// transborda para o mês anterior/seguinte) para o pai poder pedir e
// guardar em cache a disponibilidade por mês em vez de recalcular a
// grelha inteira sempre que o calendário abre ou muda de mês.
const monthRange = computed(() => {
    const year = viewDate.value.getFullYear()
    const month = viewDate.value.getMonth()

    return {
        start: formatIso(new Date(year, month, 1)),
        end: formatIso(new Date(year, month + 1, 0)),
    }
})

watch(
    [monthRange, () => props.open],
    ([range, isOpen]) => {
        if (isOpen) {
            emit('visible-range-change', range)
        }
    },
    { immediate: true }
)

const canGoPrevMonth = computed(() => {
    if (!props.minIso) {
        return true
    }

    const minDate = parseIso(props.minIso)
    return viewDate.value.getFullYear() > minDate.getFullYear()
        || (viewDate.value.getFullYear() === minDate.getFullYear() && viewDate.value.getMonth() > minDate.getMonth())
})

const canGoNextMonth = computed(() => {
    if (!props.maxIso) {
        return true
    }

    const maxDate = parseIso(props.maxIso)
    return viewDate.value.getFullYear() < maxDate.getFullYear()
        || (viewDate.value.getFullYear() === maxDate.getFullYear() && viewDate.value.getMonth() < maxDate.getMonth())
})

const prevMonth = () => {
    if (!canGoPrevMonth.value) {
        return
    }

    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
    if (!canGoNextMonth.value) {
        return
    }

    viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

const pick = (iso: string) => {
    if (isDisabledIso(iso)) {
        return
    }

    emit('select', iso)
    emit('update:open', false)
}

const close = () => {
    emit('update:open', false)
}
</script>

<style scoped>
.dp-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(11, 11, 15, 0.55);
}

.dp-card {
    position: relative;
    width: 100%;
    max-width: 340px;
    padding: 28px 24px 20px;
    border-radius: 24px;
    background: var(--tf-white);
    box-shadow: 0 40px 90px -30px rgba(11, 11, 15, 0.5);
}

.dp-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 30px;
    height: 30px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

.dp-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 18px;
}

.dp-title {
    min-width: 140px;
    text-align: center;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.dp-nav {
    width: 30px;
    height: 30px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-weight: 900;
    font-size: 15px;
    cursor: pointer;
}

.dp-nav:hover {
    border-color: var(--tf-black);
}

.dp-nav:disabled,
.dp-link:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.dp-nav:disabled:hover {
    border-color: var(--tf-border);
}

.dp-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 4px;
}

.dp-weekdays span {
    display: grid;
    place-items: center;
    height: 28px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--tf-muted);
}

.dp-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.dp-day {
    display: grid;
    place-items: center;
    height: 38px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--tf-ink);
    font-family: var(--tf-sans);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.dp-day:hover {
    background: var(--tf-bg);
}

.dp-day-muted {
    color: var(--tf-muted);
    opacity: 0.5;
}

.dp-day-disabled {
    color: var(--tf-muted);
    opacity: 0.3;
    cursor: not-allowed;
}

.dp-day-disabled:hover {
    background: transparent;
}

.dp-day-today {
    border: 1px solid var(--tf-black);
}

.dp-day-selected {
    background: var(--tf-accent);
    color: var(--tf-black);
    font-weight: 900;
}

.dp-footer {
    display: flex;
    justify-content: center;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--tf-border);
}

.dp-link {
    border: 0;
    background: transparent;
    color: var(--tf-black);
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
}
</style>
