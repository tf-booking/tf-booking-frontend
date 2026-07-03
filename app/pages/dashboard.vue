<template>
    <div class="page dashboard-page">
        <section class="container">
            <!-- header -->
            <div class="dashboard-header">
                <div>
                    <p class="dash-date">{{ todayLabel }}</p>
                    <h1>{{ dashboardTitle }}</h1>
                </div>

                <div class="header-actions">
                    <div class="search-box">
                        <span class="search-dot"></span>
                        Procurar cliente…
                    </div>

                    <button class="btn" type="button">+ Nova marcação</button>
                </div>
            </div>

            <article v-if="primaryBusiness" class="booking-link-card">
                <div>
                    <p class="link-eyebrow">Link público</p>
                    <h2>{{ primaryBusiness.business_name }}</h2>
                    <a :href="publicBusinessUrl" target="_blank" rel="noopener noreferrer">
                        {{ publicBusinessUrl }}
                    </a>
                </div>

                <div class="link-actions">
                    <button class="btn btn-secondary" type="button" @click="copyPublicLink">
                        Copiar link
                    </button>
                    <a class="btn btn-accent" :href="publicBusinessUrl" target="_blank" rel="noopener noreferrer">
                        Abrir página
                    </a>
                </div>
            </article>

            <p v-if="copyMessage" class="copy-message">{{ copyMessage }}</p>
            <p v-if="dashboardError" class="error-message compact-error">{{ dashboardError }}</p>

            <!-- KPIs -->
            <div class="kpi-grid">
                <article class="kpi kpi-dark">
                    <p class="kpi-label kpi-label-accent">Marcações hoje</p>
                    <div class="kpi-value">{{ dashboardKpis.appointments_today }}</div>
                    <p class="kpi-foot">{{ dashboardKpis.pending_today }} por confirmar</p>
                </article>

                <article class="kpi">
                    <p class="kpi-label">Receita do dia</p>
                    <div class="kpi-value">{{ formatCurrency(dashboardKpis.revenue_today) }}</div>
                    <p class="kpi-foot" :class="revenueFootClass">{{ revenueFoot }}</p>
                </article>

                <article class="kpi">
                    <p class="kpi-label">Ocupação</p>
                    <div class="kpi-value">{{ dashboardKpis.occupancy_percentage }}<span class="kpi-unit">%</span></div>
                    <div class="kpi-bar">
                        <div class="kpi-bar-fill" :style="{ width: `${dashboardKpis.occupancy_percentage}%` }"></div>
                    </div>
                </article>

                <article class="kpi">
                    <p class="kpi-label">{{ topSourceLabel }}</p>
                    <div class="kpi-value">{{ dashboardKpis.top_source.count }}</div>
                    <p class="kpi-foot">de {{ dashboardKpis.top_source.total }} marcações</p>
                </article>
            </div>

            <!-- lower grid -->
            <div class="dashboard-grid">
                <article class="card panel">
                    <div class="panel-head">
                        <h2>Próximas marcações</h2>
                        <NuxtLink to="/schedule" class="panel-link">ver agenda →</NuxtLink>
                    </div>

                    <p v-if="isLoadingDashboard" class="muted-text">A carregar marcações...</p>

                    <p v-else-if="appointments.length === 0" class="muted-text">
                        Sem próximas marcações.
                    </p>

                    <div v-else class="appointment-list">
                        <div v-for="appointment in appointments" :key="appointment.uuid" class="appointment-item">
                            <div class="appointment-time">{{ appointment.time }}</div>

                            <div class="appointment-body">
                                <div class="appointment-service">{{ appointment.service }}</div>
                                <div class="appointment-customer">
                                    {{ appointment.customer }} · {{ appointment.duration }} min
                                </div>
                            </div>

                            <span class="source-chip" :class="`source-${appointment.sourceKey}`">
                                {{ appointment.source }}
                            </span>

                            <span class="status" :class="appointment.confirmed ? 'ok' : 'pending'">
                                {{ appointment.confirmed ? 'Confirmada' : 'Por confirmar' }}
                            </span>
                        </div>
                    </div>
                </article>

                <article class="card panel">
                    <h2>Origem dos clientes</h2>

                    <p v-if="isLoadingDashboard" class="muted-text">A carregar origem dos clientes...</p>

                    <p v-else-if="origins.length === 0" class="muted-text">
                        Ainda sem dados de origem.
                    </p>

                    <div v-else class="origin-list">
                        <div v-for="origin in origins" :key="origin.label" class="origin-row">
                            <div class="origin-top">
                                <span>{{ origin.label }}</span>
                                <span class="origin-pct">{{ origin.value }}%</span>
                            </div>
                            <div class="origin-bar">
                                <div class="origin-bar-fill" :style="{ width: origin.value + '%', background: origin.color }">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="insight">
                        <p class="insight-eyebrow">Insight</p>
                        <p class="insight-text">{{ insightText }}</p>
                    </div>
                </article>
            </div>

            <!-- live services from the API -->
            <article class="card panel services-card">
                <div class="panel-head">
                    <h2>Serviços</h2>
                    <button class="btn btn-secondary" type="button" @click="loadServices">Atualizar</button>
                </div>

                <p v-if="isLoadingServices" class="muted-text">A carregar serviços...</p>

                <p v-else-if="services.length === 0" class="muted-text">
                    Ainda não existem serviços ou o pedido à API falhou.
                </p>

                <div v-else class="services-list">
                    <div v-for="service in services" :key="service.uuid" class="service-item">
                        <div>
                            <strong>{{ service.name }}</strong>
                            <span>{{ service.business_name }}</span>
                        </div>
                        <small>{{ service.duration_minutes }} min · {{ service.price }}€</small>
                    </div>
                </div>

                <p v-if="apiError" class="error-message">{{ apiError }}</p>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-or-manager'],
    layout: 'backoffice',
})

