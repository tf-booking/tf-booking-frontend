
export default defineNuxtRouteMiddleware(() => {
    const { loadTokens, isAuthenticated } = useAuth()

    loadTokens()

    if (!isAuthenticated.value) {
        return navigateTo('/login')
    }
})