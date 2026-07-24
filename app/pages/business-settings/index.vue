<template>
    <div class="page settings-page">
        <section class="container">
            <div class="settings-head">
                <p class="tf-eyebrow">{{ currentBusiness?.business_name || 'Negócio' }}</p>
                <h1>Definições da agenda</h1>
                <p>Controla quando os clientes podem marcar e como os horários aparecem na página de marcações.</p>
            </div>

            <div v-if="isLoading" class="card state-card">
                A carregar definições...
            </div>

            <div v-else class="settings-grid">
                <article class="card">
                    <h2>Antecedência mínima</h2>
                    <p class="card-hint">
                        O cliente não pode marcar para daqui a menos do que este período.
                    </p>

                    <select v-model="minNoticeSelect" class="input">
                        <option v-for="option in minNoticeOptions" :key="option.value" :value="String(option.value)">
                            {{ option.label }}
                        </option>
                        <option value="custom">Personalizado</option>
                    </select>

                    <div v-if="minNoticeSelect === 'custom'" class="custom-field">
                        <input
                            v-model.number="form.min_booking_notice_minutes"
                            class="input"
                            type="number"
                            min="0"
                            step="5"
                        />
                        <span class="custom-suffix">minutos</span>
                    </div>
                </article>

                <article class="card">
                    <h2>Antecedência máxima</h2>
                    <p class="card-hint">
                        O cliente não pode marcar para depois deste período a partir de hoje.
                    </p>

                    <select v-model="maxHorizonSelect" class="input">
                        <option v-for="option in maxHorizonOptions" :key="option.value" :value="String(option.value)">
                            {{ option.label }}
                        </option>
                        <option value="custom">Personalizado</option>
                    </select>

                    <div v-if="maxHorizonSelect === 'custom'" class="custom-field">
                        <input
                            v-model.number="form.max_booking_horizon_days"
                            class="input"
                            type="number"
                            min="1"
                            step="1"
                        />
                        <span class="custom-suffix">dias</span>
                    </div>
                </article>

                <article class="card">
                    <h2>Intervalos de tempo na agenda</h2>
                    <p class="card-hint">
                        Define de quanto em quanto tempo aparecem os horários (ex.: 1h mostra 8h, 9h, 10h...).
                    </p>

                    <select v-model="slotIntervalSelect" class="input">
                        <option v-for="option in slotIntervalOptions" :key="option.value" :value="String(option.value)">
                            {{ option.label }}
                        </option>
                        <option value="custom">Personalizado</option>
                    </select>

                    <div v-if="slotIntervalSelect === 'custom'" class="custom-field">
                        <input
                            v-model.number="form.slot_interval_minutes"
                            class="input"
                            type="number"
                            min="1"
                            step="5"
                        />
                        <span class="custom-suffix">minutos</span>
                    </div>
                </article>

                <article class="card">
                    <h2>Otimização do agendamento</h2>
                    <p class="card-hint">
                        Escolhe como os horários disponíveis são calculados e mostrados ao cliente.
                    </p>

                    <label class="radio-option">
                        <input v-model="form.scheduling_optimization" type="radio" name="optimization" value="fixed" />
                        <span>
                            <strong>Intervalos fixos</strong>
                            <small>Mostra sempre os horários seguindo o intervalo definido acima.</small>
                        </span>
                    </label>

                    <label class="radio-option">
                        <input v-model="form.scheduling_optimization" type="radio" name="optimization" value="smart" />
                        <span>
                            <strong>Otimização inteligente</strong>
                            <small>Mostra todos os horários realmente disponíveis, evitando buracos na agenda.</small>
                        </span>
                    </label>
                </article>

                <article class="card">
                    <h2>Lembrete de marcação</h2>
                    <p class="card-hint">
                        Quando é que o cliente recebe o lembrete da marcação por email.
                    </p>

                    <select v-model="reminderSelect" class="input">
                        <option v-for="option in reminderOptions" :key="option.value" :value="String(option.value)">
                            {{ option.label }}
                        </option>
                        <option value="custom">Personalizado</option>
                    </select>

                    <div v-if="reminderSelect === 'custom'" class="custom-field">
                        <input
                            v-model.number="form.reminder_hours_before"
                            class="input"
                            type="number"
                            min="0"
                            step="1"
                        />
                        <span class="custom-suffix">horas antes</span>
                    </div>
                </article>

                <article class="card">
                    <h2>Dias de fecho</h2>
                    <p class="card-hint">
                        Nestes dias o negócio aparece fechado - os clientes não veem horários
                        disponíveis, mesmo que os colaboradores tenham horário de trabalho definido.
                    </p>

                    <label class="toggle-row">
                        <input v-model="form.close_on_national_holidays" type="checkbox" />
                        <span>Fechar automaticamente nos feriados nacionais</span>
                    </label>
                </article>

                <article class="card closed-dates-card">
                    <h2>Fechar uma data específica</h2>
                    <p class="card-hint">
                        Marca um dia pontual como fechado (ex.: amanhã, uma folga, um imprevisto).
                        Só é possível se ainda não houver marcações confirmadas nesse dia.
                    </p>

                    <div class="closed-date-form">
                        <div>
                            <label class="label">Data</label>
                            <DateField v-model="newClosedDate.date" />
                        </div>

                        <div>
                            <label class="label">Motivo (opcional)</label>
                            <input
                                v-model="newClosedDate.reason"
                                class="input"
                                type="text"
                                placeholder="Folga, evento, obras..."
                            />
                        </div>

                        <button
                            class="btn btn-secondary"
                            type="button"
                            :disabled="!newClosedDate.date || isAddingClosedDate"
                            @click="addClosedDate"
                        >
                            {{ isAddingClosedDate ? 'A fechar...' : 'Fechar este dia' }}
                        </button>
                    </div>

                    <p v-if="closedDatesError" class="error-message">{{ closedDatesError }}</p>

                    <div v-if="isLoadingClosedDates" class="closed-dates-empty">
                        A carregar dias de fecho...
                    </div>

                    <p v-else-if="!closedDates.length" class="closed-dates-empty">
                        Ainda não fechaste nenhuma data específica.
                    </p>

                    <ul v-else class="closed-dates-list">
                        <li v-for="closedDate in closedDates" :key="closedDate.id">
                            <span class="closed-date-date">{{ formatClosedDate(closedDate.date) }}</span>
                            <span v-if="closedDate.reason" class="closed-date-reason">{{ closedDate.reason }}</span>

                            <button
                                class="closed-date-remove"
                                type="button"
                                aria-label="Reabrir esta data"
                                @click="removeClosedDate(closedDate)"
                            >
                                ×
                            </button>
                        </li>
                    </ul>
                </article>

                <p v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </p>

                <p v-if="isSaving" class="save-status">A guardar...</p>
                <p v-else-if="successMessage" class="save-status save-status-ok">{{ successMessage }}</p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-or-manager', 'first-service'],
    layout: 'backoffice',
})

