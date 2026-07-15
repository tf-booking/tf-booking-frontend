<template>
    <div class="page criar-negocio-page">
        <section class="container narrow">
            <p class="tf-eyebrow">Falta um passo</p>
            <h1>Cria o teu negócio</h1>

            <p class="lede">
                A tua conta ainda não tem nenhum negócio associado na Klenda. Dá-lhe um nome para continuares.
            </p>

            <form class="card form-card" @submit.prevent="handleSubmit">
                <label class="label">Nome do negócio</label>
                <input v-model="name" class="input" type="text" placeholder="Barbearia Silva" autocomplete="organization" />

                <p v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </p>

                <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                    {{ isLoading ? 'A criar...' : 'Criar o meu negócio →' }}
                </button>
            </form>

            <button type="button" class="logout-link" @click="handleLogout">
                Sair
            </button>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth'],
    layout: false,
})

const { apiFetch } = useApi()
const { logout, navigateAfterLogin } = useAuth()

const name = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
    errorMessage.value = ''

    if (!name.value.trim()) {
        errorMessage.value = 'O nome do negócio é obrigatório.'
        return
    }

    try {
        isLoading.value = true

        await apiFetch('/businesses/create-own/', {
            method: 'POST',
            body: { name: name.value.trim() },
        })

        await navigateAfterLogin()
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.name
            || error?.data?.detail
            || 'Não foi possível criar o negócio. Tenta novamente.'
    } finally {
        isLoading.value = false
    }
}

const handleLogout = async () => {
    await logout()
}
</script>

<style scoped>
.criar-negocio-page {
    display: grid;
    place-items: center;
    min-height: 100svh;
    padding: 32px 16px;
    background: #f7f6f2;
}

.narrow {
    width: min(100%, 460px);
}

.tf-eyebrow {
    margin: 0 0 10px;
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

h1 {
    margin: 0 0 10px;
    font-size: clamp(32px, 5vw, 44px);
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1;
}

.lede {
    margin: 0 0 28px;
    color: #7e7a71;
    font-size: 16px;
    line-height: 1.5;
}

.form-card {
    display: grid;
    gap: 16px;
    padding: 28px;
    border-radius: 20px;
}

.submit-btn {
    min-height: 58px;
    width: 100%;
    font-size: 16px;
}

.logout-link {
    display: block;
    margin: 24px auto 0;
    border: 0;
    background: transparent;
    padding: 0;
    color: #7a756b;
    font-weight: 800;
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
}

.error-message {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
}

button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>
