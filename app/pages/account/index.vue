<template>
    <div class="page account-page">
        <section class="container">
            <div class="account-header">
                <div>
                    <p class="tf-eyebrow">Conta</p>
                    <h1>Perfil</h1>
                    <p class="account-subtitle">
                        Atualiza os teus dados de acesso e a informação base do utilizador.
                    </p>
                </div>
            </div>

            <div class="account-shell">
                <aside class="card account-nav-card">
                    <p class="account-nav-label">Conta</p>

                    <nav class="account-nav">
                        <NuxtLink to="/account" class="account-nav-link active">
                            <span class="account-nav-dot"></span>
                            Perfil
                        </NuxtLink>
                    </nav>
                </aside>

                <div class="account-content">
                    <article class="card profile-overview-card">
                        <div class="profile-avatar">
                            {{ userInitials }}
                        </div>

                        <div class="profile-overview-copy">
                            <p class="profile-overview-label">Utilizador</p>
                            <h2>{{ fullName }}</h2>
                            <p>{{ form.email || 'Sem email definido' }}</p>
                        </div>

                        <div class="profile-overview-meta">
                            <div class="meta-chip">
                                <span>Username</span>
                                <strong>{{ form.username || 'Sem username' }}</strong>
                            </div>

                            <div class="meta-chip">
                                <span>Negócio atual</span>
                                <strong>{{ currentBusiness?.business_name || 'Sem negócio' }}</strong>
                            </div>
                        </div>
                    </article>

                    <div v-if="isLoadingProfile" class="card state-card">
                        A carregar perfil...
                    </div>

                    <div v-else class="account-grid">
                        <article class="card form-card">
                            <div class="section-head">
                                <div>
                                    <p class="section-label">Dados principais</p>
                                    <h2>Informação pessoal</h2>
                                </div>
                            </div>

                            <form class="form" @submit.prevent="saveProfile">
                                <div class="two-columns">
                                    <div>
                                        <label class="label">Primeiro nome</label>
                                        <input v-model="form.first_name" class="input" type="text" placeholder="António" />
                                    </div>

                                    <div>
                                        <label class="label">Último nome</label>
                                        <input v-model="form.last_name" class="input" type="text" placeholder="Silva" />
                                    </div>
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Username</label>
                                        <input v-model="form.username" class="input" type="text" placeholder="antonio" />
                                    </div>

                                    <div>
                                        <label class="label">Email</label>
                                        <input v-model="form.email" class="input" type="email" placeholder="antonio@email.pt" />
                                    </div>
                                </div>

                                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                                <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                                <div class="form-actions">
                                    <button class="btn btn-accent" type="submit" :disabled="isSavingProfile">
                                        {{ isSavingProfile ? 'A guardar...' : 'Guardar perfil' }}
                                    </button>
                                </div>
                            </form>
                        </article>

                        <article class="card form-card security-card">
                            <div class="section-head">
                                <div>
                                    <p class="section-label">Segurança</p>
                                    <h2>Alterar password</h2>
                                </div>
                            </div>

                            <form class="form" @submit.prevent="savePassword">
                                <div>
                                    <label class="label">Password atual</label>
                                    <input v-model="passwordForm.current_password" class="input" type="password" placeholder="••••••••" />
                                </div>

                                <div class="two-columns">
                                    <div>
                                        <label class="label">Nova password</label>
                                        <input v-model="passwordForm.new_password" class="input" type="password" placeholder="Mínimo 6 caracteres" />
                                    </div>

                                    <div>
                                        <label class="label">Confirmar nova password</label>
                                        <input v-model="passwordForm.new_password_confirm" class="input" type="password" placeholder="Repete a nova password" />
                                    </div>
                                </div>

                                <p class="security-hint">
                                    Só é alterada se preencheres os três campos acima.
                                </p>

                                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                                <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

                                <div class="form-actions">
                                    <button class="btn btn-secondary" type="submit" :disabled="isSavingPassword">
                                        {{ isSavingPassword ? 'A atualizar...' : 'Atualizar password' }}
                                    </button>
                                </div>
                            </form>
                        </article>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
    layout: 'backoffice',
})

type MeResponse = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
}

const { apiFetch } = useApi()
const { currentBusiness, currentUser, loadCurrentBusiness } = useCurrentBusiness()

const isLoadingProfile = ref(false)
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
})

const passwordForm = reactive({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
})

const fullName = computed(() => {
    const name = `${form.first_name} ${form.last_name}`.trim()
    return name || form.username || 'Utilizador'
})

const userInitials = computed(() => {
    const tokens = fullName.value.split(/\s+/).filter(Boolean)

    if (!tokens.length) {
        return 'TF'
    }

    return tokens
        .slice(0, 2)
        .map((token) => token.charAt(0).toUpperCase())
        .join('')
})

const resetMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
}

const resetPasswordForm = () => {
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.new_password_confirm = ''
}

const applyProfile = (profile: MeResponse | null) => {
    form.username = profile?.username || ''
    form.email = profile?.email || ''
    form.first_name = profile?.first_name || ''
    form.last_name = profile?.last_name || ''
}

