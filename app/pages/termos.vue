<template>
    <div class="page legal-page">
        <section class="section">
            <div class="container legal-container">
                <p class="tf-eyebrow">Legal</p>
                <h1 class="tf-title legal-title">Termos de Serviço</h1>
                <p class="legal-updated">Última atualização: 11 de julho de 2026</p>

                <p>
                    Estes termos regulam o uso da Klenda, o serviço de marcações online
                    disponível em <strong>myklenda.com</strong>. Ao criar uma conta, aceitas
                    estes termos.
                </p>

                <h2>1. O serviço</h2>
                <p>
                    A Klenda disponibiliza uma agenda online, página de marcação pública e
                    gestão de clientes e equipa para negócios como barbearias e salões. Existe um
                    plano Grátis e um plano Pro, pago por subscrição.
                </p>

                <h2>2. Conta e responsabilidades</h2>
                <ul>
                    <li>És responsável por manteres os dados da tua conta corretos e a tua palavra-passe em segurança.</li>
                    <li>És responsável pelos dados de clientes que introduzes na plataforma, incluindo garantir que tens uma base legal para os tratar.</li>
                    <li>Não podes usar a Klenda para atividades ilegais ou para enviar spam.</li>
                </ul>

                <h2>3. Planos e pagamento</h2>
                <ul>
                    <li>O plano <strong>Grátis</strong> não tem custo e inclui 1 profissional.</li>
                    <li>
                        O plano <strong>Pro</strong> é uma subscrição recorrente (mensal ou anual)
                        que se renova automaticamente até seres tu a cancelar. Inclui até 3
                        colaboradores; cada colaborador adicional acresce um valor fixo à
                        subscrição, cobrado de forma proporcional assim que o adicionas.
                    </li>
                    <li>Os preços apresentados não incluem IVA, que é acrescentado no checkout.</li>
                    <li>Podes cancelar a subscrição a qualquer momento na tua Conta — o acesso Pro mantém-se até ao fim do período já pago.</li>
                </ul>

                <h2>4. Cancelamento e reembolsos</h2>
                <p>
                    Não fazemos reembolsos de períodos já iniciados, salvo obrigação legal em
                    contrário. Após o cancelamento ou falha de pagamento, a conta volta
                    automaticamente ao plano Grátis no fim do período pago.
                </p>

                <h2>5. Disponibilidade do serviço</h2>
                <p>
                    Esforçamo-nos para manter a Klenda disponível, mas não garantimos
                    funcionamento ininterrupto. Podemos fazer manutenções pontuais que causem
                    indisponibilidade temporária.
                </p>

                <h2>6. Propriedade intelectual</h2>
                <p>
                    A marca Klenda, o design e o código da aplicação pertencem-nos. Os dados que
                    introduzes (informação do teu negócio, clientes, marcações) continuam a ser
                    teus.
                </p>

                <h2>7. Limitação de responsabilidade</h2>
                <p>
                    A Klenda é fornecida "tal como está". Na medida permitida por lei, não somos
                    responsáveis por perdas indiretas resultantes do uso ou impossibilidade de
                    uso do serviço.
                </p>

                <h2>8. Alterações a estes termos</h2>
                <p>
                    Podemos atualizar estes termos ocasionalmente. Alterações relevantes serão
                    comunicadas por email ou através da aplicação.
                </p>

                <h2>9. Lei aplicável</h2>
                <p>Estes termos regem-se pela lei portuguesa.</p>

                <h2>10. Contacto</h2>
                <p>
                    Dúvidas sobre estes termos: <a href="mailto:geral@myklenda.com">geral@myklenda.com</a>
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
useHead({
    title: 'Termos de Serviço · Klenda',
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
