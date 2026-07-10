// Ao fazer logout, a navegação para /login é feita em SPA (sem reload).
// Se a página protegida anterior (dashboard, agenda, etc.) ficar em bfcache
// do browser, o botão "recuar" pode restaurá-la tal como estava - já
// renderizada, sem voltar a passar pelo middleware - mesmo depois dos
// tokens terem sido apagados. O evento "pageshow" com `persisted: true`
// é como o browser avisa que a página voltou do bfcache; aí forçamos um
// reload real para qualquer página que não seja pública, o que garante
// que o middleware de autenticação volta a correr.
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/booking/', '/invite/']

const isPublicPath = (path: string) => {
    if (path === '/') {
        return true
    }

    if (path.includes('/profissional/')) {
        return true
    }

    return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export default defineNuxtPlugin(() => {
    if (!import.meta.client) {
        return
    }

    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return
        }

        const hasToken = Boolean(localStorage.getItem('tf_booking_access_token'))

        if (hasToken) {
            return
        }

        if (!isPublicPath(window.location.pathname)) {
            window.location.replace('/login')
        }
    })
})
