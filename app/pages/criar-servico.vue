<template>
    <div class="page criar-servico-page">
        <section class="container narrow">
            <p class="tf-eyebrow">Falta um passo</p>
            <h1>Cria o teu primeiro serviço</h1>

            <p class="lede">
                O teu negócio ainda não tem nenhum serviço - sem isso, a tua página pública de
                marcações fica sem nada para os clientes marcarem. Cria o primeiro (podes editar
                ou adicionar mais depois em Serviços).
            </p>

            <form class="card form-card" @submit.prevent="handleSubmit">
                <div>
                    <label class="label">Nome do serviço</label>
                    <input v-model="form.name" class="input" type="text" placeholder="Corte de cabelo" autocomplete="off" />
                </div>

                <div class="two-columns">
                    <div>
                        <label class="label">Duração (minutos)</label>
                        <input v-model.number="form.duration_minutes" class="input" type="number" min="1" placeholder="30" />
                    </div>

                    <div>
                        <label class="label">Preço (€)</label>
                        <input v-model.number="form.price" class="input" type="number" min="0" step="0.01" placeholder="0" />
                    </div>
                </div>

                <div>
                    <label class="label">Descrição (opcional)</label>
                    <textarea v-model="form.description" class="input textarea" placeholder="Fala um pouco sobre este serviço."></textarea>
                </div>

                <p v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </p>

                <button class="btn btn-accent submit-btn" type="submit" :disabled="isLoading">
                    {{ isLoading ? 'A criar...' : 'Criar serviço →' }}
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
const { logout } = useAuth()

const form = reactive({
    name: '',
    duration_minutes: 30,
    price: 0,
    description: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
    errorMessage.value = ''

    if (!form.name.trim()) {
        errorMessage.value = 'O nome do serviço é obrigatório.'
        return
    }

    if (!form.duration_minutes || form.duration_minutes <= 0) {
        errorMessage.value = 'A duração tem de ser superior a 0 minutos.'
        return
    }

    try {
        isLoading.value = true

        await apiFetch('/businesses/first-service/', {
            method: 'POST',
            body: {
                name: form.name.trim(),
                duration_minutes: form.duration_minutes,
                price: form.price || 0,
                description: form.description.trim(),
            },
        })

        await navigateTo('/dashboard')
    } catch (error: any) {
        console.error(error)
        errorMessage.value = error?.data?.name?.[0]
            || error?.data?.duration_minutes?.[0]
            || error?.data?.price?.[0]
            || error?.data?.detail
            || 'Não foi possível criar o serviço. Tenta novamente.'
    } finally {
        isLoading.value = false
    }
}

const handleLogout = async () => {
    await logout()
}

onMounted(async () => {
    try {
        const me = await apiFetch<{ first_service_business: unknown }>('/me/')

        if (!me.first_service_business) {
            await navigateTo('/dashboard')
        }
    } catch (error) {
        console.error(error)
    }
})
</script>

<style scoped>
.criar-servico-page {
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

.two-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
}

.textarea {
    min-height: 100px;
    padding-top: 14px;
    resize: vertical;
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

@media (max-width: 480px) {
    .two-columns {
        grid-template-columns: 1fr;
    }
}
</style>
