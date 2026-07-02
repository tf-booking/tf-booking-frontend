<template>
    <div class="page login-page">
        <div class="login-card card">
            <p class="tf-eyebrow">TF Booking</p>

            <h1>Entrar</h1>

            <p class="subtitle">
                Acede ao painel de gestão das tuas marcações.
            </p>

            <form class="form" @submit.prevent="handleLogin">
                <div>
                    <label class="label">Username</label>
                    <input v-model="form.username" class="input" type="text" placeholder="admin"
                        autocomplete="username" />
                </div>

                <div>
                    <label class="label">Password</label>
                    <input v-model="form.password" class="input" type="password" placeholder="••••••••"
                        autocomplete="current-password" />
                </div>

                <p v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </p>

                <button class="btn btn-accent" type="submit" :disabled="isLoading">
                    {{ isLoading ? 'A entrar...' : 'Entrar' }}
                </button>
            </form>
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

const handleLogin = async () => {
    errorMessage.value = ''

    if (!form.username || !form.password) {
        errorMessage.value = 'Preenche o username e a password.'
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
    padding: 56px 16px;
}

.login-card {
    width: min(440px, 100%);
    padding: 34px;
}

h1 {
    margin: 0;
    font-size: 44px;
    line-height: 0.95;
    letter-spacing: -0.06em;
}

.subtitle {
    margin: 14px 0 28px;
    color: var(--tf-muted);
    line-height: 1.5;
}

.form {
    display: grid;
    gap: 18px;
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 700;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>