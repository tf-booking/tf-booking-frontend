<template>
    <div class="page login-page">
        <div class="login-shell">
            <aside class="brand-panel">
                <div class="brand-logo">
                    klenda<span class="brand-dot">.</span>
                </div>

                <div class="brand-copy">
                    <p class="brand-eyebrow">Nova palavra-passe</p>

                    <h2>Define a tua nova password.</h2>

                    <p class="brand-lede">
                        Escolhe uma password com pelo menos 6 caracteres para
                        voltares a aceder à tua conta.
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
                    <template v-if="!hasToken">
                        <h1>Link inválido</h1>
                        <p class="form-lede">
                            Este link de recuperação está incompleto ou já foi usado.
                        </p>
                        <div class="form-footer">
                            <NuxtLink to="/recuperar-password">Pedir um novo link</NuxtLink>
                        </div>
                    </template>

                    <template v-else>
                        <h1>Nova password</h1>

                        <p class="form-lede">Escolhe a tua nova palavra-passe.</p>

                        <form v-if="!successMessage" class="form" @submit.prevent="handleSubmit">
                            <div>
                                <label class="label">Nova password</label>
                                <input
                                    v-model="newPassword"
                                    class="input"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    autocomplete="new-password"
                                />
                            </div>

                            <div>
                                <label class="label">Confirmar nova password</label>
                                <input
                                    v-model="newPasswordConfirm"
                                    class="input"
                                    type="password"
                                    placeholder="Repete a nova password"
                                    autocomplete="new-password"
                                />
                            </div>

                            <p v-if="errorMessage" class="error-message">
                                {{ errorMessage }}
                            </p>

                            <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                                {{ isLoading ? 'A atualizar...' : 'Atualizar password' }}
                            </button>
                        </form>

                        <template v-else>
                            <p class="success-message">{{ successMessage }}</p>
                            <div class="form-footer">
                                <NuxtLink to="/login">Ir para o login &rarr;</NuxtLink>
                            </div>
                        </template>
                    </template>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

const { apiFetch } = useApi()
const route = useRoute()

const token = computed(() => String(route.query.token || '').trim())
const hasToken = computed(() => Boolean(token.value))

const newPassword = ref('')
const newPasswordConfirm = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
    errorMessage.value = ''

    if (!newPassword.value || !newPasswordConfirm.value) {
        errorMessage.value = 'Preenche as duas passwords.'
        return
    }

    if (newPassword.value !== newPasswordConfirm.value) {
        errorMessage.value = 'As passwords não coincidem.'
        return
    }

    try {
        isLoading.value = true

        await apiFetch<{ detail: string }>('/auth/password-reset/confirm/', {
            method: 'POST',
            body: {
                token: token.value,
                new_password: newPassword.value,
                new_password_confirm: newPasswordConfirm.value,
            },
            auth: false,
        })

        successMessage.value = 'Password atualizada com sucesso. Já podes entrar com a nova password.'
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.detail || 'Este link é inválido ou já expirou.'
    } finally {
        isLoading.value = false
    }
}
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
    padding: 16px;
    border-radius: 12px;
    background: var(--tf-success-bg);
    color: var(--tf-success-fg);
    font-weight: 700;
    line-height: 1.5;
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
