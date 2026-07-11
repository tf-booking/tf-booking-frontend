<template>
    <footer class="app-footer">
        <div class="container footer-inner">
            <NuxtLink to="/" class="footer-brand">
                klenda<span class="footer-brand-dot">.</span>
            </NuxtLink>

            <nav class="footer-links">
                <NuxtLink to="/privacidade">Política de Privacidade</NuxtLink>
                <NuxtLink to="/termos">Termos de Serviço</NuxtLink>
                <a href="mailto:geral@myklenda.com">geral@myklenda.com</a>
            </nav>

            <p class="footer-copy">© {{ currentYear }} Klenda</p>
        </div>
    </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
    border-top: 1px solid var(--tf-border);
    background: var(--tf-bg);
}

.footer-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 32px 0;
}

.footer-brand {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--tf-ink);
}

.footer-brand-dot {
    color: var(--tf-accent-strong);
}

.footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    font-size: 14px;
    font-weight: 700;
    color: var(--tf-muted);
}

.footer-links a {
    color: var(--tf-muted);
}

.footer-links a:hover {
    color: var(--tf-ink);
}

.footer-copy {
    margin: 0;
    color: var(--tf-muted);
    font-family: var(--tf-mono);
    font-size: 12px;
}

@media (max-width: 700px) {
    .footer-inner {
        justify-content: center;
        text-align: center;
    }
}
</style>
