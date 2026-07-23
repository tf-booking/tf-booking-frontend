export type NotificationItem = {
    id: number
    notification_type: string
    notification_type_label: string
    title: string
    message: string
    is_read: boolean
    created_at: string
    business_uuid: string
    business_name: string
    appointment_uuid: string | null
    appointment_start_at: string | null
    appointment_staff_member: number | null
}

type NotificationListResponse = {
    count: number
    next: string | null
    previous: string | null
    results: NotificationItem[]
}

let pollTimer: ReturnType<typeof setInterval> | undefined

export const useNotifications = () => {
    const { apiFetch, apiBase } = useApi()

    const notifications = useState<NotificationItem[]>('notifications-list', () => [])
    const unreadCount = useState<number>('notifications-unread-count', () => 0)
    const isLoading = useState('notifications-loading', () => false)
    const isLoadingMore = useState('notifications-loading-more', () => false)
    const nextPageUrl = useState<string | null>('notifications-next-page', () => null)

    const loadUnreadCount = async () => {
        try {
            const response = await apiFetch<{ count: number }>('/notifications/unread-count/', { silent: true })
            unreadCount.value = response.count
        } catch (error) {
            console.error('Erro ao carregar contagem de notificações:', error)
        }
    }

    const loadNotifications = async () => {
        try {
            isLoading.value = true

            const response = await apiFetch<NotificationListResponse>('/notifications/', { silent: true })
            notifications.value = response.results
            nextPageUrl.value = response.next
        } catch (error) {
            console.error('Erro ao carregar notificações:', error)
        } finally {
            isLoading.value = false
        }
    }

    const loadMore = async () => {
        if (!nextPageUrl.value || isLoadingMore.value) {
            return
        }

        try {
            isLoadingMore.value = true

            const relativeEndpoint = nextPageUrl.value.replace(apiBase, '')
            const response = await apiFetch<NotificationListResponse>(relativeEndpoint, { silent: true })
            notifications.value = [...notifications.value, ...response.results]
            nextPageUrl.value = response.next
        } catch (error) {
            console.error('Erro ao carregar mais notificações:', error)
        } finally {
            isLoadingMore.value = false
        }
    }

    const markAsRead = async (id: number) => {
        const target = notifications.value.find((notification) => notification.id === id)

        if (target && !target.is_read) {
            target.is_read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
        }

        try {
            await apiFetch(`/notifications/${id}/mark-read/`, { method: 'POST', silent: true })
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error)
        }
    }

    const markAllAsRead = async () => {
        notifications.value.forEach((notification) => {
            notification.is_read = true
        })
        unreadCount.value = 0

        try {
            await apiFetch('/notifications/mark-all-read/', { method: 'POST', silent: true })
        } catch (error) {
            console.error('Erro ao marcar todas as notificações como lidas:', error)
        }
    }

    const startPolling = () => {
        if (pollTimer) {
            return
        }

        loadUnreadCount()
        pollTimer = setInterval(loadUnreadCount, 30000)
    }

    const stopPolling = () => {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = undefined
        }
    }

    return {
        notifications,
        unreadCount,
        isLoading,
        isLoadingMore,
        nextPageUrl,
        loadNotifications,
        loadMore,
        loadUnreadCount,
        markAsRead,
        markAllAsRead,
        startPolling,
        stopPolling,
    }
}
