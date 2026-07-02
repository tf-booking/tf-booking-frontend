<template>
    <div class="page schedule-page">
        <section class="container">
            <div class="schedule-header">
                <div>
                    <p class="tf-eyebrow">Agenda</p>
                    <h1>Agenda do negócio</h1>
                    <p>
                        Gere horários de trabalho, bloqueios e marcações numa agenda visual.
                    </p>
                </div>

                <NuxtLink to="/dashboard" class="btn btn-secondary">
                    Voltar ao dashboard
                </NuxtLink>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <div v-else-if="staffMembers.length === 0" class="card empty-card">
                Ainda não existem colaboradores. Cria primeiro colaboradores em
                <NuxtLink to="/staff">/staff</NuxtLink>.
            </div>

            <div v-else class="calendar-layout">
                <aside class="card sidebar-card">
                    <h2>Configuração</h2>

                    <p class="business-label">
                        Negócio: <strong>{{ selectedBusiness.name }}</strong>
                    </p>

                    <div class="field">
                        <label class="label">Colaborador</label>

                        <select v-model.number="selectedStaffId" class="input" @change="handleStaffChange">
                            <option :value="null" disabled>
                                Escolhe um colaborador
                            </option>

                            <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                                {{ staff.name }}
                            </option>
                        </select>
                    </div>

                    <div v-if="selectedStaff" class="selected-staff-box">
                        <strong>{{ selectedStaff.name }}</strong>
                        <span>{{ selectedStaff.email || 'Sem email' }}</span>

                        <div class="staff-services">
                            <small v-for="serviceName in selectedStaff.services_names" :key="serviceName">
                                {{ serviceName }}
                            </small>
                        </div>
                    </div>

                    <div class="tool-box">
                        <label class="label">Modo rápido</label>

                        <div class="tool-buttons">
                            <button class="tool-button" :class="{ active: selectedTool === 'working' }" type="button"
                                @click="selectedTool = 'working'">
                                Horário de trabalho
                            </button>

                            <button class="tool-button" :class="{ active: selectedTool === 'block' }" type="button"
                                @click="selectedTool = 'block'">
                                Bloqueio
                            </button>

                            <button class="tool-button" :class="{ active: selectedTool === 'appointment' }"
                                type="button" @click="selectedTool = 'appointment'">
                                Marcação
                            </button>
                        </div>

                        <p class="hint">
                            Arrasta na agenda para selecionar um período. Depois escolhe uma ação.
                        </p>
                    </div>

                    <div class="legend">
                        <div>
                            <span class="dot dot-working"></span>
                            Horário de trabalho
                        </div>

                        <div>
                            <span class="dot dot-block"></span>
                            Bloqueio
                        </div>

                        <div>
                            <span class="dot dot-appointment"></span>
                            Marcação
                        </div>
                    </div>
                </aside>

                <main class="calendar-main">
                    <div class="card calendar-card">
                        <ClientOnly>
                            <FullCalendar :options="calendarOptions" />
                        </ClientOnly>
                    </div>

                    <div v-if="selectedRange" class="card selected-range-card">
                        <div>
                            <p class="tf-eyebrow">Período selecionado</p>

                            <h2>
                                {{ formatDateTime(selectedRange.start) }}
                                -
                                {{ formatDateTime(selectedRange.end) }}
                            </h2>

                            <p>
                                Escolhe o que queres fazer com este período.
                            </p>
                        </div>

                        <div class="selected-range-actions">
                            <button class="btn btn-accent" type="button" :disabled="isSavingWorkingHour"
                                @click="saveSelectedRangeAsWorkingHour">
                                Guardar como horário
                            </button>

                            <button class="btn btn-secondary" type="button" :disabled="isSavingBlock"
                                @click="saveSelectedRangeAsBlock">
                                Guardar como bloqueio
                            </button>

                            <button class="btn btn-secondary" type="button" @click="prepareSelectedRangeAsAppointment">
                                Preparar marcação
                            </button>

                            <button class="btn btn-danger" type="button" @click="clearSelectedRange">
                                Limpar
                            </button>
                        </div>
                    </div>

                    <p v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </p>

                    <p v-if="successMessage" class="success-message">
                        {{ successMessage }}
                    </p>

                    <div class="forms-grid">
                        <article class="card form-card">
                            <h2>{{ editingWorkingHour ? 'Editar horário de trabalho' : 'Horário de trabalho' }}</h2>

                            <form class="form" @submit.prevent="saveWorkingHour">
                                <div>
                                    <label class="label">Dia da semana</label>

                                    <select v-model.number="workingHourForm.weekday" class="input">
                                        <option v-for="day in weekdays" :key="day.value" :value="day.value">
                                            {{ day.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Hora início</label>
                                        <input v-model="workingHourForm.start_time" class="input" type="time" />
                                    </div>

                                    <div>
                                        <label class="label">Hora fim</label>
                                        <input v-model="workingHourForm.end_time" class="input" type="time" />
                                    </div>
                                </div>

                                <label class="checkbox-row">
                                    <input v-model="workingHourForm.is_active" type="checkbox" />
                                    <span>Horário ativo</span>
                                </label>

                                <div class="form-actions">
                                    <button class="btn btn-accent" type="submit" :disabled="isSavingWorkingHour">
                                        {{ isSavingWorkingHour ? 'A guardar...' : editingWorkingHour ? 'Guardar alterações' : 'Guardar horário' }}
                                    </button>

                                    <button v-if="editingWorkingHour" class="btn btn-secondary" type="button"
                                        @click="cancelWorkingHourEdit">
                                        Cancelar
                                    </button>

                                    <button v-if="editingWorkingHour" class="btn btn-danger" type="button"
                                        @click="deleteWorkingHour(editingWorkingHour)">
                                        Apagar
                                    </button>
                                </div>
                            </form>
                        </article>

                        <article class="card form-card">
                            <h2>{{ editingBlock ? 'Editar bloqueio' : 'Bloqueio' }}</h2>

                            <form class="form" @submit.prevent="saveBlock">
                                <div class="two-columns">
                                    <div>
                                        <label class="label">Data início</label>
                                        <input v-model="blockForm.start_date" class="input" type="date" />
                                    </div>

                                    <div>
                                        <label class="label">Hora início</label>
                                        <input v-model="blockForm.start_time" class="input" type="time" />
                                    </div>
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Data fim</label>
                                        <input v-model="blockForm.end_date" class="input" type="date" />
                                    </div>

                                    <div>
                                        <label class="label">Hora fim</label>
                                        <input v-model="blockForm.end_time" class="input" type="time" />
                                    </div>
                                </div>

                                <div>
                                    <label class="label">Motivo</label>
                                    <input v-model="blockForm.reason" class="input" type="text"
                                        placeholder="Férias, consulta, pausa, reunião..." />
                                </div>

                                <div class="form-actions">
                                    <button class="btn btn-accent" type="submit" :disabled="isSavingBlock">
                                        {{ isSavingBlock ? 'A guardar...' : editingBlock ? 'Guardar alterações' :
                                        'Guardar bloqueio' }}
                                    </button>

                                    <button v-if="editingBlock" class="btn btn-secondary" type="button"
                                        @click="cancelBlockEdit">
                                        Cancelar
                                    </button>

                                    <button v-if="editingBlock" class="btn btn-danger" type="button"
                                        @click="deleteBlock(editingBlock)">
                                        Apagar
                                    </button>
                                </div>
                            </form>
                        </article>

                        <article class="card form-card">
                            <h2>Marcação manual</h2>

                            <form class="form" @submit.prevent="saveAppointment">
                                <div>
                                    <label class="label">Serviço</label>

                                    <select v-model="appointmentForm.service_uuid" class="input">
                                        <option value="" disabled>
                                            Escolhe um serviço
                                        </option>

                                        <option v-for="service in services" :key="service.uuid" :value="service.uuid">
                                            {{ service.name }} — {{ service.duration_minutes }} min
                                        </option>
                                    </select>
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Data</label>
                                        <input v-model="appointmentForm.start_date" class="input" type="date" />
                                    </div>

                                    <div>
                                        <label class="label">Hora</label>
                                        <input v-model="appointmentForm.start_time" class="input" type="time" />
                                    </div>
                                </div>

                                <div>
                                    <label class="label">Nome do cliente</label>
                                    <input v-model="appointmentForm.customer_name" class="input" type="text"
                                        placeholder="Maria Silva" />
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Telefone</label>
                                        <input v-model="appointmentForm.customer_phone" class="input" type="text"
                                            placeholder="910000000" />
                                    </div>

                                    <div>
                                        <label class="label">Email</label>
                                        <input v-model="appointmentForm.customer_email" class="input" type="email"
                                            placeholder="cliente@email.pt" />
                                    </div>
                                </div>

                                <div>
                                    <label class="label">Notas</label>
                                    <input v-model="appointmentForm.notes" class="input" type="text"
                                        placeholder="Observações internas..." />
                                </div>

                                <div class="form-actions">
                                    <button class="btn btn-accent" type="submit" :disabled="isSavingAppointment">
                                        {{ isSavingAppointment ? 'A marcar...' : 'Criar marcação' }}
                                    </button>
                                </div>
                            </form>
                        </article>

                        <article v-if="selectedAppointment" class="card form-card">
                            <h2>Marcação selecionada</h2>

                            <div class="appointment-detail">
                                <strong>{{ selectedAppointment.service_name }}</strong>
                                <span>{{ selectedAppointment.customer_name }}</span>
                                <span>{{ selectedAppointment.customer_phone || 'Sem telefone' }}</span>
                                <span>
                                    {{ formatDateTime(selectedAppointment.start_at) }}
                                    -
                                    {{ formatDateTime(selectedAppointment.end_at) }}
                                </span>
                                <small>{{ selectedAppointment.status }}</small>
                            </div>
                        </article>
                    </div>
                </main>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptLocale from '@fullcalendar/core/locales/pt'
import type {
    CalendarOptions,
    DateSelectArg,
    DatesSetArg,
    EventClickArg,
    EventInput,
} from '@fullcalendar/core'

definePageMeta({
    middleware: 'auth',
})

type Business = {
    id: number
    uuid: string
    name: string
    slug: string
    is_active: boolean
}

type Service = {
    id: number
    uuid: string
    business: number
    business_name: string
    name: string
    description: string
    duration_minutes: number
    price: string
    is_active: boolean
}

type StaffMember = {
    id: number
    uuid: string
    business: number
    business_name: string
    user: number | null
    services: number[]
    services_names: string[]
    name: string
    email: string
    phone: string
    bio: string
    avatar_url: string
    is_active: boolean
}

type WorkingHour = {
    id: number
    staff_member: number
    staff_member_name: string
    business_name: string
    weekday: number
    weekday_label: string
    start_time: string
    end_time: string
    is_active: boolean
}

type StaffBlock = {
    id: number
    uuid: string
    staff_member: number
    staff_member_name: string
    business_name: string
    start_at: string
    end_at: string
    reason: string
    created_at: string
}

type Appointment = {
    id: number
    uuid: string
    business: number
    service: number
    service_name: string
    staff_member: number
    staff_member_name: string
    customer: number
    customer_name: string
    customer_phone: string
    start_at: string
    end_at: string
    status: string
    source: string
    notes: string
}

type SelectedRange = {
    start: string
    end: string
    startDate: string
    startTime: string
    endDate: string
    endTime: string
    weekday: number
}

const { apiFetch } = useApi()

const weekdays = [
    { value: 0, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 2, label: 'Quarta-feira' },
    { value: 3, label: 'Quinta-feira' },
    { value: 4, label: 'Sexta-feira' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' },
]

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)

const services = ref<Service[]>([])
const staffMembers = ref<StaffMember[]>([])
const selectedStaffId = ref<number | null>(null)

const workingHours = ref<WorkingHour[]>([])
const blocks = ref<StaffBlock[]>([])
const appointments = ref<Appointment[]>([])

const selectedTool = ref<'working' | 'block' | 'appointment'>('working')
const selectedAppointment = ref<Appointment | null>(null)
const selectedRange = ref<SelectedRange | null>(null)

const visibleRange = reactive({
    start: '',
    end: '',
})

const isLoadingBusinesses = ref(false)
const isLoadingStaff = ref(false)
const isSavingWorkingHour = ref(false)
const isSavingBlock = ref(false)
const isSavingAppointment = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const editingWorkingHour = ref<WorkingHour | null>(null)
const editingBlock = ref<StaffBlock | null>(null)

const workingHourForm = reactive({
    weekday: 0,
    start_time: '09:00',
    end_time: '18:00',
    is_active: true,
})

const blockForm = reactive({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    reason: '',
})

const appointmentForm = reactive({
    service_uuid: '',
    start_date: '',
    start_time: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
})

const selectedStaff = computed(() => {
    if (!selectedStaffId.value) {
        return null
    }

    return staffMembers.value.find((staff) => staff.id === selectedStaffId.value) || null
})

const calendarEvents = computed<EventInput[]>(() => {
    const workingEvents: EventInput[] = workingHours.value.map((hour) => ({
        id: `working-${hour.id}`,
        title: 'Trabalha',
        daysOfWeek: [toFullCalendarWeekday(hour.weekday)],
        startTime: normalizeTime(hour.start_time),
        endTime: normalizeTime(hour.end_time),
        backgroundColor: hour.is_active ? '#d9f99d' : '#e5e7eb',
        borderColor: hour.is_active ? '#84cc16' : '#9ca3af',
        textColor: '#111116',
        extendedProps: {
            type: 'working-hour',
            source: hour,
        },
    }))

    const blockEvents: EventInput[] = blocks.value.map((block) => ({
        id: `block-${block.uuid}`,
        title: block.reason || 'Bloqueado',
        start: block.start_at,
        end: block.end_at,
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
        textColor: '#991b1b',
        extendedProps: {
            type: 'block',
            source: block,
        },
    }))

    const appointmentEvents: EventInput[] = appointments.value.map((appointment) => ({
        id: `appointment-${appointment.uuid}`,
        title: `${appointment.service_name || 'Marcação'} · ${appointment.customer_name || 'Cliente'}`,
        start: appointment.start_at,
        end: appointment.end_at,
        backgroundColor: '#111116',
        borderColor: '#111116',
        textColor: '#ffffff',
        extendedProps: {
            type: 'appointment',
            source: appointment,
        },
    }))

    return [
        ...workingEvents,
        ...blockEvents,
        ...appointmentEvents,
    ]
})

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
    ],
    initialView: 'timeGridWeek',
    locale: ptLocale,
    firstDay: 1,
    selectable: true,
    selectMirror: true,
    unselectAuto: false,
    allDaySlot: false,
    nowIndicator: true,
    height: 'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: '00:15:00',
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth',
    },
    buttonText: {
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
    },
    events: calendarEvents.value,
    select: handleCalendarSelect,
    eventClick: handleEventClick,
    datesSet: handleDatesSet,
}))

const resetMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
}

const normalizeTime = (value: string) => {
    return value.length === 5 ? `${value}:00` : value
}

const toFullCalendarWeekday = (backendWeekday: number) => {
    return backendWeekday === 6 ? 0 : backendWeekday + 1
}

const toBackendWeekday = (date: Date) => {
    const jsDay = date.getDay()

    return jsDay === 0 ? 6 : jsDay - 1
}

const formatDateInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const formatTimeInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
}

const toDateTimePayload = (date: string, time: string) => {
    return `${date}T${time}:00`
}

const todayDate = () => {
    return formatDateInput(new Date())
}

const formatDateTime = (value: string) => {
    if (!value) {
        return '-'
    }

    return new Intl.DateTimeFormat('pt-PT', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(value))
}

const splitDateTime = (value: string) => {
    const date = new Date(value)

    return {
        date: formatDateInput(date),
        time: formatTimeInput(date),
    }
}

const resetWorkingHourForm = () => {
    editingWorkingHour.value = null

    workingHourForm.weekday = 0
    workingHourForm.start_time = '09:00'
    workingHourForm.end_time = '18:00'
    workingHourForm.is_active = true
}

const resetBlockForm = () => {
    editingBlock.value = null

    const today = todayDate()

    blockForm.start_date = today
    blockForm.start_time = '09:00'
    blockForm.end_date = today
    blockForm.end_time = '10:00'
    blockForm.reason = ''
}

