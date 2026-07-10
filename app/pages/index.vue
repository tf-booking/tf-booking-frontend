<template>
    <div class="page home-page">
        <section class="hero section">
            <div class="container hero-grid">
                <div class="hero-copy">
                    <p class="tf-eyebrow">TF Creative · Klenda</p>

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
                    <div class="floating-word word-one">creative</div>
                    <div class="floating-word word-two">klenda</div>

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

        <section class="section pricing-section">
            <div class="container">
                <p class="tf-eyebrow">Planos</p>

                <div class="section-heading">
                    <h2>Escolhe o plano do teu negócio.</h2>

                    <p>
                        Sem fidelização, cancela quando quiseres. Começa grátis e passa a Pro
                        quando precisares de mais colaboradores e de um perfil à tua imagem.
                    </p>
                </div>

                <div class="pricing-grid">
                    <article class="card pricing-card">
                        <p class="pricing-tier">Grátis</p>

                        <div class="pricing-price">
                            <span class="pricing-amount">0€</span>
                        </div>

                        <p class="pricing-detail">para sempre, 1 profissional</p>

                        <ul class="pricing-features">
                            <li>Página de marcação online</li>
                            <li>Agenda e calendário</li>
                            <li>Notificações por email</li>
                            <li class="pricing-feature-off">Personalização do perfil</li>
                            <li class="pricing-feature-off">Estatísticas do negócio</li>
                            <li class="pricing-feature-off">Notificações SMS</li>
                        </ul>

                        <NuxtLink to="/dashboard" class="btn btn-secondary pricing-cta">
                            Começar grátis
                        </NuxtLink>
                    </article>

                    <article class="card pricing-card pricing-card-pro">
                        <span class="pricing-badge">Mais popular</span>

                        <p class="pricing-tier pricing-tier-accent">Pro</p>

                        <div class="pricing-price">
                            <span class="pricing-amount">19,90€</span>
                            <span class="pricing-period">/mês</span>
                        </div>

                        <p class="pricing-detail">até 3 colaboradores incluídos</p>

                        <ul class="pricing-features">
                            <li>Tudo do Grátis</li>
                            <li>Perfil 100% personalizável</li>
                            <li>Estatísticas do negócio</li>
                            <li>Integração Google Calendar</li>
                            <li>100 SMS de lembrete incluídos/mês</li>
                            <li>Colaborador extra: +3,99€/mês</li>
                        </ul>

                        <NuxtLink to="/dashboard" class="btn btn-accent pricing-cta">
                            Testar 14 dias grátis
                        </NuxtLink>
                    </article>
                </div>

                <p class="pricing-footnote">
                    Colaborador extra: 3,99€/mês por colaborador além dos 3 incluídos.
                    SMS extra além dos incluídos no Pro: 0,04€/SMS.
                </p>
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

.pricing-section {
    padding-bottom: 96px;
}

.pricing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
    align-items: start;
}

.pricing-card {
    position: relative;
    padding: 32px;
}

.pricing-card-pro {
    background: var(--tf-black);
    color: var(--tf-white);
    border-color: rgba(255, 255, 255, 0.12);
}

.pricing-badge {
    position: absolute;
    top: -14px;
    left: 32px;
    padding: 6px 14px;
    border-radius: 999px;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.pricing-tier {
    margin: 0 0 18px;
    font-family: var(--tf-mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.pricing-tier-accent {
    color: var(--tf-accent);
}

.pricing-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.pricing-amount {
    font-size: 46px;
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 1;
}

.pricing-period {
    color: var(--tf-muted);
    font-size: 15px;
    font-weight: 700;
}

.pricing-card-pro .pricing-period {
    color: #b7b3aa;
}

.pricing-detail {
    margin: 12px 0 0;
    color: var(--tf-muted);
    font-size: 14px;
}

.pricing-card-pro .pricing-detail {
    color: #b7b3aa;
}

.pricing-features {
    display: grid;
    gap: 14px;
    margin: 28px 0 0;
    padding: 24px 0 0;
    border-top: 1px solid var(--tf-border);
    list-style: none;
}

.pricing-card-pro .pricing-features {
    border-top-color: rgba(255, 255, 255, 0.12);
}

.pricing-features li {
    padding-left: 26px;
    position: relative;
    font-size: 15px;
    font-weight: 600;
}

.pricing-features li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--tf-accent);
    font-weight: 900;
}

.pricing-feature-off {
    color: var(--tf-muted);
}

.pricing-feature-off::before {
    content: "–" !important;
    color: var(--tf-muted) !important;
}

.pricing-cta {
    width: 100%;
    margin-top: 28px;
}

.pricing-footnote {
    margin: 20px 0 0;
    color: var(--tf-muted);
    font-size: 13px;
    text-align: center;
}

@media (max-width: 900px) {

    .hero-grid,
    .section-heading,
    .feature-grid,
    .pricing-grid {
        grid-template-columns: 1fr;
    }

    .hero-panel {
        min-height: 380px;
    }
}
</style>