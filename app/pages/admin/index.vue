<template>
    <div v-if="canAccessAdmin" class="page admin-page">
        <section class="container">
            <div class="admin-header">
                <div>
                    <p class="tf-eyebrow">Admin TF Creative</p>
                    <h1>Gestão da plataforma</h1>
                    <p>
                        Cria negócios, owners e gere os clientes da plataforma.
                    </p>
                </div>

                <button class="btn btn-secondary" type="button" @click="logout">
                    Sair
                </button>
            </div>

            <div class="admin-grid">
                <article class="card form-card">
                    <h2>Criar negócio + owner</h2>

                    <form class="form" @submit.prevent="createBusinessWithOwner">
                        <div class="form-section">
                            <h3>Dados do negócio</h3>

                            <div>
                                <label class="label">Nome do negócio</label>
                                <input v-model="form.business_name" class="input" type="text"
                                    placeholder="Clínica Demo" />
                            </div>

                            <div>
                                <label class="label">Slug</label>
                                <input v-model="form.business_slug" class="input" type="text"
                                    placeholder="clinica-demo" />
                            </div>

                            <div>
                                <label class="label">Email do negócio</label>
                                <input v-model="form.business_email" class="input" type="email"
                                    placeholder="geral@clinicademo.pt" />
                            </div>

                            <div>
                                <label class="label">Telefone</label>
                                <input v-model="form.business_phone" class="input" type="text"
                                    placeholder="910000000" />
                            </div>

                            <div>
                                <label class="label">Cidade</label>
                                <input v-model="form.business_city" class="input" type="text" placeholder="Porto" />
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Owner do negócio</h3>

                            <div>
                                <label class="label">Username</label>
                                <input v-model="form.owner_username" class="input" type="text"
                                    placeholder="clinicademo" />
                            </div>

                            <div>
                                <label class="label">Email do owner</label>
                                <input v-model="form.owner_email" class="input" type="email"
                                    placeholder="owner@clinicademo.pt" />
                            </div>

                            <div class="two-columns">
                                <div>
                                    <label class="label">Primeiro nome</label>
                                    <input v-model="form.owner_first_name" class="input" type="text"
                                        placeholder="Catarina" />
                                </div>

                                <div>
                                    <label class="label">Último nome</label>
                                    <input v-model="form.owner_last_name" class="input" type="text"
                                        placeholder="Silva" />
                                </div>
                            </div>

                            <div>
                                <label class="label">Password inicial</label>
                                <input v-model="form.owner_password" class="input" type="password"
                                    placeholder="••••••••" />
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Serviços</h3>

                            <div v-for="(service, index) in form.services" :key="index" class="service-row">
                                <div class="service-row-header">
                                    <label class="service-owner-radio">
                                        <input v-model="ownerServiceIndex" type="radio" name="owner_service"
                                            :value="index" />
                                        Serviço do owner
                                    </label>

                                    <button v-if="form.services.length > 1" class="mini-action" type="button"
                                        @click="removeServiceRow(index)">
                                        Remover
                                    </button>
                                </div>

                                <div>
                                    <label class="label">Nome do serviço</label>
                                    <input v-model="service.name" class="input" type="text"
                                        placeholder="Corte de cabelo" />
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Duração (min)</label>
                                        <input v-model.number="service.duration_minutes" class="input" type="number"
                                            min="1" placeholder="30" />
                                    </div>

                                    <div>
                                        <label class="label">Preço (€)</label>
                                        <input v-model.number="service.price" class="input" type="number" min="0"
                                            step="0.01" placeholder="20" />
                                    </div>
                                </div>

                                <div>
                                    <label class="label">Descrição</label>
                                    <input v-model="service.description" class="input" type="text"
                                        placeholder="Opcional" />
                                </div>
                            </div>

                            <button class="btn btn-secondary" type="button" @click="addServiceRow">
                                + Adicionar serviço
                            </button>
                        </div>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <p v-if="successMessage" class="success-message">
                            {{ successMessage }}
                        </p>

                        <button class="btn btn-accent" type="submit" :disabled="isCreating">
                            {{ isCreating ? 'A criar...' : 'Criar negócio' }}
                        </button>
                    </form>
                </article>

                <article class="card list-card">
                    <div class="card-title-row">
                        <h2>Negócios</h2>

                        <button class="btn btn-secondary" type="button" @click="loadBusinesses">
                            Atualizar
                        </button>
                    </div>

                    <p v-if="isLoadingBusinesses" class="muted-text">
                        A carregar negócios...
                    </p>

                    <p v-else-if="businesses.length === 0" class="muted-text">
                        Ainda não existem negócios.
                    </p>

                    <div v-else class="business-list">
                        <div v-for="business in businesses" :key="business.uuid" class="business-item">
                            <div class="business-main">
                                <strong>{{ business.name }}</strong>
                                <a :href="publicBookingUrl(business)" target="_blank" rel="noopener noreferrer">
                                    {{ publicBookingUrl(business) }}
                                </a>
                            </div>

                            <div class="business-actions">
                                <button class="mini-action" type="button" @click="copyBusinessLink(business)">
                                    Copiar
                                </button>

                                <a class="mini-action" :href="publicBookingUrl(business)" target="_blank" rel="noopener noreferrer">
                                    Abrir
                                </a>

                                <small :class="{ inactive: !business.is_active }">
                                    {{ business.is_active ? 'Ativo' : 'Inativo' }}
                                </small>
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
    middleware: 'admin' as any,
    layout: false,
})