type Service = {
    id: number
    uuid: string
    business: number
    business_uuid: string
    business_name: string
    name: string
    description: string
    duration_minutes: number
    price: string
    is_active: boolean
}

type DashboardTopSource = {
    source: string
    source_key: string
    label: string
    count: number
    total: number
}

type DashboardKpis = {
    appointments_today: number
    pending_today: number
    revenue_today: string
    revenue_yesterday: string
    revenue_change_percent: number | null
    occupancy_percentage: number
    top_source: DashboardTopSource
}

type DashboardAppointment = {
    uuid: string
    time: string
    service: string
    customer: string
    duration: number
    source: string
    source_key: string
    status: string
    status_label: string
    confirmed: boolean
}

type DashboardOrigin = {
    source: string
    source_key: string
    label: string
    value: number
    count: number
}

type BusinessDashboard = {
    business: {
        id: number
        uuid: string
        name: string
        slug: string
        email: string
        phone: string
        city: string
    }
    membership: {
        role: string
        role_label: string
    }
    user: {
        display_name: string
    }
    kpis: DashboardKpis
    upcoming_appointments: DashboardAppointment[]
    origins: DashboardOrigin[]
    insight: string
}

const { apiFetch } = useApi()
const { currentBusiness, loadCurrentBusiness } = useCurrentBusiness()

const services = ref<Service[]>([])
const dashboard = ref<BusinessDashboard | null>(null)
const isLoadingDashboard = ref(false)
const isLoadingServices = ref(false)
const dashboardError = ref('')
const apiError = ref('')
const publicOrigin = ref('')
const copyMessage = ref('')

const emptyKpis: DashboardKpis = {
    appointments_today: 0,
    pending_today: 0,
    revenue_today: '0.00',
    revenue_yesterday: '0.00',
    revenue_change_percent: null,
    occupancy_percentage: 0,
    top_source: {
        source: '',
        source_key: '',
        label: '',
        count: 0,
        total: 0,
    },
}

const originColors: Record<string, string> = {
    instagram: '#d7ff3e',
    google: '#0b0b0f',
    whatsapp: '#25d366',
    facebook: '#1877f2',
    ads: '#ffb703',
    manual: '#c5c0b4',
    'public-page': '#9a958a',
}

