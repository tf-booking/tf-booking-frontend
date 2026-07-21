<template>
    <div class="page schedule-page" :class="{ 'schedule-page-locked': isMobileLayout }">
        <section class="container">
            <div v-if="!isMobileLayout" class="schedule-header">
                <div>
                    <p class="tf-eyebrow">Agenda</p>
                    <h1>{{ isStaffOnly ? 'A minha agenda' : 'Agenda do negócio' }}</h1>
                    <p class="schedule-header-copy">
                        {{ isStaffOnly ? 'Gere as tuas marcações numa agenda visual.' : 'Gere marcações e bloqueios numa agenda visual.' }}
                    </p>
                </div>

                <div class="schedule-header-actions">
                    <div class="integration-stack">
                        <button
                            class="btn btn-secondary btn-google-calendar"
                            type="button"
                            :disabled="isGoogleCalendarButtonDisabled"
                            @click="connectGoogleCalendar"
                        >
                            {{ googleCalendarButtonLabel }}
                        </button>

                        <button
                            v-if="googleCalendarStatus.is_connected"
                            class="btn-google-calendar-disconnect"
                            type="button"
                            :disabled="isDisconnectingGoogleCalendar"
                            @click="disconnectGoogleCalendar"
                        >
                            {{ isDisconnectingGoogleCalendar ? 'A desligar...' : 'Desligar' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="isInitializing" class="card empty-card" />

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <div v-else-if="staffMembers.length === 0" class="card empty-card">
                Ainda não existem colaboradores. Cria primeiro colaboradores em
                <NuxtLink to="/staff">/staff</NuxtLink>.
            </div>

            <div v-else class="schedule-body">
                <div class="card calendar-card" :class="{ 'calendar-card-mobile': isMobileLayout }">
                    <div v-if="!isMobileLayout" class="cal-toolbar">
                        <div class="cal-toolbar-left">
                            <h2 class="cal-title">{{ calendarTitle }}</h2>

                            <div class="cal-nav">
                                <button type="button" aria-label="Anterior" @click="calPrev">‹</button>
                                <button type="button" aria-label="Seguinte" @click="calNext">›</button>
                            </div>

                        </div>

                        <div class="cal-toolbar-right">
                            <select
                                v-if="!isStaffOnly"
                                v-model.number="selectedStaffId"
                                class="cal-staff"
                                @change="handleStaffChange"
                            >
                                <option :value="null" disabled>Colaborador</option>

                                <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                                    {{ staff.name }}
                                </option>
                            </select>

                            <div class="view-toggle">
                                <button v-for="view in calendarViews" :key="view.value" type="button" class="view-btn"
                                    :class="{ active: currentView === view.value }" @click="setCalendarView(view.value)">
                                    {{ view.label }}
                                </button>
                            </div>

                            <button class="btn btn-accent cal-new" type="button" @click="openNewAppointmentModal">
                                + Novo
                            </button>
                        </div>
                    </div>

                    <div v-else class="mobile-date-nav">
                        <div class="cal-nav">
                            <button type="button" aria-label="Dia anterior" @click="mobileGoPrevDay">‹</button>
                            <button type="button" aria-label="Dia seguinte" @click="mobileGoNextDay">›</button>
                        </div>

                        <button class="cal-today" type="button" @click="mobileGoToday">Hoje</button>

                        <button type="button" class="mobile-date-picker" aria-label="Escolher data" @click="isDatePickerOpen = true">
                            <span class="mobile-date-label">{{ mobileDateLabel }}</span>

                            <svg class="mobile-date-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.6" />
                                <path d="M3 8H17" stroke="currentColor" stroke-width="1.6" />
                                <path d="M7 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                                <path d="M13 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                            </svg>
                        </button>
                    </div>

                    <p v-if="!isMobileLayout" class="cal-hint">
                        A área verde-clara mostra o horário de trabalho do colaborador. Clica ou arrasta na agenda para criar uma marcação ou bloqueio.
                    </p>

                    <p v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </p>

                    <p v-if="successMessage" class="success-message">
                        {{ successMessage }}
                    </p>

                    <ClientOnly v-if="!isMobileLayout">
                        <FullCalendar :key="slotIntervalMinutes" ref="calendarRef" :options="calendarOptions" />
                    </ClientOnly>

                    <div v-else class="mobile-board-wrapper">
                        <p v-if="isLoadingMobileDay" class="muted-text">A carregar agenda...</p>

                        <ScheduleMobileBoard
                            v-else
                            :staff-members="staffMembers"
                            :appointments="mobileAppointments"
                            :blocks="mobileBlocks"
                            :working-hours="mobileWorkingHours"
                            :date="mobileDate"
                            :slot-interval-minutes="slotIntervalMinutes"
                            :is-pro="isPro"
                            @open-appointment="handleMobileOpenAppointment"
                            @open-block="handleMobileOpenBlock"
                            @create-at="handleMobileCreateAt"
                        />
                    </div>
                </div>
            </div>

            <button
                v-if="isMobileLayout && selectedBusiness && staffMembers.length > 0"
                class="floating-add"
                type="button"
                aria-label="Novo período"
                @click="handleMobileCreate"
            >
                +
            </button>

            <DatePickerModal
                :open="isDatePickerOpen"
                :selected="mobileDate"
                @update:open="isDatePickerOpen = $event"
                @select="handleMobileDatePicked"
            />
        </section>

        <Teleport to="body">
            <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
                <div class="modal-card">
                    <button class="modal-close" type="button" aria-label="Fechar" @click="closeModal">×</button>

                    <div v-if="modalStep === 'choice'" class="modal-choice">
                        <p class="tf-eyebrow">Novo período</p>
                        <h2>O que queres criar?</h2>
                        <p class="modal-range-label">{{ modalRangeLabel }}</p>

                        <div class="modal-choice-actions">
                            <button class="btn btn-accent" type="button" @click="goToAppointmentForm">
                                Marcação
                            </button>

                            <button class="btn btn-secondary" type="button" @click="goToBlockForm">
                                Bloqueio
                            </button>
                        </div>
                    </div>

                    <div v-else-if="modalStep === 'appointment-form'" class="modal-form">
                        <p class="tf-eyebrow">Marcação</p>
                        <h2>Nova marcação</h2>

                        <form @submit.prevent="saveAppointment">
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
                                    <DateField v-model="appointmentForm.start_date" />
                                </div>

                                <div>
                                    <label class="label">Hora</label>
                                    <TimeSelect v-model="appointmentForm.start_time" />
                                </div>
                            </div>

                            <label class="toggle-row">
                                <input v-model="appointmentForm.is_walk_in" type="checkbox" />
                                <span>Cliente de rua (sem ficha)</span>
                            </label>

                            <template v-if="!appointmentForm.is_walk_in">
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
                                            placeholder="cliente@email.pt" required />
                                    </div>
                                </div>
                            </template>

                            <div v-if="isOwnerOrManager">
                                <label class="label">Desconto (€)</label>
                                <input v-model="appointmentForm.discount_amount" class="input" type="number" min="0"
                                    step="0.01" placeholder="0.00" />
                            </div>

                            <div>
                                <label class="label">Notas</label>
                                <input v-model="appointmentForm.notes" class="input" type="text"
                                    placeholder="Observações internas..." />
                            </div>

                            <div>
                                <label class="label">Repetir</label>

                                <select v-model="appointmentForm.repeat" class="input">
                                    <option value="none">Não repete</option>
                                    <option value="weekly">Todas as semanas</option>
                                    <option value="biweekly">De 2 em 2 semanas</option>
                                    <option value="monthly">Todos os meses</option>
                                    <option value="yearly">Todos os anos</option>
                                </select>
                            </div>

                            <template v-if="appointmentForm.repeat !== 'none'">
                                <label class="toggle-row">
                                    <input v-model="appointmentForm.repeat_no_end_date" type="checkbox"
                                        @change="appointmentForm.repeat_until = ''" />
                                    <span>Sem data limite</span>
                                </label>

                                <div v-if="!appointmentForm.repeat_no_end_date">
                                    <label class="label">Repetir até</label>
                                    <DateField v-model="appointmentForm.repeat_until" />
                                </div>
                            </template>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingAppointment">
                                    {{ isSavingAppointment ? 'A marcar...' : 'Criar marcação' }}
                                </button>

                                <button class="btn btn-secondary" type="button" @click="modalStep = 'choice'">
                                    Voltar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-else-if="modalStep === 'block-form'" class="modal-form">
                        <p class="tf-eyebrow">Bloqueio</p>
                        <h2>{{ editingBlock ? 'Editar bloqueio' : 'Novo bloqueio' }}</h2>

                        <form @submit.prevent="saveBlock">
                            <div class="two-columns">
                                <div>
                                    <label class="label">Data início</label>
                                    <DateField v-model="blockForm.start_date" />
                                </div>

                                <div>
                                    <label class="label">Hora início</label>
                                    <TimeSelect v-model="blockForm.start_time" />
                                </div>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Data fim</label>
                                    <DateField v-model="blockForm.end_date" />
                                </div>

                                <div>
                                    <label class="label">Hora fim</label>
                                    <TimeSelect v-model="blockForm.end_time" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Motivo</label>
                                <input v-model="blockForm.reason" class="input" type="text"
                                    placeholder="Férias, consulta, pausa, reunião..." />
                            </div>

                            <template v-if="!editingBlock">
                                <div>
                                    <label class="label">Repetir</label>

                                    <select v-model="blockForm.repeat" class="input">
                                        <option value="none">Não repete</option>
                                        <option value="weekly">Todas as semanas</option>
                                        <option value="biweekly">De 2 em 2 semanas</option>
                                        <option value="monthly">Todos os meses</option>
                                        <option value="yearly">Todos os anos</option>
                                    </select>
                                </div>

                                <div v-if="blockForm.repeat !== 'none'">
                                    <label class="label">Repetir até</label>
                                    <DateField v-model="blockForm.repeat_until" />
                                </div>
                            </template>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingBlock">
                                    {{ isSavingBlock ? 'A guardar...' : editingBlock ? 'Guardar alterações' : 'Criar bloqueio' }}
                                </button>

                                <button class="btn btn-secondary" type="button" @click="cancelBlockFormStep">
                                    Voltar
                                </button>

                                <button v-if="editingBlock" class="btn btn-danger" type="button"
                                    @click="deleteBlockFromModal">
                                    Apagar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-else-if="modalStep === 'appointment-detail' && modalAppointment" class="modal-detail">
                        <p class="tf-eyebrow">Marcação</p>
                        <h2>{{ modalAppointment.service_name || 'Marcação' }}</h2>

                        <div class="appointment-detail">
                            <span>{{ modalAppointment.customer_name }}</span>
                            <span>{{ modalAppointment.customer_phone || 'Sem telefone' }}</span>
                            <span>
                                {{ formatDateTime(modalAppointment.start_at) }}
                                -
                                {{ formatDateTime(modalAppointment.end_at) }}
                            </span>
                            <small v-if="modalAppointment.status !== 'confirmed'">
                                {{ appointmentStatusLabels[modalAppointment.status] || modalAppointment.status }}
                            </small>
                            <p v-if="Number(modalAppointment.discount_amount) > 0" class="modal-notes">
                                Desconto: -{{ formatCurrency(modalAppointment.discount_amount) }}
                                · Total: {{ formatCurrency(modalAppointment.final_price) }}
                            </p>
                            <p v-if="modalAppointment.notes" class="modal-notes">{{ modalAppointment.notes }}</p>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" type="button" @click="editAppointmentFromDetail">
                                Editar
                            </button>

                            <button class="btn btn-danger" type="button" @click="deleteAppointmentFromModal">
                                Apagar marcação
                            </button>
                        </div>
                    </div>

                    <div v-else-if="modalStep === 'appointment-edit' && modalAppointment" class="modal-form">
                        <p class="tf-eyebrow">Marcação</p>
                        <h2>Editar marcação</h2>

                        <form @submit.prevent="saveAppointmentEdit">
                            <div>
                                <label class="label">Estado</label>

                                <select v-model="appointmentEditForm.status" class="input">
                                    <option v-for="option in appointmentStatusOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Data início</label>
                                    <DateField v-model="appointmentEditForm.start_date" />
                                </div>

                                <div>
                                    <label class="label">Hora início</label>
                                    <TimeSelect v-model="appointmentEditForm.start_time" />
                                </div>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Data fim</label>
                                    <DateField v-model="appointmentEditForm.end_date" />
                                </div>

                                <div>
                                    <label class="label">Hora fim</label>
                                    <TimeSelect v-model="appointmentEditForm.end_time" />
                                </div>
                            </div>

                            <div v-if="isOwnerOrManager">
                                <label class="label">Desconto (€)</label>
                                <input v-model="appointmentEditForm.discount_amount" class="input" type="number"
                                    min="0" step="0.01" placeholder="0.00" />
                            </div>

                            <div>
                                <label class="label">Notas</label>
                                <input v-model="appointmentEditForm.notes" class="input" type="text"
                                    placeholder="Observações internas..." />
                            </div>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingAppointmentEdit">
                                    {{ isSavingAppointmentEdit ? 'A guardar...' : 'Guardar alterações' }}
                                </button>

                                <button class="btn btn-secondary" type="button" @click="modalStep = 'appointment-detail'">
                                    Voltar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-else-if="modalStep === 'block-detail' && modalBlock" class="modal-detail">
                        <p class="tf-eyebrow">Bloqueio</p>
                        <h2>{{ modalBlock.reason || 'Bloqueado' }}</h2>

                        <div class="appointment-detail">
                            <span>
                                {{ formatDateTime(modalBlock.start_at) }}
                                -
                                {{ formatDateTime(modalBlock.end_at) }}
                            </span>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-secondary" type="button" @click="editBlockFromDetail">
                                Editar
                            </button>

                            <button class="btn btn-danger" type="button" @click="deleteBlockFromModal">
                                Apagar bloqueio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
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
import type {
    Appointment,
    StaffBlock,
    StaffMember,
    WorkingHour,
} from '~/types/schedule'
import { findNextAppointmentId, getAppointmentColors, getBlockColors } from '~/utils/scheduleColors'

definePageMeta({
    middleware: 'auth',
    layout: 'backoffice',
})

type Business = {
    id: number
    uuid: string
    name: string
    slug: string
    is_active: boolean
    plan: string
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

type RecurrenceFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

type SelectedRange = {
    start: string
    end: string
    startDate: string
    startTime: string
    endDate: string
    endTime: string
}

type ModalStep =
    | 'choice'
    | 'appointment-form'
    | 'block-form'
    | 'appointment-detail'
    | 'appointment-edit'
    | 'block-detail'

type GoogleCalendarStatus = {
    is_configured: boolean
    is_connected: boolean
    can_connect: boolean
    calendar_id: string
    connected_at: string | null
}

const { apiFetch } = useApi()
const { isFree } = usePlan()
const route = useRoute()
const router = useRouter()
const { businesses: membershipBusinesses, loadCurrentBusiness, currentUser } = useCurrentBusiness()

const isMobileViewport = import.meta.client && window.innerWidth < 720

const calendarRef = ref<any>(null)
const calendarTitle = ref('')
const currentView = ref(isMobileViewport ? 'timeGridDay' : 'timeGridWeek')

const getCalendarApi = () => calendarRef.value?.getApi?.()
const calPrev = () => getCalendarApi()?.prev()
const calNext = () => getCalendarApi()?.next()
const calToday = () => getCalendarApi()?.today()

const calendarViews = [
    { value: 'timeGridDay', label: 'Dia' },
    { value: 'timeGridWeek', label: 'Semana' },
    { value: 'dayGridMonth', label: 'Mês' },
]

const setCalendarView = (view: string) => {
    currentView.value = view
    getCalendarApi()?.changeView(view)
}

const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const weekdayAbbrPt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const appointmentStatusLabels: Record<string, string> = {
    confirmed: 'Confirmada',
    no_show: 'Não apareceu',
}

const MAX_RECURRENCE_OCCURRENCES = 104

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const isPro = computed(() => selectedBusiness.value?.plan === 'pro')
const slotIntervalMinutes = ref(30)

const services = ref<Service[]>([])
const staffMembers = ref<StaffMember[]>([])
const selectedStaffId = ref<number | null>(null)

const workingHours = ref<WorkingHour[]>([])
const blocks = ref<StaffBlock[]>([])
const appointments = ref<Appointment[]>([])

const modalStep = ref<ModalStep>('choice')
const isModalOpen = ref(false)
const modalRange = ref<SelectedRange | null>(null)
const modalAppointment = ref<Appointment | null>(null)
const modalBlock = ref<StaffBlock | null>(null)

const visibleRange = reactive({
    start: '',
    end: '',
})

const isInitializing = ref(true)
const isLoadingBusinesses = ref(false)
const isLoadingStaff = ref(false)
const isSavingBlock = ref(false)
const isSavingAppointment = ref(false)
const isSavingAppointmentEdit = ref(false)
const isLoadingGoogleCalendarStatus = ref(false)
const isConnectingGoogleCalendar = ref(false)
const isDisconnectingGoogleCalendar = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const googleCalendarStatus = reactive<GoogleCalendarStatus>({
    is_configured: false,
    is_connected: false,
    can_connect: false,
    calendar_id: 'primary',
    connected_at: null,
})

const editingBlock = ref<StaffBlock | null>(null)

const blockForm = reactive({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    reason: '',
    repeat: 'none' as RecurrenceFrequency,
    repeat_until: '',
})

const appointmentForm = reactive({
    service_uuid: '',
    start_date: '',
    start_time: '',
    is_walk_in: false,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    discount_amount: '',
    notes: '',
    repeat: 'none' as RecurrenceFrequency,
    repeat_until: '',
    repeat_no_end_date: false,
})

const appointmentEditForm = reactive({
    status: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    discount_amount: '',
    notes: '',
})

const selectedStaff = computed(() => {
    if (!selectedStaffId.value) {
        return null
    }

    return staffMembers.value.find((staff) => staff.id === selectedStaffId.value) || null
})

const currentRole = computed(() => {
    if (!selectedBusiness.value) {
        return null
    }

    const membership = membershipBusinesses.value.find(
        (business) => business.business_uuid === selectedBusiness.value?.uuid
    )

    return membership?.role || null
})

const isStaffOnly = computed(() => currentRole.value === 'staff')

const isOwnerOrManager = computed(() => ['owner', 'manager', 'admin'].includes(currentRole.value || ''))

const isMobileLayout = ref(isMobileViewport)

const updateIsMobileLayout = () => {
    isMobileLayout.value = window.innerWidth <= 720
}

const mobileDate = ref('')
const isDatePickerOpen = ref(false)
const mobileAppointments = ref<Appointment[]>([])
const mobileBlocks = ref<StaffBlock[]>([])
const mobileWorkingHours = ref<WorkingHour[]>([])
const isLoadingMobileDay = ref(false)

const mobileDateLabel = computed(() => {
    const date = new Date(`${mobileDate.value}T00:00:00`)

    return new Intl.DateTimeFormat('pt-PT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    }).format(date)
})

const appointmentStatusOptions = computed(() => {
    return Object.entries(appointmentStatusLabels).map(([value, label]) => ({ value, label }))
})

const googleCalendarButtonLabel = computed(() => {
    if (isConnectingGoogleCalendar.value) {
        return 'A ligar ao Google...'
    }

    if (isLoadingGoogleCalendarStatus.value) {
        return 'A verificar Google...'
    }

    if (!googleCalendarStatus.is_configured) {
        return 'Google Calendar indisponível'
    }

    if (googleCalendarStatus.is_connected) {
        return 'Google Calendar ligado'
    }

    if (isFree.value) {
        return 'Google Calendar (Pro)'
    }

    return 'Conectar Google Calendar'
})

const googleCalendarHint = computed(() => {
    if (!googleCalendarStatus.is_configured) {
        return 'Falta configurar as credenciais Google no backend.'
    }

    if (googleCalendarStatus.is_connected) {
        return 'As tuas marcações passam a ser enviadas para o teu Google Calendar.'
    }

    if (!googleCalendarStatus.can_connect) {
        return 'Precisas de ter um perfil de profissional neste negócio para ligar esta integração.'
    }

    return 'Liga a tua agenda a um calendário Google.'
})

const isGoogleCalendarButtonDisabled = computed(() => {
    return (
        !selectedBusiness.value
        || !googleCalendarStatus.is_configured
        || !googleCalendarStatus.can_connect
        || isLoadingGoogleCalendarStatus.value
        || isConnectingGoogleCalendar.value
        || (isFree.value && !googleCalendarStatus.is_connected)
    )
})

const nextAppointmentId = computed(() => {
    return findNextAppointmentId(appointments.value)
})

const modalRangeLabel = computed(() => {
    if (!modalRange.value) {
        return ''
    }

    return formatRangeLabel(modalRange.value.start, modalRange.value.end)
})

const calendarEvents = computed<EventInput[]>(() => {
    const workingHourEvents: EventInput[] = workingHours.value.map((hour) => ({
        id: `working-${hour.id}`,
        daysOfWeek: [toFullCalendarWeekday(hour.weekday)],
        startTime: normalizeTime(hour.start_time),
        endTime: normalizeTime(hour.end_time),
        display: 'background',
        backgroundColor: 'rgba(194, 232, 0, 0.16)',
        extendedProps: {
            type: 'working-hour',
        },
    }))

    const blockColors = getBlockColors()

    const blockEvents: EventInput[] = blocks.value.map((block) => ({
        id: `block-${block.uuid}`,
        title: block.reason || 'Bloqueado',
        start: block.start_at,
        end: block.end_at,
        backgroundColor: blockColors.backgroundColor,
        borderColor: blockColors.borderColor,
        textColor: blockColors.textColor,
        extendedProps: {
            type: 'block',
            source: block,
            subtitle: '',
        },
    }))

    const appointmentEvents: EventInput[] = appointments.value.map((appointment) => {
        const colors = getAppointmentColors(appointment, appointment.id === nextAppointmentId.value)

        return {
            id: `appointment-${appointment.uuid}`,
            title: appointment.service_name || 'Marcação',
            start: appointment.start_at,
            end: appointment.end_at,
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
            textColor: colors.textColor,
            extendedProps: {
                type: 'appointment',
                source: appointment,
                subtitle: appointment.customer_name || 'Cliente',
            },
        }
    })

    return [
        ...workingHourEvents,
        ...blockEvents,
        ...appointmentEvents,
    ]
})

const renderEventContent = (arg: any) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'tf-event'

    const titleEl = document.createElement('strong')
    titleEl.textContent = arg.event.title
    wrapper.appendChild(titleEl)

    const subtitle = arg.event.extendedProps?.subtitle
    if (subtitle) {
        const subtitleEl = document.createElement('span')
        subtitleEl.textContent = subtitle
        wrapper.appendChild(subtitleEl)
    }

    return { domNodes: [wrapper] }
}

const renderDayHeader = (arg: any) => {
    const wrapper = document.createElement('div')
    wrapper.className = arg.isToday ? 'tf-day-header is-today' : 'tf-day-header'

    const dow = document.createElement('span')
    dow.className = 'tf-day-header-dow'
    dow.textContent = weekdayAbbrPt[arg.date.getDay()] ?? ''

    const num = document.createElement('span')
    num.className = 'tf-day-header-num'
    num.textContent = String(arg.date.getDate())

    wrapper.appendChild(dow)
    wrapper.appendChild(num)

    return { domNodes: [wrapper] }
}

const minutesToDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`
}

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
    ],
    initialView: currentView.value,
    locale: ptLocale,
    firstDay: 1,
    selectable: true,
    selectMirror: true,
    allDaySlot: false,
    nowIndicator: true,
    height: 'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '22:00:00',
    slotDuration: minutesToDuration(slotIntervalMinutes.value),
    slotLabelInterval: minutesToDuration(slotIntervalMinutes.value),
    snapDuration: minutesToDuration(Math.min(15, slotIntervalMinutes.value)),
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    },
    headerToolbar: false,
    events: calendarEvents.value,
    eventContent: renderEventContent,
    select: handleCalendarSelect,
    eventClick: handleEventClick,
    datesSet: handleDatesSet,
    ...(currentView.value !== 'dayGridMonth' ? { dayHeaderContent: renderDayHeader } : {}),
}))

watch(slotIntervalMinutes, (minutes) => {
    const api = getCalendarApi()

    if (!api) {
        return
    }

    api.setOption('slotDuration', minutesToDuration(minutes))
    api.setOption('slotLabelInterval', minutesToDuration(minutes))
    api.setOption('snapDuration', minutesToDuration(Math.min(15, minutes)))
})

const resetMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
}

const firstErrorMessage = (error: any, fallback: string) => {
    const data = error?.data

    if (!data) {
        return fallback
    }

    if (typeof data.detail === 'string' && data.detail) {
        return data.detail
    }

    for (const value of Object.values(data)) {
        if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) {
            return value[0]
        }

        if (typeof value === 'string' && value) {
            return value
        }
    }

    return fallback
}

const toFullCalendarWeekday = (backendWeekday: number) => {
    return backendWeekday === 6 ? 0 : backendWeekday + 1
}

const normalizeTime = (value: string) => {
    return value.length === 5 ? `${value}:00` : value
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

const formatCurrency = (value: string | number | null) => {
    const amount = Number(value || 0)

    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
    })
        .format(Number.isFinite(amount) ? amount : 0)
        .replace(/\s/g, '')
}

const formatRangeLabel = (startIso: string, endIso: string) => {
    const start = new Date(startIso)
    const end = new Date(endIso)

    const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
    })

    const timeFormatter = new Intl.DateTimeFormat('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
}

const splitDateTime = (value: string) => {
    const date = new Date(value)

    return {
        date: formatDateInput(date),
        time: formatTimeInput(date),
    }
}

const resetBlockForm = () => {
    editingBlock.value = null

    const today = todayDate()

    blockForm.start_date = today
    blockForm.start_time = '09:00'
    blockForm.end_date = today
    blockForm.end_time = '10:00'
    blockForm.reason = ''
    blockForm.repeat = 'none'
    blockForm.repeat_until = ''
}

const resetAppointmentForm = () => {
    const today = todayDate()

    appointmentForm.service_uuid = services.value[0]?.uuid || ''
    appointmentForm.start_date = today
    appointmentForm.start_time = '09:00'
    appointmentForm.is_walk_in = false
    appointmentForm.customer_name = ''
    appointmentForm.customer_phone = ''
    appointmentForm.customer_email = ''
    appointmentForm.discount_amount = ''
    appointmentForm.notes = ''
    appointmentForm.repeat = 'none'
    appointmentForm.repeat_until = ''
    appointmentForm.repeat_no_end_date = false
}

const fillFormsFromModalRange = () => {
    if (!modalRange.value) {
        return
    }

    appointmentForm.start_date = modalRange.value.startDate
    appointmentForm.start_time = modalRange.value.startTime

    blockForm.start_date = modalRange.value.startDate
    blockForm.start_time = modalRange.value.startTime
    blockForm.end_date = modalRange.value.endDate
    blockForm.end_time = modalRange.value.endTime
}

const shiftDateByFrequency = (date: Date, frequency: RecurrenceFrequency) => {
    const next = new Date(date)

    if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7)
    } else if (frequency === 'biweekly') {
        next.setDate(next.getDate() + 14)
    } else if (frequency === 'monthly') {
        next.setMonth(next.getMonth() + 1)
    } else if (frequency === 'yearly') {
        next.setFullYear(next.getFullYear() + 1)
    }

    return next
}

const buildOccurrences = (
    startDate: string,
    endDate: string,
    frequency: RecurrenceFrequency,
    untilDate: string,
) => {
    if (frequency === 'none' || !startDate) {
        return { occurrences: [{ startDate, endDate }], capped: false }
    }

    const spanDays = Math.round(
        (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime())
        / 86400000
    )

    const until = untilDate ? new Date(`${untilDate}T23:59:59`) : null
    const occurrences: { startDate: string; endDate: string }[] = []
    let cursor = new Date(`${startDate}T00:00:00`)
    let capped = false

    while (!until || cursor.getTime() <= until.getTime()) {
        if (occurrences.length >= MAX_RECURRENCE_OCCURRENCES) {
            capped = true
            break
        }

        const cursorEnd = new Date(cursor)
        cursorEnd.setDate(cursorEnd.getDate() + spanDays)

        occurrences.push({
            startDate: formatDateInput(cursor),
            endDate: formatDateInput(cursorEnd),
        })

        cursor = shiftDateByFrequency(cursor, frequency)
    }

    return { occurrences, capped }
}

const closeModal = () => {
    isModalOpen.value = false
    modalStep.value = 'choice'
    modalRange.value = null
    modalAppointment.value = null
    modalBlock.value = null
    editingBlock.value = null
    getCalendarApi()?.unselect()
}

const openNewAppointmentModal = () => {
    resetMessages()

    if (!selectedStaffId.value) {
        errorMessage.value = 'Seleciona primeiro um colaborador.'
        return
    }

    modalRange.value = null
    resetAppointmentForm()
    resetBlockForm()
    modalStep.value = 'choice'
    isModalOpen.value = true
}

const goToAppointmentForm = () => {
    modalStep.value = 'appointment-form'
}

const goToBlockForm = () => {
    if (!blockForm.reason) {
        blockForm.reason = 'Bloqueado'
    }

    modalStep.value = 'block-form'
}

const cancelBlockFormStep = () => {
    if (editingBlock.value) {
        modalStep.value = 'block-detail'
        return
    }

    modalStep.value = 'choice'
}

const editBlockFromDetail = () => {
    if (!modalBlock.value) {
        return
    }

    editBlock(modalBlock.value)
    modalStep.value = 'block-form'
}

const handleDatesSet = async (info: DatesSetArg) => {
    calendarTitle.value = computeCalendarTitle(info)
    currentView.value = info.view.type

    const endDate = new Date(info.end)
    endDate.setDate(endDate.getDate() - 1)

    visibleRange.start = formatDateInput(info.start)
    visibleRange.end = formatDateInput(endDate)

    await loadAppointments()
}

const computeCalendarTitle = (info: DatesSetArg) => {
    if (info.view.type === 'dayGridMonth') {
        return info.view.title
    }

    const start = info.view.currentStart
    const end = new Date(info.view.currentEnd)
    end.setDate(end.getDate() - 1)

    const startMonthName = monthNamesPt[start.getMonth()] ?? ''
    const endMonthName = monthNamesPt[end.getMonth()] ?? ''

    if (info.view.type === 'timeGridDay') {
        return `${start.getDate()} de ${startMonthName}`
    }

    if (start.getMonth() === end.getMonth()) {
        return startMonthName
    }

    return `${startMonthName} — ${endMonthName}`
}

const handleCalendarSelect = (selection: DateSelectArg) => {
    resetMessages()

    if (!selectedStaffId.value) {
        errorMessage.value = 'Seleciona primeiro um colaborador.'
        getCalendarApi()?.unselect()
        return
    }

    modalRange.value = {
        start: selection.start.toISOString(),
        end: selection.end.toISOString(),
        startDate: formatDateInput(selection.start),
        startTime: formatTimeInput(selection.start),
        endDate: formatDateInput(selection.end),
        endTime: formatTimeInput(selection.end),
    }

    resetAppointmentForm()
    resetBlockForm()
    fillFormsFromModalRange()

    modalStep.value = 'choice'
    isModalOpen.value = true
}

const handleEventClick = (info: EventClickArg) => {
    resetMessages()

    const type = info.event.extendedProps.type

    if (type === 'block') {
        modalBlock.value = info.event.extendedProps.source as StaffBlock
        modalStep.value = 'block-detail'
        isModalOpen.value = true
        return
    }

    if (type === 'appointment') {
        modalAppointment.value = info.event.extendedProps.source as Appointment
        modalStep.value = 'appointment-detail'
        isModalOpen.value = true
    }
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

const loadScheduleSettings = async () => {
    if (!selectedBusiness.value) {
        return
    }

    try {
        const response = await apiFetch<{ slot_interval_minutes: number }>(
            '/businesses/me-settings/',
            { query: { business_uuid: selectedBusiness.value.uuid } }
        )

        slotIntervalMinutes.value = response.slot_interval_minutes
    } catch (error) {
        console.error('Erro ao carregar definições da agenda:', error)
    }
}

const loadGoogleCalendarStatus = async () => {
    if (!selectedBusiness.value) {
        googleCalendarStatus.is_configured = false
        googleCalendarStatus.is_connected = false
        googleCalendarStatus.can_connect = false
        googleCalendarStatus.calendar_id = 'primary'
        googleCalendarStatus.connected_at = null
        return
    }

    try {
        isLoadingGoogleCalendarStatus.value = true

        const response = await apiFetch<GoogleCalendarStatus>(
            `/businesses/${selectedBusiness.value.uuid}/google-calendar/status/`
        )

        googleCalendarStatus.is_configured = response.is_configured
        googleCalendarStatus.is_connected = response.is_connected
        googleCalendarStatus.can_connect = response.can_connect
        googleCalendarStatus.calendar_id = response.calendar_id
        googleCalendarStatus.connected_at = response.connected_at
    } catch (error) {
        console.error(error)
        googleCalendarStatus.is_connected = false
        googleCalendarStatus.can_connect = false
        errorMessage.value = 'Não foi possível verificar o estado do Google Calendar.'
    } finally {
        isLoadingGoogleCalendarStatus.value = false
    }
}

const connectGoogleCalendar = async () => {
    if (!selectedBusiness.value || isGoogleCalendarButtonDisabled.value) {
        return
    }

    try {
        isConnectingGoogleCalendar.value = true
        resetMessages()

        const response = await apiFetch<{ url: string }>(
            `/businesses/${selectedBusiness.value.uuid}/google-calendar/connect/`,
            {
                method: 'POST',
            }
        )

        window.location.href = response.url
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.detail || 'Não foi possível iniciar a ligação ao Google Calendar.'
    } finally {
        isConnectingGoogleCalendar.value = false
    }
}

const disconnectGoogleCalendar = async () => {
    if (!selectedBusiness.value || isDisconnectingGoogleCalendar.value) {
        return
    }

    try {
        isDisconnectingGoogleCalendar.value = true
        resetMessages()

        await apiFetch(
            `/businesses/${selectedBusiness.value.uuid}/google-calendar/disconnect/`,
            { method: 'POST' }
        )

        googleCalendarStatus.is_connected = false
        googleCalendarStatus.connected_at = null
        successMessage.value = 'Google Calendar desligado.'
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível desligar o Google Calendar.'
    } finally {
        isDisconnectingGoogleCalendar.value = false
    }
}

const applyGoogleCalendarFeedbackFromQuery = async () => {
    const googleCalendarResult = route.query.google_calendar

    if (typeof googleCalendarResult !== 'string') {
        return
    }

    if (googleCalendarResult === 'connected') {
        successMessage.value = 'Google Calendar ligado com sucesso.'
    } else if (googleCalendarResult === 'cancelled') {
        errorMessage.value = 'Ligação ao Google Calendar cancelada.'
    } else if (googleCalendarResult === 'error') {
        errorMessage.value = 'Não foi possível concluir a ligação ao Google Calendar.'
    }

    const nextQuery = { ...route.query }
    delete nextQuery.google_calendar

    await router.replace({
        query: nextQuery,
    })
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

        if (!selectedStaffId.value && staffMembers.value.length > 0) {
            const ownStaffMember = staffMembers.value.find(
                (staff) => staff.user === currentUser.value?.id
            )

            selectedStaffId.value = (ownStaffMember || staffMembers.value[0]!).id
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
        }>(`/working-hours/?staff=${selectedStaffId.value}&is_active=true`)

        workingHours.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar o horário de trabalho.'
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
    resetBlockForm()
    closeModal()

    await loadWorkingHours()
    await loadBlocks()
    await loadAppointments()
}

const loadMobileDay = async () => {
    if (!selectedBusiness.value || !mobileDate.value) {
        return
    }

    const weekday = (new Date(`${mobileDate.value}T00:00:00`).getDay() + 6) % 7

    try {
        isLoadingMobileDay.value = true
        resetMessages()

        const [appointmentsResponse, blocksResponse, workingHoursResponse] = await Promise.all([
            apiFetch<{ results: Appointment[] }>(
                `/appointments/?business=${selectedBusiness.value.id}&date=${mobileDate.value}`
            ),
            apiFetch<{ results: StaffBlock[] }>(
                `/staff-blocks/?business=${selectedBusiness.value.id}&date=${mobileDate.value}`
            ),
            apiFetch<{ results: WorkingHour[] }>(
                `/working-hours/?business=${selectedBusiness.value.id}&weekday=${weekday}&is_active=true`
            ),
        ])

        mobileAppointments.value = appointmentsResponse.results
        mobileBlocks.value = blocksResponse.results
        mobileWorkingHours.value = workingHoursResponse.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar a agenda do dia.'
    } finally {
        isLoadingMobileDay.value = false
    }
}

const refreshScheduleData = async () => {
    await loadBlocks()
    await loadAppointments()

    if (isMobileLayout.value) {
        await loadMobileDay()
    }
}

const shiftMobileDate = (days: number) => {
    const date = new Date(`${mobileDate.value}T00:00:00`)
    date.setDate(date.getDate() + days)
    mobileDate.value = formatDateInput(date)
}

const mobileGoPrevDay = () => {
    shiftMobileDate(-1)
    loadMobileDay()
}

const mobileGoNextDay = () => {
    shiftMobileDate(1)
    loadMobileDay()
}

const mobileGoToday = () => {
    mobileDate.value = todayDate()
    loadMobileDay()
}

const handleMobileDatePicked = (iso: string) => {
    mobileDate.value = iso
    loadMobileDay()
}

const handleMobileOpenAppointment = (appointment: Appointment) => {
    resetMessages()
    modalAppointment.value = appointment
    modalStep.value = 'appointment-detail'
    isModalOpen.value = true
}

const handleMobileOpenBlock = (block: StaffBlock) => {
    resetMessages()
    modalBlock.value = block
    modalStep.value = 'block-detail'
    isModalOpen.value = true
}

const handleMobileCreate = () => {
    resetMessages()

    if (!staffMembers.value.length) {
        errorMessage.value = 'Ainda não existem colaboradores.'
        return
    }

    selectedStaffId.value = staffMembers.value[0]!.id
    openNewAppointmentModal()
}

// Clicar num horário vazio da agenda mobile (ScheduleMobileBoard) abre a
// mesma modal de escolha (Marcação/Bloqueio), já com a hora clicada
// preenchida - equivalente ao que "handleCalendarSelect" já fazia no desktop.
const handleMobileCreateAt = ({ staffId, time }: { staffId: number; time: string }) => {
    resetMessages()

    selectedStaffId.value = staffId

    const interval = slotIntervalMinutes.value > 0 ? slotIntervalMinutes.value : 30
    const [hour, minute] = time.split(':').map(Number)
    const endTotalMinutes = (hour ?? 0) * 60 + (minute ?? 0) + interval
    const endTime = `${String(Math.floor(endTotalMinutes / 60)).padStart(2, '0')}:${String(endTotalMinutes % 60).padStart(2, '0')}`

    modalRange.value = {
        start: toDateTimePayload(mobileDate.value, time),
        end: toDateTimePayload(mobileDate.value, endTime),
        startDate: mobileDate.value,
        startTime: time,
        endDate: mobileDate.value,
        endTime,
    }

    resetAppointmentForm()
    resetBlockForm()
    fillFormsFromModalRange()

    modalStep.value = 'choice'
    isModalOpen.value = true
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

    if (editingBlock.value) {
        try {
            isSavingBlock.value = true

            await apiFetch(`/staff-blocks/${editingBlock.value.uuid}/`, {
                method: 'PUT',
                body: {
                    staff_member: selectedStaffId.value,
                    start_at: startAt,
                    end_at: endAt,
                    reason: blockForm.reason,
                },
            })

            successMessage.value = 'Bloqueio atualizado com sucesso.'
            resetBlockForm()
            closeModal()
            await refreshScheduleData()
        } catch (error: any) {
            console.error(error)
            errorMessage.value = firstErrorMessage(error, 'Erro ao guardar bloqueio.')
        } finally {
            isSavingBlock.value = false
        }

        return
    }

    if (blockForm.repeat !== 'none' && !blockForm.repeat_until) {
        errorMessage.value = 'Escolhe até quando o bloqueio se repete.'
        return
    }

    const { occurrences, capped } = buildOccurrences(
        blockForm.start_date,
        blockForm.end_date,
        blockForm.repeat,
        blockForm.repeat_until,
    )

    try {
        isSavingBlock.value = true

        let successCount = 0
        let failCount = 0

        for (const occurrence of occurrences) {
            try {
                await apiFetch('/staff-blocks/', {
                    method: 'POST',
                    body: {
                        staff_member: selectedStaffId.value,
                        start_at: toDateTimePayload(occurrence.startDate, blockForm.start_time),
                        end_at: toDateTimePayload(occurrence.endDate, blockForm.end_time),
                        reason: blockForm.reason,
                    },
                })

                successCount += 1
            } catch (error) {
                console.error(error)
                failCount += 1
            }
        }

        if (successCount && !failCount) {
            successMessage.value = successCount > 1
                ? `${successCount} bloqueios criados com sucesso.`
                : 'Bloqueio criado com sucesso.'
        } else if (successCount && failCount) {
            successMessage.value = `${successCount} bloqueios criados, ${failCount} falharam.`
        } else {
            errorMessage.value = 'Não foi possível criar o bloqueio.'
        }

        if (capped && successCount) {
            successMessage.value = `${successMessage.value} Limite de ${MAX_RECURRENCE_OCCURRENCES} ocorrências atingido.`
        }

        if (successCount) {
            resetBlockForm()
            closeModal()
            await refreshScheduleData()
        }
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
    blockForm.repeat = 'none'
    blockForm.repeat_until = ''
}

const deleteBlockFromModal = async () => {
    const block = modalBlock.value || editingBlock.value

    if (!block) {
        return
    }

    try {
        await apiFetch(`/staff-blocks/${block.uuid}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Bloqueio apagado com sucesso.'
        closeModal()
        await refreshScheduleData()
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

    if (
        !appointmentForm.is_walk_in
        && (!appointmentForm.customer_name || !appointmentForm.customer_phone || !appointmentForm.customer_email)
    ) {
        errorMessage.value = 'Preenche o nome, telefone e email do cliente.'
        return
    }

    if (
        appointmentForm.repeat !== 'none'
        && !appointmentForm.repeat_no_end_date
        && !appointmentForm.repeat_until
    ) {
        errorMessage.value = 'Escolhe até quando a marcação se repete ou marca "Sem data limite".'
        return
    }

    const { occurrences, capped } = buildOccurrences(
        appointmentForm.start_date,
        appointmentForm.start_date,
        appointmentForm.repeat,
        appointmentForm.repeat_until,
    )

    const recurrenceGroup = appointmentForm.repeat !== 'none' ? crypto.randomUUID() : null

    try {
        isSavingAppointment.value = true

        let successCount = 0
        let failCount = 0

        for (const occurrence of occurrences) {
            try {
                await apiFetch('/public/appointments/', {
                    method: 'POST',
                    body: {
                        business_slug: selectedBusiness.value.slug,
                        service_uuid: appointmentForm.service_uuid,
                        staff_uuid: selectedStaff.value.uuid,
                        start_at: toDateTimePayload(occurrence.startDate, appointmentForm.start_time),
                        is_walk_in: appointmentForm.is_walk_in,
                        customer_name: appointmentForm.customer_name,
                        customer_phone: appointmentForm.customer_phone,
                        customer_email: appointmentForm.customer_email,
                        discount_amount: Number(appointmentForm.discount_amount) || 0,
                        recurrence_group: recurrenceGroup,
                        notes: appointmentForm.notes,
                        source: 'manual',
                    },
                })

                successCount += 1
            } catch (error) {
                console.error(error)
                failCount += 1
            }
        }

        if (successCount && !failCount) {
            successMessage.value = successCount > 1
                ? `${successCount} marcações criadas com sucesso.`
                : 'Marcação criada com sucesso.'
        } else if (successCount && failCount) {
            successMessage.value = `${successCount} marcações criadas, ${failCount} não foram criadas (horário indisponível).`
        } else {
            errorMessage.value = 'Não foi possível criar a marcação. Verifica a disponibilidade do horário.'
        }

        if (capped && successCount) {
            successMessage.value = `${successMessage.value} Limite de ${MAX_RECURRENCE_OCCURRENCES} ocorrências atingido.`
        }

        if (successCount) {
            resetAppointmentForm()
            closeModal()
            await refreshScheduleData()
        }
    } finally {
        isSavingAppointment.value = false
    }
}

const editAppointmentFromDetail = () => {
    if (!modalAppointment.value) {
        return
    }

    const start = splitDateTime(modalAppointment.value.start_at)
    const end = splitDateTime(modalAppointment.value.end_at)

    appointmentEditForm.status = modalAppointment.value.status
    appointmentEditForm.start_date = start.date
    appointmentEditForm.start_time = start.time
    appointmentEditForm.end_date = end.date
    appointmentEditForm.end_time = end.time
    appointmentEditForm.discount_amount = modalAppointment.value.discount_amount || ''
    appointmentEditForm.notes = modalAppointment.value.notes || ''

    modalStep.value = 'appointment-edit'
}

const saveAppointmentEdit = async () => {
    resetMessages()

    if (!modalAppointment.value) {
        return
    }

    if (
        !appointmentEditForm.start_date
        || !appointmentEditForm.start_time
        || !appointmentEditForm.end_date
        || !appointmentEditForm.end_time
    ) {
        errorMessage.value = 'Preenche a data e hora de início e fim.'
        return
    }

    const startAt = toDateTimePayload(appointmentEditForm.start_date, appointmentEditForm.start_time)
    const endAt = toDateTimePayload(appointmentEditForm.end_date, appointmentEditForm.end_time)

    if (new Date(endAt) <= new Date(startAt)) {
        errorMessage.value = 'O fim da marcação tem de ser depois do início.'
        return
    }

    try {
        isSavingAppointmentEdit.value = true

        await apiFetch(`/appointments/${modalAppointment.value.uuid}/`, {
            method: 'PATCH',
            body: {
                status: appointmentEditForm.status,
                start_at: startAt,
                end_at: endAt,
                notes: appointmentEditForm.notes,
                ...(isOwnerOrManager.value
                    ? { discount_amount: Number(appointmentEditForm.discount_amount) || 0 }
                    : {}),
            },
        })

        successMessage.value = 'Marcação atualizada com sucesso.'
        closeModal()
        await refreshScheduleData()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = firstErrorMessage(error, 'Não foi possível guardar a marcação.')
    } finally {
        isSavingAppointmentEdit.value = false
    }
}

const deleteAppointmentFromModal = async () => {
    if (!modalAppointment.value) {
        return
    }

    try {
        await apiFetch(`/appointments/${modalAppointment.value.uuid}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Marcação apagada com sucesso.'
        closeModal()
        await refreshScheduleData()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar a marcação.'
    }
}

watch(isMobileLayout, (mobile) => {
    if (mobile) {
        loadMobileDay()
    }
})

onMounted(async () => {
    resetBlockForm()
    resetAppointmentForm()

    mobileDate.value = todayDate()
    updateIsMobileLayout()
    window.addEventListener('resize', updateIsMobileLayout)

    try {
        await loadCurrentBusiness()
        await loadBusinesses()

        // Estas 4 só dependem do negócio selecionado, não umas das outras.
        await Promise.all([
            loadScheduleSettings(),
            loadGoogleCalendarStatus(),
            loadServices(),
            loadStaff(),
        ])

        // Estas 3 dependem do colaborador escolhido (definido dentro de loadStaff).
        await Promise.all([
            loadWorkingHours(),
            loadBlocks(),
            loadAppointments(),
        ])

        await applyGoogleCalendarFeedbackFromQuery()
    } finally {
        isInitializing.value = false
    }

    if (isMobileLayout.value) {
        await loadMobileDay()
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateIsMobileLayout)
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

.schedule-header-actions {
    display: flex;
    align-items: flex-end;
    gap: 12px;
}

.schedule-header h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.92;
    letter-spacing: -0.07em;
}

.schedule-header-copy {
    margin: 16px 0 0;
    color: var(--tf-muted);
    font-size: 18px;
}

.schedule-header-copy a {
    text-decoration: underline;
}

.integration-stack {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-google-calendar-disconnect {
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
    white-space: nowrap;
}

.btn-google-calendar-disconnect:hover {
    color: var(--tf-ink);
}

.btn-google-calendar-disconnect:disabled {
    opacity: 0.6;
    cursor: default;
}

.integration-hint {
    margin: 0;
    max-width: 320px;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;
    text-align: right;
}

.integration-hint.connected {
    color: #166534;
}

.btn-google-calendar {
    white-space: nowrap;
}

.schedule-body {
    display: grid;
    gap: 18px;
}

.calendar-card,
.empty-card {
    padding: 24px;
}

.empty-card {
    min-height: 160px;
}

/* ---- calendar toolbar (design) ---- */
.cal-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.cal-toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.cal-title {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-transform: capitalize;
}

.cal-nav {
    display: flex;
    gap: 6px;
}

.cal-nav button {
    width: 36px;
    height: 36px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: #fff;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
}

.cal-nav button:hover {
    border-color: var(--tf-black);
}

.cal-today {
    padding: 8px 14px;
    border: 0;
    border-radius: 999px;
    background: var(--tf-black);
    color: #fff;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
}

.cal-toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.cal-staff {
    height: 44px;
    padding: 0 14px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: #fff;
    font-family: var(--tf-sans);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
}

.view-toggle {
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    background: #eee8da;
}

.view-btn {
    padding: 7px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #8a857a;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
}

.view-btn.active {
    background: #fff;
    color: var(--tf-black);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.cal-new {
    height: 44px;
}

.cal-hint {
    margin: 0 0 14px;
    color: var(--tf-muted);
    font-size: 13px;
}

.calendar-card {
    overflow: hidden;
}

.error-message {
    margin: 0 0 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 700;
}

.success-message {
    margin: 0 0 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #dcfce7;
    color: #166534;
    font-weight: 700;
}

.muted-text {
    color: var(--tf-muted);
    font-weight: 700;
}

.mobile-date-nav {
    display: flex;
    align-items: center;
    gap: 10px;
}

.mobile-date-picker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.mobile-date-label {
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    text-transform: capitalize;
    color: var(--tf-muted);
}

.mobile-date-icon {
    width: 15px;
    height: 15px;
    color: var(--tf-muted);
}

.mobile-board-wrapper {
    flex: 1;
    min-height: 0;
}

.floating-add {
    display: none;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.calendar-card :deep(.fc) {
    font-family: inherit;
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
    padding: 4px 7px;
    font-weight: 700;
    font-size: 11px;
    cursor: pointer;
}

.calendar-card :deep(.tf-event) {
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
}

.calendar-card :deep(.tf-event strong) {
    font-size: 12px;
    font-weight: 800;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.calendar-card :deep(.tf-event span) {
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
    opacity: 0.75;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.calendar-card :deep(.fc-timegrid-slot) {
    height: 64px;
}

.calendar-card :deep(.fc-bg-event) {
    opacity: 1;
}

.calendar-card :deep(.fc-col-header-cell) {
    padding: 6px 0;
}

.calendar-card :deep(.tf-day-header) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    margin: 0 auto;
    border-radius: 14px;
}

.calendar-card :deep(.tf-day-header-dow) {
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.calendar-card :deep(.tf-day-header-num) {
    font-size: 20px;
    font-weight: 900;
    color: var(--tf-black);
}

.calendar-card :deep(.tf-day-header.is-today) {
    background: var(--tf-black);
}

.calendar-card :deep(.tf-day-header.is-today .tf-day-header-dow) {
    color: var(--tf-accent);
}

.calendar-card :deep(.tf-day-header.is-today .tf-day-header-num) {
    color: #fff;
}

.calendar-card :deep(.fc-day-today) {
    background: #fbfbf6 !important;
}

.calendar-card :deep(.fc-timegrid-axis),
.calendar-card :deep(.fc-timegrid-slot-label) {
    font-family: var(--tf-mono);
    font-size: 10px;
    color: #b0aa9c;
}

.calendar-card :deep(.fc-timegrid-now-indicator-line) {
    border-color: #ff5c35;
}

.calendar-card :deep(.fc-timegrid-now-indicator-arrow) {
    border-color: #ff5c35;
    color: #ff5c35;
}

.calendar-card :deep(.fc-theme-standard td),
.calendar-card :deep(.fc-theme-standard th),
.calendar-card :deep(.fc-scrollgrid) {
    border-color: #e2dcc7;
}

/* ---- modal ---- */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(11, 11, 15, 0.55);
}

.modal-card {
    position: relative;
    width: 100%;
    min-width: 0;
    max-width: 460px;
    max-height: 88vh;
    max-height: 88dvh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 32px;
    border-radius: 24px;
    background: var(--tf-white);
    box-shadow: 0 40px 90px -30px rgba(11, 11, 15, 0.5);
    box-sizing: border-box;
}

.modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 34px;
    height: 34px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-size: 20px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

.modal-card h2 {
    margin: 4px 0 0;
    font-size: 26px;
    letter-spacing: -0.045em;
}

.modal-range-label {
    margin: 10px 0 22px;
    color: var(--tf-muted);
    font-weight: 700;
}

.modal-choice-actions {
    display: grid;
    gap: 10px;
    margin-top: 6px;
}

.modal-choice-actions .btn {
    width: 100%;
}

.modal-form form {
    display: grid;
    gap: 16px;
    margin-top: 20px;
}

.modal-detail .appointment-detail {
    display: grid;
    gap: 8px;
    margin-top: 18px;
}

.modal-detail .appointment-detail span {
    color: var(--tf-muted);
    font-weight: 700;
}

.modal-detail .appointment-detail small {
    width: fit-content;
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 900;
}

.modal-notes {
    margin: 4px 0 0;
    color: var(--tf-ink);
}

.toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    font-weight: 800;
    color: var(--tf-black);
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

.two-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.two-columns > div {
    min-width: 0;
}

.two-columns .input {
    min-width: 0;
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
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

@media (max-width: 720px) {
    .schedule-header {
        align-items: start;
        flex-direction: column;
    }

    .schedule-header-actions {
        width: 100%;
        align-items: stretch;
        flex-direction: column;
    }

    .integration-hint {
        max-width: none;
        text-align: left;
    }

    .two-columns {
        grid-template-columns: 1fr;
    }

    .modal-overlay {
        padding: 12px;
    }

    .modal-card {
        max-width: none;
        max-height: 92dvh;
        padding: 20px;
        border-radius: 18px;
    }

    .modal-close {
        top: 12px;
        right: 12px;
        width: 30px;
        height: 30px;
        font-size: 16px;
    }

    .modal-card h2 {
        margin-right: 34px;
        font-size: 21px;
    }

    .schedule-page-locked {
        overflow: hidden;
        height: 100dvh;
    }

    .calendar-card-mobile {
        position: fixed;
        top: 62px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: var(--tf-white);
        overflow: hidden;
    }

    .mobile-date-nav {
        flex-shrink: 0;
        padding: 10px 14px;
        border-bottom: 1px solid var(--tf-border);
    }

    .error-message,
    .success-message {
        flex-shrink: 0;
        margin-left: 14px;
        margin-right: 14px;
    }

    .floating-add {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 50;
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        border: 0;
        border-radius: 50%;
        background: var(--tf-accent);
        color: var(--tf-black);
        box-shadow: 0 18px 34px -16px rgba(11, 11, 15, 0.45);
        font-size: 30px;
        font-weight: 600;
        cursor: pointer;
    }
}
</style>