const resetAppointmentForm = () => {
    const today = todayDate()

    appointmentForm.service_uuid = services.value[0]?.uuid || ''
    appointmentForm.start_date = today
    appointmentForm.start_time = '09:00'
    appointmentForm.customer_name = ''
    appointmentForm.customer_phone = ''
    appointmentForm.customer_email = ''
    appointmentForm.notes = ''
}

const fillFormsFromSelectedRange = () => {
    if (!selectedRange.value) {
        return
    }

    workingHourForm.weekday = selectedRange.value.weekday
    workingHourForm.start_time = selectedRange.value.startTime
    workingHourForm.end_time = selectedRange.value.endTime
    workingHourForm.is_active = true

    blockForm.start_date = selectedRange.value.startDate
    blockForm.start_time = selectedRange.value.startTime
    blockForm.end_date = selectedRange.value.endDate
    blockForm.end_time = selectedRange.value.endTime

    appointmentForm.start_date = selectedRange.value.startDate
    appointmentForm.start_time = selectedRange.value.startTime
}

const clearSelectedRange = () => {
    selectedRange.value = null
    resetMessages()
}

const handleDatesSet = async (info: DatesSetArg) => {
    const endDate = new Date(info.end)
    endDate.setDate(endDate.getDate() - 1)

    visibleRange.start = formatDateInput(info.start)
    visibleRange.end = formatDateInput(endDate)

    await loadAppointments()
}

