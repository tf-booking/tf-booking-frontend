<template>
    <div class="page support-page">
        <section class="container">
            <div class="support-header">
                <p class="tf-eyebrow">Precisas de ajuda?</p>
                <h1>Centro de apoio</h1>
            </div>

            <div class="quick-grid">
                <a class="card quick-card" :href="`mailto:${supportEmail}`">
                    <span class="quick-icon">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                            <path d="m3 7 9 6 9-6"></path>
                        </svg>
                    </span>
                    <div class="quick-title">Email de suporte</div>
                    <div class="quick-copy">{{ supportEmail }}</div>
                </a>

                <button class="card quick-card" type="button" @click="scrollToFaq">
                    <span class="quick-icon">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"></path>
                            <path d="M12 17h.01"></path>
                        </svg>
                    </span>
                    <div class="quick-title">Perguntas frequentes</div>
                    <div class="quick-copy">Respostas rápidas abaixo</div>
                </button>
            </div>

            <div class="support-grid">
                <article ref="faqPanel" class="card panel">
                    <h2>Perguntas frequentes</h2>

                    <div class="faq-list">
                        <div
                            v-for="(item, index) in faqItems"
                            :key="item.question"
                            class="faq-item"
                            :class="{ open: openFaqIndex === index }"
                        >
                            <button class="faq-question" type="button" @click="toggleFaq(index)">
                                <span>{{ item.question }}</span>
                                <span class="faq-toggle">{{ openFaqIndex === index ? '−' : '+' }}</span>
                            </button>
                            <p v-if="openFaqIndex === index" class="faq-answer">{{ item.answer }}</p>
                        </div>
                    </div>
                </article>

                <article class="card panel">
                    <h2>Reportar um problema</h2>
                    <p class="panel-subtitle">
                        Diz-nos o que correu mal — a nossa equipa responde em até 24h.
                    </p>

                    <form @submit.prevent="submitReport">
                        <label class="label">Tipo de problema</label>
                        <div class="chip-row">
                            <button
                                v-for="option in categoryOptions"
                                :key="option.key"
                                class="chip"
                                :class="{ active: reportCategory === option.key }"
                                type="button"
                                @click="reportCategory = option.key"
                            >
                                {{ option.label }}
                            </button>
                        </div>

                        <label class="label" for="report-area">Onde aconteceu?</label>
                        <select id="report-area" v-model="reportArea" class="input">
                            <option v-for="area in areaOptions" :key="area" :value="area">
                                {{ area }}
                            </option>
                        </select>

                        <label class="label" for="report-message">Descreve o problema</label>
                        <textarea
                            id="report-message"
                            v-model="reportMessage"
                            class="input"
                            rows="4"
                            placeholder="Quanto mais detalhes deres, mais rápido conseguimos ajudar."
                        ></textarea>

                        <p v-if="reportError" class="form-error">{{ reportError }}</p>
                        <p v-if="reportSuccess" class="form-success">{{ reportSuccess }}</p>

                        <button class="btn btn-accent submit-btn" type="submit" :disabled="isSendingReport">
                            {{ isSendingReport ? 'A enviar...' : 'Enviar relatório' }}
                        </button>
                    </form>
                </article>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: ['auth', 'owner-or-manager'],
    layout: 'backoffice',
})

const { apiFetch } = useApi()
const { currentBusiness, loadCurrentBusiness } = useCurrentBusiness()

const supportEmail = 'suporte@myklenda.com'

const faqItems = [
    {
        question: 'Como altero o horário de funcionamento?',
        answer:
            'Vai a Equipa, abre o colaborador e define os horários de trabalho de cada dia da semana. '
            + 'Para ausências pontuais, como férias ou pausas, cria bloqueios diretamente na Agenda.',
    },
    {
        question: 'Como cancelo uma marcação de um cliente?',
        answer:
            'Na Agenda, abre a marcação e muda o estado para "Cancelada" — assim fica registada no histórico. '
            + 'Também a podes apagar, mas nesse caso desaparece de vez. O cliente não recebe aviso automático, '
            + 'por isso contacta-o se necessário.',
    },
    {
        question: 'Como adiciono um novo colaborador?',
        answer:
            'Em Equipa, usa "Adicionar colaborador" e envia o convite por email. O colaborador recebe um link '
            + 'para criar a conta e fica logo disponível na agenda.',
    },
    {
        question: 'Os meus clientes podem remarcar sozinhos?',
        answer:
            'Podem cancelar através do link "gerir marcação" que recebem no email de confirmação. '
            + 'Para remarcar, basta fazerem uma nova marcação na tua página pública.',
    },
    {
        question: 'Como mudo de plano?',
        answer:
            'Em Conta, no separador "Plano", podes fazer upgrade para o Pro ou gerir a tua subscrição '
            + 'a qualquer momento.',
    },
]

