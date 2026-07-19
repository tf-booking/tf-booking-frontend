<template>
    <div class="page customers-page">
        <section class="container">
            <div class="customers-header">
                <div>
                    <p class="tf-eyebrow">{{ totalCount }} clientes · {{ selectedBusiness?.name || 'Negócio' }}</p>
                    <h1>Clientes</h1>
                </div>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <article v-else class="card list-card">
                <div class="card-title-row">
                    <div>
                        <h2>Todos os clientes</h2>
                        <p>{{ totalCount }} no total</p>
                    </div>

                    <button class="mini-button refresh-button" type="button" @click="loadCustomers">
                        Atualizar
                    </button>
                </div>

                <input
                    v-model="searchTerm"
                    class="input search-input"
                    type="search"
                    placeholder="Procurar nome, email ou número"
                />

                <p v-if="isLoadingCustomers && customers.length === 0" class="muted-text">
                    A carregar clientes...
                </p>

                <p v-else-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                <p v-else-if="customers.length === 0" class="muted-text">
                    {{ searchTerm ? 'Nenhum cliente encontrado.' : 'Ainda não existem clientes.' }}
                </p>

                <div v-else class="customer-list">
                    <button
                        v-for="customer in customers"
                        :key="customer.uuid"
                        type="button"
                        class="customer-item"
                        @click="openCustomer(customer)"
                    >
                        <span class="customer-avatar">{{ customerInitials(customer.name) }}</span>

                        <div class="customer-main">
                            <div class="customer-topline">
                                <span class="customer-name-wrap">
                                    <strong>{{ customer.name }}</strong>
                                    <small v-if="customer.is_blocked" class="status-pill blocked">Bloqueado</small>
                                </span>
                                <span class="customer-visits">{{ customer.appointments_count }} marcações</span>
                            </div>

                            <span class="customer-meta">
                                {{ customer.phone || 'Sem telefone' }}{{ customer.email ? ` · ${customer.email}` : '' }}
                            </span>

                            <span class="customer-visit-meta">{{ lastVisitLabel(customer) }}</span>
                        </div>

                        <span class="customer-chevron">›</span>
                    </button>
                </div>

                <button
                    v-if="hasMore"
                    class="btn btn-secondary load-more"
                    type="button"
                    :disabled="isLoadingMore"
                    @click="loadMoreCustomers"
                >
                    {{ isLoadingMore ? 'A carregar...' : 'Carregar mais' }}
                </button>
            </article>
        </section>

        <Teleport to="body">
            <div v-if="selectedCustomer" class="modal-overlay" @click.self="closeCustomer">
                <div class="modal-card customer-modal">
                    <button class="modal-close" type="button" aria-label="Fechar" @click="closeCustomer">×</button>

                    <p class="tf-eyebrow">Cliente</p>
                    <h2>{{ selectedCustomer.name }}</h2>

                    <div class="customer-modal-sub">
                        <span>{{ lastVisitLabel(selectedCustomer) }}</span>
                        <small class="status-pill" :class="{ inactive: isInactive(selectedCustomer) }">
                            {{ isInactive(selectedCustomer) ? 'Cliente inativo' : 'Cliente ativo' }}
                        </small>
                        <small v-if="selectedCustomer.is_blocked" class="status-pill blocked">Bloqueado</small>
                    </div>

                    <div class="modal-tabs">
                        <button
                            type="button"
                            class="modal-tab"
                            :class="{ active: detailTab === 'overview' }"
                            @click="detailTab = 'overview'"
                        >
                            Visão geral
                        </button>
                        <button
                            type="button"
                            class="modal-tab"
                            :class="{ active: detailTab === 'appointments' }"
                            @click="openAppointmentsTab"
                        >
                            Marcações
                        </button>
                    </div>

                    <div v-if="detailTab === 'overview'" class="customer-overview">
                        <template v-if="!isEditing">
                            <div class="overview-actions">
                                <button
                                    v-if="selectedCustomer.is_blocked"
                                    class="btn btn-secondary"
                                    type="button"
                                    :disabled="isTogglingBlock"
                                    @click="setBlocked(false)"
                                >
                                    {{ isTogglingBlock ? 'A desbloquear...' : 'Desbloquear' }}
                                </button>

                                <button
                                    v-else
                                    class="btn-danger"
                                    type="button"
                                    :disabled="isTogglingBlock"
                                    @click="showBlockConfirm = true"
                                >
                                    Bloquear cliente
                                </button>

                                <button class="btn btn-secondary" type="button" @click="startEdit">Editar</button>
                            </div>

                            <p v-if="blockErrorMessage" class="error-message">{{ blockErrorMessage }}</p>

                            <section class="info-block">
                                <p class="block-label">Informação pessoal</p>
                                <div class="info-grid">
                                    <div>
                                        <span class="info-key">Telefone</span>
                                        <span class="info-value">{{ selectedCustomer.phone || '-' }}</span>
                                    </div>
                                    <div>
                                        <span class="info-key">E-mail</span>
                                        <span class="info-value">{{ selectedCustomer.email || '-' }}</span>
                                    </div>
                                </div>
                            </section>

                            <section class="info-block">
                                <p class="block-label">Campanhas e-mail e SMS</p>
                                <p class="marketing-value" :class="{ accepted: selectedCustomer.accepts_marketing }">
                                    {{ selectedCustomer.accepts_marketing ? 'Aceita receber' : 'Não aceita receber' }}
                                </p>
                            </section>

                            <section class="info-block">
                                <p class="block-label">Observações</p>
                                <p class="notes-value">{{ selectedCustomer.notes || '-' }}</p>
                            </section>

                            <section class="info-block">
                                <p class="block-label">Estatísticas</p>
                                <div class="stats-grid">
                                    <div class="stat-box">
                                        <strong>{{ selectedCustomer.appointments_count }}</strong>
                                        <span>Marcações</span>
                                    </div>
                                    <div class="stat-box">
                                        <strong>{{ formatCurrency(selectedCustomer.total_spent) }}</strong>
                                        <span>Valor total</span>
                                    </div>
                                    <div class="stat-box">
                                        <strong>{{ selectedCustomer.completed_count }}</strong>
                                        <span>Completas</span>
                                    </div>
                                    <div class="stat-box">
                                        <strong>{{ selectedCustomer.cancelled_count }}</strong>
                                        <span>Canceladas</span>
                                    </div>
                                </div>
                            </section>
                        </template>

                        <form v-else class="form edit-form" @submit.prevent="saveCustomer">
                            <div>
                                <label class="label">Nome</label>
                                <input v-model="editForm.name" class="input" type="text" />
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Telefone</label>
                                    <input v-model="editForm.phone" class="input" type="text" />
                                </div>

                                <div>
                                    <label class="label">E-mail</label>
                                    <input v-model="editForm.email" class="input" type="email" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Observações</label>
                                <textarea v-model="editForm.notes" class="input textarea" />
                            </div>

                            <label class="toggle-row">
                                <input v-model="editForm.accepts_marketing" type="checkbox" />
                                <span>Aceita receber campanhas de e-mail/SMS</span>
                            </label>

                            <p v-if="editErrorMessage" class="error-message">{{ editErrorMessage }}</p>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSavingCustomer">
                                    {{ isSavingCustomer ? 'A guardar...' : 'Guardar alterações' }}
                                </button>

                                <button class="btn btn-secondary" type="button" @click="cancelEdit">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>

                    <div v-else class="customer-appointments">
                        <p v-if="isLoadingAppointments" class="muted-text">A carregar marcações...</p>

                        <p v-else-if="appointmentsError" class="error-message">{{ appointmentsError }}</p>

                        <template v-else>
                            <template v-if="upcomingAppointments.length">
                                <p class="block-label">Próximas marcações</p>
                                <div class="appointment-list">
                                    <div v-for="appt in upcomingAppointments" :key="appt.uuid" class="appointment-row">
                                        <div>
                                            <strong>{{ appt.service_name }}</strong>
                                            <span>{{ formatDateTime(appt.start_at) }} · {{ appt.staff_member_name }}</span>
                                        </div>
                                        <small class="status-pill">
                                            {{ appointmentStatusLabels[appt.status] || appt.status }}
                                        </small>
                                    </div>
                                </div>
                            </template>

                            <template v-if="pastAppointments.length">
                                <p class="block-label">Histórico</p>
                                <div class="appointment-list">
                                    <div v-for="appt in pastAppointments" :key="appt.uuid" class="appointment-row">
                                        <div>
                                            <strong>{{ appt.service_name }}</strong>
                                            <span>{{ formatDateTime(appt.start_at) }} · {{ appt.staff_member_name }}</span>
                                        </div>
                                        <small class="status-pill" :class="{ inactive: appt.status === 'cancelled' }">
                                            {{ appointmentStatusLabels[appt.status] || appt.status }}
                                        </small>
                                    </div>
                                </div>
                            </template>

                            <p v-if="!upcomingAppointments.length && !pastAppointments.length" class="muted-text">
                                Ainda não existem marcações para este cliente.
                            </p>
                        </template>
                    </div>
                </div>
            </div>
        </Teleport>

        <ConfirmModal
            v-model:open="showBlockConfirm"
            tag="Bloquear"
            title="Bloquear cliente?"
            :message="`${selectedCustomer?.name || 'Este cliente'} deixa de poder fazer marcações online neste negócio. As marcações já existentes mantêm-se.`"
            confirm-label="Bloquear cliente"
            danger
            @confirm="setBlocked(true)"
        />
    </div>
