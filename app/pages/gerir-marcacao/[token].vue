<template>
    <div class="manage-page">
        <header class="manage-header">
            <NuxtLink class="brand" to="/">klenda<span>.</span></NuxtLink>
            <span class="secure-label">Ligação segura</span>
        </header>

        <main class="manage-main">
            <section v-if="isLoading" class="manage-card state-card">
                <Spinner />
                <p>A carregar a tua marcação...</p>
            </section>

            <section v-else-if="loadError" class="manage-card state-card error-state">
                <div class="state-icon">!</div>
                <p class="eyebrow">Link indisponível</p>
                <h1>Não conseguimos abrir esta marcação.</h1>
                <p>{{ loadError }}</p>
            </section>

            <section v-else-if="appointment" class="manage-card">
                <div class="card-heading">
                    <div>
                        <p class="eyebrow">Gerir marcação</p>
                        <h1>{{ appointment.business.name }}</h1>
                    </div>
                    <span class="status-pill" :class="`status-${appointment.status}`">
                        {{ appointment.status_label }}
                    </span>
                </div>

                <p class="welcome-copy">
                    Olá, {{ firstName }}. Confirma os dados antes de cancelares a marcação.
                </p>

                <div class="appointment-details">
                    <div class="detail-row detail-main">
                        <span>Serviço</span>
                        <strong>{{ appointment.service.name }}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Data</span>
                        <strong>{{ dateLabel }}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Hora</span>
                        <strong>{{ timeLabel }}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Profissional</span>
                        <strong>{{ appointment.staff.name }}</strong>
                    </div>
                    <div v-if="locationLabel" class="detail-row">
                        <span>Local</span>
                        <strong>{{ locationLabel }}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Valor</span>
                        <strong>{{ priceLabel }}</strong>
                    </div>
                </div>

                <div v-if="successMessage" class="success-panel">
                    <div class="success-icon">✓</div>
                    <div>
                        <strong>Marcação cancelada</strong>
                        <p>{{ successMessage }}</p>
                    </div>
                </div>

                <template v-else-if="appointment.can_cancel">
                    <div v-if="!isConfirmingCancel" class="manage-actions">
                        <button class="cancel-button" type="button" @click="isConfirmingCancel = true">
                            Cancelar marcação
                        </button>
                        <p>Esta ação liberta imediatamente o horário para outro cliente.</p>
                    </div>

                    <div v-else class="cancel-panel">
                        <p class="eyebrow">Confirmar cancelamento</p>
                        <h2>Tens a certeza?</h2>
                        <label for="cancellation-reason">Motivo <span>(opcional)</span></label>
                        <textarea
                            id="cancellation-reason"
                            v-model="cancellationReason"
                            maxlength="255"
                            placeholder="Ex.: surgiu um imprevisto"
                        />

                        <p v-if="actionError" class="action-error">{{ actionError }}</p>

                        <div class="confirm-actions">
                            <button class="back-button" type="button" :disabled="isCancelling" @click="closeConfirmation">
                                Manter marcação
                            </button>
                            <button class="confirm-cancel-button" type="button" :disabled="isCancelling" @click="cancelAppointment">
                                {{ isCancelling ? 'A cancelar...' : 'Sim, cancelar' }}
                            </button>
                        </div>
                    </div>
                </template>

                <div v-else class="unavailable-panel">
                    Esta marcação já não pode ser cancelada online.
                </div>

                <footer class="business-contact">
                    <span>Precisas de ajuda?</span>
                    <a v-if="appointment.business.email" :href="`mailto:${appointment.business.email}`">
                        Contactar {{ appointment.business.name }}
                    </a>
                    <a v-else-if="appointment.business.phone" :href="`tel:${appointment.business.phone}`">
                        {{ appointment.business.phone }}
                    </a>
                </footer>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

useHead({
    title: 'Gerir marcação | Klenda',
    meta: [{ name: 'robots', content: 'noindex,nofollow,noarchive' }],
})

type ManagedAppointment = {
    uuid: string
    customer_name: string
    business: {
        name: string
        email: string
        phone: string
        address: string
        city: string
    }
    service: { name: string; price: string }
    staff: { name: string }
    start_at: string
    end_at: string
    status: string
    status_label: string
    can_cancel: boolean
}

const route = useRoute()
const { apiFetch } = useApi()

const appointment = ref<ManagedAppointment | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const isConfirmingCancel = ref(false)
const isCancelling = ref(false)
const cancellationReason = ref('')
const actionError = ref('')
const successMessage = ref('')

const token = computed(() => String(route.params.token || ''))
const firstName = computed(() => appointment.value?.customer_name.trim().split(/\s+/)[0] || '')

const startDate = computed(() => appointment.value ? new Date(appointment.value.start_at) : null)
const dateLabel = computed(() => startDate.value?.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
}) || '')
const timeLabel = computed(() => startDate.value?.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
}) || '')
const locationLabel = computed(() => [
    appointment.value?.business.address,
    appointment.value?.business.city,
].filter(Boolean).join(', '))
const priceLabel = computed(() => new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
}).format(Number(appointment.value?.service.price || 0)))

const errorDetail = (error: any, fallback: string) => {
    const detail = error?.data?.detail
    return typeof detail === 'string' && detail ? detail : fallback
}

const loadAppointment = async () => {
    try {
        isLoading.value = true
        loadError.value = ''
        appointment.value = await apiFetch<ManagedAppointment>(
            `/public/appointments/manage/${encodeURIComponent(token.value)}/`,
            { auth: false }
        )
    } catch (error: any) {
        loadError.value = errorDetail(
            error,
            'O link pode ter expirado. Abre novamente o link recebido por email.'
        )
    } finally {
        isLoading.value = false
    }
}