const openFaqIndex = ref<number | null>(null)
const faqPanel = ref<HTMLElement | null>(null)

const toggleFaq = (index: number) => {
    openFaqIndex.value = openFaqIndex.value === index ? null : index
}

const scrollToFaq = () => {
    faqPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const categoryOptions = [
    { key: 'bug', label: 'Bug / erro' },
    { key: 'suggestion', label: 'Sugestão' },
    { key: 'other', label: 'Outro' },
]

const areaOptions = [
    'Painel',
    'Agenda',
    'Clientes',
    'Serviços',
    'Equipa',
    'Estatísticas',
    'Campanhas',
    'Definições',
    'Página pública',
    'Outro',
]

const reportCategory = ref('bug')
const reportArea = ref('Agenda')
const reportMessage = ref('')
const reportError = ref('')
const reportSuccess = ref('')
const isSendingReport = ref(false)

const submitReport = async () => {
    reportError.value = ''
    reportSuccess.value = ''

    if (!reportMessage.value.trim()) {
        reportError.value = 'Descreve o problema antes de enviares.'
        return
    }

    try {
        isSendingReport.value = true

        await apiFetch('/support/requests/', {
            method: 'POST',
            body: {
                category: reportCategory.value,
                area: reportArea.value,
                message: reportMessage.value.trim(),
                business_uuid: currentBusiness.value?.business_uuid || null,
            },
        })

        reportSuccess.value = 'Relatório enviado! Respondemos em até 24h.'
        reportMessage.value = ''
    } catch (error) {
        console.error(error)
        reportError.value = 'Não foi possível enviar o relatório. Tenta novamente.'
    } finally {
        isSendingReport.value = false
    }
}

onMounted(() => {
    loadCurrentBusiness()
})
</script>

<style scoped>
.support-page {
    padding: 48px 0 88px;
}

.support-header {
    margin-bottom: 26px;
}

.support-header h1 {
    margin: 0;
    font-size: clamp(32px, 4vw, 40px);
    letter-spacing: -0.045em;
}

.quick-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.quick-card {
    display: block;
    padding: 22px;
    text-align: left;
    font-family: var(--tf-sans);
    color: var(--tf-black);
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px -12px rgba(11, 11, 15, 0.25);
}

.quick-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-bottom: 16px;
    border-radius: 12px;
    background: #f1ecdf;
    color: var(--tf-black);
}

.quick-title {
    margin-bottom: 4px;
    font-weight: 800;
    font-size: 16px;
}

.quick-copy {
    font-size: 13px;
    color: var(--tf-muted);
}

.support-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 16px;
    align-items: start;
}

.panel {
    padding: 24px;
}

.panel h2 {
    margin: 0 0 4px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.panel-subtitle {
    margin: 0 0 20px;
    font-size: 13px;
    color: var(--tf-muted);
}

.faq-list {
    display: flex;
    flex-direction: column;
    margin-top: 14px;
}

.faq-item {
    border-bottom: 1px solid #eee8da;
}

.faq-item:last-child {
    border-bottom: 0;
}

.faq-question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 16px 0;
    border: 0;
    background: none;
    color: var(--tf-black);
    font-family: var(--tf-sans);
    font-weight: 700;
    font-size: 14.5px;
    text-align: left;
    cursor: pointer;
}

.faq-toggle {
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 400;
    color: var(--tf-muted);
}

.faq-item.open .faq-toggle {
    color: var(--tf-black);
}

.faq-answer {
    margin: 0;
    padding: 0 0 16px;
    font-size: 13.5px;
    color: #6b6b60;
    line-height: 1.6;
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
}

.chip {
    padding: 8px 13px;
    border: 0;
    border-radius: 999px;
    background: #f1ecdf;
    color: #6b6b60;
    font-family: var(--tf-sans);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.chip.active {
    background: var(--tf-black);
    color: #fff;
}

select.input {
    margin-bottom: 16px;
}

textarea.input {
    margin-bottom: 16px;
    resize: vertical;
}

.submit-btn {
    width: 100%;
}

.form-error {
    margin: 0 0 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 700;
    font-size: 13.5px;
}

.form-success {
    margin: 0 0 14px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #eef7dd;
    color: #3d5c0d;
    font-weight: 700;
    font-size: 13.5px;
}

@media (max-width: 900px) {
    .support-grid {
        grid-template-columns: 1fr;
    }

    .quick-grid {
        grid-template-columns: 1fr;
    }
}
</style>
