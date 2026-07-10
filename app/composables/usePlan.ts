export const usePlan = () => {
    const { currentBusiness } = useCurrentBusiness()

    const isPro = computed(() => currentBusiness.value?.business_plan === 'pro')
    const isFree = computed(() => !isPro.value)

    return {
        isPro,
        isFree,
    }
}
