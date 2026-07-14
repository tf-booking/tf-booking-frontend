<template>
    <div class="page campaigns-page">
        <section class="container">
            <div class="campaigns-header">
                <div>
                    <p class="tf-eyebrow">{{ activeCampaignsCount }} campanhas ativas · {{ selectedBusiness?.name || 'Negócio' }}</p>
                    <h1>Campanhas</h1>
                </div>

                <button class="btn btn-accent header-new-button" type="button" @click="openCreateCampaign">
                    + Nova campanha
                </button>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <ProLock
                v-else
                :locked="isFree"
                message="As campanhas de fidelização estão disponíveis no plano Pro."
            >
                <div class="campaigns-grid">
                    <article ref="formCardRef" class="card form-card" :class="{ 'form-card-open': isFormOpen || editingCampaign }">
                        <div class="form-card-head">
                            <div>
                                <p class="business-label">Negócio: <strong>{{ selectedBusiness.name }}</strong></p>
                                <h2>{{ editingCampaign ? 'Editar campanha' : 'Criar campanha' }}</h2>
                            </div>

                            <button class="form-close" type="button" aria-label="Fechar formulário" @click="closeForm">
                                ×
                            </button>
                        </div>

                        <form class="form" @submit.prevent="saveCampaign">
                            <div>
                                <label class="label">Nome da campanha</label>
                                <input v-model="form.name" class="input" type="text" placeholder="Cliente fiel" />
                            </div>

                            <div>
                                <label class="label">Tipo de campanha</label>
                                <div class="choice-grid">
                                    <button
                                        type="button"
                                        class="choice-option"
                                        :class="{ selected: form.campaign_type === 'loyalty' }"
                                        @click="form.campaign_type = 'loyalty'"
                                    >
                                        <span class="choice-name">Fidelidade (por visitas)</span>
                                    </button>

                                    <button
                                        type="button"
                                        class="choice-option"
                                        :class="{ selected: form.campaign_type === 'direct_discount' }"
                                        @click="form.campaign_type = 'direct_discount'"
                                    >
                                        <span class="choice-name">Desconto direto</span>
                                    </button>
                                </div>
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Marcações necessárias</label>
                                    <input v-model.number="form.visits_required" class="input" type="number" min="1" placeholder="5" />
                                </div>

                                <div v-if="form.campaign_type === 'loyalty'">
                                    <label class="label">Recompensa na visita Nº</label>
                                    <input v-model.number="form.reward_visit_number" class="input" type="number" min="2" placeholder="6" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Recompensa</label>
                                <div class="choice-grid">
                                    <button
                                        type="button"
                                        class="choice-option"
                                        :class="{ selected: form.reward_type === 'free_service' }"
                                        @click="form.reward_type = 'free_service'"
                                    >
                                        <span class="choice-name">Serviço grátis</span>
                                    </button>

                                    <button
                                        type="button"
                                        class="choice-option"
                                        :class="{ selected: form.reward_type === 'percentage_discount' }"
                                        @click="form.reward_type = 'percentage_discount'"
                                    >
                                        <span class="choice-name">Desconto %</span>
                                    </button>
                                </div>
                            </div>

                            <div v-if="form.reward_type === 'percentage_discount'">
                                <label class="label">Desconto (%)</label>
                                <input v-model="form.discount_percentage" class="input" type="number" step="0.01" min="0" max="100" placeholder="20" />
                            </div>

                            <div>
                                <label class="label">Aplica-se a</label>
                                <select v-model="form.service" class="input">
                                    <option value="">Todos os serviços</option>
                                    <option v-for="service in services" :key="service.id" :value="String(service.id)">
                                        {{ service.name }}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label class="label">Período da campanha</label>
                                <div class="two-columns">
                                    <div class="filter-field">
                                        <label class="label sublabel">Início</label>
                                        <DateField v-model="form.starts_at" />
                                    </div>

                                    <div class="filter-field">
                                        <label class="label sublabel">Fim</label>
                                        <DateField v-model="form.ends_at" />
                                    </div>
                                </div>
                                <p class="field-hint">Deixa em branco para uma campanha sem data de início/fim definida.</p>
                            </div>

                            <label class="toggle-row">
                                <input v-model="form.is_active" type="checkbox" />
                                <span>Campanha ativa</span>
                            </label>

                            <p v-if="errorMessage" class="error-message">
                                {{ errorMessage }}
                            </p>

                            <p v-if="successMessage" class="success-message">
                                {{ successMessage }}
                            </p>

                            <div class="form-actions">
                                <button class="btn btn-accent" type="submit" :disabled="isSaving">
                                    {{ isSaving ? 'A guardar...' : editingCampaign ? 'Guardar alterações' : 'Criar campanha' }}
                                </button>

                                <button v-if="editingCampaign" class="btn btn-secondary" type="button" @click="cancelEdit">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </article>

                    <article class="card list-card">
                        <div class="card-title-row">
                            <div>
                                <h2>Campanhas criadas</h2>
                                <p>{{ activeCampaignsCount }} ativas · {{ inactiveCampaignsCount }} inativas</p>
                            </div>

                            <button class="mini-button refresh-button" type="button" @click="loadCampaigns">
                                Atualizar
                            </button>
                        </div>

                        <p v-if="isLoadingCampaigns" class="muted-text">
                            A carregar campanhas...
                        </p>

                        <p v-else-if="displayedCampaigns.length === 0" class="muted-text">
                            Ainda não existem campanhas.
                        </p>

                        <div v-else class="campaign-list">
                            <div v-for="campaign in displayedCampaigns" :key="campaign.uuid" class="campaign-item" :class="{ inactive: !campaign.is_active }">
                                <div class="campaign-top">
                                    <div class="campaign-title-group">
                                        <strong>{{ campaign.name }}</strong>
                                        <small class="status-pill" :class="statusClass(campaign)">{{ statusLabel(campaign) }}</small>
                                    </div>
                                    <span class="campaign-reward-badge">{{ rewardLabel(campaign) }}</span>
                                </div>

                                <p class="campaign-desc">{{ rewardDescription(campaign) }}</p>

                                <div class="campaign-progress">
                                    <div class="progress-top">
                                        <span class="progress-label">Progresso médio</span>
                                        <span class="progress-value">{{ campaign.average_progress }}/{{ campaign.visits_required }}</span>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" :style="{ width: progressWidth(campaign) + '%' }"></div>
                                    </div>
                                </div>

                                <div class="campaign-actions">
                                    <button class="mini-button" type="button" @click="editCampaign(campaign)">
                                        Editar
                                    </button>

                                    <button class="mini-button danger" type="button" @click="deleteCampaign(campaign)">
                                        Apagar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </ProLock>

            <button v-if="selectedBusiness && !isFree" class="floating-add" type="button" aria-label="Nova campanha" @click="openCreateCampaign">
                +
            </button>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-only'],
    layout: 'backoffice',
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
    name: string
}

