<template>
    <div class="page services-page">
        <section class="container">
            <div class="services-header">
                <div>
                    <p class="tf-eyebrow">Serviços</p>
                    <h1>Gestão de serviços</h1>
                    <p>
                        Cria os serviços do negócio, define duração, preço e disponibilidade.
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

            <div v-else class="services-grid">
                <article class="card form-card">
                    <h2>{{ editingService ? 'Editar serviço' : 'Criar serviço' }}</h2>

                    <p class="business-label">
                        Negócio: <strong>{{ selectedBusiness.name }}</strong>
                    </p>

                    <form class="form" @submit.prevent="saveService">
                        <div>
                            <label class="label">Nome do serviço</label>
                            <input v-model="form.name" class="input" type="text" placeholder="Corte cabelo" />
                        </div>

                        <div>
                            <label class="label">Descrição</label>
                            <textarea v-model="form.description" class="input textarea"
                                placeholder="Descrição breve do serviço" />
                        </div>

                        <div class="two-columns">
                            <div>
                                <label class="label">Duração em minutos</label>
                                <input v-model.number="form.duration_minutes" class="input" type="number" min="1"
                                    placeholder="30" />
                            </div>

                            <div>
                                <label class="label">Preço</label>
                                <input v-model="form.price" class="input" type="number" step="0.01" min="0"
                                    placeholder="15.00" />
                            </div>
                        </div>

                        <label class="checkbox-row">
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
                        <h2>Serviços criados</h2>

                        <button class="btn btn-secondary" type="button" @click="loadServices">
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
                        <div v-for="service in services" :key="service.uuid" class="service-item">
                            <div>
                                <strong>{{ service.name }}</strong>
                                <span>
                                    {{ service.duration_minutes }} min · {{ service.price }}€
                                </span>
                            </div>

                            <div class="service-actions">
                                <small :class="{ inactive: !service.is_active }">
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

const isLoadingBusinesses = ref(false)
const isLoadingServices = ref(false)
const isSaving = ref(false)

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

    form.name = service.name
    form.description = service.description
    form.duration_minutes = service.duration_minutes
    form.price = service.price
    form.is_active = service.is_active
}

const cancelEdit = () => {
    resetMessages()
    resetForm()
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
    padding: 56px 0 88px;
}

.services-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
}

.services-header h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.92;
    letter-spacing: -0.07em;
}

.services-header p:last-child {
    margin: 16px 0 0;
    color: var(--tf-muted);
    font-size: 18px;
}

.services-grid {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 18px;
    align-items: start;
}

.form-card,
.list-card,
.empty-card {
    padding: 28px;
}

.form-card h2,
.list-card h2 {
    margin: 0;
    font-size: 30px;
    letter-spacing: -0.05em;
}

.business-label {
    margin: 10px 0 0;
    color: var(--tf-muted);
}

.form {
    display: grid;
    gap: 18px;
    margin-top: 24px;
}

.textarea {
    min-height: 110px;
    padding-top: 14px;
    resize: vertical;
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

.card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
}

.service-list {
    display: grid;
    gap: 12px;
}

.service-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    border-radius: 18px;
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

.service-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.service-actions small {
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 900;
}

.service-actions small.inactive {
    background: #fee2e2;
    color: #991b1b;
}

.mini-button {
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: var(--tf-white);
    color: var(--tf-black);
    font-weight: 900;
    cursor: pointer;
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

@media (max-width: 960px) {
    .services-header {
        align-items: start;
        flex-direction: column;
    }

    .services-grid,
    .two-columns {
        grid-template-columns: 1fr;
    }

    .service-item {
        align-items: flex-start;
        flex-direction: column;
    }

    .service-actions {
        flex-wrap: wrap;
    }
}
</style>