type SettingsForm = {
    min_booking_notice_minutes: number
    max_booking_horizon_days: number
    slot_interval_minutes: number
    scheduling_optimization: 'fixed' | 'smart'
    reminder_hours_before: number
    close_on_national_holidays: boolean
}

type ClosedDate = {
    id: number
    date: string
    reason: string
    created_at: string
}

const { apiFetch } = useApi()
const { currentBusiness, loadCurrentBusiness } = useCurrentBusiness()

const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const hasLoaded = ref(false)

const form = reactive<SettingsForm>({
    min_booking_notice_minutes: 0,
    max_booking_horizon_days: 90,
    slot_interval_minutes: 30,
    scheduling_optimization: 'fixed',
    reminder_hours_before: 24,
    close_on_national_holidays: false,
})

const closedDates = ref<ClosedDate[]>([])
const isLoadingClosedDates = ref(true)
const isAddingClosedDate = ref(false)
const closedDatesError = ref('')
const newClosedDate = reactive({ date: '', reason: '' })

const minNoticeOptions = [
    { value: 0, label: 'Sem antecedência mínima' },
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 1440, label: '24 horas' },
]

const maxHorizonOptions = [
    { value: 7, label: '1 semana' },
    { value: 14, label: '2 semanas' },
    { value: 30, label: '1 mês' },
    { value: 60, label: '2 meses' },
    { value: 90, label: '3 meses' },
    { value: 180, label: '6 meses' },
    { value: 365, label: '12 meses' },
]

const slotIntervalOptions = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
]

const reminderOptions = [
    { value: 0, label: 'Não enviar lembrete' },
    { value: 24, label: '24 horas antes' },
    { value: 48, label: '48 horas antes' },
    { value: 72, label: '72 horas antes' },
]