</template>

<script setup lang="ts">
import type { Appointment } from '~/types/schedule'

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
}

type Customer = {
    id: number
    uuid: string
    business: number
    business_uuid: string
    business_name: string
    name: string
    email: string
    phone: string
    source: string
    notes: string
    accepts_marketing: boolean
    is_blocked: boolean
    appointments_count: number
    completed_count: number
    cancelled_count: number
    total_spent: string | number | null
    last_visit_at: string | null
    next_appointment_at: string | null
    created_at: string
    updated_at: string
}

const { apiFetch } = useApi()

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const isLoadingBusinesses = ref(false)

const customers = ref<Customer[]>([])
const totalCount = ref(0)
const nextPageUrl = ref<string | null>(null)
const isLoadingCustomers = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')

let searchDebounce: ReturnType<typeof setTimeout> | null = null

const hasMore = computed(() => Boolean(nextPageUrl.value))

const selectedCustomer = ref<Customer | null>(null)
const detailTab = ref<'overview' | 'appointments'>('overview')

const isEditing = ref(false)
const isSavingCustomer = ref(false)
const editErrorMessage = ref('')
const editForm = reactive({
    name: '',
    phone: '',
    email: '',
    notes: '',
    accepts_marketing: false,
})

const isTogglingBlock = ref(false)
const showBlockConfirm = ref(false)
const blockErrorMessage = ref('')

