<template>
    <div class="profile-viewport">
        <div class="device">
            <section v-if="isLoading" class="state-screen">
                <div class="state-mark">K</div>
                <p class="step-count">A carregar</p>
                <h1>A preparar o perfil...</h1>
            </section>

            <section v-else-if="errorMessage || !business || !staffMember" class="state-screen">
                <div class="state-mark state-mark-error">!</div>
                <p class="step-count">Perfil indisponivel</p>
                <h1>Nao encontramos este profissional.</h1>
                <p class="state-copy">{{ errorMessage || 'Confirma se o link esta correto.' }}</p>
                <NuxtLink class="btn btn-secondary state-btn" :to="bookingPath">Voltar a marcacao</NuxtLink>
            </section>

            <section v-else class="profile">
                <div class="profile-scroll">
                    <div class="banner">
                        <img
                            v-if="coverPhoto"
                            class="banner-photo"
                            :src="coverPhoto"
                            :alt="business.name"
                        />
                        <div class="banner-texture"></div>
                        <NuxtLink class="banner-back" :to="bookingPath" aria-label="Voltar">&lsaquo;</NuxtLink>
                    </div>

                    <div class="avatar-wrap">
                        <img
                            v-if="avatarPhoto"
                            class="avatar avatar-img"
                            :src="avatarPhoto"
                            :alt="staffMember.name"
                        />
                        <div v-else class="avatar">{{ staffInitials(staffMember.name) }}</div>
                    </div>

                    <div class="profile-head">
                        <h1>{{ staffMember.name }}</h1>
                        <p class="profile-role">{{ profileSubtitle }}</p>

                        <div v-if="stats.length" class="stats">
                            <template v-for="(stat, index) in stats" :key="stat.label">
                                <span v-if="index > 0" class="stat-divider"></span>
                                <div class="stat">
                                    <div class="stat-value">{{ stat.value }}</div>
                                    <div class="stat-label">{{ stat.label }}</div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="profile-about">
                        <p class="profile-bio">{{ profileDescription }}</p>

                        <div v-if="serviceChips.length" class="chips">
                            <span
                                v-for="(chip, index) in serviceChips"
                                :key="chip"
                                class="chip"
                                :class="{ 'chip-dark': index === 0 }"
                            >
                                {{ chip }}
                            </span>
                        </div>
                    </div>

                    <div v-if="profilePhotos.length" class="portfolio">
                        <div class="portfolio-head">
                            <span class="portfolio-label">Trabalhos</span>
                            <span class="portfolio-count">{{ profilePhotos.length }} fotos</span>
                        </div>

                        <div class="portfolio-grid">
                            <img
                                v-for="(photo, index) in profilePhotos"
                                :key="`${photo}-${index}`"
                                class="portfolio-photo"
                                :src="photo"
                                :alt="`${staffMember.name} - trabalho ${index + 1}`"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>

                <div class="profile-cta">
                    <NuxtLink class="btn btn-accent block-btn" :to="bookWithStaffPath">
                        Marcar com {{ firstName }} ->
                    </NuxtLink>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
    alias: ['/booking/:slug/profissional/:staffUuid'],
})

type PublicStaffMember = {
    uuid: string
    name: string
    bio: string
    avatar_url: string
    gallery_image_urls: string[]
}

type PublicService = {
    uuid: string
    name: string
    description: string
    duration_minutes: number
    price: string
    staff_members: PublicStaffMember[]
}

type PublicBusiness = {
    uuid: string
    name: string
    slug: string
    phone: string
    address: string
    city: string
    website_url: string
    cover_image_url: string
    services: PublicService[]
}

const route = useRoute()
const { apiFetch, apiBase } = useApi()

// The API returns media as relative paths (/media/...); serve them from the backend origin,
// not the frontend origin (otherwise the browser 404s them against localhost:3000).
const mediaBase = apiBase.replace(/\/api\/?$/, '')

