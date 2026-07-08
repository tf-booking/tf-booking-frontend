<template>
    <div class="time-select">
        <select class="input" :value="hour" @change="onHourChange($event)">
            <option v-for="h in hourOptions" :key="h" :value="h">{{ h }}</option>
        </select>

        <span class="time-select-sep">:</span>

        <select class="input" :value="minute" @change="onMinuteChange($event)">
            <option v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</option>
        </select>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    modelValue: string
    step?: number
}>(), {
    step: 5,
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

const parts = computed(() => {
    const [h, m] = (props.modelValue || '00:00').split(':')

    return {
        hour: h ? h.padStart(2, '0') : '00',
        minute: m ? m.padStart(2, '0') : '00',
    }
})

const hour = computed(() => parts.value.hour)
const minute = computed(() => parts.value.minute)

const minuteOptions = computed(() => {
    const step = props.step > 0 ? props.step : 5
    const count = Math.max(1, Math.floor(60 / step))
    const options = Array.from({ length: count }, (_, i) => String(i * step).padStart(2, '0'))

    if (!options.includes(minute.value)) {
        options.push(minute.value)
        options.sort()
    }

    return options
})

const emitValue = (nextHour: string, nextMinute: string) => {
    emit('update:modelValue', `${nextHour}:${nextMinute}`)
}

const onHourChange = (event: Event) => {
    emitValue((event.target as HTMLSelectElement).value, minute.value)
}

const onMinuteChange = (event: Event) => {
    emitValue(hour.value, (event.target as HTMLSelectElement).value)
}
</script>

<style scoped>
.time-select {
    display: flex;
    align-items: center;
    gap: 6px;
}

.time-select .input {
    flex: 1;
    min-width: 0;
    padding: 0 8px;
    text-align: center;
}

.time-select-sep {
    font-weight: 900;
    color: var(--tf-muted);
}
</style>