const setBlocked = async (value: boolean) => {
    if (!selectedCustomer.value || isTogglingBlock.value) {
        return
    }

    try {
        isTogglingBlock.value = true
        blockErrorMessage.value = ''

        const updated = await apiFetch<Customer>(`/customers/${selectedCustomer.value.uuid}/`, {
            method: 'PATCH',
            body: { is_blocked: value },
        })

        selectedCustomer.value = { ...selectedCustomer.value, is_blocked: updated.is_blocked }

        const index = customers.value.findIndex((customer) => customer.uuid === updated.uuid)

        if (index !== -1) {
            customers.value[index] = { ...customers.value[index], is_blocked: updated.is_blocked }
        }
    } catch (error) {
        console.error(error)
        blockErrorMessage.value = value
            ? 'Não foi possível bloquear o cliente. Tenta novamente.'
            : 'Não foi possível desbloquear o cliente. Tenta novamente.'
    } finally {
        isTogglingBlock.value = false
    }
}

const appointments = ref<Appointment[]>([])
const isLoadingAppointments = ref(false)
const appointmentsError = ref('')
const loadedAppointmentsFor = ref('')

const appointmentStatusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Concluída',
    no_show: 'Não apareceu',
}

const upcomingAppointments = computed(() => {
    const now = Date.now()

    return appointments.value
        .filter((appt) => ['pending', 'confirmed'].includes(appt.status) && new Date(appt.start_at).getTime() >= now)
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
})

const pastAppointments = computed(() => {
    const upcomingUuids = new Set(upcomingAppointments.value.map((appt) => appt.uuid))

    return appointments.value
        .filter((appt) => !upcomingUuids.has(appt.uuid))
        .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
})

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

const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('pt-PT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const lastVisitLabel = (customer: Customer) => {
    if (!customer.last_visit_at) {
        return 'Sem visitas anteriores'
    }

    const diffDays = Math.floor((Date.now() - new Date(customer.last_visit_at).getTime()) / 86400000)

    if (diffDays <= 0) {
        return 'Última visita hoje'
    }

    if (diffDays === 1) {
        return 'Última visita há 1 dia'
    }

    if (diffDays < 30) {
        return `Última visita há ${diffDays} dias`
    }

    const diffMonths = Math.floor(diffDays / 30)

    if (diffMonths < 12) {
        return `Última visita há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`
    }

    const diffYears = Math.floor(diffMonths / 12)
    return `Última visita há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`
}

