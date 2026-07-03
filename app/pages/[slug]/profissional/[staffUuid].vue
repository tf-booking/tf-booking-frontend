<template>
    <div class="staff-profile-page">
        <section v-if="isLoading" class="state-screen">
            <div class="state-mark">TF</div>
            <p class="step-count">A carregar</p>
            <h1>A preparar o perfil do profissional...</h1>
        </section>

        <section v-else-if="errorMessage || !business || !staffMember" class="state-screen">
            <div class="state-mark state-mark-error">!</div>
            <p class="step-count">Perfil indisponível</p>
            <h1>Não encontrámos este profissional.</h1>
            <p class="state-copy">
                {{ errorMessage || 'Confirma se o link está correto.' }}
            </p>
            <NuxtLink class="action-link" :to="bookingPath">
                Voltar à marcação
            </NuxtLink>
        </section>

        <section v-else class="profile-shell">
            <header class="profile-topbar">
                <NuxtLink class="back-link" :to="bookingPath">
                    ‹ Voltar à marcação
                </NuxtLink>
                <span class="topbar-brand">TF Booking</span>
            </header>

            <div class="profile-grid">
                <section class="profile-hero card">
                    <div class="profile-hero-copy">
                        <p class="step-count">{{ business.name }}</p>
                        <h1>{{ staffMember.name }}</h1>
                        <p class="profile-lede">
                            {{ staffMember.bio?.trim() || 'Profissional disponível para marcações neste negócio.' }}
                        </p>

                        <div class="profile-meta">
                            <span>{{ staffServices.length }} serviços</span>
                            <span v-if="business.city">{{ business.city }}</span>
                        </div>
                    </div>

                    <div class="profile-avatar-wrap">
                        <img
                            v-if="staffMember.avatar_url"
                            :src="staffMember.avatar_url"
                            :alt="staffMember.name"
                            class="profile-avatar-image"
                        />
                        <div v-else class="profile-avatar-fallback">
                            {{ staffInitials(staffMember.name) }}
                        </div>
                    </div>
                </section>

                <section class="card detail-card">
                    <p class="card-label">Sobre o profissional</p>
                    <p class="detail-copy">
                        {{ staffMember.bio?.trim() || 'Este profissional ainda não tem uma descrição pública.' }}
                    </p>
                </section>

                <section class="card detail-card">
                    <div class="services-head">
                        <div>
                            <p class="card-label">Serviços disponíveis</p>
                            <h2>O que podes marcar com este profissional</h2>
                        </div>
                        <NuxtLink class="action-link action-link-dark" :to="bookingPath">
                            Ir para a marcação
                        </NuxtLink>
                    </div>

                    <div class="service-list">
                        <article v-for="service in staffServices" :key="service.uuid" class="service-item">
                            <div>
                                <h3>{{ service.name }}</h3>
                                <p>{{ service.description?.trim() || 'Serviço disponível para marcação pública.' }}</p>
                            </div>
                            <div class="service-meta">
                                <span>{{ service.duration_minutes }} min</span>
                                <strong>{{ formatPrice(service.price) }}</strong>
                            </div>
                        </article>
                    </div>
                </section>

                <section class="card detail-card business-card">
                    <p class="card-label">Negócio</p>
                    <h2>{{ business.name }}</h2>
                    <p class="detail-copy">
                        {{ business.address }}<span v-if="business.city">, {{ business.city }}</span>
                    </p>
                    <div class="business-links">
                        <a v-if="business.phone" class="action-link" :href="`tel:${business.phone}`">
                            {{ business.phone }}
                        </a>
                        <a
                            v-if="business.website_url"
                            class="action-link"
                            :href="business.website_url"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Website
                        </a>
                    </div>
                </section>
            </div>
        </section>
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
const bookingPath = computed(() => `/${encodeURIComponent(slug.value)}`)

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
        return `${value}€`
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
        errorMessage.value = 'Link inválido.'
        isLoading.value = false
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''

        const response = await apiFetch<PublicBusiness>(`/public/businesses/${encodeURIComponent(slug.value)}/`)
        business.value = response

        if (!staffMember.value) {
            errorMessage.value = 'Este profissional não está disponível neste negócio.'
        }
    } catch (error: any) {
        console.error(error)
        business.value = null
        errorMessage.value = error?.data?.business || 'Não foi possível carregar o perfil deste profissional.'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadProfile()
})
</script>