const handleCalendarSelect = (selection: DateSelectArg) => {
    resetMessages()

    if (!selectedStaffId.value) {
        errorMessage.value = 'Seleciona primeiro um colaborador.'
        return
    }

    const startDate = formatDateInput(selection.start)
    const endDate = formatDateInput(selection.end)
    const startTime = formatTimeInput(selection.start)
    const endTime = formatTimeInput(selection.end)

    selectedRange.value = {
        start: selection.start.toISOString(),
        end: selection.end.toISOString(),
        startDate,
        startTime,
        endDate,
        endTime,
        weekday: toBackendWeekday(selection.start),
    }

    editingWorkingHour.value = null
    editingBlock.value = null
    selectedAppointment.value = null

    fillFormsFromSelectedRange()

    if (selectedTool.value === 'working') {
        successMessage.value = 'Período selecionado. Podes guardar como horário de trabalho.'
        return
    }

    if (selectedTool.value === 'block') {
        blockForm.reason = blockForm.reason || 'Bloqueado'
        successMessage.value = 'Período selecionado. Podes guardar como bloqueio.'
        return
    }

    successMessage.value = 'Período selecionado. Preenche os dados do cliente para criar marcação.'
}

const handleEventClick = (info: EventClickArg) => {
    resetMessages()
    selectedRange.value = null

    const type = info.event.extendedProps.type

    if (type === 'working-hour') {
        selectedTool.value = 'working'
        editWorkingHour(info.event.extendedProps.source as WorkingHour)
        return
    }

    if (type === 'block') {
        selectedTool.value = 'block'
        editBlock(info.event.extendedProps.source as StaffBlock)
        return
    }

    if (type === 'appointment') {
        selectedAppointment.value = info.event.extendedProps.source as Appointment
    }
}