const isInactive = (customer: Customer) => {
    if (!customer.last_visit_at) {
        return true
    }

    const diffDays = (Date.now() - new Date(customer.last_visit_at).getTime()) / 86400000
    return diffDays > 90
}

const customerInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')

const loadBusinesses = async () => {
    try {
        isLoadingBusinesses.value = true

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

const loadCustomers = async () => {
    if (!selectedBusiness.value) {
        return
    }

    try {
        isLoadingCustomers.value = true
        errorMessage.value = ''

        const params = new URLSearchParams({ business: String(selectedBusiness.value.id) })

        if (searchTerm.value.trim()) {
            params.set('search', searchTerm.value.trim())
        }

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Customer[]
        }>(`/customers/?${params.toString()}`)

        customers.value = response.results
        totalCount.value = response.count
        nextPageUrl.value = response.next
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os clientes.'
    } finally {
        isLoadingCustomers.value = false
    }
}

const loadMoreCustomers = async () => {
    if (!nextPageUrl.value) {
        return
    }

    try {
        isLoadingMore.value = true

        const nextUrl = new URL(nextPageUrl.value)

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Customer[]
        }>(`/customers/?${nextUrl.searchParams.toString()}`)

        customers.value = [...customers.value, ...response.results]
        totalCount.value = response.count
        nextPageUrl.value = response.next
    } catch (error) {
        console.error(error)
    } finally {
        isLoadingMore.value = false
    }
}

watch(searchTerm, () => {
    if (searchDebounce) {
        clearTimeout(searchDebounce)
    }

    searchDebounce = setTimeout(() => {
        loadCustomers()
    }, 350)
})

const openCustomer = (customer: Customer) => {
    selectedCustomer.value = customer
    detailTab.value = 'overview'
    isEditing.value = false
    blockErrorMessage.value = ''
    appointments.value = []
    loadedAppointmentsFor.value = ''
}

const closeCustomer = () => {
    selectedCustomer.value = null
    isEditing.value = false
    blockErrorMessage.value = ''
}

const loadAppointmentsForCustomer = async () => {
    if (!selectedCustomer.value) {
        return
    }

    try {
        isLoadingAppointments.value = true
        appointmentsError.value = ''

        const response = await apiFetch<{ results: Appointment[] }>(
            `/appointments/?customer=${selectedCustomer.value.id}`
        )

        appointments.value = response.results
        loadedAppointmentsFor.value = selectedCustomer.value.uuid
    } catch (error) {
        console.error(error)
        appointmentsError.value = 'Não foi possível carregar as marcações.'
    } finally {
        isLoadingAppointments.value = false
    }
}

const openAppointmentsTab = () => {
    detailTab.value = 'appointments'

    if (selectedCustomer.value && loadedAppointmentsFor.value !== selectedCustomer.value.uuid) {
        loadAppointmentsForCustomer()
    }
}

const startEdit = () => {
    if (!selectedCustomer.value) {
        return
    }

    editForm.name = selectedCustomer.value.name
    editForm.phone = selectedCustomer.value.phone
    editForm.email = selectedCustomer.value.email
    editForm.notes = selectedCustomer.value.notes
    editForm.accepts_marketing = selectedCustomer.value.accepts_marketing
    editErrorMessage.value = ''
    isEditing.value = true
}

const cancelEdit = () => {
    isEditing.value = false
    editErrorMessage.value = ''
}

const saveCustomer = async () => {
    if (!selectedCustomer.value) {
        return
    }

    if (!editForm.name.trim()) {
        editErrorMessage.value = 'O nome é obrigatório.'
        return
    }

    try {
        isSavingCustomer.value = true
        editErrorMessage.value = ''

        const updated = await apiFetch<Customer>(`/customers/${selectedCustomer.value.uuid}/`, {
            method: 'PATCH',
            body: {
                name: editForm.name,
                phone: editForm.phone,
                email: editForm.email,
                notes: editForm.notes,
                accepts_marketing: editForm.accepts_marketing,
            },
        })

        selectedCustomer.value = { ...selectedCustomer.value, ...updated }

        const index = customers.value.findIndex((customer) => customer.uuid === updated.uuid)

        if (index !== -1) {
            customers.value[index] = { ...customers.value[index], ...updated }
        }

        isEditing.value = false
    } catch (error: any) {
        console.error(error)
        editErrorMessage.value = error?.data ? JSON.stringify(error.data) : 'Não foi possível guardar as alterações.'
    } finally {
        isSavingCustomer.value = false
    }
}