const resolveMedia = (url: string) => {
    const value = String(url || '').trim()

    if (!value) {
        return ''
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
        return value
    }

    return `${mediaBase}${value.startsWith('/') ? '' : '/'}${value}`
}

const slug = computed(() => String(route.params.slug || '').trim())
const staffUuid = computed(() => String(route.params.staffUuid || '').trim())
const serviceQuery = computed(() => String(route.query.service || '').trim())

const bookingQuery = computed(() => {
    const query: Record<string, string> = {
        step: '2',
        staff: staffUuid.value,
    }

    if (serviceQuery.value) {
        query.service = serviceQuery.value
    }

    return query
})

const bookWithStaffQuery = computed(() => ({
    ...bookingQuery.value,
    step: '3',
}))

const bookingPath = computed(() => ({
    path: `/booking/${encodeURIComponent(slug.value)}`,
    query: bookingQuery.value,
}))

const bookWithStaffPath = computed(() => ({
    path: `/booking/${encodeURIComponent(slug.value)}`,
    query: bookWithStaffQuery.value,
}))

const business = ref<PublicBusiness | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const allStaffMembers = computed(() => {
    const map = new Map<string, PublicStaffMember>()

    for (const service of business.value?.services || []) {
        for (const staff of service.staff_members) {
            if (!map.has(staff.uuid)) {
                map.set(staff.uuid, staff)
            }
        }
    }

    return Array.from(map.values())
})

const staffMember = computed(() =>
    allStaffMembers.value.find((staff) => staff.uuid === staffUuid.value) || null
)

const staffServices = computed(() =>
    business.value?.services.filter((service) =>
        service.staff_members.some((staff) => staff.uuid === staffUuid.value)
    ) || []
)

const firstName = computed(() => staffMember.value?.name.trim().split(/\s+/)[0] || 'este profissional')

const profileSubtitle = computed(() =>
    business.value ? `Profissional · ${business.value.name}` : 'Profissional'
)

const profileDescription = computed(() =>
    staffMember.value?.bio?.trim() || 'Profissional disponivel para marcacoes neste negocio.'
)

const coverPhoto = computed(() => resolveMedia(business.value?.cover_image_url || ''))

const avatarPhoto = computed(() => resolveMedia(staffMember.value?.avatar_url || ''))

const profilePhotos = computed(() => {
    const photos = new Set<string>()

    if (avatarPhoto.value) {
        photos.add(avatarPhoto.value)
    }

    for (const url of staffMember.value?.gallery_image_urls || []) {
        const resolved = resolveMedia(url)

        if (resolved) {
            photos.add(resolved)
        }
    }

    return Array.from(photos)
})

const stats = computed(() => {
    const list: { value: string; label: string }[] = [
        { value: String(staffServices.value.length), label: 'servicos' },
    ]

    if (profilePhotos.value.length) {
        list.push({ value: String(profilePhotos.value.length), label: 'fotos' })
    }

    if (business.value?.city) {
        list.push({ value: business.value.city, label: 'local' })
    }

    return list
})

const serviceChips = computed(() =>
    staffServices.value.slice(0, 6).map((service) => service.name)
)

useHead(() => ({
    title: staffMember.value && business.value
        ? `${staffMember.value.name} | ${business.value.name}`
        : 'Profissional | Klenda',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}))

const staffInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')

const formatPrice = (value: string | number) => {
    const amount = Number(value)

    if (Number.isNaN(amount)) {
        return `${value}EUR`
    }

    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    })
        .format(amount)
        .replace(/\s/g, '')
}

const loadProfile = async () => {
    if (!slug.value || !staffUuid.value) {
        errorMessage.value = 'Link invalido.'
        isLoading.value = false
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''

        const response = await apiFetch<PublicBusiness>(`/public/businesses/${encodeURIComponent(slug.value)}/`)
        business.value = response

        if (!staffMember.value) {
            errorMessage.value = 'Este profissional nao esta disponivel neste negocio.'
        }
    } catch (error: any) {
        console.error(error)
        business.value = null
        errorMessage.value = error?.data?.business || 'Nao foi possivel carregar o perfil deste profissional.'
    } finally {
        isLoading.value = false
    }
}

