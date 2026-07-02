<template>
    <div class="page login-page">
        <div class="login-shell card">
            <!-- brand panel -->
            <aside class="brand-panel">
                <div class="brand-watermark">booking</div>

                <div class="brand-logo">
                    <span class="brand-mark">TF</span>
                    Booking
                </div>

                <div class="brand-copy">
                    <p class="brand-eyebrow">Bem-vindo de volta</p>

                    <h2>Gere as tuas marcações num só sítio.</h2>

                    <p class="brand-lede">
                        Agenda, serviços, equipa e a origem de cada cliente —
                        Instagram, Google ou WhatsApp.
                    </p>
                </div>

                <div class="brand-footer">
                    <span class="pulse-dot"></span>
                    Powered by TF Creative
                </div>
            </aside>

            <!-- form panel -->
            <div class="form-panel">
                <h1>Entrar</h1>

                <p class="form-lede">Acede ao painel do teu negócio.</p>

                <form class="form" @submit.prevent="handleLogin">
                    <div>
                        <label class="label">Utilizador</label>
                        <input v-model="form.username" class="input" type="text" placeholder="admin"
                            autocomplete="username" />
                    </div>

                    <div>
                        <div class="password-label-row">
                            <label class="label">Palavra-passe</label>
                            <button type="button" class="link-muted" @click="showPassword = !showPassword">
                                {{ showPassword ? 'ocultar' : 'mostrar' }}
                            </button>
                        </div>

                        <input v-model="form.password" class="input" :type="showPassword ? 'text' : 'password'"
                            placeholder="••••••••••" autocomplete="current-password" />
                    </div>

                    <div class="forgot-row">Esqueceste-te?</div>

                    <p v-if="errorMessage" class="error-message">
                        {{ errorMessage }}
                    </p>

                    <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                        {{ isLoading ? 'A entrar...' : 'Entrar no dashboard →' }}
                    </button>

                    <button class="btn btn-secondary google-btn" type="button" disabled>
                        <span class="google-mark">G</span>
                        Continuar com Google
                    </button>
                </form>

                <div class="form-footer">
                    Novo por aqui? <strong>Criar conta do negócio</strong>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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
}

const { login } = useAuth()
const { apiFetch } = useApi()

const form = reactive({
    username: '',
    password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
    errorMessage.value = ''

    if (!form.username || !form.password) {
        errorMessage.value = 'Preenche o utilizador e a palavra-passe.'
        return
    }

    try {
        isLoading.value = true

        await login({
            username: form.username,
            password: form.password,
        })

        const me = await apiFetch<MeResponse>('/me/')

        if (me.is_superuser || me.is_staff) {
            await navigateTo('/admin')
            return
        }

        await navigateTo('/dashboard')
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Credenciais inválidas ou erro ao entrar.'
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.login-page {
    display: grid;
    place-items: center;
    padding: 48px 20px 72px;
}

.login-shell {
    display: grid;
    grid-template-columns: 0.92fr 1.08fr;
    width: min(1080px, 100%);
    overflow: hidden;
    border-radius: 28px;
}

/* ---- brand panel ---- */
.brand-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 44px;
    padding: 48px 46px;
    background: var(--tf-black);
    color: var(--tf-white);
    overflow: hidden;
}

.brand-watermark {
    position: absolute;
    bottom: -30px;
    left: -8px;
    font-size: 200px;
    font-weight: 900;
    letter-spacing: -0.09em;
    line-height: 0.8;
    color: rgba(255, 255, 255, 0.045);
    pointer-events: none;
}

.brand-logo {
    position: relative;
    display: flex;
    align-items: center;
    gap: 11px;
    font-weight: 900;
    font-size: 19px;
    letter-spacing: -0.03em;
}

.brand-mark {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 14px;
}

.brand-copy {
    position: relative;
}

.brand-eyebrow {
    margin: 0 0 22px;
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.brand-copy h2 {
    margin: 0;
    font-size: clamp(38px, 4.4vw, 52px);
    font-weight: 900;
    letter-spacing: -0.055em;
    line-height: 0.94;
}

.brand-lede {
    max-width: 34ch;
    margin: 24px 0 0;
    color: #b7b3aa;
    font-size: 16px;
    line-height: 1.6;
}

.brand-footer {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: var(--tf-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #77736a;
}

.pulse-dot {
    width: 7px;
    height: 7px;
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

/* ---- form panel ---- */
.form-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 68px;
    background: #fdfcf9;
}

.form-panel h1 {
    margin: 0 0 8px;
    font-size: 34px;
    font-weight: 900;
    letter-spacing: -0.04em;
}

.form-lede {
    margin: 0 0 32px;
    color: #6b6b60;
    font-size: 15px;
}

.form {
    display: grid;
    gap: 20px;
}

.password-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.link-muted {
    border: 0;
    background: none;
    padding: 0 0 9px;
    font-family: var(--tf-mono);
    font-size: 11px;
    color: #9a958a;
    cursor: pointer;
}

.forgot-row {
    margin-top: -6px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: #6b6b60;
}

.submit-btn {
    height: 54px;
    font-size: 16px;
}

.google-btn {
    height: 54px;
}

.google-mark {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-size: 10px;
    font-weight: 800;
}

.form-footer {
    margin-top: 34px;
    padding-top: 26px;
    border-top: 1px solid #eae5d9;
    font-size: 14px;
    color: #6b6b60;
}

.form-footer strong {
    color: var(--tf-black);
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

@media (max-width: 860px) {
    .login-shell {
        grid-template-columns: 1fr;
    }

    .brand-panel {
        padding: 40px 34px;
        gap: 30px;
    }

    .brand-watermark {
        font-size: 140px;
    }

    .form-panel {
        padding: 40px 30px;
    }
}
</style>
