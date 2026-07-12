let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (apiBase: string): Promise<string | null> => {
    if (!import.meta.client) {
        return null
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            const refreshToken = localStorage.getItem('tf_booking_refresh_token')

            if (!refreshToken) {
                return null
            }

            try {
                const response = await $fetch<{ access: string; refresh?: string }>(
                    `${apiBase}/auth/token/refresh/`,
                    { method: 'POST', body: { refresh: refreshToken } }
                )

                localStorage.setItem('tf_booking_access_token', response.access)

                if (response.refresh) {
                    localStorage.setItem('tf_booking_refresh_token', response.refresh)
                }

                return response.access
            } catch {
                localStorage.removeItem('tf_booking_access_token')
                localStorage.removeItem('tf_booking_refresh_token')
                return null
            }
        })().finally(() => {
            refreshPromise = null
        })
    }

    return refreshPromise
}

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

        const buildHeaders = (accessToken: string | null) => ({
            ...(optionHeaders as Record<string, string> || {}),
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        })

        const { start, stop } = useGlobalLoading()

        if (!silent) {
            start()
        }

        try {
            try {
                return await $fetch<T>(`${apiBase}${endpoint}`, {
                    ...fetchOptions,
                    headers: buildHeaders(token),
                })
            } catch (error: any) {
                const status = error?.status || error?.statusCode
                const canRetry = auth && Boolean(token) && status === 401

                if (!canRetry) {
                    throw error
                }

                const newAccessToken = await refreshAccessToken(apiBase)

                if (!newAccessToken) {
                    if (import.meta.client) {
                        localStorage.removeItem('tf_booking_access_token')
                        localStorage.removeItem('tf_booking_refresh_token')
                        await navigateTo('/login')
                    }

                    throw error
                }

                return await $fetch<T>(`${apiBase}${endpoint}`, {
                    ...fetchOptions,
                    headers: buildHeaders(newAccessToken),
                })
            }
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