const minNoticeSelect = ref('0')
const maxHorizonSelect = ref('90')
const slotIntervalSelect = ref('30')
const reminderSelect = ref('24')

watch(minNoticeSelect, (value) => {
    if (value !== 'custom') {
        form.min_booking_notice_minutes = Number(value)
    }
})

watch(maxHorizonSelect, (value) => {
    if (value !== 'custom') {
        form.max_booking_horizon_days = Number(value)
    }
})

watch(slotIntervalSelect, (value) => {
    if (value !== 'custom') {
        form.slot_interval_minutes = Number(value)
    }
})

watch(reminderSelect, (value) => {
    if (value !== 'custom') {
        form.reminder_hours_before = Number(value)
    }
})

const syncSelectFromValue = (
    select: Ref<string>,
    options: { value: number }[],
    value: number
) => {
    select.value = options.some((option) => option.value === value) ? String(value) : 'custom'
}

const formatApiError = (error: any) => {
    const data = error?.data

    if (!data) {
        return 'Ocorreu um erro inesperado.'
    }

    if (typeof data === 'string') {
        return data
    }

    const firstEntry = Object.entries(data)[0]

    if (!firstEntry) {
        return 'Ocorreu um erro inesperado.'
    }

    const [, value] = firstEntry

    return Array.isArray(value) ? String(value[0]) : String(value)
}

const loadSettings = async () => {
    try {
        isLoading.value = true
        errorMessage.value = ''

        await loadCurrentBusiness()

        const response = await apiFetch<SettingsForm>('/businesses/me-settings/', {
            query: currentBusiness.value?.business_uuid
                ? { business_uuid: currentBusiness.value.business_uuid }
                : {},
        })

        form.min_booking_notice_minutes = response.min_booking_notice_minutes
        form.max_booking_horizon_days = response.max_booking_horizon_days
        form.slot_interval_minutes = response.slot_interval_minutes
        form.scheduling_optimization = response.scheduling_optimization
        form.reminder_hours_before = response.reminder_hours_before
        form.close_on_national_holidays = response.close_on_national_holidays

        syncSelectFromValue(minNoticeSelect, minNoticeOptions, form.min_booking_notice_minutes)
        syncSelectFromValue(maxHorizonSelect, maxHorizonOptions, form.max_booking_horizon_days)
        syncSelectFromValue(slotIntervalSelect, slotIntervalOptions, form.slot_interval_minutes)
        syncSelectFromValue(reminderSelect, reminderOptions, form.reminder_hours_before)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar as definições.'
    } finally {
        isLoading.value = false
        // Só depois do form estar sincronizado com o servidor é que as
        // alterações do utilizador devem despoletar o auto-save.
        await nextTick()
        hasLoaded.value = true
    }
}

const saveSettings = async () => {
    errorMessage.value = ''
    successMessage.value = ''

    try {
        isSaving.value = true

        await apiFetch('/businesses/me-settings/', {
            method: 'PATCH',
            query: currentBusiness.value?.business_uuid
                ? { business_uuid: currentBusiness.value.business_uuid }
                : {},
            body: {
                min_booking_notice_minutes: form.min_booking_notice_minutes,
                max_booking_horizon_days: form.max_booking_horizon_days,
                slot_interval_minutes: form.slot_interval_minutes,
                scheduling_optimization: form.scheduling_optimization,
                reminder_hours_before: form.reminder_hours_before,
                close_on_national_holidays: form.close_on_national_holidays,
            },
        })

        successMessage.value = 'Guardado automaticamente.'
    } catch (error) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSaving.value = false
    }
}

