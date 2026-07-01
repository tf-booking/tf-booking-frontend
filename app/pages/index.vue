<template>
    <div class="page home-page">
        <section class="hero section">
            <div class="container hero-grid">
                <div class="hero-copy">
                    <p class="tf-eyebrow">TF Creative · Booking System</p>

                    <h1 class="tf-title">
                        Marcações online com presença de marca.
                    </h1>

                    <p class="tf-subtitle">
                        Uma plataforma de agenda criada para negócios que querem transformar
                        Instagram, WhatsApp e Google em marcações reais.
                    </p>

                    <div class="hero-actions">
                        <NuxtLink to="/dashboard" class="btn btn-accent">
                            Entrar no dashboard
                        </NuxtLink>

                        <NuxtLink to="/booking/demo" class="btn btn-secondary">
                            Ver página pública
                        </NuxtLink>
                    </div>
                </div>

                <div class="hero-panel">
                    <div class="floating-word word-one">TF creative</div>
                    <div class="floating-word word-two">booking</div>

                    <article class="card booking-card">
                        <div class="card-header">
                            <span>Próxima marcação</span>
                            <strong>15:00</strong>
                        </div>

                        <div class="service-box">
                            <p>Limpeza de pele</p>
                            <span>Maria Silva · Instagram</span>
                        </div>

                        <div class="mini-grid">
                            <div>
                                <strong>42</strong>
                                <span>Marcações</span>
                            </div>

                            <div>
                                <strong>18</strong>
                                <span>via Instagram</span>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <section class="section services-section">
            <div class="container">
                <p class="tf-eyebrow">Mais que uma agenda</p>

                <div class="section-heading">
                    <h2>
                        Pensado para negócios que precisam de presença digital e conversão.
                    </h2>

                    <p>
                        A TF Creative trabalha comunicação digital, desenvolvimento web e
                        marketing estratégico. Esta app deve seguir essa lógica: não é só
                        marcar horas, é transformar atenção em clientes.
                    </p>
                </div>

                <div class="feature-grid">
                    <article class="feature-card">
                        <span>01</span>
                        <h3>Página pública premium</h3>
                        <p>
                            Um link bonito para colocar na bio, anúncios, Google ou WhatsApp.
                        </p>
                    </article>

                    <article class="feature-card">
                        <span>02</span>
                        <h3>Agenda sem conflitos</h3>
                        <p>
                            Horários livres, colaboradores, serviços e bloqueios sem marcações sobrepostas.
                        </p>
                    </article>

                    <article class="feature-card">
                        <span>03</span>
                        <h3>Marketing-first</h3>
                        <p>
                            Guarda a origem da marcação para perceber o que vem de Instagram,
                            anúncios, Google ou WhatsApp.
                        </p>
                    </article>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.hero {
    min-height: calc(100vh - 76px);
    display: flex;
    align-items: center;
}

.hero-grid {
    display: grid;
    grid-template-columns: 1.12fr 0.88fr;
    gap: 64px;
    align-items: center;
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 34px;
}

.hero-panel {
    position: relative;
    min-height: 520px;
    display: grid;
    place-items: center;
}

.booking-card {
    position: relative;
    z-index: 2;
    width: min(420px, 100%);
    padding: 28px;
    background: var(--tf-black);
    color: var(--tf-white);
    border-color: rgba(255, 255, 255, 0.12);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #d8d8d8;
    margin-bottom: 22px;
}

.card-header strong {
    color: var(--tf-accent);
    font-size: 28px;
}

.service-box {
    padding: 22px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.08);
}

.service-box p {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 950;
    letter-spacing: -0.04em;
}

.service-box span {
    color: #c8c8c8;
}

.mini-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 16px;
}

.mini-grid div {
    padding: 18px;
    border-radius: 20px;
    background: var(--tf-accent);
    color: var(--tf-black);
}

.mini-grid strong {
    display: block;
    font-size: 34px;
    line-height: 1;
}

.mini-grid span {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    font-weight: 800;
}

.floating-word {
    position: absolute;
    z-index: 1;
    font-size: clamp(64px, 8vw, 120px);
    font-weight: 950;
    letter-spacing: -0.08em;
    color: rgba(11, 11, 15, 0.06);
    user-select: none;
}

.word-one {
    top: 10px;
    right: 0;
}

.word-two {
    bottom: 24px;
    left: 0;
}

.services-section {
    background: var(--tf-black);
    color: var(--tf-white);
}

.services-section .tf-eyebrow {
    color: var(--tf-accent);
}

.section-heading {
    display: grid;
    grid-template-columns: 1fr 0.7fr;
    gap: 44px;
    align-items: end;
    margin-bottom: 34px;
}

.section-heading h2 {
    margin: 0;
    font-size: clamp(34px, 5vw, 66px);
    line-height: 0.98;
    letter-spacing: -0.065em;
}

.section-heading p {
    margin: 0;
    color: #c8c8c8;
    font-size: 17px;
    line-height: 1.6;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

.feature-card {
    padding: 28px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.04);
}

.feature-card span {
    color: var(--tf-accent);
    font-weight: 950;
}

.feature-card h3 {
    margin: 28px 0 12px;
    font-size: 26px;
    letter-spacing: -0.04em;
}

.feature-card p {
    margin: 0;
    color: #c8c8c8;
    line-height: 1.55;
}

@media (max-width: 900px) {

    .hero-grid,
    .section-heading,
    .feature-grid {
        grid-template-columns: 1fr;
    }

    .hero-panel {
        min-height: 380px;
    }
}
</style>