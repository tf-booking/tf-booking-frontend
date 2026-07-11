<template>
    <div class="page legal-page">
        <section class="section">
            <div class="container legal-container">
                <p class="tf-eyebrow">Legal</p>
                <h1 class="tf-title legal-title">Política de Privacidade</h1>
                <p class="legal-updated">Última atualização: 11 de julho de 2026</p>

                <p>
                    Esta política explica que dados a Klenda recolhe, para que os usa, e quais
                    são os teus direitos sobre eles. Aplica-se a quem usa a Klenda para gerir o
                    seu negócio (donos, gestores, colaboradores) e a quem faz marcações através
                    da página pública de um negócio.
                </p>

                <h2>Quem somos</h2>
                <p>
                    A Klenda ("nós") é o serviço de marcações online disponível em
                    <strong>myklenda.com</strong>. Para questões sobre esta política ou sobre os
                    teus dados, contacta-nos em
                    <a href="mailto:geral@myklenda.com">geral@myklenda.com</a>.
                </p>

                <h2>Que dados recolhemos</h2>
                <ul>
                    <li>
                        <strong>Conta:</strong> nome, email, palavra-passe (encriptada) ou, se
                        entrares com o Google, o teu nome e email associados a essa conta.
                    </li>
                    <li>
                        <strong>Negócio:</strong> nome, morada, contactos, descrição, fotos e
                        serviços que um dono/gestor configura na sua página pública.
                    </li>
                    <li>
                        <strong>Marcações e clientes:</strong> nome, telefone e email de clientes
                        introduzidos por um negócio ou pelo próprio cliente ao marcar.
                    </li>
                    <li>
                        <strong>Pagamento:</strong> ao subscrever o plano Pro, os dados do cartão
                        são processados diretamente pela Stripe — a Klenda nunca vê nem guarda o
                        número do teu cartão.
                    </li>
                    <li>
                        <strong>Uso do serviço:</strong> registos técnicos básicos (data/hora de
                        acesso, tipo de erro) usados para diagnosticar problemas.
                    </li>
                </ul>

                <h2>Para que usamos os dados</h2>
                <ul>
                    <li>Disponibilizar o serviço: agenda, marcações, notificações por email.</li>
                    <li>Processar pagamentos e gerir a subscrição do plano Pro.</li>
                    <li>Responder a pedidos de suporte enviados por email.</li>
                    <li>Cumprir obrigações legais (ex.: faturação).</li>
                </ul>

                <h2>Com quem partilhamos dados</h2>
                <p>Não vendemos dados a ninguém. Partilhamos apenas com fornecedores que nos ajudam a operar o serviço:</p>
                <ul>
                    <li><strong>Stripe</strong> — processamento de pagamentos da subscrição Pro.</li>
                    <li><strong>Zoho Mail</strong> — envio dos emails transacionais (confirmações, convites, faturas).</li>
                    <li><strong>Google</strong> — se ligares a tua conta, para autenticação (Sign-In) e sincronização de marcações com o Google Calendar.</li>
                    <li><strong>Render e Vercel</strong> — alojamento da aplicação e da base de dados.</li>
                </ul>

                <h2>Quanto tempo guardamos os dados</h2>
                <p>
                    Guardamos os dados enquanto a conta estiver ativa. Se pedires o encerramento
                    da conta, apagamos os dados pessoais associados, exceto quando a lei nos
                    obrigar a conservar registos (ex.: faturas) por mais tempo.
                </p>

                <h2>Os teus direitos</h2>
                <p>Ao abrigo do RGPD, tens direito a:</p>
                <ul>
                    <li>Aceder aos dados que temos sobre ti.</li>
                    <li>Corrigir dados incorretos.</li>
                    <li>Pedir o apagamento dos teus dados.</li>
                    <li>Pedir uma cópia dos teus dados num formato portátil.</li>
                    <li>Opor-te a determinados usos dos teus dados.</li>
                </ul>
                <p>
                    Para exercer qualquer um destes direitos, escreve para
                    <a href="mailto:geral@myklenda.com">geral@myklenda.com</a>.
                </p>

                <h2>Cookies</h2>
                <p>
                    Usamos apenas cookies/armazenamento local essenciais ao funcionamento do
                    serviço (manter a tua sessão iniciada). Não usamos cookies de publicidade ou
                    de rastreio de terceiros.
                </p>

                <h2>Segurança</h2>
                <p>
                    Usamos ligações encriptadas (HTTPS) e palavras-passe encriptadas. Nenhum
                    sistema é 100% seguro, mas trabalhamos para proteger os teus dados com boas
                    práticas do setor.
                </p>

                <h2>Alterações a esta política</h2>
                <p>
                    Podemos atualizar esta política ocasionalmente. Alterações relevantes serão
                    comunicadas por email ou através da aplicação.
                </p>

                <h2>Contacto</h2>
                <p>
                    Dúvidas sobre privacidade: <a href="mailto:geral@myklenda.com">geral@myklenda.com</a>
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
useHead({
    title: 'Política de Privacidade · Klenda',
})
</script>

<style scoped>
.legal-page {
    background: var(--tf-canvas);
}

.legal-container {
    max-width: 760px;
}

.legal-title {
    font-size: clamp(34px, 5vw, 52px);
}

.legal-updated {
    margin: 16px 0 40px;
    color: var(--tf-muted);
    font-family: var(--tf-mono);
    font-size: 13px;
}

.legal-page :deep(h2) {
    margin: 40px 0 14px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.legal-page :deep(p) {
    margin: 0 0 16px;
    color: #3c3934;
    font-size: 16px;
    line-height: 1.7;
}

.legal-page :deep(ul) {
    margin: 0 0 16px;
    padding-left: 22px;
    color: #3c3934;
    font-size: 16px;
    line-height: 1.7;
}

.legal-page :deep(li) {
    margin-bottom: 8px;
}

.legal-page :deep(a) {
    color: var(--tf-black);
    font-weight: 700;
    text-decoration: underline;
}
</style>
