<template>
    <div class="page staff-page">
        <section class="container">
            <div class="staff-header">
                <div>
                    <p class="tf-eyebrow">{{ staffMembers.length }} colaboradores · {{ selectedBusiness?.name || 'Negócio' }}</p>
                    <h1>Equipa</h1>
                </div>

                <button class="btn btn-accent header-new-button" type="button" @click="openCreateStaff">
                    + Novo colaborador
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

                    <form class="form" @submit.prevent="saveStaff">
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
                                <label v-for="service in services" :key="service.id" class="service-check">
                                    <input v-model="form.services" type="checkbox" :value="service.id" />
                                    <span>{{ service.name }}</span>
                                </label>
                            </div>
                        </div>

                        <label class="toggle-row">
                            <input v-model="form.is_active" type="checkbox" />
                            <span>Colaborador ativo</span>
                        </label>

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
                        <div v-for="staff in staffMembers" :key="staff.uuid" class="staff-item" :class="{ inactive: !staff.is_active }">
                            <div class="staff-avatar">
                                {{ staffInitials(staff.name) }}
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

                                <button class="mini-button" type="button" @click="editStaff(staff)">
                                    Editar
                                </button>

                                <button class="mini-button danger" type="button" @click="deleteStaff(staff)">
                                    Apagar
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </div>

            <button v-if="selectedBusiness" class="floating-add" type="button" aria-label="Novo colaborador" @click="openCreateStaff">
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

const { apiFetch } = useApi()

const businesses = ref<Business[]>([])
const selectedBusiness = ref<Business | null>(null)
const formCardRef = ref<HTMLElement | null>(null)

const services = ref<Service[]>([])
const staffMembers = ref<StaffMember[]>([])

const isLoadingBusinesses = ref(false)
const isLoadingServices = ref(false)
const isLoadingStaff = ref(false)
const isSaving = ref(false)
const isFormOpen = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const editingStaff = ref<StaffMember | null>(null)

const form = reactive({
    name: '',
    email: '',
    phone: '',
    bio: '',
    services: [] as number[],
    is_active: true,
})

const activeStaffCount = computed(() => staffMembers.value.filter((staff) => staff.is_active).length)
const inactiveStaffCount = computed(() => staffMembers.value.length - activeStaffCount.value)

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
    editingStaff.value = null

    form.name = ''
    form.email = ''
    form.phone = ''
    form.bio = ''
    form.services = []
    form.is_active = true
}

const openCreateStaff = async () => {
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

    try {
        isSaving.value = true

        const payload = {
            business: selectedBusiness.value.id,
            user: null,
            services: form.services,
            name: form.name,
            email: form.email,
            phone: form.phone,
            bio: form.bio,
            avatar_url: '',
            is_active: form.is_active,
        }

        if (editingStaff.value) {
            await apiFetch(`/staff/${editingStaff.value.id}/`, {
                method: 'PUT',
                body: payload,
            })

            successMessage.value = 'Colaborador atualizado com sucesso.'
        } else {
            await apiFetch('/staff/', {
                method: 'POST',
                body: payload,
            })

            successMessage.value = 'Colaborador criado com sucesso.'
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

    editingStaff.value = staff
    isFormOpen.value = true

    form.name = staff.name
    form.email = staff.email || ''
    form.phone = staff.phone || ''
    form.bio = staff.bio || ''
    form.services = [...staff.services]
    form.is_active = staff.is_active

    focusForm()
}

const cancelEdit = () => {
    resetMessages()
    resetForm()
    isFormOpen.value = false
}

const deleteStaff = async (staff: StaffMember) => {
    const confirmed = window.confirm(`Tens a certeza que queres apagar "${staff.name}"?`)

    if (!confirmed) {
        return
    }

    try {
        resetMessages()

        await apiFetch(`/staff/${staff.id}/`, {
            method: 'DELETE',
        })

        successMessage.value = 'Colaborador apagado com sucesso.'

        if (editingStaff.value?.id === staff.id) {
            resetForm()
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

.two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.services-check-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.service-check {
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    background: #f0ece2;
    font-size: 12px;
    font-weight: 800;
    color: var(--tf-black);
}

.service-check input {
    width: 14px;
    height: 14px;
    accent-color: var(--tf-black);
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
    }
}
</style>