type CampaignType = 'loyalty' | 'direct_discount'
type RewardType = 'free_service' | 'percentage_discount'

type Campaign = {
    id: number
    uuid: string
    business: number
    name: string
    campaign_type: CampaignType
    visits_required: number
    reward_visit_number: number | null
    reward_type: RewardType
    discount_percentage: string | null
    service: number | null
    service_name: string
    starts_at: string | null
    ends_at: string | null
    is_active: boolean
    average_progress: number
}

const { apiFetch } = useApi()
const { isFree } = usePlan()

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const services = ref<Service[]>([])
const campaigns = ref<Campaign[]>([])
const formCardRef = ref<HTMLElement | null>(null)

const isLoadingBusinesses = ref(false)
const isLoadingCampaigns = ref(false)
const isSaving = ref(false)
const isFormOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const editingCampaign = ref<Campaign | null>(null)

const demoCampaigns: Campaign[] = [
    {
        id: -1,
        uuid: 'demo-1',
        business: 0,
        name: 'Cliente fiel',
        campaign_type: 'loyalty',
        visits_required: 5,
        reward_visit_number: 6,
        reward_type: 'free_service',
        discount_percentage: null,
        service: null,
        service_name: 'Todos os serviços',
        starts_at: null,
        ends_at: null,
        is_active: true,
        average_progress: 3.2,
    },
    {
        id: -2,
        uuid: 'demo-2',
        business: 0,
        name: 'Volta em Julho',
        campaign_type: 'direct_discount',
        visits_required: 3,
        reward_visit_number: null,
        reward_type: 'percentage_discount',
        discount_percentage: '20',
        service: null,
        service_name: 'Coloração',
        starts_at: null,
        ends_at: null,
        is_active: true,
        average_progress: 1,
    },
    {
        id: -3,
        uuid: 'demo-3',
        business: 0,
        name: 'Promo Natal',
        campaign_type: 'loyalty',
        visits_required: 9,
        reward_visit_number: 10,
        reward_type: 'free_service',
        discount_percentage: null,
        service: null,
        service_name: 'Todos os serviços',
        starts_at: null,
        ends_at: null,
        is_active: false,
        average_progress: 4,
    },
]

const form = reactive({
    name: '',
    campaign_type: 'loyalty' as CampaignType,
    visits_required: 5,
    reward_visit_number: 6 as number | null,
    reward_type: 'free_service' as RewardType,
    discount_percentage: '20',
    service: '',
    starts_at: '',
    ends_at: '',
    is_active: true,
})

