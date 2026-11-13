declare global {
    interface Window {
        fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] }
        _fbq?: unknown
    }
}

export type CookieConsent = 'granted' | 'denied'

const CONSENT_STORAGE_KEY = 'klenda_cookie_consent'

// O pixel só corre nas páginas "de marketing" da Klenda. Ficam de fora as
// páginas públicas de marcação dos negócios (/booking/..., /<slug>/profissional/...,
// /gerir-marcacao/...) - os visitantes dessas são clientes dos nossos clientes,
// não queremos partilhar dados deles com a Meta - e todo o backoffice.
const TRACKED_PATHS = [
    '/',
    '/signup',
    '/login',
    '/criar-negocio',
    '/privacidade',
    '/termos',
    '/recuperar-password',
]

export const isMetaPixelPath = (path: string) => {
    const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
    return TRACKED_PATHS.includes(clean)
}

let pixelLoaded = false

export const useMetaPixel = () => {
    const config = useRuntimeConfig()
    const pixelId = String(config.public.metaPixelId || '')

    const consent = useState<CookieConsent | null>('cookieConsent', () => null)

    const readConsent = () => {
        if (!import.meta.client) {
            return
        }

        const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
        consent.value = stored === 'granted' || stored === 'denied' ? stored : null
    }

    const isEnabled = () => {
        // Em desenvolvimento não carregamos o pixel, para não sujar os dados
        // da campanha com visitas de localhost.
        return import.meta.client && !import.meta.dev && Boolean(pixelId) && consent.value === 'granted'
    }

    const loadPixel = () => {
        if (!isEnabled() || pixelLoaded) {
            return
        }

        /* eslint-disable */
        ;(function (f: any, b: Document, e: string, v: string) {
            if (f.fbq) return
            const n: any = (f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            })
            if (!f._fbq) f._fbq = n
            n.push = n
            n.loaded = true
            n.version = '2.0'
            n.queue = []
            const t = b.createElement(e) as HTMLScriptElement
            t.async = true
            t.src = v
            const s = b.getElementsByTagName(e)[0]
            s?.parentNode?.insertBefore(t, s)
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
        /* eslint-enable */

        window.fbq?.('init', pixelId)
        pixelLoaded = true
    }

    const trackPageView = (path: string) => {
        if (!isEnabled() || !isMetaPixelPath(path)) {
            return
        }

        loadPixel()
        window.fbq?.('track', 'PageView')
    }

    // Conta criada com sucesso (email + password ou Google). É o evento que a
    // campanha de Leads da Meta vai otimizar.
    const trackRegistration = (params: Record<string, unknown> = {}) => {
        if (!isEnabled()) {
            return
        }

        loadPixel()
        window.fbq?.('track', 'CompleteRegistration', params)
    }

    const setConsent = (value: CookieConsent) => {
        consent.value = value

        if (import.meta.client) {
            localStorage.setItem(CONSENT_STORAGE_KEY, value)
        }

        if (value === 'granted') {
            trackPageView(window.location.pathname)
        }
    }

    return {
        consent,
        readConsent,
        setConsent,
        trackPageView,
        trackRegistration,
    }
}
