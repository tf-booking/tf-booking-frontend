<template>
    <div class="profile-viewport">
        <div class="device">
            <section v-if="isLoading" class="state-screen">
                <div class="state-mark">TF</div>
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
                            v-if="heroPhoto"
                            class="banner-photo"
                            :src="heroPhoto"
                            :alt="staffMember.name"
                        />
                        <div class="banner-overlay"></div>
                        <div class="banner-texture"></div>
                        <NuxtLink class="banner-back" :to="bookingPath" aria-label="Voltar"><</NuxtLink>
                    </div>

                    <div class="avatar-wrap">
                        <img
                            v-if="staffMember.avatar_url"
                            class="avatar avatar-img"
                            :src="staffMember.avatar_url"
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
                        <div class="section-head">
                            <span class="section-label">Descricao</span>
                        </div>

                        <div class="about-card">
                            <p class="profile-bio">{{ profileDescription }}</p>
                        </div>

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

                    <div v-if="profilePhotos.length" class="gallery-section">
                        <div class="section-head">
                            <span class="section-label">Fotos</span>
                            <span class="section-meta">{{ profilePhotos.length }} imagens</span>
                        </div>

                        <div class="gallery-featured">
                            <img
                                :src="profilePhotos[activePhotoIndex]"
                                :alt="`${staffMember.name} - foto ${activePhotoIndex + 1}`"
                            />
                        </div>

                        <div v-if="profilePhotos.length > 1" class="gallery-strip">
                            <button
                                v-for="(photo, index) in profilePhotos"
                                :key="`${photo}-${index}`"
                                type="button"
                                class="gallery-thumb"
                                :class="{ 'gallery-thumb-active': index === activePhotoIndex }"
                                @click="activePhotoIndex = index"
                            >
                                <img :src="photo" :alt="`${staffMember.name} - miniatura ${index + 1}`" />
                            </button>
                        </div>
                    </div>

                    <div v-if="staffServices.length" class="works">
                        <div class="works-head">
                            <span class="works-label">Servicos</span>
                            <span class="works-count">{{ staffServices.length }} disponiveis</span>
                        </div>

                        <div class="service-list">
                            <article v-for="service in staffServices" :key="service.uuid" class="service-item">
                                <div class="service-copy">
                                    <h3>{{ service.name }}</h3>
                                    <p>{{ service.duration_minutes }} min</p>
                                </div>
                                <strong class="service-price">{{ formatPrice(service.price) }}</strong>
                            </article>
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
    services: PublicService[]
}

const route = useRoute()
const { apiFetch } = useApi()

const slug = computed(() => String(route.params.slug || '').trim())
const staffUuid = computed(() => String(route.params.staffUuid || '').trim())
const serviceQuery = computed(() => String(route.query.service || '').trim())
const activePhotoIndex = ref(0)

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

const profilePhotos = computed(() => {
    const photos = new Set<string>()

    if (staffMember.value?.avatar_url) {
        photos.add(staffMember.value.avatar_url)
    }

    for (const url of staffMember.value?.gallery_image_urls || []) {
        const cleaned = String(url || '').trim()

        if (cleaned) {
            photos.add(cleaned)
        }
    }

    return Array.from(photos)
})

const heroPhoto = computed(() =>
    profilePhotos.value[activePhotoIndex.value] || staffMember.value?.avatar_url || ''
)

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

watch(profilePhotos, (photos) => {
    if (!photos.length || activePhotoIndex.value >= photos.length) {
        activePhotoIndex.value = 0
    }
}, { immediate: true })

useHead(() => ({
    title: staffMember.value && business.value
        ? `${staffMember.value.name} | ${business.value.name}`
        : 'Profissional | TF Booking',
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
    height: 218px;
    overflow: hidden;
    background: linear-gradient(135deg, #17171d, #26262d);
}

.banner-photo,
.gallery-featured img,
.gallery-thumb img,
.avatar-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.banner-photo {
    position: absolute;
    inset: 0;
}

.banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(11, 11, 15, 0.3), rgba(11, 11, 15, 0.7));
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
.gallery-section,
.works {
    padding: 22px 24px 0;
}

.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.section-label,
.works-label {
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.section-meta,
.works-count {
    font-family: var(--tf-mono);
    font-size: 11px;
    color: #9a958a;
}

.about-card {
    padding: 18px;
    border: 1px solid var(--tf-border);
    border-radius: 22px;
    background: linear-gradient(180deg, #fff, #fbf8f1);
}

.profile-bio {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #4a483f;
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

.gallery-featured {
    overflow: hidden;
    border-radius: 24px;
    background: #ece6d9;
    aspect-ratio: 4 / 5;
}

.gallery-strip {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 88px;
    gap: 10px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.gallery-thumb {
    padding: 0;
    border: 2px solid transparent;
    border-radius: 18px;
    overflow: hidden;
    background: #ece6d9;
    aspect-ratio: 1 / 1;
    cursor: pointer;
}

.gallery-thumb-active {
    border-color: var(--tf-black);
}

.works {
    padding-bottom: 26px;
}

.works-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.service-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.service-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 18px;
    border: 1px solid var(--tf-border);
    border-radius: 18px;
    background: #fff;
}

.service-copy h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
}

.service-copy p {
    margin: 3px 0 0;
    font-size: 13px;
    color: var(--tf-muted);
}

.service-price {
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -0.02em;
    white-space: nowrap;
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
