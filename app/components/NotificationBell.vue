<template>
    <div class="nb-root">
        <button
            ref="toggleRef"
            class="nb-toggle"
            type="button"
            aria-label="Notificações"
            :aria-expanded="isOpen"
            @click="toggleOpen"
        >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                    d="M5 8a5 5 0 0 1 10 0v3.5l1.4 2.1a.8.8 0 0 1-.66 1.24H4.26a.8.8 0 0 1-.66-1.24L5 11.5V8Z"
                    stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"
                />
                <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>

            <span v-if="unreadCount > 0" class="nb-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </button>

        <Teleport to="body">
            <Transition name="nb-fade">
                <div v-if="isOpen" class="nb-backdrop" @click.self="closePanel">
                    <Transition name="nb-slide">
                        <div v-if="isOpen" ref="panelRef" class="nb-panel" :style="panelStyle">
                            <div class="nb-panel-head">
                                <span class="nb-panel-title">Notificações</span>

                                <div class="nb-panel-actions">
                                    <button
                                        v-if="unreadCount > 0"
                                        type="button"
                                        class="nb-mark-all"
                                        @click="markAllAsRead"
                                    >
                                        marcar lidas
                                    </button>

                                    <button type="button" class="nb-close" aria-label="Fechar" @click="closePanel">×</button>
                                </div>
                            </div>

                            <p v-if="isLoading" class="nb-empty">A carregar...</p>

                            <p v-else-if="notifications.length === 0" class="nb-empty">
                                Sem notificações por agora.
                            </p>

                            <div v-else class="nb-list">
                                <button
                                    v-for="notification in notifications"
                                    :key="notification.id"
                                    type="button"
                                    class="nb-item"
                                    :class="`nb-item-${notification.notification_type}`"
                                    @click="handleNotificationClick(notification)"
                                >
                                    <span class="nb-item-top">
                                        <strong>{{ notification.title }}</strong>
                                        <span class="nb-item-time">{{ formatRelativeTime(notification.created_at) }}</span>
                                    </span>

                                    <span class="nb-item-message">{{ notification.message }}</span>
                                    <span class="nb-item-business">{{ notification.business_name }}</span>

                                    <span v-if="!notification.is_read" class="nb-item-dot"></span>
                                </button>
                            </div>

                            <button
                                v-if="nextPageUrl"
                                type="button"
                                class="nb-see-all"
                                :disabled="isLoadingMore"
                                @click="loadMore"
                            >
                                {{ isLoadingMore ? 'A carregar...' : 'VER TODAS' }}
                            </button>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { NotificationItem } from '~/composables/useNotifications'

const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    nextPageUrl,
    loadNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
} = useNotifications()

const router = useRouter()

const activeMobilePanel = useState<'notifications' | 'sidebar-menu' | null>('active-mobile-panel', () => null)
const isOpen = computed(() => activeMobilePanel.value === 'notifications')
const toggleRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const MOBILE_BREAKPOINT = 720
const PANEL_WIDTH = 360

const updatePanelPosition = () => {
    if (!toggleRef.value || window.innerWidth <= MOBILE_BREAKPOINT) {
        panelStyle.value = {}
        return
    }

    const rect = toggleRef.value.getBoundingClientRect()
    const left = Math.min(
        Math.max(12, rect.left),
        window.innerWidth - PANEL_WIDTH - 12
    )

    panelStyle.value = {
        top: `${rect.bottom + 10}px`,
        left: `${left}px`,
    }
}

const toggleOpen = () => {
    activeMobilePanel.value = isOpen.value ? null : 'notifications'

    if (isOpen.value) {
        loadNotifications()
        nextTick(updatePanelPosition)
    }
}

const closePanel = () => {
    if (activeMobilePanel.value === 'notifications') {
        activeMobilePanel.value = null
    }
}

const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id)

    if (!notification.appointment_uuid || !notification.appointment_start_at) {
        return
    }

    closePanel()

    const startDate = new Date(notification.appointment_start_at)
    const year = startDate.getFullYear()
    const month = String(startDate.getMonth() + 1).padStart(2, '0')
    const day = String(startDate.getDate()).padStart(2, '0')

    router.push({
        path: '/schedule',
        query: {
            date: `${year}-${month}-${day}`,
            appointment: notification.appointment_uuid,
            ...(notification.appointment_staff_member
                ? { staff: String(notification.appointment_staff_member) }
                : {}),
        },
    })
}

const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMinutes = Math.round(diffMs / 60000)

    if (diffMinutes < 1) {
        return 'agora mesmo'
    }

    if (diffMinutes < 60) {
        return `há ${diffMinutes} min`
    }

    const diffHours = Math.round(diffMinutes / 60)

    if (diffHours < 24) {
        return `há ${diffHours} h`
    }

    const diffDays = Math.round(diffHours / 24)
    return `há ${diffDays} d`
}

