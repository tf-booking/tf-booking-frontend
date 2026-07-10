<template>
    <header class="app-header">
        <NuxtLink to="/" class="brand">
            klenda<span class="brand-dot">.</span>
        </NuxtLink>

        <nav class="nav">
            <NuxtLink to="/booking/demo">Página pública</NuxtLink>
            <NuxtLink to="/dashboard">Dashboard</NuxtLink>
            <NuxtLink to="/login" class="login-link">Entrar</NuxtLink>
        </nav>
    </header>
</template>

<style scoped>
.app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    background: var(--tf-black);
    border-bottom: 1px solid #1c1c22;
}

.brand {
    display: inline-flex;
    align-items: baseline;
    font-size: 28px;
    font-weight: 950;
    letter-spacing: -0.04em;
    color: var(--tf-white);
}

.brand-dot {
    color: var(--tf-accent);
}

.nav {
    display: flex;
    align-items: center;
    gap: 24px;
    font-size: 14px;
    font-weight: 850;
    color: #b7b3aa;
}

.nav a.router-link-active {
    color: var(--tf-white);
}

.login-link {
    padding: 10px 16px;
    border: 1px solid var(--tf-accent);
    border-radius: 999px;
    color: var(--tf-white);
}

@media (max-width: 760px) {
    .app-header {
        padding: 0 16px;
    }

    .nav {
        gap: 12px;
        font-size: 12px;
    }

    .nav a:first-child {
        display: none;
    }
}
</style>