watch([slug, staffUuid], () => {
    loadProfile()
}, { immediate: true })
</script>

<style scoped>
.profile-viewport {
    min-height: 100svh;
    background: #fdfcf9;
}

.device {
    width: 100%;
    min-height: 100svh;
    background: #fdfcf9;
}

.state-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100svh;
    padding: 34px;
}

.state-mark {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    margin-bottom: 28px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-weight: 900;
    font-size: 20px;
}

.state-mark-error {
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
}

.state-screen h1 {
    margin: 0;
    font-size: 34px;
    line-height: 0.98;
    font-weight: 900;
}

.step-count {
    margin: 0 0 8px;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.state-copy {
    margin: 18px 0 24px;
    color: var(--tf-muted);
    line-height: 1.5;
}

.state-btn {
    width: fit-content;
}

.profile {
    display: flex;
    flex-direction: column;
    min-height: 100svh;
}

.profile-scroll {
    flex: 1;
}

.banner {
    position: relative;
    height: 190px;
    overflow: hidden;
    background: linear-gradient(135deg, #17171d, #26262d);
}

.banner-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.banner-texture {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0 14px, transparent 14px 28px);
}

.banner-back {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    color: #fff;
    font-size: 18px;
    font-weight: 800;
}

.avatar-wrap {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    margin-top: -52px;
}

.avatar {
    display: grid;
    place-items: center;
    width: 104px;
    height: 104px;
    border-radius: 50%;
    border: 5px solid #fdfcf9;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-weight: 900;
    font-size: 34px;
    overflow: hidden;
}

.profile-head {
    text-align: center;
    padding: 14px 24px 0;
}

.profile-head h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.04em;
}

.profile-role {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--tf-muted);
}

.stats {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 18px;
    margin-top: 16px;
}

.stat {
    text-align: center;
}

.stat-value {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.stat-label {
    font-family: var(--tf-mono);
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.stat-divider {
    width: 1px;
    background: var(--tf-border);
}

.profile-about,
.portfolio {
    padding: 22px 24px 0;
}

.portfolio-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.portfolio-label {
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.portfolio-count {
    font-family: var(--tf-mono);
    font-size: 11px;
    color: #9a958a;
}

.profile-bio {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #4a483f;
    text-align: center;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
}

.chip {
    padding: 7px 13px;
    border-radius: 999px;
    background: #f1ecdf;
    color: var(--tf-black);
    font-size: 12px;
    font-weight: 700;
}

.chip-dark {
    background: var(--tf-black);
    color: #fff;
}

.portfolio {
    padding-bottom: 26px;
}

.portfolio-grid {
    column-count: 2;
    column-gap: 10px;
}

.portfolio-photo {
    display: block;
    width: 100%;
    margin-bottom: 10px;
    border-radius: 16px;
    break-inside: avoid;
    background: #ece6d9;
}

.profile-cta {
    position: sticky;
    bottom: 0;
    padding: 16px 24px 26px;
    background: linear-gradient(to top, #fdfcf9 65%, rgba(253, 252, 249, 0));
}

.block-btn {
    width: 100%;
    height: 56px;
    font-size: 17px;
}

@media (min-width: 620px) {
    .profile-viewport {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
        background:
            radial-gradient(circle at 18% 12%, rgba(215, 255, 62, 0.14), transparent 30%),
            var(--tf-canvas);
    }

    .device {
        width: min(460px, 100%);
        min-height: 0;
        border: 1px solid #d9d2c2;
        border-radius: 34px;
        box-shadow: 0 40px 90px -44px rgba(11, 11, 15, 0.5);
        overflow: hidden;
    }

    .profile,
    .state-screen {
        min-height: min(820px, calc(100svh - 64px));
    }
}
</style>
