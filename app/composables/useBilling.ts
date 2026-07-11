export const useBilling = () => {
    const { apiFetch } = useApi()
    const { currentBusiness } = useCurrentBusiness()

    const isRedirecting = useState('billing-is-redirecting', () => false)
    const billingError = useState('billing-error', () => '')

    const redirectToUrl = (url: string) => {
        if (import.meta.client) {
            window.location.href = url
        }
    }

    const startCheckout = async (interval: 'month' | 'year' = 'month') => {
        const businessUuid = currentBusiness.value?.business_uuid

        if (!businessUuid) {
            billingError.value = 'Não foi possível identificar o teu negócio.'
            return
        }

        billingError.value = ''
        isRedirecting.value = true

        try {
            const response = await apiFetch<{ url: string }>(
                `/businesses/${businessUuid}/billing/checkout/`,
                { method: 'POST', body: { interval } }
            )
            redirectToUrl(response.url)
        } catch (error) {
            console.error('Erro ao iniciar o checkout:', error)
            billingError.value = 'Não foi possível iniciar o pagamento. Tenta novamente.'
            isRedirecting.value = false
        }
    }

    const openBillingPortal = async () => {
        const businessUuid = currentBusiness.value?.business_uuid

        if (!businessUuid) {
            billingError.value = 'Não foi possível identificar o teu negócio.'
            return
        }

        billingError.value = ''
        isRedirecting.value = true

        try {
            const response = await apiFetch<{ url: string }>(
                `/businesses/${businessUuid}/billing/portal/`,
                { method: 'POST' }
            )
            redirectToUrl(response.url)
        } catch (error) {
            console.error('Erro ao abrir a gestão da subscrição:', error)
            billingError.value = 'Não foi possível abrir a gestão da subscrição. Tenta novamente.'
            isRedirecting.value = false
        }
    }

    return {
        isRedirecting,
        billingError,
        startCheckout,
        openBillingPortal,
    }
}
