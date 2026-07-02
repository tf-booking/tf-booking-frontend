<template>
    <div class="page services-page">
        <section class="container">
            <div class="services-header">
                <div>
                    <p class="tf-eyebrow">{{ services.length }} serviços · {{ selectedBusiness?.name || 'Negócio' }}</p>
                    <h1>Serviços</h1>
                </div>

                <button class="btn btn-accent header-new-button" type="button" @click="openCreateService">
                    + Novo serviço
                </button>
            </div>

            <div v-if="isLoadingBusinesses" class="card empty-card">
                A carregar negócio...
            </div>

            <div v-else-if="!selectedBusiness" class="card empty-card">
                Este utilizador ainda não tem nenhum negócio associado.
            </div>

            <div v-else class="services-grid">
                <article ref="formCardRef" class="card form-card" :class="{ 'form-card-open': isFormOpen || editingService }">
                    <div class="form-card-head">
                        <div>
                            <p class="business-label">Negócio: <strong>{{ selectedBusiness.name }}</strong></p>
                            <h2>{{ editingService ? 'Editar serviço' : 'Criar serviço' }}</h2>
                        </div>

                        <button class="form-close" type="button" aria-label="Fechar formulário" @click="closeForm">
                            ×
                        </button>
                    </div>

                    <form class="form" @submit.prevent="saveService">
                        <div>
                            <label class="label">Nome do serviço</label>
                            <input v-model="form.name" class="input" type="text" placeholder="Limpeza de pele" />
                        </div>

                        <div>
                            <label class="label">Descrição</label>
                            <textarea v-model="form.description" class="input textarea"
                                placeholder="Tratamento facial profundo com esfoliação e hidratação." />
                        </div>

                        <div class="two-columns">
                            <div>
                                <label class="label">Duração (min)</label>
                                <input v-model.number="form.duration_minutes" class="input" type="number" min="1"
                                    placeholder="60" />
                            </div>

                            <div>
                                <label class="label">Preço (€)</label>
                                <input v-model="form.price" class="input" type="number" step="0.01" min="0"
                                    placeholder="35.00" />
                            </div>
                        </div>

                        <label class="toggle-row">
                            <input v-model="form.is_active" type="checkbox" />
                            <span>Serviço ativo</span>
                        </label>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <p v-if="successMessage" class="success-message">
                            {{ successMessage }}
                        </p>

                        <div class="form-actions">
                            <button class="btn btn-accent" type="submit" :disabled="isSaving">
                                {{ isSaving ? 'A guardar...' : editingService ? 'Guardar alterações' : 'Criar serviço'
                                }}
                            </button>

                            <button v-if="editingService" class="btn btn-secondary" type="button" @click="cancelEdit">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </article>

                <article class="card list-card">
                    <div class="card-title-row">
                        <div>
                            <h2>Serviços criados</h2>
                            <p>{{ activeServicesCount }} ativos · {{ inactiveServicesCount }} inativos</p>
                        </div>

                        <button class="mini-button refresh-button" type="button" @click="loadServices">
                            Atualizar
                        </button>
                    </div>

                    <p v-if="isLoadingServices" class="muted-text">
                        A carregar serviços...
                    </p>

                    <p v-else-if="services.length === 0" class="muted-text">
                        Ainda não existem serviços.
                    </p>

                    <div v-else class="service-list">
                        <div v-for="service in services" :key="service.uuid" class="service-item" :class="{ inactive: !service.is_active }">
                            <span class="service-accent"></span>

                            <div class="service-main">
                                <div class="service-topline">
                                    <strong>{{ service.name }}</strong>
                                    <span class="service-price">{{ formatCurrency(service.price) }}</span>
                                </div>

                                <span class="service-meta">
                                    {{ service.duration_minutes }} min · {{ service.description || 'Sem descrição' }}
                                </span>
                            </div>

                            <div class="service-actions">
                                <small class="status-pill" :class="{ inactive: !service.is_active }">
                                    {{ service.is_active ? 'Ativo' : 'Inativo' }}
                                </small>

                                <button class="mini-button" type="button" @click="editService(service)">
                                    Editar
                                </button>

                                <button class="mini-button danger" type="button" @click="deleteService(service)">
                                    Apagar
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </div>

            <button v-if="selectedBusiness" class="floating-add" type="button" aria-label="Novo serviço" @click="openCreateService">
                +
            </button>
        </section>
    </div>
</template>

<script setup lang="ts">
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

const { apiFetch } = useApi()

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const services = ref<Service[]>([])
const formCardRef = ref<HTMLElement | null>(null)

const isLoadingBusinesses = ref(false)
const isLoadingServices = ref(false)
const isSaving = ref(false)
const isFormOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const editingService = ref<Service | null>(null)

const form = reactive({
    name: '',
    description: '',
    duration_minutes: 30,
    price: '0.00',
    is_active: true,
})

const activeServicesCount = computed(() => services.value.filter((service) => service.is_active).length)
const inactiveServicesCount = computed(() => services.value.length - activeServicesCount.value)