const saveSelectedRangeAsWorkingHour = async () => {
    if (!selectedRange.value) {
        errorMessage.value = 'Seleciona primeiro um período na agenda.'
        return
    }

    if (selectedRange.value.startDate !== selectedRange.value.endDate) {
        errorMessage.value = 'Para horário de trabalho, seleciona apenas um dia.'
        return
    }

    selectedTool.value = 'working'
    fillFormsFromSelectedRange()

    await saveWorkingHour()
    selectedRange.value = null
}

const saveSelectedRangeAsBlock = async () => {
    if (!selectedRange.value) {
        errorMessage.value = 'Seleciona primeiro um período na agenda.'
        return
    }

    selectedTool.value = 'block'
    fillFormsFromSelectedRange()

    if (!blockForm.reason) {
        blockForm.reason = 'Bloqueado'
    }

    await saveBlock()
    selectedRange.value = null
}

const prepareSelectedRangeAsAppointment = () => {
    if (!selectedRange.value) {
        errorMessage.value = 'Seleciona primeiro um período na agenda.'
        return
    }

    selectedTool.value = 'appointment'
    fillFormsFromSelectedRange()

    successMessage.value = 'Agora preenche o serviço e dados do cliente em "Marcação manual".'
}

const loadBusinesses = async () => {
    try {
        isLoadingBusinesses.value = true
        resetMessages()

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Business[]
        }>('/businesses/')

        businesses.value = response.results
        selectedBusiness.value = businesses.value[0] || null
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar o negócio do utilizador.'
    } finally {
        isLoadingBusinesses.value = false
    }
}

const loadServices = async () => {
    if (!selectedBusiness.value) {
        return
    }

    try {
        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Service[]
        }>(`/services/?business=${selectedBusiness.value.id}&is_active=true`)

        services.value = response.results

        if (!appointmentForm.service_uuid && services.value[0] && services.value.length > 0) {
            appointmentForm.service_uuid = services.value[0].uuid
        }
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os serviços.'
    }
}

