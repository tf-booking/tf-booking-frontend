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
            first_service_business: { business_uuid: string; business_name: string } | null
        }>('/me/')

        if (me.is_superuser || me.is_staff) {
            return
        }

        if (me.first_service_business) {
            return navigateTo('/criar-servico')
        }
    } catch (error) {
        console.error('Erro no middleware first-service:', error)
        return navigateTo('/login')
    }
})