<style scoped>
.staff-profile-page {
    min-height: 100svh;
    background:
        radial-gradient(circle at top left, rgba(215, 255, 62, 0.16), transparent 24%),
        linear-gradient(180deg, #f8f5ee 0%, #fdfcf9 100%);
    color: var(--tf-black);
}

.state-screen {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 680px;
    margin: 0 auto;
    padding: 34px 24px;
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

.step-count {
    margin: 0 0 8px;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.state-screen h1,
.profile-hero h1 {
    margin: 0;
    font-size: clamp(34px, 7vw, 62px);
    line-height: 0.95;
    font-weight: 900;
}

.state-copy {
    margin: 18px 0 24px;
    color: var(--tf-muted);
    line-height: 1.6;
}

.profile-shell {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 24px 24px 48px;
}

.profile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
}

.back-link,
.action-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 18px;
    border-radius: 999px;
    border: 1px solid var(--tf-border);
    background: #fff;
    color: var(--tf-black);
    text-decoration: none;
    font-weight: 700;
}

.action-link-dark {
    background: var(--tf-black);
    border-color: var(--tf-black);
    color: #fff;
}

.topbar-brand {
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.profile-grid {
    display: grid;
    gap: 18px;
}

.card {
    border: 1px solid rgba(220, 214, 201, 0.9);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 24px 70px -52px rgba(11, 11, 15, 0.35);
}

.profile-hero {
    display: grid;
    gap: 24px;
    padding: 26px;
}

.profile-lede {
    margin: 18px 0 0;
    max-width: 42ch;
    color: #4a483f;
    font-size: 16px;
    line-height: 1.65;
}

.profile-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
}

.profile-meta span {
    padding: 8px 12px;
    border-radius: 999px;
    background: #f4f1ea;
    font-size: 12px;
    font-weight: 700;
}

.profile-avatar-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
}

.profile-avatar-image,
.profile-avatar-fallback {
    width: 120px;
    height: 120px;
    border-radius: 28px;
}

.profile-avatar-image {
    object-fit: cover;
    border: 1px solid rgba(220, 214, 201, 0.9);
}

.profile-avatar-fallback {
    display: grid;
    place-items: center;
    background: var(--tf-black);
    color: #fff;
    font-size: 34px;
    font-weight: 900;
    letter-spacing: 0.08em;
}

.detail-card {
    padding: 24px;
}

.card-label {
    margin: 0 0 10px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.detail-card h2,
.services-head h2,
.service-item h3 {
    margin: 0;
}

.detail-copy {
    margin: 0;
    color: #4a483f;
    font-size: 15px;
    line-height: 1.7;
}

.services-head {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 18px;
}

.service-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.service-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px;
    border-radius: 20px;
    background: #f8f5ee;
}

.service-item h3 {
    font-size: 17px;
    font-weight: 800;
}

.service-item p {
    margin: 8px 0 0;
    color: var(--tf-muted);
    font-size: 14px;
    line-height: 1.55;
}

.service-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    white-space: nowrap;
    font-size: 13px;
}

.service-meta strong {
    font-size: 18px;
}

.business-links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
}

@media (min-width: 860px) {
    .profile-grid {
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
    }

    .profile-hero,
    .detail-card:nth-child(3) {
        grid-column: 1 / -1;
    }

    .profile-hero {
        grid-template-columns: minmax(0, 1fr) 180px;
        align-items: center;
        padding: 36px;
    }

    .services-head {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}

@media (max-width: 520px) {
    .profile-shell {
        padding-right: 16px;
        padding-left: 16px;
    }

    .profile-topbar {
        flex-direction: column;
        align-items: stretch;
    }

    .service-item {
        flex-direction: column;
    }

    .service-meta {
        align-items: flex-start;
    }
}
</style>
