const HIDE_DELAY_MS = 200

let hideTimeout: ReturnType<typeof setTimeout> | null = null

export const useGlobalLoading = () => {
    const pendingRequests = useState<number>('tf-global-loading-pending', () => 0)
    const isLoading = useState<boolean>('tf-global-loading-visible', () => false)

    const start = () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout)
            hideTimeout = null
        }

        pendingRequests.value++
        isLoading.value = true
    }

    const stop = () => {
        pendingRequests.value = Math.max(0, pendingRequests.value - 1)

        if (pendingRequests.value === 0 && !hideTimeout) {
            hideTimeout = setTimeout(() => {
                hideTimeout = null

                if (pendingRequests.value === 0) {
                    isLoading.value = false
                }
            }, HIDE_DELAY_MS)
        }
    }

    return {
        isLoading,
        start,
        stop,
    }
}
