<template>
    <div class="page login-page">
        <div class="login-shell">
            <aside class="brand-panel">
                <div class="brand-logo">
                    klenda<span class="brand-dot">.</span>
                </div>

                <div class="brand-copy">
                    <p class="brand-eyebrow">Bem-vindo de volta</p>

                    <h2>Gere as tuas marcações num só sítio.</h2>

                    <p class="brand-lede">
                        Agenda, serviços, equipa e a origem de cada cliente -
                        Instagram, Google ou WhatsApp.
                    </p>
                </div>

                <div class="brand-footer">
                    <span class="pulse-dot"></span>
                    Powered by TF Creative
                </div>

                <div class="brand-watermark">klenda</div>
            </aside>

            <section class="form-panel">
                <div class="form-content">
                    <h1>Entrar</h1>

                    <p class="form-lede">
                        <span v-if="step === 'business'">Falta só o nome do teu negócio.</span>
                        <span v-else>Acede ao painel do teu negócio.</span>
                    </p>

                    <!-- PASSO 1: credenciais -->
                    <form v-if="step === 'credentials'" class="form" @submit.prevent="handleLogin">
                        <div>
                            <label class="label">Email</label>
                            <input
                                v-model="form.username"
                                class="input"
                                type="text"
                                inputmode="email"
                                placeholder="geral@estudio.pt"
                                autocomplete="username"
                            />
                        </div>

                        <div>
                            <label class="label">Palavra-passe</label>

                            <div class="password-field">
                                <input
                                    v-model="form.password"
                                    class="input password-input"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="••••••••••"
                                    autocomplete="current-password"
                                />

                                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                                    {{ showPassword ? 'ocultar' : 'mostrar' }}
                                </button>
                            </div>
                        </div>

                        <div class="forgot-row">
                            <NuxtLink to="/recuperar-password">Esqueceste-te?</NuxtLink>
                        </div>

                        <p v-if="successMessage" class="success-message">
                            {{ successMessage }}
                        </p>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                            {{ isLoading ? 'A entrar...' : 'Entrar no dashboard →' }}
                        </button>

                        <template v-if="isGoogleConfigured">
                            <div class="auth-divider"><span>ou</span></div>
                            <div ref="googleButtonRef" class="google-button-slot"></div>
                        </template>
                    </form>

                    <!-- PASSO 2: primeira vez com esta conta Google - falta criar o negócio -->
                    <form v-else class="form" @submit.prevent="handleBusinessStep">
                        <div>
                            <label class="label">Nome do negócio</label>
                            <input
                                v-model="businessName"
                                class="input"
                                type="text"
                                placeholder="Barbearia Silva"
                                autocomplete="organization"
                            />
                        </div>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                            {{ isLoading ? 'A criar negócio...' : 'Criar o meu negócio →' }}
                        </button>

                        <button type="button" class="back-link" @click="step = 'credentials'">← Voltar</button>
                    </form>

                    <div v-if="step === 'credentials'" class="form-footer">
                        Ainda não tens conta? <NuxtLink to="/signup">Criar conta grátis</NuxtLink>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

type MeResponse = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    businesses: {
        id: number
        business_uuid: string
        business_name: string
        business_slug: string
        role: string
        is_active: boolean
        created_at: string
    }[]
    pending_invite: { business_name: string; invite_url: string } | null
}

const { login, setTokens } = useAuth()
const { apiFetch } = useApi()
const { isGoogleConfigured, renderGoogleButton, submitGoogleCredential } = useGoogleAuth()
const route = useRoute()

const form = reactive({
    username: '',
    password: '',
})

type Step = 'credentials' | 'business'
const step = ref<Step>('credentials')
const businessName = ref('')
const googleCredential = ref('')

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref(route.query.reset === 'success' ? 'Password atualizada. Já podes entrar.' : '')
const showPassword = ref(false)
const googleButtonRef = ref<HTMLElement | null>(null)

const loginErrorMessage = (error: any, fallback: string) => {
    const detail = error?.data?.detail
    return typeof detail === 'string' && detail ? detail : fallback
}