type Business = {
    id: number
    uuid: string
    name: string
    slug: string
    email: string
    phone: string
    city: string
    is_active: boolean
}

type ServiceRow = {
    name: string
    description: string
    duration_minutes: number
    price: number
}

const emptyServiceRow = (): ServiceRow => ({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
})

const { logout, loadTokens, isAuthenticated } = useAuth()
const { apiFetch } = useApi()

const businesses = ref<Business[]>([])
const isLoadingBusinesses = ref(false)
const isCreating = ref(false)
const canAccessAdmin = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const publicOrigin = ref('')

const form = reactive({
    business_name: '',
    business_slug: '',
    business_email: '',
    business_phone: '',
    business_city: '',
    owner_username: '',
    owner_email: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_password: '',
    services: [emptyServiceRow()] as ServiceRow[],
})

const ownerServiceIndex = ref<number | null>(null)

const addServiceRow = () => {
    form.services.push(emptyServiceRow())
}

const removeServiceRow = (index: number) => {
    form.services.splice(index, 1)

    if (ownerServiceIndex.value === index) {
        ownerServiceIndex.value = null
    } else if (ownerServiceIndex.value !== null && ownerServiceIndex.value > index) {
        ownerServiceIndex.value -= 1
    }
}

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
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar os negócios.'
    } finally {
        isLoadingBusinesses.value = false
    }
}

const publicBookingPath = (business: Business) => `/booking/${encodeURIComponent(business.slug)}`

const publicBookingUrl = (business: Business) => {
    if (!publicOrigin.value) {
        return publicBookingPath(business)
    }

    return `${publicOrigin.value}${publicBookingPath(business)}`
}

const copyBusinessLink = async (business: Business) => {
    if (!import.meta.client || !navigator.clipboard) {
        successMessage.value = `Link: ${publicBookingUrl(business)}`
        return
    }

    await navigator.clipboard.writeText(publicBookingUrl(business))
    successMessage.value = `Link público de ${business.name} copiado.`
}

const resetForm = () => {
    form.business_name = ''
    form.business_slug = ''
    form.business_email = ''
    form.business_phone = ''
    form.business_city = ''
    form.owner_username = ''
    form.owner_email = ''
    form.owner_first_name = ''
    form.owner_last_name = ''
    form.owner_password = ''
    form.services = [emptyServiceRow()]
    ownerServiceIndex.value = null
}