const closeConfirmation = () => {
    isConfirmingCancel.value = false
    actionError.value = ''
}

const cancelAppointment = async () => {
    try {
        isCancelling.value = true
        actionError.value = ''
        appointment.value = await apiFetch<ManagedAppointment>(
            `/public/appointments/manage/${encodeURIComponent(token.value)}/`,
            {
                method: 'POST',
                auth: false,
                body: { cancellation_reason: cancellationReason.value },
            }
        )
        isConfirmingCancel.value = false
        successMessage.value = 'O negócio foi notificado e o horário ficou novamente disponível.'
    } catch (error: any) {
        actionError.value = errorDetail(error, 'Não foi possível cancelar a marcação. Tenta novamente.')
    } finally {
        isCancelling.value = false
    }
}

onMounted(loadAppointment)
</script>

<style scoped>
.manage-page {
    min-height: 100svh;
    background:
        radial-gradient(circle at 15% 10%, rgba(215, 255, 62, 0.16), transparent 28rem),
        #f4f1e9;
    color: var(--tf-black);
}

.manage-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(100% - 40px, 1120px);
    margin: 0 auto;
    padding: 28px 0;
}

.brand {
    color: var(--tf-black);
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-decoration: none;
}

.brand span { color: var(--tf-accent); }

.secure-label,
.eyebrow {
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.secure-label { color: #777064; }

.manage-main {
    display: grid;
    place-items: start center;
    padding: 34px 20px 80px;
}

.manage-card {
    width: min(100%, 720px);
    padding: clamp(26px, 6vw, 52px);
    border: 1px solid #dfd9cc;
    border-radius: 24px;
    background: #fffefa;
    box-shadow: 0 24px 70px rgba(24, 21, 14, 0.08);
}

.state-card { text-align: center; }
.state-card > p { color: #6f695e; }
.error-state h1 { margin: 10px auto 14px; max-width: 16ch; }
.state-icon,
.success-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: #ffe2df;
    color: #9d241c;
    font-weight: 900;
}

.card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.eyebrow { margin: 0 0 10px; color: #777064; }
.card-heading h1 { margin: 0; font-size: clamp(32px, 6vw, 48px); line-height: 1; }
.welcome-copy { margin: 22px 0 30px; color: #6f695e; line-height: 1.6; }

.status-pill {
    flex: 0 0 auto;
    padding: 8px 11px;
    border-radius: 999px;
    background: #e9f6dc;
    color: #315b1e;
    font-size: 12px;
    font-weight: 800;
}

.status-cancelled { background: #eeeae2; color: #746e63; }

.appointment-details {
    overflow: hidden;
    border: 1px solid #e3ddd1;
    border-radius: 16px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    gap: 30px;
    padding: 16px 20px;
    border-bottom: 1px solid #e8e2d7;
}

.detail-row:last-child { border-bottom: 0; }
.detail-row span { color: #837c70; font-size: 14px; }
.detail-row strong { text-align: right; }
.detail-main { background: #f8f5ee; }

.manage-actions,
.cancel-panel,
.success-panel,
.unavailable-panel {
    margin-top: 28px;
}

.cancel-button,
.confirm-cancel-button,
.back-button {
    min-height: 52px;
    border-radius: 12px;
    padding: 0 20px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
}

.cancel-button,
.confirm-cancel-button {
    border: 1px solid #c63a30;
    background: #c63a30;
    color: white;
}

.cancel-button { width: 100%; }
.manage-actions p { margin: 10px 0 0; color: #8a8377; font-size: 12px; text-align: center; }

.cancel-panel {
    padding: 22px;
    border: 1px solid #e4c6c1;
    border-radius: 16px;
    background: #fff8f6;
}

.cancel-panel h2 { margin: 0 0 20px; }
.cancel-panel label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 800; }
.cancel-panel label span { color: #8a8377; font-weight: 500; }
.cancel-panel textarea {
    width: 100%;
    min-height: 90px;
    padding: 13px;
    border: 1px solid #d9c8c3;
    border-radius: 10px;
    background: white;
    font: inherit;
    resize: vertical;
    box-sizing: border-box;
}

.confirm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.back-button { border: 1px solid #d8d0c3; background: white; color: var(--tf-black); }
button:disabled { cursor: wait; opacity: 0.65; }
.action-error { color: #a22a22; font-size: 13px; font-weight: 700; }

.success-panel {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 16px;
    background: #edf8df;
    color: #284e16;
}

.success-icon { flex: 0 0 auto; margin: 0; background: var(--tf-accent); color: var(--tf-black); }
.success-panel p { margin: 4px 0 0; font-size: 13px; }
.unavailable-panel { padding: 16px; border-radius: 12px; background: #eeeae2; color: #6d675d; text-align: center; }

.business-contact {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-top: 32px;
    padding-top: 22px;
    border-top: 1px solid #e6e0d5;
    color: #837c70;
    font-size: 13px;
}

.business-contact a { color: var(--tf-black); font-weight: 800; }

@media (max-width: 560px) {
    .manage-header { width: min(100% - 32px, 1120px); padding: 20px 0; }
    .manage-main { padding: 18px 12px 40px; }
    .manage-card { padding: 24px 20px; border-radius: 18px; }
    .card-heading { display: grid; gap: 16px; }
    .status-pill { width: fit-content; }
    .detail-row { gap: 16px; padding: 14px 15px; }
    .confirm-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .business-contact { display: grid; gap: 8px; }
}
</style>
