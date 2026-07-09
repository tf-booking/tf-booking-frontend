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
            businesses: { role: string; is_active: boolean }[]
        }>('/me/')

        if (me.is_superuser || me.is_staff) {
            return
        }

        const hasOwnerMembership = me.businesses.some(
            (business) => business.is_active && business.role === 'owner'
        )

        if (!hasOwnerMembership) {
            return navigateTo('/dashboard')
        }
    } catch (error) {
        console.error('Erro no middleware owner-only:', error)
        return navigateTo('/login')
    }
})