watch(() => form.visits_required, (value) => {
    if (form.campaign_type === 'loyalty' && Number.isFinite(value)) {
        form.reward_visit_number = value + 1
    }
})

const displayedCampaigns = computed(() => (isFree.value ? demoCampaigns : campaigns.value))

const activeCampaignsCount = computed(() => displayedCampaigns.value.filter((campaign) => campaign.is_active).length)
const inactiveCampaignsCount = computed(() => displayedCampaigns.value.length - activeCampaignsCount.value)

const rewardLabel = (campaign: Campaign) => {
    if (campaign.reward_type === 'free_service') {
        const target = campaign.campaign_type === 'loyalty' ? campaign.reward_visit_number : campaign.visits_required
        return `${target}ª grátis`
    }

    return `-${Number(campaign.discount_percentage || 0)}%`
}

const rewardDescription = (campaign: Campaign) => {
    const rewardText = campaign.reward_type === 'free_service'
        ? 'serviço grátis'
        : `${Number(campaign.discount_percentage || 0)}% desconto`

    return `${campaign.visits_required} marcações → ${rewardText} · ${campaign.service_name}`
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const statusLabel = (campaign: Campaign) => {
    if (!campaign.is_active) {
        return 'Inativa'
    }

    const today = todayIso()

    if (campaign.ends_at && campaign.ends_at < today) {
        return 'Terminada'
    }

    if (campaign.starts_at && campaign.starts_at > today) {
        return 'Agendada'
    }

    return 'Ativa'
}

const statusClass = (campaign: Campaign) => {
    const label = statusLabel(campaign)

    if (label === 'Ativa') return 'status-active'
    if (label === 'Agendada') return 'status-scheduled'
    if (label === 'Terminada') return 'status-ended'
    return 'status-inactive'
}

const progressWidth = (campaign: Campaign) => {
    if (!campaign.visits_required) {
        return 0
    }

    return Math.min(100, Math.round((campaign.average_progress / campaign.visits_required) * 100))
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

const resetForm = () => {
    editingCampaign.value = null

    form.name = ''
    form.campaign_type = 'loyalty'
    form.visits_required = 5
    form.reward_visit_number = 6
    form.reward_type = 'free_service'
    form.discount_percentage = '20'
    form.service = ''
    form.starts_at = ''
    form.ends_at = ''
    form.is_active = true
}

const openCreateCampaign = async () => {
    resetMessages()
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
        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Service[]
        }>(`/services/?business=${selectedBusiness.value.id}&is_active=true`)

        services.value = response.results
    } catch (error) {
        console.error(error)
    }
}

const loadCampaigns = async () => {
    if (!selectedBusiness.value || isFree.value) {
        return
    }

    try {
        isLoadingCampaigns.value = true
        resetMessages()

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Campaign[]
        }>(`/campaigns/?business=${selectedBusiness.value.id}`)

        campaigns.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar as campanhas.'
    } finally {
        isLoadingCampaigns.value = false
    }
}

const saveCampaign = async () => {
    resetMessages()

    if (!selectedBusiness.value) {
        errorMessage.value = 'Não existe negócio selecionado.'
        return
    }

    if (!form.name) {
        errorMessage.value = 'O nome da campanha é obrigatório.'
        return
    }

    if (!form.visits_required || form.visits_required < 1) {
        errorMessage.value = 'O número de marcações necessárias tem de ser pelo menos 1.'
        return
    }

    if (form.campaign_type === 'loyalty') {
        if (!form.reward_visit_number || form.reward_visit_number <= form.visits_required) {
            errorMessage.value = 'A visita da recompensa tem de ser posterior ao número de marcações necessárias.'
            return
        }
    }

    if (form.reward_type === 'percentage_discount') {
        const percentage = Number(form.discount_percentage)

        if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
            errorMessage.value = 'A percentagem de desconto tem de estar entre 0 e 100.'
            return
        }
    }

    if (form.starts_at && form.ends_at && form.ends_at < form.starts_at) {
        errorMessage.value = 'A data de fim não pode ser anterior à data de início.'
        return
    }

    try {
        isSaving.value = true

        const payload = {
            business: selectedBusiness.value.id,
            name: form.name,
            campaign_type: form.campaign_type,
            visits_required: form.visits_required,
            reward_visit_number: form.campaign_type === 'loyalty' ? form.reward_visit_number : null,
            reward_type: form.reward_type,
            discount_percentage: form.reward_type === 'percentage_discount' ? String(form.discount_percentage) : null,
            service: form.service ? Number(form.service) : null,
            starts_at: form.starts_at || null,
            ends_at: form.ends_at || null,
            is_active: form.is_active,
        }

        if (editingCampaign.value) {
            await apiFetch(`/campaigns/${editingCampaign.value.uuid}/`, {
                method: 'PUT',
                body: payload,
            })

            successMessage.value = 'Campanha atualizada com sucesso.'
        } else {
            await apiFetch('/campaigns/', {
                method: 'POST',
                body: payload,
            })

            successMessage.value = 'Campanha criada com sucesso.'
        }

        resetForm()
        isFormOpen.value = false
        await loadCampaigns()
    } catch (error: any) {
        console.error(error)

        if (error?.data) {
            errorMessage.value = JSON.stringify(error.data)
        } else {
            errorMessage.value = 'Erro ao guardar campanha.'
        }
    } finally {
        isSaving.value = false
    }
}