const formatClosedDate = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`)
    return new Intl.DateTimeFormat('pt-PT', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

const businessQuery = () =>
    currentBusiness.value?.business_uuid ? { business_uuid: currentBusiness.value.business_uuid } : {}

const loadClosedDates = async () => {
    try {
        isLoadingClosedDates.value = true

        closedDates.value = await apiFetch<ClosedDate[]>('/businesses/me-closed-dates/', {
            query: businessQuery(),
        })
    } catch (error) {
        console.error(error)
    } finally {
        isLoadingClosedDates.value = false
    }
}

const addClosedDate = async () => {
    if (!newClosedDate.date) {
        return
    }

    closedDatesError.value = ''

    try {
        isAddingClosedDate.value = true

        const created = await apiFetch<ClosedDate>('/businesses/me-closed-dates/', {
            method: 'POST',
            query: businessQuery(),
            body: {
                date: newClosedDate.date,
                reason: newClosedDate.reason,
            },
        })

        closedDates.value = [...closedDates.value, created].sort((a, b) => a.date.localeCompare(b.date))
        newClosedDate.date = ''
        newClosedDate.reason = ''
    } catch (error) {
        console.error(error)
        closedDatesError.value = formatApiError(error)
    } finally {
        isAddingClosedDate.value = false
    }
}

const removeClosedDate = async (closedDate: ClosedDate) => {
    closedDatesError.value = ''

    try {
        await apiFetch(`/businesses/me-closed-dates/`, {
            method: 'DELETE',
            query: { ...businessQuery(), closed_date_id: closedDate.id },
        })

        closedDates.value = closedDates.value.filter((entry) => entry.id !== closedDate.id)
    } catch (error) {
        console.error(error)
        closedDatesError.value = formatApiError(error)
    }
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null

watch(form, () => {
    if (!hasLoaded.value) {
        return
    }

    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
    }

    autoSaveTimeout = setTimeout(saveSettings, 300)
}, { deep: true })

onBeforeUnmount(() => {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
    }
})

onMounted(async () => {
    await loadSettings()
    await loadClosedDates()
})
</script>

<style scoped>
.settings-page {
    padding: 56px 0 88px;
}

.settings-head {
    margin-bottom: 28px;
}

.settings-head h1 {
    margin: 6px 0 0;
    font-size: clamp(36px, 5vw, 56px);
    letter-spacing: -0.06em;
    line-height: 0.98;
}

.settings-head p:last-child {
    margin: 14px 0 0;
    color: var(--tf-muted);
    font-size: 16px;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.settings-grid .card {
    padding: 26px;
}

.settings-grid h2 {
    margin: 0 0 8px;
    font-size: 20px;
    letter-spacing: -0.04em;
}

.card-hint {
    margin: 0 0 16px;
    color: var(--tf-muted);
    font-size: 14px;
    line-height: 1.45;
}

.custom-field {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
}

.custom-field .input {
    max-width: 140px;
}

.custom-suffix {
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 700;
}

.radio-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    margin-bottom: 10px;
    border: 1px solid var(--tf-border);
    border-radius: 16px;
    cursor: pointer;
}

.radio-option input {
    margin-top: 4px;
}

.radio-option span {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.radio-option small {
    color: var(--tf-muted);
    font-size: 13px;
    line-height: 1.4;
}

.toggle-row {
    display: flex;
    align-items: center;
    gap: 14px;
    font-weight: 800;
    color: var(--tf-black);
    cursor: pointer;
}

.toggle-row input {
    position: relative;
    width: 42px;
    height: 24px;
    flex-shrink: 0;
    appearance: none;
    border-radius: 999px;
    background: #d8d1c3;
    cursor: pointer;
    transition: background 0.16s ease;
}

.toggle-row input::after {
    content: "";
    position: absolute;
    top: 4px;
    left: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--tf-white);
    transition: transform 0.16s ease;
}

.toggle-row input:checked {
    background: var(--tf-black);
}

.toggle-row input:checked::after {
    transform: translateX(18px);
}

.closed-dates-card {
    grid-column: 1 / -1;
}

.closed-date-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: end;
    gap: 14px;
    margin-bottom: 18px;
}

.closed-dates-empty {
    margin: 0;
    color: var(--tf-muted);
    font-size: 14px;
}

.closed-dates-list {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.closed-dates-list li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: 1px solid var(--tf-border);
    border-radius: 12px;
}

.closed-date-date {
    font-weight: 800;
}

.closed-date-reason {
    color: var(--tf-muted);
    font-size: 14px;
    flex: 1;
}

.closed-date-remove {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    margin-left: auto;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-size: 16px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

@media (max-width: 720px) {
    .closed-date-form {
        grid-template-columns: 1fr;
    }
}

.error-message {
    grid-column: 1 / -1;
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 700;
}

.save-status {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 700;
}

.save-status-ok {
    color: #166534;
}

@media (max-width: 900px) {
    .settings-grid {
        grid-template-columns: 1fr;
    }
}
</style>
