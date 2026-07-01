export const useApi = () => {
    const config = useRuntimeConfig()

    const apiBase = config.public.apiBase

    const apiFetch = async <T>(
        endpoint: string,
        options: Parameters<typeof $fetch>[1] = {}
    ) => {
        return await $fetch<T>(`${apiBase}${endpoint}`, {
            ...options,
        })
    }

    return {
        apiBase,
        apiFetch,
    }
}