const loadStaff = async () => {
    if (!selectedBusiness.value) {
        return
    }

    try {
        isLoadingStaff.value = true
        resetMessages()

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: StaffMember[]
        }>(`/staff/?business=${selectedBusiness.value.id}&is_active=true`)

        staffMembers.value = response.results

        if (!selectedStaffId.value && staffMembers.value[0] && staffMembers.value.length > 0) {
            selectedStaffId.value = staffMembers.value[0].id
        }
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os colaboradores.'
    } finally {
        isLoadingStaff.value = false
    }
}

const loadWorkingHours = async () => {
    if (!selectedStaffId.value) {
        workingHours.value = []
        return
    }

    try {
        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: WorkingHour[]
        }>(`/working-hours/?staff=${selectedStaffId.value}`)

        workingHours.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os horários.'
    }
}

const loadBlocks = async () => {
    if (!selectedStaffId.value) {
        blocks.value = []
        return
    }

    try {
        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: StaffBlock[]
        }>(`/staff-blocks/?staff=${selectedStaffId.value}`)

        blocks.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os bloqueios.'
    }
}

const loadAppointments = async () => {
    if (!selectedStaffId.value) {
        appointments.value = []
        return
    }

    try {
        let endpoint = `/appointments/?staff=${selectedStaffId.value}`

        if (visibleRange.start && visibleRange.end) {
            endpoint += `&start_date=${visibleRange.start}&end_date=${visibleRange.end}`
        }

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Appointment[]
        }>(endpoint)

        appointments.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar as marcações.'
    }
}

const handleStaffChange = async () => {
    resetMessages()
    resetWorkingHourForm()
    resetBlockForm()
    selectedRange.value = null
    selectedAppointment.value = null

    await loadWorkingHours()
    await loadBlocks()
    await loadAppointments()
}

const saveWorkingHour = async () => {
    resetMessages()

    if (!selectedStaffId.value) {
        errorMessage.value = 'Seleciona um colaborador.'
        return
    }

    if (!workingHourForm.start_time || !workingHourForm.end_time) {
        errorMessage.value = 'Preenche a hora de início e fim.'
        return
    }

    if (workingHourForm.end_time <= workingHourForm.start_time) {
        errorMessage.value = 'A hora de fim tem de ser superior à hora de início.'
        return
    }

    try {
        isSavingWorkingHour.value = true

        const payload = {
            staff_member: selectedStaffId.value,
            weekday: workingHourForm.weekday,
            start_time: workingHourForm.start_time,
            end_time: workingHourForm.end_time,
            is_active: workingHourForm.is_active,
        }

        if (editingWorkingHour.value) {
            await apiFetch(`/working-hours/${editingWorkingHour.value.id}/`, {
                method: 'PUT',
                body: payload,
            })

            successMessage.value = 'Horário atualizado com sucesso.'
        } else {
            await apiFetch('/working-hours/', {
                method: 'POST',
                body: payload,
            })

            successMessage.value = 'Horário criado com sucesso.'
        }

        resetWorkingHourForm()
        await loadWorkingHours()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data ? JSON.stringify(error.data) : 'Erro ao guardar horário.'
    } finally {
        isSavingWorkingHour.value = false
    }
}

const editWorkingHour = (hour: WorkingHour) => {
    editingWorkingHour.value = hour

    workingHourForm.weekday = hour.weekday
    workingHourForm.start_time = hour.start_time.slice(0, 5)
    workingHourForm.end_time = hour.end_time.slice(0, 5)
    workingHourForm.is_active = hour.is_active
}

const cancelWorkingHourEdit = () => {
    resetMessages()
    resetWorkingHourForm()
}

