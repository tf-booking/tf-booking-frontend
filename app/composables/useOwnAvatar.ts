type OwnAvatarResponse = {
    avatar_url: string
    avatar_position: string
}

export const useOwnAvatar = () => {
    const { apiFetch } = useApi()

    const ownAvatarUrl = useState('own-avatar-url', () => '')
    const ownAvatarPosition = useState('own-avatar-position', () => '50% 50%')

    // Sem cache de propósito: isto é um pedido leve, e uma otimização de
    // cache aqui corria o risco de deixar a sidebar presa num valor antigo
    // (ou nos valores por omissão, se a primeira tentativa falhasse por
    // temporização com a autenticação) sem nada para forçar nova tentativa.
    const loadOwnAvatar = async (businessUuid: string | undefined | null) => {
        if (!businessUuid) {
            ownAvatarUrl.value = ''
            ownAvatarPosition.value = '50% 50%'
            return
        }

        try {
            const response = await apiFetch<OwnAvatarResponse>(
                `/staff/me-profile/?business_uuid=${encodeURIComponent(businessUuid)}`,
                { silent: true }
            )
            ownAvatarUrl.value = response.avatar_url || ''
            ownAvatarPosition.value = response.avatar_position || '50% 50%'
        } catch {
            ownAvatarUrl.value = ''
            ownAvatarPosition.value = '50% 50%'
        }
    }

    return {
        ownAvatarUrl,
        ownAvatarPosition,
        loadOwnAvatar,
    }
}