const todayLabel = computed(() => {
    const label = new Intl.DateTimeFormat('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }).format(new Date())
    return label.charAt(0).toUpperCase() + label.slice(1)
})

const primaryBusiness = computed(() => currentBusiness.value)

const dashboardKpis = computed(() => dashboard.value?.kpis || emptyKpis)

const dashboardTitle = computed(() => {
    const businessName = dashboard.value?.business.name || primaryBusiness.value?.business_name
    return businessName ? `Olá, ${businessName}` : 'Olá'
})

const appointments = computed(() =>
    (dashboard.value?.upcoming_appointments || []).map((appointment) => ({
        ...appointment,
        sourceKey: appointment.source_key,
    }))
)

const origins = computed(() =>
    (dashboard.value?.origins || []).map((origin) => ({
        ...origin,
        color: originColors[origin.source_key] || '#c5c0b4',
    }))
)

const topSourceLabel = computed(() => {
    const label = dashboardKpis.value.top_source.label
    return label ? `Via ${label}` : 'Origem principal'
})

const revenueFoot = computed(() => {
    const change = dashboardKpis.value.revenue_change_percent

    if (change === null) {
        return 'Sem comparativo de ontem'
    }

    if (change === 0) {
        return '0% vs. ontem'
    }

    return `${change > 0 ? '+' : '-'}${Math.abs(change)}% vs. ontem`
})

const revenueFootClass = computed(() => {
    const change = dashboardKpis.value.revenue_change_percent

    if (change === null || change >= 0) {
        return 'kpi-up'
    }

    return 'kpi-down'
})

const insightText = computed(() =>
    dashboard.value?.insight || 'Ainda não há dados suficientes. Partilha o link público para começar a medir a origem dos clientes.'
)

const publicBusinessPath = computed(() =>
    primaryBusiness.value ? `/booking/${encodeURIComponent(primaryBusiness.value.business_slug)}` : '/'
)

const publicBusinessUrl = computed(() => {
    if (!primaryBusiness.value) {
        return ''
    }

    if (!publicOrigin.value) {
        return publicBusinessPath.value
    }

    return `${publicOrigin.value}${publicBusinessPath.value}`
})

const formatCurrency = (value: string | number) => {
    const amount = Number(value || 0)

    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0)
}

const loadDashboard = async () => {
    if (!primaryBusiness.value) {
        dashboard.value = null
        return
    }

    try {
        isLoadingDashboard.value = true
        dashboardError.value = ''

        dashboard.value = await apiFetch<BusinessDashboard>(
            `/businesses/${primaryBusiness.value.business_uuid}/dashboard/`
        )
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
        dashboardError.value = 'Não foi possível carregar o resumo do negócio.'
    } finally {
        isLoadingDashboard.value = false
    }
}

const copyPublicLink = async () => {
    if (!publicBusinessUrl.value) {
        return
    }

    if (!import.meta.client || !navigator.clipboard) {
        copyMessage.value = `Link: ${publicBusinessUrl.value}`
        return
    }

    await navigator.clipboard.writeText(publicBusinessUrl.value)
    copyMessage.value = 'Link público copiado.'
}

const loadServices = async () => {
    if (!primaryBusiness.value) {
        services.value = []
        apiError.value = 'Este utilizador ainda não tem um negócio associado.'
        return
    }

    try {
        isLoadingServices.value = true
        apiError.value = ''

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Service[]
        }>(`/services/?business_uuid=${primaryBusiness.value.business_uuid}&is_active=true`)

        services.value = response.results
    } catch (error) {
        console.error('Erro ao carregar serviços:', error)
        apiError.value = 'Não foi possível carregar os serviços. Confirma se fizeste login e se o backend está ligado.'
    } finally {
        isLoadingServices.value = false
    }
}

onMounted(async () => {
    publicOrigin.value = window.location.origin
    await loadCurrentBusiness()
    await Promise.all([
        loadDashboard(),
        loadServices(),
    ])
})
</script>

<style scoped>
.dashboard-page {
    padding: 48px 0 88px;
}

/* header */
.dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;
}

.dash-date {
    margin: 0 0 9px;
    font-family: var(--tf-mono);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.dashboard-header h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 40px);
    letter-spacing: -0.045em;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 46px;
    width: 220px;
    padding: 0 16px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: #fff;
    font-size: 14px;
    color: #9a958a;
}

.search-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #c5c0b4;
}

.booking-link-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
    padding: 20px 22px;
    border: 1px solid var(--tf-border);
    border-radius: 22px;
    background: #fff;
}

.booking-link-card h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.03em;
}

