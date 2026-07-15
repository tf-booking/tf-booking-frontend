<template>
    <div class="page staff-page">
        <section class="container">
            <div class="staff-header">
                <div>
                    <p class="tf-eyebrow">{{ staffMembers.length }} colaboradores · {{ selectedBusiness?.name || 'Negócio' }}</p>
                    <h1>Equipa</h1>
                </div>

                <button
                    class="btn header-new-button"
                    :class="isStaffLimitLocked ? 'btn-secondary pro-locked-button' : 'btn-accent'"
                    type="button"
                    @click="openCreateStaff"
                >
                    <span v-if="isStaffLimitLocked" class="pro-locked-tag">PRO</span>
                    {{ isStaffLimitLocked ? 'Adicionar colaborador' : '+ Novo colaborador' }}
                </button>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <div v-else class="staff-grid">
                <article ref="formCardRef" class="card form-card" :class="{ 'form-card-open': isFormOpen || editingStaff }">
                    <div class="form-card-head">
                        <div>
                            <p class="business-label">Negócio: <strong>{{ selectedBusiness.name }}</strong></p>
                            <h2>{{ editingStaff ? 'Editar colaborador' : 'Criar colaborador' }}</h2>
                        </div>

                        <button class="form-close" type="button" aria-label="Fechar formulário" @click="closeForm">
                            ×
                        </button>
                    </div>

                    <ProLock
                        :locked="!editingStaff && isStaffLimitLocked"
                        :message="staffLockMessage"
                        :cta-label="staffLockCtaLabel"
                    >
                    <form class="form" @submit.prevent="saveStaff">
                        <div class="avatar-field">
                            <div class="avatar-preview">
                                <img v-if="avatarPreviewUrl" class="avatar-preview-image" :src="avatarPreviewUrl" :alt="form.name" />
                                <template v-else>{{ staffInitials(form.name) }}</template>
                            </div>

                            <div class="avatar-field-actions">
                                <button class="btn btn-secondary" type="button" @click="pickAvatar">
                                    {{ avatarPreviewUrl ? 'Alterar foto' : 'Adicionar foto' }}
                                </button>
                                <input
                                    ref="avatarInput"
                                    class="visually-hidden"
                                    type="file"
                                    accept="image/*"
                                    @change="handleAvatarChange"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="label">Nome do colaborador</label>
                            <input v-model="form.name" class="input" type="text" placeholder="Ana Silva" />
                        </div>

                        <div class="two-columns">
                            <div>
                                <label class="label">Email</label>
                                <input v-model="form.email" class="input" type="email" placeholder="ana@email.pt" />
                            </div>

                            <div>
                                <label class="label">Telefone</label>
                                <input v-model="form.phone" class="input" type="text" placeholder="910000000" />
                            </div>
                        </div>

                        <div>
                            <label class="label">Bio / descrição</label>
                            <textarea v-model="form.bio" class="input textarea"
                                placeholder="Especialista em estética facial e cabelo." />
                        </div>

                        <div>
                            <label class="label">Serviços que realiza</label>

                            <div v-if="services.length === 0" class="services-empty">
                                Ainda não existem serviços. Cria primeiro serviços em /services.
                            </div>

                            <div v-else class="services-check-list">
                                <div v-for="service in services" :key="service.id" class="service-check-row">
                                    <label class="service-check">
                                        <input v-model="form.services" type="checkbox" :value="service.id" />
                                        <span class="service-check-name">{{ service.name }}</span>
                                    </label>

                                    <div v-if="form.services.includes(service.id)" class="service-duration-override">
                                        <input
                                            v-model.number="form.serviceDurations[service.id]"
                                            class="input input-compact"
                                            type="number"
                                            min="1"
                                            :placeholder="String(service.duration_minutes)"
                                        />
                                        <span class="duration-suffix">min</span>
                                    </div>
                                </div>
                            </div>

                            <p class="services-hint">
                                Deixa em branco para usar a duração padrão do serviço. Preenche só se este colaborador demorar mais ou menos tempo.
                            </p>
                        </div>

                        <label v-if="!editingStaff?.is_owner" class="toggle-row">
                            <input v-model="form.is_active" type="checkbox" />
                            <span>Colaborador ativo</span>
                        </label>

                        <p v-else class="services-hint">
                            O owner do negócio permanece sempre ativo como colaborador.
                        </p>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <p v-if="successMessage" class="success-message">
                            {{ successMessage }}
                        </p>

                        <div class="form-actions">
                            <button class="btn btn-accent" type="submit" :disabled="isSaving">
                                {{ isSaving ? 'A guardar...' : editingStaff ? 'Guardar alterações' : 'Criar colaborador'
                                }}
                            </button>

                            <button v-if="editingStaff" class="btn btn-secondary" type="button" @click="cancelEdit">
                                Cancelar
                            </button>
                        </div>
                    </form>
                    </ProLock>
                </article>

                <article class="card list-card">
                    <div class="card-title-row">
                        <div>
                            <h2>Colaboradores</h2>
                            <p>{{ activeStaffCount }} ativos · {{ inactiveStaffCount }} inativos</p>
                        </div>

                        <button class="mini-button refresh-button" type="button" @click="loadStaff">
                            Atualizar
                        </button>
                    </div>

                    <p v-if="isLoadingStaff" class="muted-text">
                        A carregar colaboradores...
                    </p>

                    <p v-else-if="staffMembers.length === 0" class="muted-text">
                        Ainda não existem colaboradores.
                    </p>

                    <div v-else class="staff-list">
                        <template v-for="staff in staffMembers" :key="staff.uuid">
                            <div class="staff-item" :class="{ inactive: !staff.is_active, expanded: expandedStaffId === staff.id }">
                                <div class="staff-avatar">
                                    <img
                                        v-if="staff.avatar_url"
                                        class="staff-avatar-image"
                                        :src="staff.avatar_url"
                                        :alt="staff.name"
                                    />
                                    <template v-else>
                                        {{ staffInitials(staff.name) }}
                                    </template>
                                </div>

                                <div class="staff-main">
                                    <div class="staff-topline">
                                        <strong>{{ staff.name }}</strong>
                                        <span class="staff-status-dot" :class="{ inactive: !staff.is_active }"></span>
                                    </div>

                                    <span>
                                        {{ staff.phone || staff.email || 'Sem contacto' }}
                                    </span>

                                    <div class="staff-services">
                                        <small v-for="serviceName in staff.services_names" :key="serviceName">
                                            {{ serviceName }}
                                        </small>
                                    </div>
                                </div>

                                <div class="staff-actions">
                                    <small class="status-pill" :class="{ inactive: !staff.is_active }">
                                        {{ staff.is_active ? 'Ativo' : 'Inativo' }}
                                    </small>

                                    <small class="status-pill access-pill" :class="`access-${staff.access_status}`">
                                        {{ accessStatusLabels[staff.access_status] }}
                                    </small>

                                    <button class="mini-button" type="button"
                                        :class="{ active: expandedStaffId === staff.id }"
                                        @click="toggleStaffSchedule(staff)">
                                        Horário
                                    </button>

                                    <button class="mini-button" type="button" @click="editStaff(staff)">
                                        Editar
                                    </button>

                                    <button
                                        v-if="!staff.is_owner && staff.is_active && staff.access_status !== 'active' && staff.email"
                                        class="mini-button"
                                        type="button"
                                        :disabled="invitingStaffId === staff.id"
                                        @click="inviteStaff(staff)"
                                    >
                                        {{ invitingStaffId === staff.id ? 'A convidar...' : staff.access_status === 'pending' ? 'Reenviar convite' : 'Convidar' }}
                                    </button>

                                    <button v-if="!staff.is_owner" class="mini-button danger" type="button" @click="confirmDeleteStaff(staff)">
                                        Apagar
                                    </button>
                                </div>
                            </div>

                            <div v-if="expandedStaffId === staff.id" class="staff-schedule-panel">
                                <p v-if="isLoadingStaffSchedule" class="muted-text">A carregar horário...</p>

                                <div v-else class="schedule-panel-columns">
                                    <div class="schedule-panel-col">
                                        <h3>Horário de trabalho</h3>

                                        <div class="working-hours-list">
                                            <p v-if="!workingHoursByStaff[staff.id]?.length" class="muted-text">
                                                Sem horários definidos.
                                            </p>

                                            <div v-for="hour in workingHoursByStaff[staff.id]" :key="hour.id"
                                                class="working-hour-row" :class="{ inactive: !hour.is_active }">
                                                <span class="wh-day">{{ hour.weekday_label }}</span>
                                                <span class="wh-time">{{ hour.start_time.slice(0, 5) }} - {{ hour.end_time.slice(0, 5) }}</span>
                                                <span class="wh-status" :class="{ active: hour.is_active, inactive: !hour.is_active }">
                                                    {{ hour.is_active ? 'Ativo' : 'Inativo' }}
                                                </span>

                                                <div class="wh-actions">
                                                    <button class="mini-button" type="button" @click="editWorkingHour(hour)">
                                                        Editar
                                                    </button>

                                                    <button class="mini-button danger" type="button"
                                                        @click="deleteWorkingHour(staff.id, hour)">
                                                        Apagar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="panel-subcard">
                                            <p class="panel-subcard-title">
                                                {{ editingWorkingHour ? 'Editar horário' : 'Novo horário' }}
                                            </p>

                                            <form class="panel-form" @submit.prevent="saveWorkingHour(staff.id)">
                                                <div class="two-columns">
                                                    <div>
                                                        <label class="label">Dia da semana</label>

                                                        <select v-model.number="workingHourForm.weekday" class="input">
                                                            <option v-for="day in weekdays" :key="day.value" :value="day.value">
                                                                {{ day.label }}
                                                            </option>
                                                        </select>
                                                    </div>

                                                    <label class="toggle-row inline-toggle">
                                                        <input v-model="workingHourForm.is_active" type="checkbox" />
                                                        <span>{{ workingHourForm.is_active ? 'Ativo' : 'Inativo' }}</span>
                                                    </label>
                                                </div>

                                                <div class="two-columns">
                                                    <div>
                                                        <label class="label">Hora início</label>
                                                        <TimeSelect v-model="workingHourForm.start_time" />
                                                    </div>

                                                    <div>
                                                        <label class="label">Hora fim</label>
                                                        <TimeSelect v-model="workingHourForm.end_time" />
                                                    </div>
                                                </div>

                                                <div class="form-actions">
                                                    <button class="btn btn-accent" type="submit" :disabled="isSavingWorkingHour">
                                                        {{ isSavingWorkingHour ? 'A guardar...' : editingWorkingHour ? 'Guardar alterações' : 'Adicionar horário' }}
                                                    </button>

                                                    <button v-if="editingWorkingHour" class="btn btn-secondary" type="button"
                                                        @click="cancelWorkingHourEdit">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    <div class="schedule-panel-col">
                                        <h3>Bloquear dias</h3>
                                        <p class="panel-hint">
                                            Férias, folgas ou outros períodos em que o colaborador fica indisponível o dia inteiro.
                                        </p>

                                        <div class="day-blocks-list">
                                            <p v-if="!blocksByStaff[staff.id]?.length" class="muted-text">
                                                Sem dias bloqueados.
                                            </p>

                                            <div v-for="block in blocksByStaff[staff.id]" :key="block.uuid" class="day-block-row">
                                                <span class="db-range">{{ formatBlockRange(block) }}</span>
                                                <span class="db-reason">{{ block.reason || 'Bloqueado' }}</span>

                                                <button class="mini-button danger" type="button"
                                                    @click="deleteDayBlock(staff.id, block)">
                                                    Apagar
                                                </button>
                                            </div>
                                        </div>

                                        <div class="panel-subcard">
                                            <p class="panel-subcard-title">Novo bloqueio</p>

                                            <form class="panel-form" @submit.prevent="saveDayBlock(staff.id)">
                                                <div class="two-columns">
                                                    <div>
                                                        <label class="label">De</label>
                                                        <DateField v-model="dayBlockForm.start_date" />
                                                    </div>

                                                    <div>
                                                        <label class="label">Até</label>
                                                        <DateField v-model="dayBlockForm.end_date" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label class="label">Motivo</label>
                                                    <input v-model="dayBlockForm.reason" class="input" type="text"
                                                        placeholder="Férias" />
                                                </div>

                                                <div class="form-actions">
                                                    <button class="btn btn-accent" type="submit" :disabled="isSavingDayBlock">
                                                        {{ isSavingDayBlock ? 'A bloquear...' : 'Bloquear dias' }}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </article>
            </div>

            <button v-if="selectedBusiness" class="floating-add" type="button" aria-label="Novo colaborador" @click="openCreateStaff">
                +
            </button>
        </section>

        <ConfirmModal
            v-model:open="proModal.open"
            tag="PRO"
            :title="proModal.title"
            :message="proModal.message"
            confirm-to="/account?tab=plano"
            confirm-label="Atualizar para o Pro"
            cancel-label="Agora não"
        />

        <ConfirmModal
            v-model:open="confirmModal.open"
            :title="confirmModal.title"
            :message="confirmModal.message"
            :confirm-label="confirmModal.confirmLabel"
            cancel-label="Cancelar"
            :danger="confirmModal.danger"
            @confirm="handleConfirmModalConfirm"
        />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-or-manager', 'first-service'],
    layout: 'backoffice',
})

