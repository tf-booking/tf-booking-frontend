<template>
    <aside class="sidebar">
        <div class="s-topbar">
            <NuxtLink to="/dashboard" class="s-brand" @click="closeMobileMenu">
                <span class="s-mark">TF</span>
                Booking
            </NuxtLink>

            <button
                class="s-menu-toggle"
                type="button"
                :aria-expanded="isMobileMenuOpen"
                aria-label="Abrir menu"
                @click="toggleMobileMenu"
            >
                ...
            </button>
        </div>

        <div class="s-panel" :class="{ open: isMobileMenuOpen }">
            <div class="s-menu-label">Menu</div>

            <nav class="s-nav">
                <NuxtLink
                    v-for="item in items"
                    :key="item.to"
                    :to="item.to"
                    class="s-link"
                    :class="{ active: isActive(item.to) }"
                    @click="closeMobileMenu"
                >
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
                    <div class="s-user-name">Estudio Marta</div>
                    <div class="s-user-plan">Plano Pro</div>
                </div>

                <button class="s-logout" type="button" title="Sair" @click="handleLogout">
                    Sair
                </button>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { logout } = useAuth()

const isMobileMenuOpen = ref(false)

const items = [
    { label: 'Painel', to: '/dashboard' },
    { label: 'Agenda', to: '/schedule' },
    { label: 'Servicos', to: '/services' },
    { label: 'Equipa', to: '/staff' },
]

const comingSoon = ['Clientes', 'Marketing']

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleLogout = () => {
    closeMobileMenu()
    logout()
}

watch(
    () => route.path,
    () => {
        closeMobileMenu()
    }
)
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

.s-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.s-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 0 8px 26px;
    font-weight: 900;
    font-size: 17px;
    letter-spacing: 0;
}

.s-mark {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 12px;
}

.s-menu-toggle {
    display: none;
}

.s-panel {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
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
    min-height: 30px;
    flex-shrink: 0;
    border: 0;
    border-radius: 999px;
    background: #2a2a32;
    color: #b7b3aa;
    padding: 0 12px;
    font-family: var(--tf-sans);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.s-logout:hover {
    background: var(--tf-accent);
    color: var(--tf-black);
}

@media (max-width: 900px) {
    .sidebar {
        position: sticky;
        top: 0;
        z-index: 80;
        width: 100%;
        height: auto;
        min-height: 62px;
        padding: 10px 14px;
        overflow: visible;
    }

    .s-brand {
        padding: 0;
        font-size: 16px;
    }

    .s-menu-toggle {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border: 1px solid #2f2f37;
        border-radius: 50%;
        background: #17171d;
        color: var(--tf-accent);
        font-size: 17px;
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
    }

    .s-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 12px;
        left: 12px;
        display: none;
        max-height: calc(100svh - 84px);
        padding: 14px;
        border: 1px solid #24242b;
        border-radius: 20px;
        background: var(--tf-black);
        box-shadow: 0 24px 60px -28px rgba(0, 0, 0, 0.8);
        overflow-y: auto;
    }

    .s-panel.open {
        display: flex;
    }

    .s-menu-label {
        padding: 0 4px 12px;
    }

    .s-nav {
        gap: 7px;
    }

    .s-link {
        min-height: 46px;
        padding: 0 14px;
        font-size: 15px;
    }

    .s-user {
        margin-top: 14px;
    }
}
</style>
