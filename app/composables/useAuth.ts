type LoginResponse = {
    access: string
    refresh: string
}

type LoginPayload = {
    username: string
    password: string
}

export const useAuth = () => {
    const { apiFetch } = useApi()

    const accessToken = useState<string | null>('accessToken', () => null)
    const refreshToken = useState<string | null>('refreshToken', () => null)

    const loadTokens = () => {
        if (!import.meta.client) {
            return
        }

        accessToken.value = localStorage.getItem('tf_booking_access_token')
        refreshToken.value = localStorage.getItem('tf_booking_refresh_token')
    }

    const setTokens = (tokens: LoginResponse) => {
        accessToken.value = tokens.access
        refreshToken.value = tokens.refresh

        if (import.meta.client) {
            localStorage.setItem('tf_booking_access_token', tokens.access)
            localStorage.setItem('tf_booking_refresh_token', tokens.refresh)
        }
    }

    const clearTokens = () => {
        accessToken.value = null
        refreshToken.value = null

        if (import.meta.client) {
            localStorage.removeItem('tf_booking_access_token')
            localStorage.removeItem('tf_booking_refresh_token')
        }
    }

    const login = async (payload: LoginPayload) => {
        const response = await apiFetch<LoginResponse>('/auth/token/', {
            method: 'POST',
            body: payload,
            auth: false,
        })

        setTokens(response)

        return response
    }

    const logout = async () => {
        clearTokens()
        await navigateTo('/login')
    }

    const isAuthenticated = computed(() => {
        return Boolean(accessToken.value)
    })

    return {
        accessToken,
        refreshToken,
        isAuthenticated,
        loadTokens,
        login,
        logout,
        clearTokens,
    }
}