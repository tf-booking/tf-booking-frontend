export type BusinessMembership = {
    id: number
    business_uuid: string
    business_name: string
    business_slug: string
    business_plan: string
    role: string
    is_active: boolean
    created_at: string
}

type MeResponse = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    has_usable_password: boolean
    businesses: BusinessMembership[]
}

export const useCurrentBusiness = () => {
    const { apiFetch } = useApi()

    const currentUser = useState<MeResponse | null>('current-user', () => null)
    const businesses = useState<BusinessMembership[]>('current-businesses', () => [])
    const currentBusiness = useState<BusinessMembership | null>('current-business', () => null)
    const isLoadingCurrentBusiness = useState('current-business-loading', () => false)
    const currentBusinessError = useState('current-business-error', () => '')

    const setCurrentBusiness = (business: BusinessMembership | null) => {
        currentBusiness.value = business
    }

    const loadCurrentBusiness = async (options: { force?: boolean } = {}) => {
        if (currentBusiness.value && !options.force) {
            return currentBusiness.value
        }

        if (isLoadingCurrentBusiness.value) {
            await new Promise<void>((resolve) => {
                const stop = watch(isLoadingCurrentBusiness, (isLoading) => {
                    if (!isLoading) {
                        stop()
                        resolve()
                    }
                })
            })

            return currentBusiness.value
        }

        try {
            isLoadingCurrentBusiness.value = true
            currentBusinessError.value = ''

            const response = await apiFetch<MeResponse>('/me/')
            const currentUuid = currentBusiness.value?.business_uuid

            currentUser.value = response
            businesses.value = response.businesses
            currentBusiness.value = (
                response.businesses.find((business) => business.business_uuid === currentUuid)
                || response.businesses[0]
                || null
            )

            return currentBusiness.value
        } catch (error) {
            console.error('Erro ao carregar negócio atual:', error)
            currentBusinessError.value = 'Não foi possível carregar o negócio atual.'
            currentBusiness.value = null
            businesses.value = []
            return null
        } finally {
            isLoadingCurrentBusiness.value = false
        }
    }

    const clearCurrentBusiness = () => {
        currentUser.value = null
        businesses.value = []
        currentBusiness.value = null
        currentBusinessError.value = ''
    }

    return {
        currentUser,
        businesses,
        currentBusiness,
        isLoadingCurrentBusiness,
        currentBusinessError,
        setCurrentBusiness,
        loadCurrentBusiness,
        clearCurrentBusiness,
    }
}