onMounted(async () => {
    await loadBusinesses()
    await loadCustomers()
})
</script>

<style scoped>
.customers-page {
    padding: 42px 0 96px;
}

.customers-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
}

.customers-header h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.055em;
}

.list-card {
    padding: 20px;
    border-radius: 18px;
}

.card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
}

.card-title-row h2 {
    margin: 0;
    font-size: 22px;
    letter-spacing: -0.04em;
}

.card-title-row p {
    margin: 5px 0 0;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
}

.search-input {
    margin-bottom: 18px;
}

.muted-text {
    color: var(--tf-muted);
    font-weight: 700;
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

.customer-list {
    display: grid;
    gap: 10px;
}

.customer-item {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    min-height: 72px;
    padding: 12px 14px;
    border: 1px solid #eee8da;
    border-radius: 16px;
    background: #fdfcf9;
    text-align: left;
    cursor: pointer;
}

.customer-avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-weight: 900;
    font-size: 14px;
}

.customer-main {
    min-width: 0;
    flex: 1;
}

.customer-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
}

.customer-name-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.customer-item strong {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
}

.customer-visits {
    flex-shrink: 0;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--tf-muted);
}

.customer-meta,
.customer-visit-meta {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 700;
    color: var(--tf-muted);
}

.customer-visit-meta {
    margin-top: 2px;
}

.customer-chevron {
    flex-shrink: 0;
    font-size: 22px;
    color: var(--tf-muted);
}

.load-more {
    width: 100%;
    margin-top: 16px;
}

.refresh-button {
    flex-shrink: 0;
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

.customer-modal-sub {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0 22px;
    color: var(--tf-muted);
    font-weight: 700;
    font-size: 13px;
}

.status-pill {
    width: fit-content;
    padding: 5px 10px;
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

.status-pill.blocked {
    background: #b42318;
    color: #fff;
}

.modal-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 22px;
    border-bottom: 1px solid var(--tf-border);
}

.modal-tab {
    padding: 10px 4px 12px;
    margin-right: 18px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--tf-muted);
    font-family: var(--tf-sans);
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
}

.modal-tab.active {
    border-bottom-color: var(--tf-black);
    color: var(--tf-black);
}

.overview-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-bottom: 8px;
}

.info-block {
    margin-bottom: 22px;
}

.block-label {
    margin: 0 0 10px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.info-key {
    display: block;
    font-size: 11px;
    color: var(--tf-muted);
    font-weight: 700;
}

.info-value {
    display: block;
    margin-top: 3px;
    font-size: 14px;
    font-weight: 800;
    word-break: break-word;
}

.marketing-value {
    margin: 0;
    font-weight: 800;
    color: #991b1b;
}

.marketing-value.accepted {
    color: #166534;
}

.notes-value {
    margin: 0;
    color: var(--tf-ink);
    font-weight: 600;
    white-space: pre-wrap;
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.stat-box {
    padding: 14px;
    border-radius: 14px;
    background: #f4f1ea;
}

.stat-box strong {
    display: block;
    font-size: 20px;
    font-weight: 900;
}

.stat-box span {
    display: block;
    margin-top: 3px;
    font-family: var(--tf-mono);
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.edit-form {
    display: grid;
    gap: 16px;
}

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.textarea {
    min-height: 88px;
    padding-top: 14px;
    resize: vertical;
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

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
}

.appointment-list {
    display: grid;
    gap: 8px;
    margin-bottom: 22px;
}

.appointment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 14px;
    border: 1px solid #eee8da;
    border-radius: 14px;
    background: #fdfcf9;
}

.appointment-row strong {
    display: block;
    font-size: 14px;
}

.appointment-row span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--tf-muted);
    font-weight: 700;
}

button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

@media (max-width: 960px) {
    .customers-page {
        padding: 24px 0 96px;
    }

    .customers-page :deep(.container),
    .container {
        width: min(100% - 28px, 1180px);
    }

    .customers-header {
        align-items: start;
        flex-direction: column;
        gap: 14px;
    }
}

@media (max-width: 620px) {
    .customers-header h1 {
        font-size: 34px;
    }

    .customer-topline {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .info-grid,
    .stats-grid,
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
}
</style>
