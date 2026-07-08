<template>
    <button type="button" class="input date-field-trigger" @click="isOpen = true">
        <span>{{ displayLabel }}</span>

        <svg class="date-field-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.6" />
            <path d="M3 8H17" stroke="currentColor" stroke-width="1.6" />
            <path d="M7 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <path d="M13 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
    </button>

    <DatePickerModal
        :open="isOpen"
        :selected="modelValue || todayIso"
        @update:open="isOpen = $event"
        @select="handleSelect"
    />
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const formatIso = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const todayIso = formatIso(new Date())

const displayLabel = computed(() => {
    if (!props.modelValue) {
        return 'Escolher data'
    }

    const date = new Date(`${props.modelValue}T00:00:00`)
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
})

const handleSelect = (iso: string) => {
    emit('update:modelValue', iso)
}
</script>

<style scoped>
.date-field-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    appearance: none;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
}

.date-field-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: var(--tf-muted);
}
</style>
