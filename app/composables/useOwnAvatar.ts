type OwnAvatarResponse = {
    avatar_url: string
    avatar_position: string
}

export const useOwnAvatar = () => {
    const { apiFetch } = useApi()

    const ownAvatarUrl = useState('own-avatar-url', () => '')
    const ownAvatarPosition = useState('own-avatar-position', () => '50% 50%')
    const ownAvatarBusinessUuid = useState('own-avatar-business-uuid', () => '')

    const loadOwnAvatar = async (businessUuid: string | undefined | null, options: { force?: boolean } = {}) => {
        if (!businessUuid) {
            ownAvatarUrl.value = ''
            ownAvatarPosition.value = '50% 50%'
            ownAvatarBusinessUuid.value = ''
            return
        }

        if (!options.force && ownAvatarBusinessUuid.value === businessUuid) {
            return
        }

        try {
            const response = await apiFetch<OwnAvatarResponse>(
                `/staff/me-profile/?business_uuid=${encodeURIComponent(businessUuid)}`,
                { silent: true }
            )
            ownAvatarUrl.value = response.avatar_url || ''
            ownAvatarPosition.value = response.avatar_position || '50% 50%'
            ownAvatarBusinessUuid.value = businessUuid
        } catch {
            ownAvatarUrl.value = ''
            ownAvatarPosition.value = '50% 50%'
            ownAvatarBusinessUuid.value = ''
        }
    }

    return {
        ownAvatarUrl,
        ownAvatarPosition,
        loadOwnAvatar,
    }
}
