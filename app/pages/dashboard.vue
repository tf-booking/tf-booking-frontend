<template>
    <div class="page dashboard-page">
        <section class="container">
            <div class="dashboard-header">
                <div>
                    <p class="tf-eyebrow">Dashboard</p>
                    <h1>Agenda do negócio</h1>
                    <p>
                        Visão rápida das marcações, clientes e origem dos contactos.
                    </p>
                </div>

                <button class="btn btn-accent">
                    Nova marcação
                </button>
            </div>

            <div class="stats-grid">
                <article class="stat-card dark">
                    <span>Marcações hoje</span>
                    <strong>8</strong>
                </article>

                <article class="stat-card">
                    <span>Esta semana</span>
                    <strong>34</strong>
                </article>

                <article class="stat-card">
                    <span>Origem principal</span>
                    <strong>Instagram</strong>
                </article>
            </div>

            <div class="dashboard-grid">
                <article class="card agenda-card">
                    <div class="card-title-row">
                        <h2>Marcações de hoje</h2>
                        <span>Europe/Lisbon</span>
                    </div>

                    <div class="appointment-list">
                        <div v-for="appointment in appointments" :key="appointment.time" class="appointment-item">
                            <div class="time">
                                {{ appointment.time }}
                            </div>

                            <div>
                                <strong>{{ appointment.service }}</strong>
                                <span>{{ appointment.customer }}</span>
                            </div>

                            <small>{{ appointment.source }}</small>
                        </div>
                    </div>
                </article>

                <article class="card source-card">
                    <p class="tf-eyebrow">Marketing</p>
                    <h2>Origem das marcações</h2>

                    <div class="source-list">
                        <div>
                            <span>Instagram</span>
                            <strong>18</strong>
                        </div>

                        <div>
                            <span>Google</span>
                            <strong>9</strong>
                        </div>

                        <div>
                            <span>WhatsApp</span>
                            <strong>7</strong>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
const appointments = [
    {
        time: '09:30',
        service: 'Corte cabelo',
        customer: 'João Pereira · Kika',
        source: 'Instagram',
    },
    {
        time: '11:00',
        service: 'Limpeza de pele',
        customer: 'Maria Silva · Ana',
        source: 'Google',
    },
    {
        time: '15:00',
        service: 'Barba + corte',
        customer: 'Pedro Costa · Tomás',
        source: 'WhatsApp',
    },
]
</script>

<style scoped>
.dashboard-page {
    padding: 56px 0 88px;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: end;
    margin-bottom: 28px;
}

.dashboard-header h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.92;
    letter-spacing: -0.07em;
}

.dashboard-header p:last-child {
    margin: 16px 0 0;
    color: var(--tf-muted);
    font-size: 18px;
}

.stats-grid {
    display: grid;
    grid-template-columns: 0.8fr 0.8fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
}

.stat-card {
    padding: 24px;
    border-radius: 28px;
    background: var(--tf-white);
    border: 1px solid var(--tf-border);
}

.stat-card.dark {
    background: var(--tf-black);
    color: var(--tf-white);
}

.stat-card span {
    display: block;
    margin-bottom: 12px;
    color: var(--tf-muted);
    font-weight: 800;
}

.stat-card.dark span {
    color: #c8c8c8;
}

.stat-card strong {
    display: block;
    font-size: clamp(32px, 4vw, 48px);
    letter-spacing: -0.06em;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1.35fr 0.65fr;
    gap: 16px;
}

.agenda-card,
.source-card {
    padding: 28px;
}

.card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
}

.card-title-row h2,
.source-card h2 {
    margin: 0;
    font-size: 28px;
    letter-spacing: -0.04em;
}

.card-title-row span {
    color: var(--tf-muted);
    font-size: 14px;
    font-weight: 800;
}

.appointment-list {
    display: grid;
    gap: 12px;
}

.appointment-item {
    display: grid;
    grid-template-columns: 86px 1fr auto;
    gap: 18px;
    align-items: center;
    padding: 18px;
    border-radius: 22px;
    background: var(--tf-bg);
}

.time {
    font-weight: 950;
    font-size: 20px;
    letter-spacing: -0.04em;
}

.appointment-item strong {
    display: block;
}

.appointment-item span {
    display: block;
    margin-top: 4px;
    color: var(--tf-muted);
}

.appointment-item small {
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-white);
    font-weight: 800;
}

.source-card {
    background: var(--tf-accent);
}

.source-card .tf-eyebrow {
    color: rgba(11, 11, 15, 0.55);
}

.source-list {
    display: grid;
    gap: 12px;
    margin-top: 24px;
}

.source-list div {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.55);
    font-weight: 900;
}

@media (max-width: 920px) {

    .dashboard-header,
    .stats-grid,
    .dashboard-grid,
    .appointment-item {
        grid-template-columns: 1fr;
    }

    .dashboard-header {
        align-items: start;
        flex-direction: column;
    }
}
</style>