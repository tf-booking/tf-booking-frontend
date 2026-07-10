
export default defineNuxtRouteMiddleware(() => {
    if (import.meta.server) {
        return
    }

    const { loadTokens, isAuthenticated } = useAuth()

    loadTokens()

    if (!isAuthenticated.value) {
        return navigateTo('/login')
    }
})