const deleteWorkingHour = async (hour: WorkingHour) => {
    const confirmed = window.confirm('Tens a certeza que queres apagar este horário?')

    if (!confirmed) {
        return
    }

    try {
        await apiFetch(`/working-hours/${hour.id}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Horário apagado com sucesso.'

        if (editingWorkingHour.value?.id === hour.id) {
            resetWorkingHourForm()
        }

        await loadWorkingHours()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o horário.'
    }
}

const saveBlock = async () => {
    resetMessages()

    if (!selectedStaffId.value) {
        errorMessage.value = 'Seleciona um colaborador.'
        return
    }

    if (!blockForm.start_date || !blockForm.start_time || !blockForm.end_date || !blockForm.end_time) {
        errorMessage.value = 'Preenche a data e hora de início e fim.'
        return
    }

    const startAt = toDateTimePayload(blockForm.start_date, blockForm.start_time)
    const endAt = toDateTimePayload(blockForm.end_date, blockForm.end_time)

    if (new Date(endAt) <= new Date(startAt)) {
        errorMessage.value = 'O fim do bloqueio tem de ser depois do início.'
        return
    }

    try {
        isSavingBlock.value = true

        const payload = {
            staff_member: selectedStaffId.value,
            start_at: startAt,
            end_at: endAt,
            reason: blockForm.reason,
        }

        if (editingBlock.value) {
            await apiFetch(`/staff-blocks/${editingBlock.value.uuid}/`, {
                method: 'PUT',
                body: payload,
            })

            successMessage.value = 'Bloqueio atualizado com sucesso.'
        } else {
            await apiFetch('/staff-blocks/', {
                method: 'POST',
                body: payload,
            })

            successMessage.value = 'Bloqueio criado com sucesso.'
        }

        resetBlockForm()
        await loadBlocks()
        await loadAppointments()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data ? JSON.stringify(error.data) : 'Erro ao guardar bloqueio.'
    } finally {
        isSavingBlock.value = false
    }
}

const editBlock = (block: StaffBlock) => {
    editingBlock.value = block

    const start = splitDateTime(block.start_at)
    const end = splitDateTime(block.end_at)

    blockForm.start_date = start.date
    blockForm.start_time = start.time
    blockForm.end_date = end.date
    blockForm.end_time = end.time
    blockForm.reason = block.reason || ''
}

const cancelBlockEdit = () => {
    resetMessages()
    resetBlockForm()
}

const deleteBlock = async (block: StaffBlock) => {
    const confirmed = window.confirm('Tens a certeza que queres apagar este bloqueio?')

    if (!confirmed) {
        return
    }

    try {
        await apiFetch(`/staff-blocks/${block.uuid}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Bloqueio apagado com sucesso.'

        if (editingBlock.value?.uuid === block.uuid) {
            resetBlockForm()
        }

        await loadBlocks()
        await loadAppointments()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o bloqueio.'
    }
}

const saveAppointment = async () => {
    resetMessages()

    if (!selectedBusiness.value || !selectedStaff.value) {
        errorMessage.value = 'Seleciona um negócio e colaborador.'
        return
    }

    if (!appointmentForm.service_uuid) {
        errorMessage.value = 'Seleciona um serviço.'
        return
    }

    if (!appointmentForm.start_date || !appointmentForm.start_time) {
        errorMessage.value = 'Seleciona data e hora.'
        return
    }

    if (!appointmentForm.customer_name || !appointmentForm.customer_phone) {
        errorMessage.value = 'Preenche o nome e telefone do cliente.'
        return
    }

    try {
        isSavingAppointment.value = true

        await apiFetch('/public/appointments/', {
            method: 'POST',
            body: {
                business_slug: selectedBusiness.value.slug,
                service_uuid: appointmentForm.service_uuid,
                staff_uuid: selectedStaff.value.uuid,
                start_at: toDateTimePayload(appointmentForm.start_date, appointmentForm.start_time),
                customer_name: appointmentForm.customer_name,
                customer_phone: appointmentForm.customer_phone,
                customer_email: appointmentForm.customer_email,
                notes: appointmentForm.notes,
                source: 'manual',
            },
        })

        successMessage.value = 'Marcação criada com sucesso.'

        selectedRange.value = null
        resetAppointmentForm()
        await loadAppointments()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data ? JSON.stringify(error.data) : 'Erro ao criar marcação.'
    } finally {
        isSavingAppointment.value = false
    }
}

onMounted(async () => {
    resetBlockForm()
    resetAppointmentForm()

    await loadBusinesses()
    await loadServices()
    await loadStaff()
    await loadWorkingHours()
    await loadBlocks()
    await loadAppointments()
})
</script>

<style scoped>
.schedule-page {
    padding: 56px 0 88px;
}

.schedule-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
}

.schedule-header h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.92;
    letter-spacing: -0.07em;
}

.schedule-header p:last-child {
    margin: 16px 0 0;
    color: var(--tf-muted);
    font-size: 18px;
}

