<template>
    <aside class="sidebar">
        <NuxtLink to="/dashboard" class="s-brand">
            <span class="s-mark">TF</span>
            Booking
        </NuxtLink>

        <div class="s-menu-label">Menu</div>

        <nav class="s-nav">
            <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="s-link"
                :class="{ active: isActive(item.to) }">
                <span class="s-dot"></span>
                {{ item.label }}
            </NuxtLink>

            <span v-for="soon in comingSoon" :key="soon" class="s-link s-link-soon" :title="`${soon} · em breve`">
                <span class="s-dot"></span>
                {{ soon }}
            </span>
        </nav>

        <div class="s-user">
            <span class="s-avatar">M</span>

            <div class="s-user-info">
                <div class="s-user-name">Estúdio Marta</div>
                <div class="s-user-plan">Plano Pro</div>
            </div>

            <button class="s-logout" type="button" title="Sair" @click="handleLogout">⎋</button>
        </div>
    </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

const items = [
    { label: 'Painel', to: '/dashboard' },
    { label: 'Agenda', to: '/schedule' },
    { label: 'Serviços', to: '/services' },
    { label: 'Equipa', to: '/staff' },
]

const comingSoon = ['Clientes', 'Marketing']

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

const handleLogout = () => {
    logout()
}
</script>

<style scoped>
.sidebar {
    position: sticky;
    top: 0;
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    width: 236px;
    height: 100vh;
    padding: 28px 18px;
    background: var(--tf-black);
    color: #fff;
    overflow-y: auto;
}

.s-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 26px;
    font-weight: 900;
    font-size: 17px;
    letter-spacing: -0.03em;
}

.s-mark {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 12px;
}

.s-menu-label {
    padding: 0 8px 12px;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #615d55;
}

.s-nav {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.s-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    color: #b7b3aa;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.s-link:hover {
    color: #fff;
    background: #17171d;
}

.s-dot {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: #3a382f;
    transition: background 0.15s ease;
}

.s-link.active {
    background: var(--tf-accent);
    color: var(--tf-black);
    font-weight: 700;
}

.s-link.active .s-dot {
    background: var(--tf-black);
}

.s-link-soon {
    opacity: 0.55;
    cursor: default;
}

.s-link-soon:hover {
    background: transparent;
    color: #b7b3aa;
}

.s-user {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-top: auto;
    padding: 14px;
    border-radius: 16px;
    background: #17171d;
}

.s-avatar {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #2a2a32;
    color: var(--tf-accent);
    font-weight: 800;
    font-size: 14px;
}

.s-user-info {
    line-height: 1.3;
    min-width: 0;
}

.s-user-name {
    font-weight: 700;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.s-user-plan {
    font-family: var(--tf-mono);
    font-size: 10px;
    color: #77736a;
}

.s-logout {
    margin-left: auto;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border: 0;
    border-radius: 9px;
    background: #2a2a32;
    color: #b7b3aa;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.s-logout:hover {
    background: var(--tf-accent);
    color: var(--tf-black);
}

/* ---- mobile: collapse to a top bar ---- */
@media (max-width: 900px) {
    .sidebar {
        position: sticky;
        top: 0;
        z-index: 50;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        width: 100%;
        height: auto;
        padding: 12px 16px;
    }

    .s-brand {
        padding: 0;
    }

    .s-menu-label {
        display: none;
    }

    .s-nav {
        flex: 1;
        flex-direction: row;
        gap: 6px;
        overflow-x: auto;
    }

    .s-link {
        padding: 8px 12px;
        white-space: nowrap;
    }

    .s-link .s-dot {
        display: none;
    }

    .s-link-soon {
        display: none;
    }

    .s-user {
        margin-top: 0;
        padding: 8px;
        background: transparent;
    }

    .s-user-info {
        display: none;
    }
}
</style>
