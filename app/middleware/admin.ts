export default defineNuxtRouteMiddleware(async () => {
    if (import.meta.server) {
        return
    }

    const { loadTokens, isAuthenticated } = useAuth()
    const { apiFetch } = useApi()

    loadTokens()

    if (!isAuthenticated.value) {
        return navigateTo('/login')
    }

    try {
        const me = await apiFetch<{
            is_superuser: boolean
            is_staff: boolean
        }>('/me/')

        if (!me.is_superuser && !me.is_staff) {
            return navigateTo('/dashboard')
        }
    } catch (error) {
        console.error('Erro no middleware admin:', error)
        return navigateTo('/login')
    }
})