const editCampaign = (campaign: Campaign) => {
    resetMessages()

    editingCampaign.value = campaign
    isFormOpen.value = true

    form.name = campaign.name
    form.campaign_type = campaign.campaign_type
    form.visits_required = campaign.visits_required
    form.reward_visit_number = campaign.reward_visit_number || campaign.visits_required + 1
    form.reward_type = campaign.reward_type
    form.discount_percentage = campaign.discount_percentage || '20'
    form.service = campaign.service ? String(campaign.service) : ''
    form.starts_at = campaign.starts_at || ''
    form.ends_at = campaign.ends_at || ''
    form.is_active = campaign.is_active

    focusForm()
}

const cancelEdit = () => {
    resetMessages()
    resetForm()
    isFormOpen.value = false
}

const deleteCampaign = async (campaign: Campaign) => {
    const confirmed = window.confirm(`Tens a certeza que queres apagar "${campaign.name}"?`)

    if (!confirmed) {
        return
    }

    try {
        resetMessages()

        await apiFetch(`/campaigns/${campaign.uuid}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Campanha apagada com sucesso.'

        if (editingCampaign.value?.uuid === campaign.uuid) {
            resetForm()
        }

        await loadCampaigns()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar a campanha.'
    }
}

onMounted(async () => {
    await loadBusinesses()
    await loadServices()
    await loadCampaigns()
})
</script>

<style scoped>
.campaigns-page {
    padding: 42px 0 96px;
}

.campaigns-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
}

.campaigns-header h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.055em;
}

.campaigns-header :deep(.tf-eyebrow),
.campaigns-header .tf-eyebrow {
    margin-bottom: 8px;
}

.campaigns-grid {
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

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.choice-option {
    padding: 14px 16px;
    border: 2px solid var(--tf-border);
    border-radius: 14px;
    background: var(--tf-white);
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.choice-option.selected {
    border-color: var(--tf-ink);
    background: rgba(215, 255, 62, 0.16);
}

.choice-name {
    font-size: 13px;
    font-weight: 800;
    color: var(--tf-ink);
}

.sublabel {
    font-size: 10px;
}

.field-hint {
    margin: 8px 0 0;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 600;
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

.campaign-list {
    display: grid;
    gap: 10px;
}

.campaign-item {
    padding: 16px 18px;
    border: 1px solid #eee8da;
    border-radius: 16px;
    background: #fdfcf9;
}

.campaign-item.inactive {
    opacity: 0.68;
}

.campaign-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.campaign-title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.campaign-title-group strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
}

.campaign-reward-badge {
    flex-shrink: 0;
    font-weight: 900;
    font-size: 15px;
    color: var(--tf-black);
}

.campaign-desc {
    margin: 6px 0 14px;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 700;
}

.campaign-progress {
    margin-bottom: 14px;
}

.progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.bar-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #eee8da;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--tf-accent);
}

.campaign-actions {
    display: flex;
    align-items: center;
    gap: 8px;
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

.status-pill.status-inactive {
    background: #fee2e2;
    color: #b42318;
}

.status-pill.status-ended {
    background: #ede9e3;
    color: #6b6558;
}

.status-pill.status-scheduled {
    background: #e0edff;
    color: #1d4ed8;
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
    .campaigns-page {
        padding: 24px 0 96px;
    }

    .campaigns-page :deep(.container),
    .container {
        width: min(100% - 28px, 1180px);
    }

    .campaigns-header {
        align-items: start;
        flex-direction: column;
        gap: 14px;
    }

    .campaigns-grid,
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

    .campaign-actions {
        flex-wrap: wrap;
    }
}

@media (max-width: 620px) {
    .campaigns-header h1 {
        font-size: 34px;
    }

    .campaign-top {
        flex-direction: column;
        gap: 4px;
    }
}
</style>