type Business = {
    id: number
    uuid: string
    name: string
    slug: string
    is_active: boolean
    plan: string
    staff_slots: number
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

type AccessStatus = 'none' | 'pending' | 'active' | 'disabled'

type ServiceOverride = {
    service_id: number
    duration_minutes_override: number | null
}

type StaffMember = {
    id: number
    uuid: string
    business: number
    business_name: string
    user: number | null
    services: number[]
    services_names: string[]
    service_overrides: ServiceOverride[]
    name: string
    email: string
    phone: string
    bio: string
    avatar_url: string
    gallery_image_urls: string[]
    is_active: boolean
    access_status: AccessStatus
    is_owner: boolean
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

const { apiFetch } = useApi()
const { startAddSeatCheckout, billingError: billingSeatsError } = useBilling()
const route = useRoute()

const FREE_PLAN_STAFF_LIMIT = 1
const PRO_PLAN_MAX_STAFF = 5

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const formCardRef = ref<HTMLElement | null>(null)

// Deriva sempre do selectedBusiness (carregado de fresco em loadBusinesses),
// nunca do estado global de useCurrentBusiness/usePlan - esse fica em cache
// entre navegações e pode ficar desatualizado nesta página.
const isPro = computed(() => selectedBusiness.value?.plan === 'pro')
const isFree = computed(() => !isPro.value)

const services = ref<Service[]>([])
const staffMembers = ref<StaffMember[]>([])

const isLoadingBusinesses = ref(false)
const isLoadingServices = ref(false)
const isLoadingStaff = ref(false)
const isSaving = ref(false)
const isFormOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const invitingStaffId = ref<number | null>(null)

const editingStaff = ref<StaffMember | null>(null)

const accessStatusLabels: Record<AccessStatus, string> = {
    none: 'Sem acesso',
    pending: 'Convite enviado',
    active: 'Acesso ativo',
    disabled: 'Acesso desativado',
}

const form = reactive({
    name: '',
    email: '',
    phone: '',
    bio: '',
    services: [] as number[],
    serviceDurations: {} as Record<number, number | null>,
    is_active: true,
})

const avatarInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')

const weekdays = [
    { value: 0, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 2, label: 'Quarta-feira' },
    { value: 3, label: 'Quinta-feira' },
    { value: 4, label: 'Sexta-feira' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' },
]

const expandedStaffId = ref<number | null>(null)
const isLoadingStaffSchedule = ref(false)
const isSavingWorkingHour = ref(false)
const isSavingDayBlock = ref(false)

const workingHoursByStaff = reactive<Record<number, WorkingHour[]>>({})
const blocksByStaff = reactive<Record<number, StaffBlock[]>>({})

const editingWorkingHour = ref<WorkingHour | null>(null)

const workingHourForm = reactive({
    weekday: 0,
    start_time: '09:00',
    end_time: '18:00',
    is_active: true,
})

const dayBlockForm = reactive({
    start_date: '',
    end_date: '',
    reason: '',
})

const activeStaffCount = computed(() => staffMembers.value.filter((staff) => staff.is_active).length)
const inactiveStaffCount = computed(() => staffMembers.value.length - activeStaffCount.value)
const staffLimit = computed(() =>
    isPro.value ? (selectedBusiness.value?.staff_slots || 1) : FREE_PLAN_STAFF_LIMIT
)
const isStaffLimitLocked = computed(() => activeStaffCount.value >= staffLimit.value)

const staffLockMessage = computed(() => {
    if (!isPro.value) {
        return 'O plano Grátis permite até 1 colaborador. Atualiza para o plano Pro para adicionares mais.'
    }

    if (staffLimit.value < PRO_PLAN_MAX_STAFF) {
        return `Já tens ${staffLimit.value} colaborador(es) no teu plano Pro. Aumenta o número de lugares em Conta > Plano para adicionares mais.`
    }

    return `O plano Pro permite no máximo ${PRO_PLAN_MAX_STAFF} colaboradores.`
})

const staffLockCtaLabel = computed(() => (isPro.value ? 'Aumentar lugares' : 'Atualizar para o Pro'))

const proModal = reactive({
    open: false,
    title: 'Disponível no plano Pro',
    message: '',
})

const showProModal = (message: string) => {
    proModal.message = message
    proModal.open = true
}

const confirmModal = reactive({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    danger: false,
    onConfirm: null as (() => void) | null,
})

const handleConfirmModalConfirm = () => {
    confirmModal.onConfirm?.()
}

const staffInitials = (name: string) => {
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

const formatDateInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const formatBlockRange = (block: StaffBlock) => {
    const formatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' })

    return `${formatter.format(new Date(block.start_at))} — ${formatter.format(new Date(block.end_at))}`
}

const resetWorkingHourForm = () => {
    editingWorkingHour.value = null

    workingHourForm.weekday = 0
    workingHourForm.start_time = '09:00'
    workingHourForm.end_time = '18:00'
    workingHourForm.is_active = true
}

const resetDayBlockForm = () => {
    const today = formatDateInput(new Date())

    dayBlockForm.start_date = today
    dayBlockForm.end_date = today
    dayBlockForm.reason = ''
}

const loadStaffSchedule = async (staffId: number) => {
    try {
        isLoadingStaffSchedule.value = true

        const [workingHoursResponse, blocksResponse] = await Promise.all([
            apiFetch<{ results: WorkingHour[] }>(`/working-hours/?staff=${staffId}`),
            apiFetch<{ results: StaffBlock[] }>(`/staff-blocks/?staff=${staffId}`),
        ])

        workingHoursByStaff[staffId] = workingHoursResponse.results
        blocksByStaff[staffId] = blocksResponse.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar o horário do colaborador.'
    } finally {
        isLoadingStaffSchedule.value = false
    }
}

const toggleStaffSchedule = async (staff: StaffMember) => {
    resetMessages()

    if (expandedStaffId.value === staff.id) {
        expandedStaffId.value = null
        return
    }

    expandedStaffId.value = staff.id
    resetWorkingHourForm()
    resetDayBlockForm()
    await loadStaffSchedule(staff.id)
}

const timeToMinutes = (value: string) => {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number)

     return (hours ?? 0) * 60 + (minutes ?? 0)      
}

const hasOverlappingWorkingHour = (staffId: number) => {
    const newStart = timeToMinutes(workingHourForm.start_time)
    const newEnd = timeToMinutes(workingHourForm.end_time)

    return (workingHoursByStaff[staffId] || []).some((hour) => {
        if (hour.weekday !== workingHourForm.weekday) {
            return false
        }

        if (editingWorkingHour.value?.id === hour.id) {
            return false
        }

        const existingStart = timeToMinutes(hour.start_time)
        const existingEnd = timeToMinutes(hour.end_time)

        return newStart < existingEnd && newEnd > existingStart
    })
}

const saveWorkingHour = async (staffId: number) => {
    resetMessages()

    if (!workingHourForm.start_time || !workingHourForm.end_time) {
        errorMessage.value = 'Preenche a hora de início e fim.'
        return
    }

    if (workingHourForm.end_time <= workingHourForm.start_time) {
        errorMessage.value = 'A hora de fim tem de ser superior à hora de início.'
        return
    }

    if (hasOverlappingWorkingHour(staffId)) {
        errorMessage.value = 'Já existe um horário para este dia que se sobrepõe a este período.'
        return
    }

    try {
        isSavingWorkingHour.value = true

        const payload = {
            staff_member: staffId,
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
        await loadStaffSchedule(staffId)
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

const deleteWorkingHour = async (staffId: number, hour: WorkingHour) => {
    try {
        await apiFetch(`/working-hours/${hour.id}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Horário apagado com sucesso.'

        if (editingWorkingHour.value?.id === hour.id) {
            resetWorkingHourForm()
        }

        await loadStaffSchedule(staffId)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o horário.'
    }
}

const saveDayBlock = async (staffId: number) => {
    resetMessages()

    if (!dayBlockForm.start_date || !dayBlockForm.end_date) {
        errorMessage.value = 'Preenche a data de início e fim.'
        return
    }

    if (dayBlockForm.end_date < dayBlockForm.start_date) {
        errorMessage.value = 'A data de fim tem de ser igual ou posterior à data de início.'
        return
    }

    try {
        isSavingDayBlock.value = true

        await apiFetch('/staff-blocks/', {
            method: 'POST',
            body: {
                staff_member: staffId,
                start_at: `${dayBlockForm.start_date}T00:00:00`,
                end_at: `${dayBlockForm.end_date}T23:59:59`,
                reason: dayBlockForm.reason || 'Bloqueado',
            },
        })

        successMessage.value = 'Dias bloqueados com sucesso.'
        resetDayBlockForm()
        await loadStaffSchedule(staffId)
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data ? JSON.stringify(error.data) : 'Erro ao bloquear dias.'
    } finally {
        isSavingDayBlock.value = false
    }
}

const deleteDayBlock = async (staffId: number, block: StaffBlock) => {
    try {
        await apiFetch(`/staff-blocks/${block.uuid}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Bloqueio apagado com sucesso.'
        await loadStaffSchedule(staffId)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o bloqueio.'
    }
}

const focusForm = async () => {
    await nextTick()

    if (import.meta.client && formCardRef.value) {
        formCardRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

const resetMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
}

const revokeAvatarPreview = () => {
    if (avatarPreviewUrl.value && avatarPreviewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl.value)
    }
}

const resetForm = () => {
    editingStaff.value = null

    form.name = ''
    form.email = ''
    form.phone = ''
    form.bio = ''
    form.services = []
    form.serviceDurations = {}
    form.is_active = true

    revokeAvatarPreview()
    avatarFile.value = null
    avatarPreviewUrl.value = ''
}

const pickAvatar = () => {
    if (isFree.value) {
        showProModal('A personalização de fotos dos colaboradores está disponível no plano Pro.')
        return
    }

    avatarInput.value?.click()
}

const handleAvatarChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
        return
    }

    revokeAvatarPreview()
    avatarFile.value = file
    avatarPreviewUrl.value = URL.createObjectURL(file)
    input.value = ''
}

const uploadAvatarIfNeeded = async (staffId: number) => {
    if (!avatarFile.value) {
        return
    }

    const formData = new FormData()
    formData.append('photos_order', 'new')
    formData.append('photos', avatarFile.value)

    await apiFetch(`/staff/${staffId}/photos/`, {
        method: 'PATCH',
        body: formData,
    })
}

const openCreateStaff = async () => {
    resetMessages()

    if (isStaffLimitLocked.value) {
        if (isPro.value && staffLimit.value < PRO_PLAN_MAX_STAFF) {
            confirmModal.title = 'Adicionar colaborador'
            confirmModal.message = (
                `Já tens ${staffLimit.value} colaborador(es) no teu plano Pro. Adicionar mais um ` +
                'custa +3,99€/mês (ou equivalente anual). Vais ser redirecionado para a Stripe para ' +
                'pagares esse valor agora - assim que o pagamento for confirmado, o lugar fica ' +
                'disponível e podes criar o colaborador.'
            )
            confirmModal.confirmLabel = 'Pagar agora'
            confirmModal.danger = false
            confirmModal.onConfirm = () => startAddSeatCheckout({
                origin: 'staff',
                businessUuidOverride: selectedBusiness.value?.uuid,
            })
            confirmModal.open = true
            return
        }

        showProModal(
            isPro.value
                ? `O plano Pro permite no máximo ${PRO_PLAN_MAX_STAFF} colaboradores.`
                : 'O plano Grátis permite até 1 colaborador. Atualiza para o plano Pro para adicionares mais.'
        )
        return
    }

    resetForm()
    isFormOpen.value = true
    await focusForm()
}

const closeForm = () => {
    resetMessages()
    resetForm()
    isFormOpen.value = false
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
        isLoadingServices.value = true
        resetMessages()

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Service[]
        }>(`/services/?business=${selectedBusiness.value.id}&is_active=true`)

        services.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os serviços.'
    } finally {
        isLoadingServices.value = false
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
        }>(`/staff/?business=${selectedBusiness.value.id}`)

        staffMembers.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os colaboradores.'
    } finally {
        isLoadingStaff.value = false
    }
}

const saveStaff = async () => {
    resetMessages()

    if (!selectedBusiness.value) {
        errorMessage.value = 'Não existe negócio selecionado.'
        return
    }

    if (!form.name) {
        errorMessage.value = 'O nome do colaborador é obrigatório.'
        return
    }

    if (form.services.length === 0) {
        errorMessage.value = 'Seleciona pelo menos um serviço para este colaborador.'
        return
    }

    await performSaveStaff()
}

const performSaveStaff = async () => {
    if (!selectedBusiness.value) {
        errorMessage.value = 'Não existe negócio selecionado.'
        return
    }

    try {
        isSaving.value = true

        const serviceDurationOverrides = form.services.map((serviceId) => {
            const raw = form.serviceDurations[serviceId]
            const value = typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null

            return { service: serviceId, duration_minutes_override: value }
        })

        const payload = {
            business: selectedBusiness.value.id,
            services: form.services,
            service_duration_overrides: serviceDurationOverrides,
            name: form.name,
            email: form.email,
            phone: form.phone,
            bio: form.bio,
            is_active: form.is_active,
        }

        if (editingStaff.value) {
            await apiFetch(`/staff/${editingStaff.value.id}/`, {
                method: 'PUT',
                body: payload,
            })

            await uploadAvatarIfNeeded(editingStaff.value.id)

            successMessage.value = 'Colaborador atualizado com sucesso.'
        } else {
            const created = await apiFetch<StaffMember>('/staff/', {
                method: 'POST',
                body: payload,
            })

            await uploadAvatarIfNeeded(created.id)

            if (created.email) {
                try {
                    await apiFetch(`/staff/${created.id}/invite/`, { method: 'POST' })
                    successMessage.value = `Colaborador criado e convite enviado para ${created.email}.`
                } catch (inviteError) {
                    console.error(inviteError)
                    successMessage.value = 'Colaborador criado, mas não foi possível enviar o convite automaticamente.'
                }
            } else {
                successMessage.value = 'Colaborador criado com sucesso.'
            }
        }

        resetForm()
        isFormOpen.value = false
        await loadStaff()
    } catch (error: any) {
        console.error(error)

        if (error?.data) {
            errorMessage.value = JSON.stringify(error.data)
        } else {
            errorMessage.value = 'Erro ao guardar colaborador.'
        }
    } finally {
        isSaving.value = false
    }
}

const editStaff = (staff: StaffMember) => {
    resetMessages()
    revokeAvatarPreview()

    editingStaff.value = staff
    isFormOpen.value = true

    form.name = staff.name
    form.email = staff.email || ''
    form.phone = staff.phone || ''
    form.bio = staff.bio || ''
    form.services = [...staff.services]
    form.serviceDurations = Object.fromEntries(
        (staff.service_overrides || []).map((override) => [override.service_id, override.duration_minutes_override])
    )
    form.is_active = staff.is_active

    avatarFile.value = null
    avatarPreviewUrl.value = staff.avatar_url || ''

    focusForm()
}

const cancelEdit = () => {
    resetMessages()
    resetForm()
    isFormOpen.value = false
}

const confirmDeleteStaff = (staff: StaffMember) => {
    confirmModal.title = 'Apagar colaborador?'
    confirmModal.message = `Tens a certeza que queres apagar "${staff.name}"? Esta ação não pode ser revertida.`
    confirmModal.confirmLabel = 'Apagar'
    confirmModal.danger = true
    confirmModal.onConfirm = () => deleteStaff(staff)
    confirmModal.open = true
}

const inviteStaff = async (staff: StaffMember) => {
    try {
        resetMessages()
        invitingStaffId.value = staff.id

        await apiFetch(`/staff/${staff.id}/invite/`, { method: 'POST' })

        successMessage.value = `Convite enviado para ${staff.email}.`

        await loadStaff()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.detail || 'Não foi possível enviar o convite.'
    } finally {
        invitingStaffId.value = null
    }
}

const deleteStaff = async (staff: StaffMember) => {
    try {
        resetMessages()

        await apiFetch(`/staff/${staff.id}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Colaborador apagado com sucesso.'

        if (editingStaff.value?.id === staff.id) {
            resetForm()
        }

        if (expandedStaffId.value === staff.id) {
            expandedStaffId.value = null
        }

        await loadStaff()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o colaborador.'
    }
}

onMounted(async () => {
    await loadBusinesses()
    await loadServices()
    await loadStaff()

    if (route.query.seat_payment === 'success') {
        if (!isStaffLimitLocked.value) {
            successMessage.value = 'Pagamento confirmado! O lugar extra já está disponível.'
            resetForm()
            isFormOpen.value = true
            await focusForm()
        } else {
            successMessage.value = (
                'Pagamento confirmado! Pode demorar alguns segundos a atualizar - ' +
                'atualiza a página se o lugar extra ainda não aparecer disponível.'
            )
        }
    } else if (route.query.seat_payment === 'cancelled') {
        errorMessage.value = 'Pagamento não foi concluído. Podes tentar novamente quando quiseres.'
    }
})

watch(billingSeatsError, (value) => {
    if (value) {
        errorMessage.value = value
    }
})

onBeforeUnmount(() => {
    revokeAvatarPreview()
})
</script>

<style scoped>
.staff-page {
    padding: 42px 0 96px;
}

.staff-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
}

.staff-header h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.055em;
}

.staff-header .tf-eyebrow {
    margin-bottom: 8px;
}

.pro-locked-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.pro-locked-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
}

.staff-grid {
    display: grid;
    grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.18fr);
    gap: 16px;
    align-items: start;
}

.form-card,
.list-card,
.empty-card {
    padding: 20px;
    border-radius: 18px;
}

.form-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
}

.form-card h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.045em;
}

.form-close {
    display: none;
    width: 36px;
    height: 36px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    color: var(--tf-black);
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

.list-card h2 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.04em;
}

.business-label {
    margin: 0 0 8px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.form {
    display: grid;
    gap: 18px;
    margin-top: 24px;
}

.textarea {
    min-height: 104px;
    padding-top: 14px;
    resize: vertical;
}

.textarea-compact {
    min-height: 88px;
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

.avatar-field {
    display: flex;
    align-items: center;
    gap: 16px;
}

.avatar-preview {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 16px;
    font-weight: 900;
    overflow: hidden;
}

.avatar-preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-field-actions {
    display: flex;
    align-items: center;
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.services-check-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.service-check-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.service-duration-override {
    display: flex;
    align-items: center;
    gap: 6px;
}

.input-compact {
    min-height: 38px;
    width: 72px;
    padding: 0 10px;
}

.duration-suffix {
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 800;
}

.services-hint {
    margin: 8px 0 0;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 700;
}

.service-check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 14px 0 8px;
    border: 1.5px solid var(--tf-border);
    border-radius: 999px;
    background: var(--tf-white);
    font-size: 13px;
    font-weight: 800;
    color: var(--tf-black);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.service-check:hover {
    border-color: var(--tf-black);
}

.service-check:has(input:checked) {
    border-color: var(--tf-black);
    background: #f6f2e9;
}

.service-check input {
    appearance: none;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border: 1.5px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
}

.service-check input::after {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: transparent;
    transition: background 0.15s ease;
}

.service-check input:checked {
    border-color: var(--tf-black);
    background: var(--tf-accent);
}

.service-check input:checked::after {
    background: var(--tf-black);
}

.service-check-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.services-empty {
    padding: 14px;
    border-radius: 16px;
    background: var(--tf-bg);
    color: var(--tf-muted);
    font-weight: 700;
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
}

.card-title-row p {
    margin: 5px 0 0;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
}

.staff-list {
    display: grid;
    gap: 12px;
}

.staff-item {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    min-height: 88px;
    padding: 14px;
    border: 1px solid #eee8da;
    border-radius: 18px;
    background: #fdfcf9;
}

.staff-item.inactive {
    opacity: 0.68;
}

.staff-item.expanded {
    border-radius: 18px 18px 0 0;
    border-bottom: 0;
}

.staff-avatar {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 13px;
    font-weight: 900;
    overflow: hidden;
}

.staff-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.staff-item.inactive .staff-avatar {
    background: #d8d1c3;
    color: var(--tf-white);
}

.staff-main {
    min-width: 0;
}

.staff-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.staff-item strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
}

.staff-item span {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 700;
}

.staff-status-dot {
    display: block;
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #2fac66;
}

.staff-status-dot.inactive {
    background: #d77568;
}

.staff-services {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}

.staff-services small {
    padding: 5px 9px;
    border-radius: 999px;
    background: #f0ece2;
    border: 0;
    color: var(--tf-black);
    font-size: 10px;
    font-weight: 800;
}

.staff-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
    max-width: 260px;
}

.status-pill {
    padding: 5px 8px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-family: var(--tf-mono);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.status-pill.inactive {
    background: #fee2e2;
    color: #b42318;
}

.access-pill.access-none {
    background: #f0ece2;
    color: #8a857a;
}

.access-pill.access-pending {
    background: #fef3c7;
    color: #92400e;
}

.access-pill.access-active {
    background: #dcfce7;
    color: #166534;
}

.mini-button {
    min-height: 30px;
    padding: 0 10px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: var(--tf-white);
    color: var(--tf-black);
    font-family: var(--tf-sans);
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
}

.refresh-button {
    flex-shrink: 0;
}

.mini-button.danger {
    color: #991b1b;
}

.mini-button.active {
    background: var(--tf-black);
    color: var(--tf-white);
    border-color: var(--tf-black);
}

.staff-schedule-panel {
    margin: -2px 0 4px;
    padding: 18px;
    border: 1px solid #eee8da;
    border-top: 0;
    border-radius: 0 0 18px 18px;
    background: #fbfaf5;
    max-width: 100%;
    overflow: hidden;
}

.schedule-panel-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    max-width: 100%;
}

.schedule-panel-col {
    min-width: 0;
    padding: 16px;
    border: 1px solid #eee8da;
    border-radius: 16px;
    background: var(--tf-white);
}

.schedule-panel-col h3 {
    margin: 0 0 12px;
    font-size: 16px;
    letter-spacing: -0.03em;
}

.panel-hint {
    margin: -6px 0 12px;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 700;
}

.panel-subcard {
    padding: 14px;
    border: 1px solid var(--tf-border);
    border-radius: 14px;
    background: var(--tf-bg);
}

.panel-subcard-title {
    margin: 0 0 14px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.working-hours-list,
.day-blocks-list {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
}

.working-hour-row,
.day-block-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: 8px;
    column-gap: 10px;
    max-width: 100%;
    padding: 9px 12px;
    border: 1px solid #eee8da;
    border-radius: 12px;
    background: var(--tf-white);
    font-size: 12px;
    font-weight: 800;
}

.working-hour-row.inactive {
    opacity: 0.6;
}

.wh-day {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wh-time {
    flex: 0 0 auto;
    color: var(--tf-muted);
    font-family: var(--tf-mono);
    font-weight: 600;
    font-size: 11px;
}

.wh-status {
    flex: 0 0 auto;
    padding: 4px 9px;
    border-radius: 999px;
    font-family: var(--tf-mono);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.wh-status.active {
    background: #dcfce7;
    color: #166534;
}

.wh-status.inactive {
    background: #fee2e2;
    color: #b42318;
}

.wh-actions {
    display: flex;
    flex: 1 0 auto;
    justify-content: flex-end;
    gap: 6px;
}

.db-range {
    flex: 0 0 auto;
    font-family: var(--tf-mono);
    font-size: 11px;
    color: var(--tf-muted);
    white-space: nowrap;
}

.db-reason {
    flex: 1 1 120px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.day-block-row .mini-button {
    flex-shrink: 0;
    margin-left: auto;
}

.panel-form {
    display: grid;
    gap: 12px;
}

.inline-toggle {
    justify-content: flex-start;
    gap: 8px;
    font-size: 12px;
}

.inline-toggle input {
    width: 36px;
    height: 20px;
}

.inline-toggle input::after {
    top: 3px;
    left: 3px;
    width: 14px;
    height: 14px;
}

.inline-toggle input:checked::after {
    transform: translateX(16px);
}

.muted-text {
    color: var(--tf-muted);
    font-weight: 700;
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

.floating-add {
    display: none;
}

@media (max-width: 960px) {
    .staff-page {
        padding: 24px 0 96px;
    }

    .staff-page :deep(.container),
    .container {
        width: min(100% - 28px, 1180px);
    }

    .staff-header {
        align-items: start;
        flex-direction: column;
        gap: 14px;
    }

    .staff-grid,
    .two-columns {
        grid-template-columns: 1fr;
    }

    .form-card {
        display: none;
        order: 2;
    }

    .form-card.form-card-open {
        display: block;
    }

    .form-close {
        display: grid;
        place-items: center;
    }

    .list-card {
        order: 1;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
    }

    .header-new-button {
        display: none;
    }

    .floating-add {
        position: fixed;
        right: 24px;
        bottom: 24px;
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

    .staff-actions {
        flex-wrap: wrap;
    }
}

@media (max-width: 620px) {
    .staff-header h1 {
        font-size: 34px;
    }

    .staff-item {
        grid-template-columns: 46px minmax(0, 1fr);
        align-items: start;
    }

    .staff-actions {
        grid-column: 1 / -1;
        justify-content: space-between;
        width: 100%;
        max-width: none;
    }
}
</style>