.booking-link-card a:not(.btn) {
    display: block;
    margin-top: 6px;
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 700;
    word-break: break-all;
}

.link-eyebrow {
    margin: 0 0 6px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.link-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.copy-message {
    margin: -4px 0 16px;
    color: #166534;
    font-size: 13px;
    font-weight: 800;
}

.compact-error {
    margin: 0 0 16px;
}

/* KPIs */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.kpi {
    padding: 22px;
    border-radius: 22px;
    background: #fff;
    border: 1px solid var(--tf-border);
}

.kpi-dark {
    background: var(--tf-black);
    color: #fff;
    border-color: var(--tf-black);
}

.kpi-label {
    margin: 0 0 18px;
    font-family: var(--tf-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.kpi-label-accent {
    color: var(--tf-accent);
}

.kpi-value {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 1;
}

.kpi-unit {
    font-size: 24px;
}

.kpi-foot {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--tf-muted);
}

.kpi-dark .kpi-foot {
    color: #b7b3aa;
}

.kpi-up {
    color: #2f9e63;
    font-weight: 700;
}

.kpi-down {
    color: #b42318;
    font-weight: 700;
}

.kpi-bar {
    margin-top: 12px;
    height: 6px;
    border-radius: 99px;
    background: #eee8da;
    overflow: hidden;
}

.kpi-bar-fill {
    height: 100%;
    background: var(--tf-accent);
}

/* lower grid */
.dashboard-grid {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 16px;
}

.panel {
    padding: 24px;
}

.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.panel h2 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.panel-link {
    font-family: var(--tf-mono);
    font-size: 11px;
    color: #9a958a;
}

.appointment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.appointment-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px;
    border-radius: 16px;
    background: #faf8f3;
    border: 1px solid #eee8da;
}

.appointment-time {
    width: 52px;
    font-weight: 900;
    font-size: 16px;
    letter-spacing: -0.03em;
}

.appointment-body {
    flex: 1;
}

.appointment-service {
    font-weight: 700;
    font-size: 15px;
}

.appointment-customer {
    margin-top: 2px;
    font-size: 13px;
    color: var(--tf-muted);
}

.source-chip {
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 10px;
    border-radius: 999px;
}

.source-instagram {
    background: var(--tf-black);
    color: var(--tf-accent);
}

.source-whatsapp,
.source-google,
.source-public-page,
.source-manual,
.source-facebook,
.source-ads {
    background: #eef1e0;
    color: #5c6b12;
}

.status {
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}

.status.ok {
    color: #2f9e63;
}

.status.pending {
    color: #c98a1a;
}

/* origins */
.origin-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.origin-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 7px;
    font-size: 13px;
    font-weight: 600;
}

.origin-pct {
    color: var(--tf-muted);
}

.origin-bar {
    height: 9px;
    border-radius: 99px;
    background: #eee8da;
    overflow: hidden;
}

.origin-bar-fill {
    height: 100%;
}

.insight {
    margin-top: 24px;
    padding: 16px;
    border-radius: 16px;
    background: var(--tf-black);
    color: #fff;
}

.insight-eyebrow {
    margin: 0 0 8px;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.insight-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #e7e4dd;
}

.insight-text strong {
    color: #fff;
}

/* services card */
.services-card {
    margin-top: 16px;
}

.services-list {
    display: grid;
    gap: 12px;
}

.service-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    border-radius: 16px;
    background: var(--tf-bg);
}

.service-item strong {
    display: block;
}

.service-item span {
    display: block;
    margin-top: 4px;
    color: var(--tf-muted);
}

.service-item small {
    font-weight: 900;
    color: var(--tf-muted);
}

.muted-text {
    color: var(--tf-muted);
    font-weight: 700;
}

.error-message {
    margin: 18px 0 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

@media (max-width: 1080px) {
    .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 720px) {
    .dashboard-header {
        flex-direction: column;
    }

    .header-actions {
        width: 100%;
    }

    .booking-link-card {
        align-items: flex-start;
        flex-direction: column;
    }

    .link-actions {
        flex-wrap: wrap;
        width: 100%;
    }

    .search-box {
        flex: 1;
        width: auto;
    }

    .kpi-grid {
        grid-template-columns: 1fr;
    }

    .appointment-item {
        flex-wrap: wrap;
    }
}
</style>
