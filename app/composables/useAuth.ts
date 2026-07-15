type LoginResponse = {
    access: string
    refresh: string
}

type LoginPayload = {
    username: string
    password: string
}

type NavigateAfterLoginResponse = {
    is_superuser: boolean
    is_staff: boolean
    businesses: { role: string; is_active: boolean }[]
    pending_invite: { business_name: string; invite_url: string } | null
    first_service_business: { business_uuid: string; business_name: string } | null
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
        useCurrentBusiness().clearCurrentBusiness()
        await navigateTo('/login')
    }

    const isAuthenticated = computed(() => {
        return Boolean(accessToken.value)
    })

    /**
     * Decide para onde enviar quem acabou de se autenticar (login, signup,
     * ou aceitar um convite/criar negócio) - centralizado aqui porque tem de
     * dar sempre o mesmo resultado nos vários pontos de entrada (login.vue,
     * signup.vue, criar-negocio.vue).
     */
    const navigateAfterLogin = async () => {
        const me = await apiFetch<NavigateAfterLoginResponse>('/me/')

        if (me.is_superuser || me.is_staff) {
            await navigateTo('/admin')
            return
        }

        if (me.businesses.length === 0) {
            // Conta sem nenhum negócio ativo (tipicamente primeiro login com uma
            // conta Google nova). Se houver um convite de equipa por aceitar,
            // segue para lá em vez de forçar a criação de um negócio novo.
            await navigateTo(me.pending_invite ? me.pending_invite.invite_url : '/criar-negocio')
            return
        }

        if (me.first_service_business) {
            // O negócio ainda não tem nenhum serviço - obriga a criar o
            // primeiro antes de continuar, senão a página pública de
            // marcações fica sem nada para marcar (ver /criar-servico).
            await navigateTo('/criar-servico')
            return
        }

        const hasOwnerOrManagerMembership = me.businesses.some(
            (business) => business.is_active && (business.role === 'owner' || business.role === 'manager')
        )

        await navigateTo(hasOwnerOrManagerMembership ? '/dashboard' : '/schedule')
    }

    return {
        accessToken,
        refreshToken,
        isAuthenticated,
        loadTokens,
        setTokens,
        login,
        logout,
        clearTokens,
        navigateAfterLogin,
    }
}