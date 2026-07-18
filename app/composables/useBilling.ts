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

    // `window.location.href` sai da SPA para a Stripe (Checkout/Billing
    // Portal). Se o utilizador voltar pelo gesto/botão "recuar" do telemóvel
    // em vez de um link, o browser pode restaurar esta página do bfcache tal
    // como ficou - sem voltar a correr onMounted - deixando isRedirecting
    // preso a `true` e o botão bloqueado para sempre. O evento `pageshow`
    // com `persisted: true` é o único sinal fiável desse caso.
    if (import.meta.client) {
        const resetOnBfcacheRestore = (event: PageTransitionEvent) => {
            if (event.persisted) {
                isRedirecting.value = false
            }
        }

        onMounted(() => {
            window.addEventListener('pageshow', resetOnBfcacheRestore)
        })

        onUnmounted(() => {
            window.removeEventListener('pageshow', resetOnBfcacheRestore)
        })
    }

    const startCheckout = async (interval: 'month' | 'year' = 'month', staffSlots = 1) => {
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
                { method: 'POST', body: { interval, staff_slots: staffSlots } }
            )
            redirectToUrl(response.url)
        } catch (error) {
            console.error('Erro ao iniciar o checkout:', error)
            billingError.value = 'Não foi possível iniciar o pagamento. Tenta novamente.'
            isRedirecting.value = false
        }
    }

    const isUpdatingSeats = useState('billing-is-updating-seats', () => false)

    const updateSeats = async (staffSlots: number, businessUuidOverride?: string) => {
        const businessUuid = businessUuidOverride || currentBusiness.value?.business_uuid

        if (!businessUuid) {
            billingError.value = 'Não foi possível identificar o teu negócio.'
            return null
        }

        billingError.value = ''
        isUpdatingSeats.value = true

        try {
            const response = await apiFetch<{ staff_slots: number }>(
                `/businesses/${businessUuid}/billing/seats/`,
                { method: 'POST', body: { staff_slots: staffSlots } }
            )
            if (currentBusiness.value?.business_uuid === businessUuid) {
                currentBusiness.value.business_staff_slots = response.staff_slots
            }
            return response
        } catch (error: any) {
            console.error('Erro ao atualizar o número de lugares:', error)
            billingError.value =
                error?.data?.detail || 'Não foi possível atualizar o número de lugares.'
            return null
        } finally {
            isUpdatingSeats.value = false
        }
    }

    const startAddSeatCheckout = async (options: {
        targetStaffSlots?: number
        origin?: 'staff' | 'account'
        businessUuidOverride?: string
    } = {}) => {
        const businessUuid = options.businessUuidOverride || currentBusiness.value?.business_uuid

        if (!businessUuid) {
            billingError.value = 'Não foi possível identificar o teu negócio.'
            return
        }

        billingError.value = ''
        isRedirecting.value = true

        try {
            const response = await apiFetch<{ url: string }>(
                `/businesses/${businessUuid}/billing/checkout/add-seat/`,
                {
                    method: 'POST',
                    body: {
                        target_staff_slots: options.targetStaffSlots,
                        origin: options.origin || 'staff',
                    },
                }
            )
            redirectToUrl(response.url)
        } catch (error: any) {
            console.error('Erro ao iniciar o pagamento do lugar extra:', error)
            billingError.value =
                error?.data?.detail || 'Não foi possível iniciar o pagamento. Tenta novamente.'
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
        startAddSeatCheckout,
        openBillingPortal,
        isUpdatingSeats,
        updateSeats,
    }
}