const loadProfile = async () => {
    try {
        isLoadingProfile.value = true
        resetMessages()

        await loadCurrentBusiness({ force: true })
        applyProfile(currentUser.value as MeResponse | null)
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Não foi possível carregar o perfil.'
    } finally {
        isLoadingProfile.value = false
    }
}

const formatApiError = (error: any) => {
    const data = error?.data

    if (!data) {
        return 'Ocorreu um erro inesperado.'
    }

    if (typeof data === 'string') {
        return data
    }

    const firstEntry = Object.entries(data)[0]

    if (!firstEntry) {
        return 'Ocorreu um erro inesperado.'
    }

    const [, value] = firstEntry

    if (Array.isArray(value)) {
        return String(value[0])
    }

    return String(value)
}

const refreshSessionProfile = async () => {
    await loadCurrentBusiness({ force: true })
    applyProfile(currentUser.value as MeResponse | null)
}

const saveProfile = async () => {
    resetMessages()

    if (!form.username.trim()) {
        errorMessage.value = 'O username é obrigatório.'
        return
    }

    try {
        isSavingProfile.value = true

        await apiFetch('/me/', {
            method: 'PATCH',
            body: {
                username: form.username.trim(),
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
            },
        })

        await refreshSessionProfile()
        successMessage.value = 'Perfil atualizado com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingProfile.value = false
    }
}

const savePassword = async () => {
    resetMessages()

    if (
        !passwordForm.current_password
        || !passwordForm.new_password
        || !passwordForm.new_password_confirm
    ) {
        errorMessage.value = 'Preenche a password atual e a nova password.'
        return
    }

    try {
        isSavingPassword.value = true

        await apiFetch('/me/', {
            method: 'PATCH',
            body: {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirm: passwordForm.new_password_confirm,
            },
        })

        resetPasswordForm()
        successMessage.value = 'Password atualizada com sucesso.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = formatApiError(error)
    } finally {
        isSavingPassword.value = false
    }
}

onMounted(() => {
    loadProfile()
})
</script>

<style scoped>
.account-page {
    padding: 42px 0 96px;
}

.account-header {
    margin-bottom: 22px;
}

.account-header h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 56px);
    line-height: 0.92;
    letter-spacing: -0.055em;
}

.account-subtitle {
    max-width: 54ch;
    margin: 14px 0 0;
    color: var(--tf-muted);
    font-size: 16px;
    line-height: 1.6;
}

.account-shell {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

.account-nav-card,
.profile-overview-card,
.form-card,
.state-card {
    padding: 20px;
}

.account-nav-card {
    position: sticky;
    top: 28px;
}

.account-nav-label,
.section-label,
.profile-overview-label {
    margin: 0 0 10px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.account-nav {
    display: grid;
    gap: 8px;
}

.account-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 46px;
    padding: 0 14px;
    border-radius: 14px;
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 800;
    background: #faf7ef;
    transition: background 0.15s ease, color 0.15s ease;
}

.account-nav-link.active {
    background: var(--tf-black);
    color: var(--tf-accent);
}

.account-nav-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: currentColor;
}

.account-content {
    display: grid;
    gap: 16px;
}

.profile-overview-card {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
}

.profile-avatar {
    display: grid;
    place-items: center;
    width: 86px;
    height: 86px;
    border-radius: 26px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.04em;
}

.profile-overview-copy h2 {
    margin: 0;
    font-size: 30px;
    letter-spacing: -0.05em;
}

.profile-overview-copy p:last-child {
    margin: 8px 0 0;
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 700;
}

.profile-overview-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
}

.meta-chip {
    min-width: 170px;
    padding: 14px 16px;
    border: 1px solid var(--tf-border);
    border-radius: 16px;
    background: #faf7ef;
}

.meta-chip span {
    display: block;
    margin-bottom: 4px;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.meta-chip strong {
    display: block;
    font-size: 14px;
    letter-spacing: -0.02em;
}

.account-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
    gap: 16px;
    align-items: start;
}

.section-head {
    margin-bottom: 18px;
}

.section-head h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.045em;
}

.form {
    display: grid;
    gap: 18px;
}

.two-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.security-card {
    background:
        linear-gradient(180deg, rgba(215, 255, 62, 0.18), rgba(215, 255, 62, 0) 120px),
        var(--tf-white);
}

.security-hint {
    margin: -2px 0 0;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
}

.state-card {
    border-radius: 18px;
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

.success-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-success-bg);
    color: var(--tf-success-fg);
    font-weight: 700;
}

@media (max-width: 1080px) {
    .account-shell,
    .account-grid {
        grid-template-columns: 1fr;
    }

    .account-nav-card {
        position: static;
    }

    .account-nav {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 820px) {
    .account-page {
        padding: 24px 0 96px;
    }

    .profile-overview-card,
    .two-columns {
        grid-template-columns: 1fr;
    }

    .profile-overview-meta {
        justify-content: flex-start;
    }

    .meta-chip {
        min-width: 0;
        width: 100%;
    }
}
</style>
