// Meta Pixel da Klenda. Só carrega depois de a pessoa aceitar os cookies
// (ver CookieConsent.vue) e só nas páginas de marketing (ver useMetaPixel.ts).
export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter()
    const { readConsent, trackPageView } = useMetaPixel()

    readConsent()

    let mounted = false

    // Primeira página vista (carregamento completo).
    nuxtApp.hook('app:mounted', () => {
        mounted = true
        trackPageView(router.currentRoute.value.path)
    })

    // Navegações seguintes dentro da app (SPA, sem reload).
    router.afterEach((to, from) => {
        if (!mounted || to.path === from.path) {
            return
        }

        trackPageView(to.path)
    })
})
