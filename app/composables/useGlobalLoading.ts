export const useGlobalLoading = () => {
    const pendingRequests = useState<number>('tf-global-loading-pending', () => 0)

    const isLoading = computed(() => pendingRequests.value > 0)

    const start = () => {
        pendingRequests.value++
    }

    const stop = () => {
        pendingRequests.value = Math.max(0, pendingRequests.value - 1)
    }

    return {
        isLoading,
        start,
        stop,
    }
}