.calendar-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 18px;
    align-items: start;
}

.sidebar-card,
.calendar-card,
.form-card,
.empty-card,
.selected-range-card {
    padding: 24px;
}

.sidebar-card {
    position: sticky;
    top: 24px;
}

.sidebar-card h2,
.form-card h2,
.selected-range-card h2 {
    margin: 0;
    font-size: 26px;
    letter-spacing: -0.05em;
}

.selected-range-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border: 2px solid var(--tf-black);
}

.selected-range-card p {
    margin: 8px 0 0;
    color: var(--tf-muted);
    font-weight: 700;
}

.selected-range-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
}

.business-label {
    margin: 10px 0 20px;
    color: var(--tf-muted);
}

.field {
    display: grid;
    gap: 8px;
}

.selected-staff-box {
    margin-top: 18px;
    padding: 16px;
    border-radius: 18px;
    background: var(--tf-bg);
}

.selected-staff-box strong {
    display: block;
}

.selected-staff-box span {
    display: block;
    margin-top: 4px;
    color: var(--tf-muted);
}

.staff-services {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
}

.staff-services small {
    padding: 6px 9px;
    border-radius: 999px;
    background: var(--tf-white);
    border: 1px solid var(--tf-border);
    color: var(--tf-black);
    font-weight: 800;
}

.tool-box {
    margin-top: 24px;
}

.tool-buttons {
    display: grid;
    gap: 8px;
    margin-top: 10px;
}

.tool-button {
    min-height: 42px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: var(--tf-white);
    color: var(--tf-black);
    font-weight: 900;
    cursor: pointer;
}

.tool-button.active {
    background: var(--tf-black);
    color: var(--tf-white);
}

.hint {
    margin: 12px 0 0;
    color: var(--tf-muted);
    font-size: 14px;
    line-height: 1.4;
}

.legend {
    display: grid;
    gap: 10px;
    margin-top: 24px;
    color: var(--tf-muted);
    font-weight: 800;
}

.legend div {
    display: flex;
    align-items: center;
    gap: 9px;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    display: inline-block;
}

.dot-working {
    background: #84cc16;
}

.dot-block {
    background: #ef4444;
}

.dot-appointment {
    background: #111116;
}

.calendar-main {
    display: grid;
    gap: 18px;
}

.calendar-card {
    overflow: hidden;
}

.forms-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.form {
    display: grid;
    gap: 18px;
    margin-top: 20px;
}

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.checkbox-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    color: var(--tf-muted);
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.btn-danger {
    min-height: 46px;
    padding: 0 18px;
    border: 1px solid #fecaca;
    border-radius: 999px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 900;
    cursor: pointer;
}

.appointment-detail {
    display: grid;
    gap: 8px;
    margin-top: 18px;
}

.appointment-detail strong {
    font-size: 18px;
}

.appointment-detail span {
    color: var(--tf-muted);
}

.appointment-detail small {
    width: fit-content;
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 900;
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 700;
}

.success-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #dcfce7;
    color: #166534;
    font-weight: 700;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.calendar-card :deep(.fc) {
    font-family: inherit;
}

.calendar-card :deep(.fc-toolbar-title) {
    font-size: 24px;
    letter-spacing: -0.04em;
}

.calendar-card :deep(.fc-button) {
    border: none;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 900;
    box-shadow: none;
}

.calendar-card :deep(.fc-button-primary:not(:disabled).fc-button-active) {
    background: var(--tf-accent);
    color: var(--tf-black);
}

.calendar-card :deep(.fc-event) {
    border-radius: 10px;
    padding: 2px 4px;
    font-weight: 800;
    cursor: pointer;
}

.calendar-card :deep(.fc-timegrid-slot) {
    height: 42px;
}

@media (max-width: 1100px) {

    .calendar-layout,
    .forms-grid {
        grid-template-columns: 1fr;
    }

    .sidebar-card {
        position: static;
    }

    .selected-range-card {
        align-items: flex-start;
        flex-direction: column;
    }

    .selected-range-actions {
        justify-content: flex-start;
    }
}

@media (max-width: 720px) {
    .schedule-header {
        align-items: start;
        flex-direction: column;
    }

    .two-columns {
        grid-template-columns: 1fr;
    }

    .calendar-card :deep(.fc-header-toolbar) {
        flex-direction: column;
        gap: 12px;
    }
}
</style>