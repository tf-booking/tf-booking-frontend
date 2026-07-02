<template>
    <div class="page invite-page">
        <div class="invite-shell">
            <div class="card invite-card">
                <p class="tf-eyebrow">Convite</p>

                <template v-if="isLoading">
                    <h1>A validar o convite...</h1>
                </template>

                <template v-else-if="!invite">
                    <h1>Convite inválido</h1>
                    <p class="invite-copy">{{ errorMessage || 'Este convite é inválido, expirou ou já foi utilizado.' }}</p>
                    <NuxtLink class="btn btn-secondary" to="/login">Ir para o login</NuxtLink>
                </template>

                <template v-else-if="isAccepted">
                    <h1>Convite aceite</h1>
                    <p class="invite-copy">O teu acesso a {{ invite.business_name }} está ativo. Podes entrar agora.</p>
                    <NuxtLink class="btn btn-accent" to="/login">Ir para o login</NuxtLink>
                </template>

                <template v-else>
                    <h1>Junta-te a {{ invite.business_name }}</h1>
                    <p class="invite-copy">
                        {{ invite.staff_name }}, foste convidado para fazeres parte da equipa
                        de {{ invite.business_name }} no TF Booking ({{ invite.email }}).
                    </p>

                    <form class="form" @submit.prevent="acceptInvite">
                        <template v-if="invite.requires_password">
                            <div>
                                <label class="label">Palavra-passe</label>
                                <input v-model="form.password" class="input" type="password" placeholder="••••••••••"
                                    autocomplete="new-password" />
                            </div>

                            <div>
                                <label class="label">Confirmar palavra-passe</label>
                                <input v-model="form.passwordConfirm" class="input" type="password" placeholder="••••••••••"
                                    autocomplete="new-password" />
                            </div>
                        </template>

                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isSubmitting">
                            {{ isSubmitting ? 'A confirmar...' : invite.requires_password ? 'Definir palavra-passe e entrar' : 'Aceitar convite' }}
                        </button>
                    </form>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

type InviteDetail = {
    business_name: string
    staff_name: string
    email: string
    requires_password: boolean
}

const route = useRoute()
const { apiFetch } = useApi()

const token = String(route.params.token || '')

const isLoading = ref(true)
const isSubmitting = ref(false)
const isAccepted = ref(false)
const errorMessage = ref('')
const invite = ref<InviteDetail | null>(null)

const form = reactive({
    password: '',
    passwordConfirm: '',
})

const loadInvite = async () => {
    try {
        isLoading.value = true
        invite.value = await apiFetch<InviteDetail>(`/auth/invite/${token}/`)
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.detail || 'Este convite é inválido, expirou ou já foi utilizado.'
        invite.value = null
    } finally {
        isLoading.value = false
    }
}

const acceptInvite = async () => {
    errorMessage.value = ''

    if (invite.value?.requires_password) {
        if (!form.password || form.password.length < 6) {
            errorMessage.value = 'A palavra-passe tem de ter pelo menos 6 caracteres.'
            return
        }

        if (form.password !== form.passwordConfirm) {
            errorMessage.value = 'As palavras-passe não coincidem.'
            return
        }
    }

    try {
        isSubmitting.value = true

        await apiFetch('/auth/invite/accept/', {
            method: 'POST',
            body: {
                token,
                password: invite.value?.requires_password ? form.password : undefined,
            },
        })

        isAccepted.value = true
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.detail || error?.data?.password || 'Não foi possível aceitar o convite.'
    } finally {
        isSubmitting.value = false
    }
}

onMounted(loadInvite)
</script>

<style scoped>
.invite-page {
    display: grid;
    place-items: center;
    min-height: 100svh;
    padding: 24px;
    background: #f7f6f2;
}

.invite-shell {
    width: 100%;
    max-width: 480px;
}

.invite-card {
    padding: clamp(28px, 5vw, 44px);
}

.invite-card h1 {
    margin: 0 0 14px;
    font-size: clamp(28px, 4vw, 36px);
    letter-spacing: -0.04em;
    line-height: 1.05;
}

.invite-copy {
    margin: 0 0 28px;
    color: var(--tf-muted);
    font-size: 15px;
    line-height: 1.55;
}

.form {
    display: grid;
    gap: 18px;
}

.submit-btn {
    min-height: 56px;
    width: 100%;
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}
</style>