const navigateAfterLogin = async () => {
    const me = await apiFetch<MeResponse>('/me/')

    if (me.is_superuser || me.is_staff) {
        await navigateTo('/admin')
        return
    }

    if (me.businesses.length === 0) {
        // Conta sem nenhum negócio ativo (tipicamente primeiro login com uma
        // conta Google nova). Se houver um convite de equipa por aceitar,
        // segue para lá em vez de forçar a criação de um negócio novo.
        await navigateTo(me.pending_invite ? me.pending_invite.invite_url : '/criar-negocio')
        return
    }

    const hasOwnerOrManagerMembership = me.businesses.some(
        (business) => business.is_active && (business.role === 'owner' || business.role === 'manager')
    )

    await navigateTo(hasOwnerOrManagerMembership ? '/dashboard' : '/schedule')
}

const handleLogin = async () => {
    errorMessage.value = ''

    if (!form.username || !form.password) {
        errorMessage.value = 'Preenche o email e a palavra-passe.'
        return
    }

    try {
        isLoading.value = true

        await login({
            username: form.username,
            password: form.password,
        })

        await navigateAfterLogin()
    } catch (error) {
        console.error(error)
        errorMessage.value = loginErrorMessage(
            error,
            'Credenciais inválidas ou erro ao entrar.'
        )
    } finally {
        isLoading.value = false
    }
}

const handleGoogleCredential = async (credential: string) => {
    errorMessage.value = ''
    googleCredential.value = credential

    try {
        isLoading.value = true

        const response = await submitGoogleCredential(credential)

        if ('needs_business_name' in response) {
            // Primeira vez que esta conta Google entra na Klenda - ainda não
            // tem negócio associado, por isso segue para o mesmo passo de
            // criação de negócio que o signup usa, em vez de travar aqui.
            step.value = 'business'
            return
        }

        setTokens(response)
        await navigateAfterLogin()
    } catch (error) {
        console.error(error)
        errorMessage.value = loginErrorMessage(
            error,
            'Não foi possível entrar com o Google. Tenta novamente.'
        )
    } finally {
        isLoading.value = false
    }
}

const handleBusinessStep = async () => {
    errorMessage.value = ''

    if (!businessName.value) {
        errorMessage.value = 'O nome do negócio é obrigatório.'
        return
    }

    try {
        isLoading.value = true

        const response = await submitGoogleCredential(googleCredential.value, businessName.value)
        setTokens(response as { access: string; refresh: string })
        await navigateAfterLogin()
    } catch (error) {
        console.error(error)
        errorMessage.value = loginErrorMessage(
            error,
            'Não foi possível criar o negócio. Tenta novamente.'
        )
    } finally {
        isLoading.value = false
    }
}

watch(
    step,
    async (value) => {
        if (value !== 'credentials') {
            return
        }

        await nextTick()

        if (googleButtonRef.value) {
            renderGoogleButton(googleButtonRef.value, handleGoogleCredential)
        }
    },
    { immediate: true }
)
</script>

<style scoped>
.login-page {
    height: 100svh;
    overflow: hidden;
    background: #f7f6f2;
}

.login-shell {
    display: grid;
    grid-template-columns: minmax(360px, 0.92fr) minmax(0, 1.08fr);
    height: 100svh;
    width: 100%;
}

.brand-panel {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: clamp(16px, 4svh, 48px);
    height: 100%;
    padding: clamp(24px, 5vw, 72px);
    background: var(--tf-black);
    color: var(--tf-white);
    overflow: hidden;
}