const formatCurrency = (value: string | number) => {
    const amount = Number(value)

    if (!Number.isFinite(amount)) {
        return `${value}€`
    }

    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    })
        .format(amount)
        .replace(/\s/g, '')
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
    editingService.value = null

    form.name = ''
    form.description = ''
    form.duration_minutes = 30
    form.price = '0.00'
    form.is_active = true
}

const openCreateService = async () => {
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
        isLoadingServices.value = true
        resetMessages()

        const response = await apiFetch<{
            count: number
            next: string | null
            previous: string | null
            results: Service[]
        }>(`/services/?business=${selectedBusiness.value.id}`)

        services.value = response.results
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os serviços.'
    } finally {
        isLoadingServices.value = false
    }
}

const saveService = async () => {
    resetMessages()

    if (!selectedBusiness.value) {
        errorMessage.value = 'Não existe negócio selecionado.'
        return
    }

    if (!form.name) {
        errorMessage.value = 'O nome do serviço é obrigatório.'
        return
    }

    if (!form.duration_minutes || form.duration_minutes <= 0) {
        errorMessage.value = 'A duração tem de ser superior a 0 minutos.'
        return
    }

    try {
        isSaving.value = true

        const payload = {
            business: selectedBusiness.value.id,
            name: form.name,
            description: form.description,
            duration_minutes: form.duration_minutes,
            price: String(form.price || '0.00'),
            is_active: form.is_active,
        }

        if (editingService.value) {
            await apiFetch(`/services/${editingService.value.id}/`, {
                method: 'PUT',
                body: payload,
            })

            successMessage.value = 'Serviço atualizado com sucesso.'
        } else {
            await apiFetch('/services/', {
                method: 'POST',
                body: payload,
            })

            successMessage.value = 'Serviço criado com sucesso.'
        }

        resetForm()
        isFormOpen.value = false
        await loadServices()
    } catch (error: any) {
        console.error(error)

        if (error?.data) {
            errorMessage.value = JSON.stringify(error.data)
        } else {
            errorMessage.value = 'Erro ao guardar serviço.'
        }
    } finally {
        isSaving.value = false
    }
}

const editService = (service: Service) => {
    resetMessages()

    editingService.value = service
    isFormOpen.value = true

    form.name = service.name
    form.description = service.description
    form.duration_minutes = service.duration_minutes
    form.price = service.price
    form.is_active = service.is_active

    focusForm()
}

const cancelEdit = () => {
    resetMessages()
    resetForm()
    isFormOpen.value = false
}

const deleteService = async (service: Service) => {
    const confirmed = window.confirm(`Tens a certeza que queres apagar "${service.name}"?`)

    if (!confirmed) {
        return
    }

    try {
        resetMessages()

        await apiFetch(`/services/${service.id}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Serviço apagado com sucesso.'

        if (editingService.value?.id === service.id) {
            resetForm()
        }

        await loadServices()
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível apagar o serviço.'
    }
}

onMounted(async () => {
    await loadBusinesses()
    await loadServices()
})
</script>

<style scoped>
.services-page {
    padding: 42px 0 96px;
}

.services-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
}

.services-header h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.055em;
}

.services-header :deep(.tf-eyebrow),
.services-header .tf-eyebrow {
    margin-bottom: 8px;
}

.services-grid {
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

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
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

.service-list {
    display: grid;
    gap: 10px;
}

.service-item {
    position: relative;
    display: grid;
    grid-template-columns: 4px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    min-height: 72px;
    padding: 12px 14px 12px 0;
    border: 1px solid #eee8da;
    border-radius: 16px;
    background: #fdfcf9;
    overflow: hidden;
}

.service-item.inactive {
    opacity: 0.68;
}

.service-accent {
    width: 4px;
    align-self: stretch;
    border-radius: 0 999px 999px 0;
    background: var(--tf-accent);
}

.service-item.inactive .service-accent {
    background: #d8d1c3;
}

.service-main {
    min-width: 0;
}

.service-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.service-item strong {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
}

.service-price {
    flex-shrink: 0;
    font-weight: 900;
    color: var(--tf-black);
}

.service-meta {
    display: block;
    max-width: 48ch;
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--tf-muted);
    font-size: 12px;
    font-weight: 700;
}

.service-actions {
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

.status-pill.inactive {
    background: #fee2e2;
    color: #b42318;
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
    .services-page {
        padding: 24px 0 96px;
    }

    .services-page :deep(.container),
    .container {
        width: min(100% - 28px, 1180px);
    }

    .services-header {
        align-items: start;
        flex-direction: column;
        gap: 14px;
    }

    .services-grid,
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

    .service-actions {
        flex-wrap: wrap;
    }
}

@media (max-width: 620px) {
    .services-header h1 {
        font-size: 34px;
    }

    .service-item {
        grid-template-columns: 4px minmax(0, 1fr);
        align-items: start;
        padding-right: 12px;
    }

    .service-actions {
        grid-column: 2;
        justify-content: space-between;
        width: 100%;
    }

    .service-meta {
        white-space: normal;
    }
}
</style>