const handleResize = () => {
    if (isOpen.value) {
        updatePanelPosition()
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.nb-root {
    position: relative;
}

.nb-toggle {
    position: relative;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 1px solid #2f2f37;
    border-radius: 50%;
    background: #17171d;
    color: var(--tf-accent);
    cursor: pointer;
}

.nb-toggle svg {
    width: 19px;
    height: 19px;
}

.nb-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    display: grid;
    place-items: center;
    min-width: 17px;
    height: 17px;
    padding: 0 3px;
    border-radius: 999px;
    background: #ff5c35;
    color: #fff;
    font-family: var(--tf-mono);
    font-size: 9px;
    font-weight: 800;
}

.nb-backdrop {
    position: fixed;
    inset: 0;
    z-index: 250;
    background: transparent;
}

.nb-fade-enter-active,
.nb-fade-leave-active {
    transition: background 0.2s ease;
}

.nb-fade-enter-from,
.nb-fade-leave-to {
    background: transparent !important;
}

.nb-slide-enter-active,
.nb-slide-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.nb-slide-enter-from,
.nb-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.nb-panel {
    position: fixed;
    top: 66px;
    right: 24px;
    display: flex;
    flex-direction: column;
    width: min(360px, 90vw);
    max-height: min(480px, 70vh);
    overflow: hidden;
    border: 1px solid var(--tf-border);
    border-radius: 18px;
    background: var(--tf-white);
    box-shadow: 0 30px 70px -30px rgba(11, 11, 15, 0.5);
}

.nb-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--tf-border);
    background: var(--tf-white);
}

.nb-panel-title {
    color: var(--tf-ink);
    font-weight: 900;
    font-size: 15px;
}

.nb-panel-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.nb-mark-all {
    border: 0;
    background: transparent;
    color: var(--tf-muted);
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
}

.nb-mark-all:hover {
    color: var(--tf-black);
}

.nb-close {
    display: none;
    width: 30px;
    height: 30px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

.nb-empty {
    margin: 0;
    padding: 24px 18px;
    color: var(--tf-muted);
    font-size: 13px;
    font-weight: 700;
    text-align: center;
}

.nb-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    padding: 8px;
}

.nb-item {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 14px 12px 16px;
    border: 0;
    border-left: 4px solid var(--tf-black);
    border-radius: 10px;
    background: #fbfbf6;
    text-align: left;
    cursor: pointer;
}

.nb-item-appointment_created {
    border-left-color: var(--tf-accent-strong);
}

.nb-item-appointment_cancelled {
    border-left-color: #ff5c35;
    background: #fff4f0;
}

.nb-item-appointment_status_changed,
.nb-item-appointment_rescheduled {
    border-left-color: var(--tf-black);
}

.nb-item-recurrence_ending {
    border-left-color: #f5a623;
    background: #fff9ef;
}

.nb-item-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
}

.nb-item-top strong {
    font-size: 13px;
    color: var(--tf-ink);
}

.nb-item-time {
    flex-shrink: 0;
    font-family: var(--tf-mono);
    font-size: 10px;
    color: var(--tf-muted);
}

.nb-item-message {
    color: var(--tf-muted);
    font-size: 12px;
    line-height: 1.4;
}

.nb-item-business {
    display: none;
    font-family: var(--tf-mono);
    font-size: 10px;
    color: var(--tf-muted);
}

.nb-item-dot {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff5c35;
}

.nb-see-all {
    flex-shrink: 0;
    padding: 12px;
    border: 0;
    border-top: 1px solid var(--tf-border);
    background: var(--tf-white);
    color: var(--tf-black);
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-align: center;
    cursor: pointer;
}

.nb-see-all:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 720px) {
    .nb-backdrop {
        top: 62px;
        right: 0;
        bottom: 0;
        left: 0;
        background: rgba(11, 11, 15, 0.45);
    }

    .nb-panel {
        top: 62px;
        right: 0;
        bottom: 0;
        left: auto;
        width: min(88vw, 380px);
        max-height: none;
        border: 0;
        border-left: 1px solid var(--tf-border);
        border-radius: 0;
        box-shadow: -24px 0 50px -30px rgba(11, 11, 15, 0.5);
    }

    .nb-slide-enter-from,
    .nb-slide-leave-to {
        opacity: 1;
        transform: translateX(100%);
    }

    .nb-panel-head {
        padding: 18px 18px 14px;
    }

    .nb-panel-title {
        font-size: 19px;
        letter-spacing: -0.02em;
    }

    .nb-close {
        display: grid;
        place-items: center;
    }

    .nb-list {
        padding: 12px;
        gap: 10px;
    }

    .nb-item {
        padding: 14px 16px 14px 18px;
        border-radius: 14px;
    }

    .nb-item-business {
        display: block;
    }
}
</style>
