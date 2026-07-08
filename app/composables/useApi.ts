export const useApi = () => {
    const config = useRuntimeConfig()
    const apiBase = String(config.public.apiBase || 'http://127.0.0.1:8000/api')
    type ApiFetchOptions = NonNullable<Parameters<typeof $fetch>[1]> & {
        auth?: boolean
        silent?: boolean
    }

    const getAccessToken = () => {
        if (!import.meta.client) {
            return null
        }

        return localStorage.getItem('tf_booking_access_token')
    }

    const apiFetch = async <T>(
        endpoint: string,
        options: ApiFetchOptions = {}
    ) => {
        const { auth = true, silent = false, headers: optionHeaders, ...fetchOptions } = options
        const token = auth ? getAccessToken() : null

        const headers: Record<string, string> = {
            ...(optionHeaders as Record<string, string> || {}),
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        const { start, stop } = useGlobalLoading()

        if (!silent) {
            start()
        }

        try {
            return await $fetch<T>(`${apiBase}${endpoint}`, {
                ...fetchOptions,
                headers,
            })
        } finally {
            if (!silent) {
                stop()
            }
        }
    }

    return {
        apiBase,
        apiFetch,
    }
}
