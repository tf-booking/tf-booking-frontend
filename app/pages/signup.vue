<template>
    <div class="page signup-page">
        <div class="signup-shell">
            <aside class="brand-panel">
                <div class="brand-logo">
                    klenda<span class="brand-dot">.</span>
                </div>

                <div class="brand-copy">
                    <p class="brand-eyebrow">Cria a tua conta</p>

                    <h2>O teu negócio, pronto para receber marcações hoje.</h2>

                    <p class="brand-lede">
                        Agenda, página de marcação online e clientes organizados
                        num só sítio. Começa grátis, sem cartão de crédito.
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
                    <h1>Criar conta</h1>

                    <p class="form-lede">
                        <span v-if="isProPlan">A começar com o plano Pro.</span>
                        <span v-else>Cria o teu negócio no plano Grátis.</span>
                    </p>

                    <form class="form" @submit.prevent="handleSignup">
                        <div>
                            <label class="label">Nome do negócio</label>
                            <input
                                v-model="form.business_name"
                                class="input"
                                type="text"
                                placeholder="Barbearia Silva"
                                autocomplete="organization"
                            />
                        </div>

                        <div>
                            <label class="label">O teu nome</label>
                            <input
                                v-model="form.owner_name"
                                class="input"
                                type="text"
                                placeholder="Carlos Silva"
                                autocomplete="name"
                            />
                        </div>

                        <div>
                            <label class="label">Email</label>
                            <input
                                v-model="form.owner_email"
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
                                    v-model="form.owner_password"
                                    class="input password-input"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="mínimo 6 caracteres"
                                    autocomplete="new-password"
                                />

                                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                                    {{ showPassword ? 'ocultar' : 'mostrar' }}
                                </button>
                            </div>
                        </div>

                        <p v-if="errorMessage" class="error-message">
                            {{ errorMessage }}
                        </p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                            {{ isLoading ? 'A criar conta...' : 'Criar a minha conta →' }}
                        </button>
                    </form>

                    <div class="form-footer">
                        Já tens conta? <NuxtLink to="/login">Entrar</NuxtLink>
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

type SignupResponse = {
    access: string
    refresh: string
    business: { name: string; slug: string }
}

const route = useRoute()
const { setTokens } = useAuth()
const { apiFetch } = useApi()

const isProPlan = computed(() => route.query.plano === 'pro')

const form = reactive({
    business_name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const handleSignup = async () => {
    errorMessage.value = ''

    if (!form.business_name || !form.owner_name || !form.owner_email || !form.owner_password) {
        errorMessage.value = 'Preenche todos os campos.'
        return
    }

    if (form.owner_password.length < 6) {
        errorMessage.value = 'A palavra-passe tem de ter pelo menos 6 caracteres.'
        return
    }

    try {
        isLoading.value = true

        const response = await apiFetch<SignupResponse>('/public/signup/', {
            method: 'POST',
            body: form,
            auth: false,
        })

        setTokens(response)

        await navigateTo('/dashboard')
    } catch (error: any) {
        console.error(error)

        const data = error?.data

        if (data?.owner_email?.[0]) {
            errorMessage.value = data.owner_email[0]
        } else if (data?.owner_password?.[0]) {
            errorMessage.value = data.owner_password[0]
        } else {
            errorMessage.value = 'Não foi possível criar a conta. Tenta novamente.'
        }
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.signup-page {
    min-height: 100svh;
    background: #f7f6f2;
}

.signup-shell {
    display: grid;
    grid-template-columns: minmax(360px, 0.92fr) minmax(0, 1.08fr);
    min-height: 100svh;
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
    max-width: 14ch;
    font-size: clamp(38px, 4.6vw, 62px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1;
}

.brand-lede {
    max-width: 33ch;
    margin: 28px 0 0;
    color: #a9a49a;
    font-size: clamp(16px, 1.2vw, 19px);
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
    font-size: clamp(160px, 24vw, 380px);
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
    animation: signupPulse 2.4s ease-in-out infinite;
}

@keyframes signupPulse {
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
    font-size: clamp(40px, 4vw, 58px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 1;
}

.form-lede {
    margin: 0 0 40px;
    color: #7e7a71;
    font-size: 17px;
    line-height: 1.45;
}

.form {
    display: grid;
    gap: 22px;
}

.signup-page :deep(.label) {
    margin-bottom: 12px;
    color: #7d786e;
    font-size: 12px;
    letter-spacing: 0;
}

.signup-page :deep(.input) {
    min-height: 58px;
    padding: 0 20px;
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

.submit-btn {
    min-height: 60px;
    width: 100%;
    font-size: 17px;
    letter-spacing: 0;
    margin-top: 6px;
}

.form-footer {
    margin-top: 36px;
    padding-top: 26px;
    border-top: 1px solid #e7e0d4;
    color: #7a756b;
    font-size: 15px;
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

@media (max-width: 900px) {
    .signup-page {
        height: auto;
    }

    .signup-shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        min-height: 100svh;
    }

    .brand-panel {
        min-height: 0;
        padding: 28px 26px 22px;
        gap: 18px;
    }

    .brand-copy h2 {
        max-width: none;
        font-size: clamp(28px, 7vw, 38px);
        line-height: 1.05;
    }

    .brand-lede {
        margin-top: 14px;
        font-size: 14px;
    }

    .brand-footer {
        display: none;
    }

    .form-panel {
        min-height: 0;
        padding: 28px 24px 40px;
    }
}
</style>
