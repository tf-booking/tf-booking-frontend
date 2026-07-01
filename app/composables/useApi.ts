export const useApi = () => {
    const config = useRuntimeConfig()
    const apiBase = String(config.public.apiBase || 'http://127.0.0.1:8000/api')

    const getAccessToken = () => {
        if (!import.meta.client) {
            return null
        }

        return localStorage.getItem('tf_booking_access_token')
    }

    const apiFetch = async <T>(
        endpoint: string,
        options: Parameters<typeof $fetch>[1] = {}
    ) => {
        const token = getAccessToken()

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string> || {}),
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        return await $fetch<T>(`${apiBase}${endpoint}`, {
            ...options,
            headers,
        })
    }

    return {
        apiBase,
        apiFetch,
    }
}