.brand-logo {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: baseline;
    width: fit-content;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.brand-dot {
    color: var(--tf-accent);
}

.brand-copy {
    position: relative;
    z-index: 1;
    align-self: center;
    max-width: 620px;
}

.brand-eyebrow {
    margin: 0 0 26px;
    font-family: var(--tf-mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.brand-copy h2 {
    margin: 0;
    max-width: 10ch;
    font-size: clamp(52px, 6.2vw, 92px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.94;
}

.brand-lede {
    max-width: 33ch;
    margin: 34px 0 0;
    color: #a9a49a;
    font-size: clamp(17px, 1.35vw, 21px);
    line-height: 1.55;
}

.brand-footer {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
    color: #858078;
}

.brand-watermark {
    position: absolute;
    right: -0.18em;
    bottom: -0.24em;
    color: rgba(255, 255, 255, 0.045);
    font-size: clamp(180px, 28vw, 430px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.8;
    pointer-events: none;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--tf-accent);
    animation: tfPulse 2.4s ease-in-out infinite;
}

@keyframes tfPulse {
    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.35);
        opacity: 0.55;
    }
}

.form-panel {
    display: grid;
    place-items: center;
    height: 100%;
    padding: clamp(20px, 6vw, 88px);
    background: #fffefa;
    overflow-y: auto;
}

.form-content {
    width: min(100%, 560px);
}

.form-panel h1 {
    margin: 0 0 12px;
    font-size: clamp(44px, 4.2vw, 64px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1;
}

.form-lede {
    margin: 0 0 46px;
    color: #7e7a71;
    font-size: 18px;
    line-height: 1.45;
}

.form {
    display: grid;
    gap: 24px;
}

.login-page :deep(.label) {
    margin-bottom: 12px;
    color: #7d786e;
    font-size: 12px;
    letter-spacing: 0;
}

.login-page :deep(.input) {
    min-height: 62px;
    padding: 0 22px;
    border-color: #ded8cc;
    border-radius: 16px;
    background: #fffefa;
    font-size: 16px;
}

.password-field {
    position: relative;
}

.password-input {
    padding-right: 104px;
}

.password-toggle {
    position: absolute;
    top: 50%;
    right: 22px;
    transform: translateY(-50%);
    border: 0;
    background: transparent;
    padding: 0;
    color: #9b9489;
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    cursor: pointer;
}

.forgot-row {
    margin-top: -10px;
    text-align: right;
    color: #767166;
    font-size: 14px;
    font-weight: 800;
}

.forgot-row a {
    color: inherit;
    text-decoration: none;
}

.forgot-row a:hover {
    text-decoration: underline;
}

.submit-btn {
    min-height: 64px;
    width: 100%;
    font-size: 17px;
    letter-spacing: 0;
}

.auth-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 6px 0;
    color: #a9a49a;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
}

.auth-divider::before,
.auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e7e0d4;
}

.google-button-slot {
    display: flex;
    justify-content: center;
    min-height: 44px;
}

.back-link {
    border: 0;
    background: transparent;
    padding: 0;
    margin-top: 4px;
    color: #7a756b;
    font-weight: 800;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
}

.back-link:hover {
    color: var(--tf-black);
}

.form-footer {
    margin-top: 44px;
    padding-top: 30px;
    border-top: 1px solid #e7e0d4;
    color: #7a756b;
    font-size: 16px;
}

.form-footer a {
    color: var(--tf-black);
    font-weight: 800;
    text-decoration: underline;
}

.error-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 800;
}

.success-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--tf-success-bg);
    color: var(--tf-success-fg);
    font-weight: 800;
}

@media (max-width: 900px) {
    .login-page {
        height: auto;
    }

    .login-shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        height: auto;
        min-height: 100svh;
    }

    .brand-panel {
        min-height: 0;
        padding: 22px 26px 18px;
        gap: 16px;
    }

    .brand-copy {
        align-self: center;
    }

    .brand-copy h2 {
        max-width: 16ch;
        font-size: clamp(24px, 6.4vw, 34px);
        line-height: 1.08;
    }

    .brand-lede,
    .brand-footer {
        display: none;
    }

    .form-panel {
        min-height: 0;
        height: auto;
        place-items: start center;
        padding: 28px 24px 32px;
    }
}

@media (max-width: 520px) {
    .brand-panel {
        padding: 18px 20px 16px;
        gap: 10px;
    }

    .brand-logo {
        font-size: 22px;
    }

    .brand-copy h2 {
        font-size: clamp(20px, 7vw, 26px);
    }

    .form-panel {
        padding: 22px 20px 28px;
    }

    .form-panel h1 {
        margin-bottom: 8px;
        font-size: 38px;
    }

    .form-lede {
        margin-bottom: 26px;
        font-size: 15px;
    }

    .form {
        gap: 18px;
    }

    .submit-btn {
        min-height: 56px;
        font-size: 15px;
    }

    .form-footer {
        margin-top: 28px;
        padding-top: 20px;
    }
}
</style>