const createBusinessWithOwner = async () => {
    errorMessage.value = ''
    successMessage.value = ''

    if (!form.business_name || !form.owner_username || !form.owner_email || !form.owner_password) {
        errorMessage.value = 'Preenche pelo menos o nome do negócio, username, email e password do owner.'
        return
    }

    try {
        isCreating.value = true

        const filledServices = form.services.filter((service) => service.name.trim() !== '')

        let ownerServiceIndexToSubmit: number | null = null

        if (ownerServiceIndex.value !== null) {
            const selectedService = form.services[ownerServiceIndex.value]

            if (selectedService && selectedService.name.trim() !== '') {
                ownerServiceIndexToSubmit = filledServices.indexOf(selectedService)
            }
        }

        await apiFetch('/admin/businesses/create-with-owner/', {
            method: 'POST',
            body: {
                ...form,
                services: filledServices,
                owner_service_index: ownerServiceIndexToSubmit,
            },
        })

        successMessage.value = 'Negócio e owner criados com sucesso.'

        resetForm()
        await loadBusinesses()
    } catch (error: any) {
        console.error(error)

        const data = error?.data

        if (data) {
            errorMessage.value = JSON.stringify(data)
        } else {
            errorMessage.value = 'Erro ao criar negócio.'
        }
    } finally {
        isCreating.value = false
    }
}

const verifyAdminAccess = async () => {
    loadTokens()

    if (!isAuthenticated.value) {
        await navigateTo('/login', { replace: true })
        return
    }

    try {
        const me = await apiFetch<{
            is_superuser: boolean
            is_staff: boolean
        }>('/me/')

        if (!me.is_superuser && !me.is_staff) {
            await navigateTo('/dashboard', { replace: true })
            return
        }

        canAccessAdmin.value = true
        await loadBusinesses()
    } catch (error) {
        console.error('Erro ao validar acesso admin:', error)
        await navigateTo('/login', { replace: true })
    }
}

onMounted(() => {
    publicOrigin.value = window.location.origin
    verifyAdminAccess()
})
</script>

<style scoped>
.admin-page {
    padding: 56px 0 88px;
}

.admin-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
}

.admin-header h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.92;
    letter-spacing: -0.07em;
}

.admin-header p:last-child {
    margin: 16px 0 0;
    color: var(--tf-muted);
    font-size: 18px;
}

.admin-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 18px;
    align-items: start;
}

.form-card,
.list-card {
    padding: 28px;
}

.form-card h2,
.list-card h2 {
    margin: 0;
    font-size: 30px;
    letter-spacing: -0.05em;
}

.form {
    display: grid;
    gap: 24px;
    margin-top: 24px;
}

.form-section {
    display: grid;
    gap: 16px;
    padding: 20px;
    border-radius: 24px;
    background: var(--tf-bg);
}

.form-section h3 {
    margin: 0;
    font-size: 20px;
    letter-spacing: -0.04em;
}

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.service-row {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--tf-border);
    border-radius: 16px;
    background: #fff;
}

.service-row-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.service-owner-radio {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--tf-muted);
}

.card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
}

.business-list {
    display: grid;
    gap: 12px;
}

.business-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    border-radius: 18px;
    background: var(--tf-bg);
}

.business-main {
    min-width: 0;
}

.business-main strong {
    display: block;
}

.business-main a {
    display: block;
    margin-top: 4px;
    color: var(--tf-muted);
    font-size: 13px;
    word-break: break-all;
}

.business-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.mini-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 11px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: #fff;
    color: var(--tf-black);
    font-family: var(--tf-sans);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
}

.business-item small {
    padding: 7px 10px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 900;
}

.business-item small.inactive {
    background: #fee2e2;
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
    .admin-header {
        align-items: start;
        flex-direction: column;
    }

    .admin-grid,
    .two-columns {
        grid-template-columns: 1fr;
    }

    .business-item {
        align-items: flex-start;
        flex-direction: column;
    }

    .business-actions {
        flex-wrap: wrap;
    }
}
</style>
