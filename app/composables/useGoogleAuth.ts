declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string
                        callback: (response: { credential: string }) => void
                    }) => void
                    renderButton: (
                        parent: HTMLElement,
                        options: Record<string, unknown>
                    ) => void
                }
            }
        }
    }
}

type GoogleAuthResponse =
    | { access: string; refresh: string }
    | { needs_business_name: true; email: string; suggested_owner_name: string }

let scriptLoadPromise: Promise<void> | null = null

const loadGoogleScript = () => {
    if (!import.meta.client) {
        return Promise.resolve()
    }

    if (window.google?.accounts?.id) {
        return Promise.resolve()
    }

    if (!scriptLoadPromise) {
        scriptLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.defer = true
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Não foi possível carregar o script da Google.'))
            document.head.appendChild(script)
        })
    }

    return scriptLoadPromise
}

export const useGoogleAuth = () => {
    const { apiFetch } = useApi()
    const config = useRuntimeConfig()
    const clientId = String(config.public.googleClientId || '')

    const isGoogleConfigured = computed(() => Boolean(clientId))

    const renderGoogleButton = async (
        container: HTMLElement,
        onCredential: (credential: string) => void
    ) => {
        if (!clientId) {
            return
        }

        await loadGoogleScript()

        if (!window.google?.accounts?.id) {
            return
        }

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => onCredential(response.credential),
        })

        window.google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'pill',
        })
    }

    const submitGoogleCredential = (credential: string, businessName?: string) => {
        return apiFetch<GoogleAuthResponse>('/auth/google/', {
            method: 'POST',
            body: businessName ? { credential, business_name: businessName } : { credential },
            auth: false,
        })
    }

    return {
        isGoogleConfigured,
        renderGoogleButton,
        submitGoogleCredential,
    }
}
