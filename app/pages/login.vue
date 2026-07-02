<template>
    <div class="page login-page">
        <div class="login-shell">
            <aside class="brand-panel">
                <div class="brand-logo">
                    <span class="brand-mark">TF</span>
                    <span>Booking</span>
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

                <div class="brand-watermark">booking</div>
            </aside>

            <section class="form-panel">
                <div class="form-content">
                    <h1>Entrar</h1>

                    <p class="form-lede">Acede ao painel do teu negócio.</p>

                    <form class="form" @submit.prevent="handleLogin">
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

                        <div class="forgot-row">Esqueceste-te?</div>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                            {{ isLoading ? 'A entrar...' : 'Entrar no dashboard →' }}
                        </button>

                    </form>

                    <div class="form-footer">
                        Acesso fornecido pela equipa TF Creative.
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
        errorMessage.value = 'Preenche o email e a palavra-passe.'
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

        const hasOwnerOrManagerMembership = me.businesses.some(
            (business) => business.is_active && (business.role === 'owner' || business.role === 'manager')
        )

        if (!hasOwnerOrManagerMembership) {
            await navigateTo('/schedule')
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
    min-height: 100svh;
    background: #f7f6f2;
}

.login-shell {
    display: grid;
    grid-template-columns: minmax(360px, 0.92fr) minmax(0, 1.08fr);
    min-height: 100svh;
    width: 100%;
}

.brand-panel {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 48px;
    min-height: 100svh;
    padding: clamp(36px, 5vw, 72px);
    background: var(--tf-black);
    color: var(--tf-white);
    overflow: hidden;
}

.brand-logo {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    width: fit-content;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0;
}

.brand-mark {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 14px;
    font-weight: 900;
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
    min-height: 100svh;
    padding: clamp(36px, 6vw, 88px);
    background: #fffefa;
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

.submit-btn {
    min-height: 64px;
    width: 100%;
    font-size: 17px;
    letter-spacing: 0;
}

.form-footer {
    margin-top: 44px;
    padding-top: 30px;
    border-top: 1px solid #e7e0d4;
    color: #7a756b;
    font-size: 16px;
}

.form-footer strong {
    color: var(--tf-black);
}

.error-message {
    margin: 0;
    padding: 14px 16px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 800;
}

@media (max-width: 900px) {
    .login-page {
        height: 100svh;
        overflow: hidden;
    }

    .login-shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        height: 100svh;
    }

    .brand-panel {
        min-height: 0;
        max-height: 36svh;
        padding: 22px 26px 18px;
        gap: 16px;
    }

    .brand-copy {
        align-self: center;
    }

    .brand-copy h2 {
        max-width: 16ch;
        font-size: clamp(26px, 7vw, 38px);
        line-height: 1.05;
    }

    .brand-lede {
        margin-top: 14px;
        font-size: 14px;
        line-height: 1.45;
    }

    .brand-footer {
        display: none;
    }

    .form-panel {
        min-height: 0;
        height: 100%;
        overflow-y: auto;
        place-items: start center;
        padding: 28px 24px 32px;
    }
}

@media (max-width: 520px) {
    .brand-panel {
        max-height: 32svh;
        padding: 18px 20px 16px;
        gap: 10px;
    }

    .brand-logo {
        font-size: 16px;
    }

    .brand-mark {
        width: 38px;
        height: 38px;
    }

    .brand-copy h2 {
        font-size: clamp(22px, 8vw, 30px);
    }

    .brand-lede {
        margin-top: 10px;
        font-size: 13px;
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
