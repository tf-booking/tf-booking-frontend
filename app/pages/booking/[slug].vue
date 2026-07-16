<template>
    <div class="booking-viewport">
        <div class="device">
            <section v-if="isLoadingBusiness" class="screen state-screen">
                <div class="state-mark">K</div>
                <p class="step-count">A carregar</p>
                <h2>A preparar a página de marcações...</h2>
            </section>

            <section v-else-if="businessError || !business" class="screen state-screen">
                <div class="state-mark state-mark-error">!</div>
                <p class="step-count">Link indisponível</p>
                <h2>Não encontrámos este negócio.</h2>
                <p class="state-copy">{{ businessError || 'Confirma se o link está correto.' }}</p>
            </section>

            <!-- ============ STEP 0 · LANDING ============ -->
            <section v-else-if="step === 0" class="screen landing">
                <div class="hero">
                    <img
                        v-if="business.cover_image_url"
                        class="hero-photo"
                        :src="business.cover_image_url"
                        :style="{ objectPosition: business.cover_position }"
                        :alt="business.name"
                    />
                    <div class="hero-overlay"></div>
                    <div class="hero-brand">klenda<span style="color:var(--tf-accent)">.</span></div>
                    <div class="hero-title">
                        <h1>{{ business.name }}</h1>
                        <div class="hero-meta">
                            <span class="rating">★ 4.9</span>
                            <span>·</span>
                            <span>{{ primaryCategory }}</span>
                            <span v-if="business.city">·</span>
                            <span v-if="business.city">{{ business.city }}</span>
                        </div>
                    </div>
                </div>

                <div class="landing-body">
                    <div class="chips">
                        <span v-for="chip in categoryChips" :key="chip" class="chip"
                            :class="{ 'chip-dark': chip === categoryChips[0] }">
                            {{ chip }}
                        </span>
                    </div>

                    <p class="landing-lede">
                        {{ business.description || 'Escolhe o serviço, vê os horários disponíveis e confirma a marcação em segundos.' }}
                    </p>

                    <div class="landing-stats">
                        <div class="stat">
                            <strong>{{ customerCountLabel }}</strong>
                            <span>Clientes</span>
                        </div>
                        <div class="stat">
                            <strong>{{ business.service_count }}</strong>
                            <span>Serviços</span>
                        </div>
                    </div>

                    <div v-if="business.gallery_image_urls.length" class="gallery-strip">
                        <img
                            v-for="(url, index) in business.gallery_image_urls"
                            :key="url"
                            class="gallery-strip-photo"
                            :src="url"
                            :alt="`${business.name} - foto ${index + 1}`"
                            loading="lazy"
                        />
                    </div>
                </div>

                <div class="screen-cta screen-cta--fade">
                    <button class="btn btn-accent block-btn" type="button" :disabled="bookableServices.length === 0"
                        @click="goTo(1)">
                        {{ bookableServices.length === 0 ? 'Sem serviços disponíveis' : 'Marcar agora →' }}
                    </button>
                    <p class="powered">Powered by TF Creative</p>
                </div>
            </section>

            <!-- ============ STEP 1 · SERVICE ============ -->
            <section v-else-if="step === 1" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(0)">‹</button>
                    <ProgressDots :current="1" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 1 de 4</p>
                    <h2>Escolhe o serviço</h2>
                </div>

                <div class="screen-body">
                    <div class="service-list">
                        <button v-for="service in business.services" :key="service.uuid" type="button"
                            class="service-row" :class="{
                                selected: selectedServiceUuid === service.uuid,
                                unavailable: service.staff_members.length === 0,
                            }" :disabled="service.staff_members.length === 0" @click="selectService(service)">
                            <div>
                                <div class="service-name">{{ service.name }}</div>
                                <div class="service-meta">
                                    {{ service.duration_minutes }} min · {{ serviceStaffLabel(service) }}
                                </div>
                            </div>
                            <div class="service-price-col">
                                <div class="service-price">{{ formatPrice(service.price) }}</div>
                                <span v-if="selectedServiceUuid === service.uuid" class="check">✓</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!selectedService"
                        @click="goTo(2)">
                        Continuar →
                    </button>
                </div>
            </section>

            <!-- ============ STEP 2 · STAFF ============ -->
            <section v-else-if="step === 2" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(1)">‹</button>
                    <ProgressDots :current="2" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 2 de 4</p>
                    <h2>Escolha um profissional</h2>
                </div>

                <div class="screen-body">
                    <section v-if="selectedService" class="staff-section staff-section-standalone">
                        <div class="staff-list">
                            <div v-for="staff in selectedServiceStaffMembers" :key="staff.uuid" class="staff-card"
                                :class="{ selected: selectedStaffUuid === staff.uuid }" role="button" tabindex="0"
                                @click="selectStaff(staff)" @keydown.enter="selectStaff(staff)"
                                @keydown.space.prevent="selectStaff(staff)">
                                <div class="staff-avatar">
                                    <img
                                        v-if="showStaffAvatarPhoto(staff)"
                                        :src="staff.avatar_url"
                                        :style="{ objectPosition: staff.avatar_position }"
                                        :alt="staff.name"
                                    />
                                    <template v-else>{{ staffInitials(staff.name) }}</template>
                                </div>

                                <div class="staff-copy">
                                    <div class="staff-name">{{ staff.name }}</div>
                                    <div class="staff-meta">
                                        {{ staff.bio?.trim() || 'Disponível para este serviço.' }}
                                    </div>
                                    <NuxtLink class="staff-profile-link" :to="staffProfilePath(staff)" @click.stop>
                                        Ver perfil →
                                    </NuxtLink>
                                </div>

                                <span v-if="selectedStaffUuid === staff.uuid" class="staff-check">✓</span>
                            </div>

                            <div class="staff-card staff-card-any" :class="{ selected: isAnyStaffSelected }"
                                role="button" tabindex="0" @click="selectAnyStaff()" @keydown.enter="selectAnyStaff()"
                                @keydown.space.prevent="selectAnyStaff()">
                                <div class="staff-avatar staff-avatar-any">
                                    ✦
                                </div>

                                <div class="staff-copy">
                                    <div class="staff-name">Sem preferência</div>
                                    <div class="staff-meta">
                                        Qualquer profissional disponível para este serviço.
                                    </div>
                                </div>

                                <span v-if="isAnyStaffSelected" class="staff-check">✓</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!hasStaffChoice" @click="goTo(3)">
                        Continuar →
                    </button>
                </div>
            </section>

            <!-- ============ STEP 3 · DATE / TIME ============ -->
            <section v-else-if="step === 3" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(2)">‹</button>
                    <ProgressDots :current="3" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 3 de 4</p>
                    <h2>Quando queres vir?</h2>
                </div>

                <div class="screen-body">
                    <div class="day-row">
                        <button v-for="day in days" :key="day.iso" type="button" class="day"
                            :class="{ selected: selectedDay === day.iso }" @click="selectDay(day.iso)">
                            <span class="day-name">{{ day.weekday }}</span>
                            <span class="day-num">{{ day.num }}</span>
                        </button>

                        <button type="button" class="day day-calendar" :class="{ selected: isCustomDaySelected }"
                            aria-label="Escolher outro dia no calendário" @click="isDatePickerOpen = true">
                            <template v-if="isCustomDaySelected">
                                <span class="day-name">{{ selectedDayData?.weekday }}</span>
                                <span class="day-num">{{ selectedDayData?.num }}</span>
                            </template>
                            <svg v-else class="day-calendar-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.6" />
                                <path d="M3 8H17" stroke="currentColor" stroke-width="1.6" />
                                <path d="M7 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                                <path d="M13 2.5V5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                            </svg>
                        </button>
                    </div>

                    <DatePickerModal
                        :open="isDatePickerOpen"
                        :selected="selectedDay || todayIso"
                        :min-iso="todayIso"
                        :max-iso="maxBookableIso"
                        @update:open="isDatePickerOpen = $event"
                        @select="selectDay"
                    />

                    <p v-if="isLoadingSlots" class="slot-state">A procurar horários disponíveis...</p>
                    <p v-else-if="slotsError" class="slot-state slot-state-error">{{ slotsError }}</p>
                    <p v-else-if="availableSlots.length === 0" class="slot-state">
                        Sem horários disponíveis para este dia.
                    </p>

                    <template v-else>
                        <template v-if="morningSlots.length">
                            <p class="slot-group-label">Manhã</p>
                            <div class="slot-grid">
                                <button v-for="slot in morningSlots" :key="slot.start_at" type="button" class="slot"
                                    :class="{ selected: selectedSlotStartAt === slot.start_at }"
                                    @click="selectSlot(slot)">
                                    {{ slot.time }}
                                </button>
                            </div>
                        </template>

                        <template v-if="afternoonSlots.length">
                            <p class="slot-group-label">Tarde</p>
                            <div class="slot-grid">
                                <button v-for="slot in afternoonSlots" :key="slot.start_at" type="button" class="slot"
                                    :class="{ selected: selectedSlotStartAt === slot.start_at }"
                                    @click="selectSlot(slot)">
                                    {{ slot.time }}
                                </button>
                            </div>
                        </template>
                    </template>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!selectedSlotStartAt"
                        @click="goTo(4)">
                        Continuar<span v-if="selectedSlot"> → {{ selectedSlot }}</span>
                    </button>
                </div>
            </section>

            <!-- ============ STEP 4 · DATA ============ -->
            <section v-else-if="step === 4" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(3)">‹</button>
                    <ProgressDots :current="4" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 4 de 4</p>
                    <h2>Os teus dados</h2>
                </div>

                <div class="screen-body">
                    <label class="label">Nome</label>
                    <input v-model="customer.name" class="input mb" type="text" placeholder="Maria Silva" />

                    <label class="label">Telemóvel</label>
                    <input v-model="customer.phone" class="input mb" type="tel" placeholder="+351 912 345 678" />

                    <label class="label">Email</label>
                    <input v-model="customer.email" class="input" type="email" placeholder="maria@email.pt" required />

                    <div class="summary-card">
                        <p class="summary-eyebrow">Resumo</p>
                        <div class="summary-top">
                            <span class="summary-service">{{ selectedService?.name }}</span>
                            <span class="summary-price">{{ selectedService ? formatPrice(selectedService.price) : ''
                                }}</span>
                        </div>
                        <div class="summary-bottom">
                            <span>{{ selectedDayLabel }} · {{ selectedSlot }}</span>
                            <span>{{ selectedService?.duration_minutes }} min · {{ isAnyStaffSelected ? 'Sem preferência' :
                                selectedStaff?.name }}</span>
                        </div>
                    </div>

                    <label class="terms-row">
                        <input v-model="acceptedTerms" type="checkbox" required />
                        <span>
                            Li e concordo com os
                            <a href="/termos" target="_blank" rel="noopener noreferrer" @click.stop>Termos e Condições</a>
                            e a
                            <a href="/privacidade" target="_blank" rel="noopener noreferrer" @click.stop>Política de Privacidade</a>
                        </span>
                    </label>

                    <p v-if="bookingError" class="booking-error">{{ bookingError }}</p>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!canConfirm || isSubmitting"
                        @click="confirm">
                        {{ isSubmitting ? 'A confirmar...' : 'Confirmar marcação' }}
                    </button>
                </div>
            </section>

            <!-- ============ STEP 4 · SUCCESS ============ -->
            <section v-else class="screen success">
                <div class="success-watermark">done</div>

                <div class="success-body">
                    <div class="success-check">✓</div>
                    <p class="success-eyebrow">Marcação confirmada</p>
                    <h2>Até {{ selectedDayName }}, {{ firstName }}!</h2>
                    <p class="success-lede">
                        A tua marcação ficou registada. Guarda os detalhes e contacta o espaço se precisares de alterar.
                    </p>

                    <div class="success-card">
                        <div class="success-card-top">
                            <span class="summary-service">{{ selectedService?.name }}</span>
                            <span class="qr"></span>
                        </div>
                        <div class="success-rows">
                            <div><span>Data</span><span>{{ selectedDayLabel }} · {{ selectedSlot }}</span></div>
                            <div><span>Local</span><span>{{ business.name }}{{ business.city ? `, ${business.city}` : ''
                                    }}</span>
                            </div>
                            <div><span>Total</span><span class="accent">{{ selectedService ?
                                    formatPrice(selectedService.price) : ''
                                    }}</span></div>
                        </div>
                    </div>

                    <button class="btn btn-accent block-btn mb" type="button" @click="reset">
                        Fazer nova marcação
                    </button>
                    <button class="btn ghost block-btn" type="button" @click="returnToBusinessLanding">
                        Ver página do negócio
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
    alias: ['/:slug'],
})

type PublicStaffMember = {
    uuid: string
    name: string
    bio: string
    avatar_url: string
    avatar_position: string
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
    email: string
    phone: string
    address: string
    city: string
    instagram_url: string
    facebook_url: string
    website_url: string
    description: string
    categories: string[]
    cover_image_url: string
    gallery_image_urls: string[]
    service_count: number
    customer_count: number
    is_pro: boolean
    cover_position: string
    services: PublicService[]
    booking_settings: {
        min_booking_notice_minutes: number
        max_booking_horizon_days: number
        slot_interval_minutes: number
    }
}

type AvailableSlot = {
    time: string
    start_at: string
    end_at: string
    staff_uuids?: string[]
}

const ANY_STAFF = '__any__'

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const isSyncingWizardRoute = ref(false)

// Inline progress-dots component used by the wizard steps.
const ProgressDots = defineComponent({
    props: { current: { type: Number, required: true } },
    setup(props) {
        return () =>
            h(
                'div',
                { class: 'progress-dots' },
                [1, 2, 3, 4].map((index) =>
                    h('span', {
                        key: index,
                        class: [
                            'progress-dot',
                            { active: index === props.current, done: index < props.current },
                        ],
                    })
                )
            )
    },
})

const slug = computed(() => String(route.params.slug || '').trim())

const {
    data: business,
    pending: isLoadingBusiness,
    error: businessFetchError,
} = await useAsyncData<PublicBusiness | null>(
    () => `public-business-${slug.value}`,
    () =>
        slug.value
            ? apiFetch<PublicBusiness>(`/public/businesses/${encodeURIComponent(slug.value)}/`, { auth: false })
            : Promise.resolve(null),
    { watch: [slug], lazy: true }
)

const businessError = computed(() => {
    if (!slug.value) {
        return 'Link inválido.'
    }

    if (businessFetchError.value) {
        return (businessFetchError.value as any)?.data?.business || 'Não foi possível carregar esta página de marcações.'
    }

    return ''
})

if (import.meta.server && businessError.value) {
    const event = useRequestEvent()

    if (event) {
        setResponseStatus(event, 404)
    }
}

const step = ref(0)

useHead(() => ({
    htmlAttrs: {
        class: step.value >= 5 ? 'booking-success-lock' : undefined,
    },
    bodyAttrs: {
        class: step.value >= 5 ? 'booking-success-lock' : undefined,
    },
}))

useSeoMeta({
    title: () =>
        business.value
            ? `${business.value.name}${business.value.city ? ` · ${business.value.city}` : ''} | Klenda`
            : 'Marcações Online | Klenda',
    description: () =>
        business.value
            ? business.value.description
                || `Marca já o teu horário em ${business.value.name}${business.value.city ? ` (${business.value.city})` : ''} através da Klenda.`
            : 'Marca o teu horário online através da Klenda.',
    ogTitle: () => business.value?.name || 'Klenda',
    ogDescription: () =>
        business.value?.description
        || (business.value ? `Marca já o teu horário em ${business.value.name} através da Klenda.` : undefined),
    ogImage: () => business.value?.cover_image_url || undefined,
})

const selectedServiceUuid = ref('')
const selectedStaffUuid = ref('')
const selectedDay = ref('')
const isDatePickerOpen = ref(false)
const availableSlots = ref<AvailableSlot[]>([])
const selectedSlot = ref<string | null>(null)
const selectedSlotStartAt = ref<string | null>(null)
const isLoadingSlots = ref(false)
const slotsError = ref('')
const isSubmitting = ref(false)
const bookingError = ref('')

const customer = reactive({
    name: '',
    phone: '',
    email: '',
})

const acceptedTerms = ref(false)

const selectedService = computed(() =>
    business.value?.services.find((service) => service.uuid === selectedServiceUuid.value) || null
)

const selectedStaff = computed(() =>
    selectedService.value?.staff_members.find((staff) => staff.uuid === selectedStaffUuid.value) || null
)

const isAnyStaffSelected = computed(() => selectedStaffUuid.value === ANY_STAFF)

const hasStaffChoice = computed(() => Boolean(selectedStaff.value) || isAnyStaffSelected.value)

const selectedServiceStaffMembers = computed(() => selectedService.value?.staff_members || [])

const bookableServices = computed(() =>
    business.value?.services.filter((service) => service.staff_members.length > 0) || []
)

const primaryCategory = computed(() => categoryChips.value[0] || 'Marcações')

const categoryChips = computed(() => {
    const real = (business.value?.categories || []).filter(Boolean)

    if (real.length) {
        return real.slice(0, 3)
    }

    const names = business.value?.services.map((service) => service.name.split(' ')[0]).filter(Boolean) || []
    const uniqueNames = Array.from(new Set(names)).slice(0, 3)
    return uniqueNames.length ? uniqueNames : ['Serviços']
})

const customerCountLabel = computed(() => {
    const count = business.value?.customer_count || 0

    if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace('.0', '')}k`
    }

    return String(count)
})

const goTo = async (target: number) => {
    step.value = target

    if (target === 3) {
        await loadAvailableSlots()
    }

    if (import.meta.client) {
        window.scrollTo({ top: 0 })
    }
}

const resetAvailabilitySelection = () => {
    availableSlots.value = []
    selectedSlot.value = null
    selectedSlotStartAt.value = null
    slotsError.value = ''
    bookingError.value = ''
}

const selectService = (service: PublicService) => {
    selectedServiceUuid.value = service.uuid
    selectedStaffUuid.value = ''
    resetAvailabilitySelection()
}

const selectStaff = (staff: PublicStaffMember) => {
    if (selectedStaffUuid.value === staff.uuid) {
        return
    }

    selectedStaffUuid.value = staff.uuid
    resetAvailabilitySelection()
}

const selectAnyStaff = () => {
    if (selectedStaffUuid.value === ANY_STAFF) {
        return
    }

    selectedStaffUuid.value = ANY_STAFF
    resetAvailabilitySelection()
}

const canonicalBookingPath = computed(() =>
    `/booking/${encodeURIComponent(business.value?.slug || slug.value)}`
)

const staffProfilePath = (staff: PublicStaffMember) =>
({
    path: `${canonicalBookingPath.value}/profissional/${encodeURIComponent(staff.uuid)}`,
    query: {
        step: '2',
        service: selectedServiceUuid.value,
        staff: staff.uuid,
    },
})

const serviceStaffLabel = (service: PublicService) => {
    const firstStaff = service.staff_members[0]

    if (!firstStaff) {
        return 'sem profissional'
    }

    if (service.staff_members.length > 1) {
        return `com ${firstStaff.name} +${service.staff_members.length - 1}`
    }

    return `com ${firstStaff.name}`
}

const staffInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')

const showStaffAvatarPhoto = (staff: PublicStaffMember) =>
    Boolean(business.value?.is_pro && staff.avatar_url)

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

const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const weekdayLong = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const describeDay = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`)
    return {
        iso,
        weekday: weekdayShort[date.getDay()],
        weekdayLong: weekdayLong[date.getDay()],
        num: String(date.getDate()).padStart(2, '0'),
        month: monthShort[date.getMonth()],
    }
}

const todayIso = new Date().toISOString().slice(0, 10)

const maxBookableIso = computed(() => {
    const maxHorizonDays = business.value?.booking_settings?.max_booking_horizon_days ?? 4
    const date = new Date()
    date.setDate(date.getDate() + Math.max(0, maxHorizonDays))
    return date.toISOString().slice(0, 10)
})

const days = computed(() => {
    const base = new Date()
    const maxHorizonDays = business.value?.booking_settings?.max_booking_horizon_days ?? 4
    const visibleDays = Math.min(4, Math.max(1, maxHorizonDays))

    return Array.from({ length: visibleDays }, (_, index) => {
        const date = new Date(base)
        date.setDate(base.getDate() + index)
        return describeDay(date.toISOString().slice(0, 10))
    })
})

const selectedDayData = computed(() =>
    selectedDay.value ? describeDay(selectedDay.value) : days.value[0]
)

const isCustomDaySelected = computed(() =>
    Boolean(selectedDay.value) && !days.value.some((day) => day.iso === selectedDay.value)
)

const selectDay = (iso: string) => {
    selectedDay.value = iso
}

const selectedDayLabel = computed(() => {
    const day = selectedDayData.value
    return day ? `${day.weekday}, ${day.num} ${day.month}` : ''
})

const selectedDayName = computed(() => selectedDayData.value?.weekdayLong || '')

const morningSlots = computed(() =>
    availableSlots.value.filter((slot) => Number(slot.time.slice(0, 2)) < 13)
)

const afternoonSlots = computed(() =>
    availableSlots.value.filter((slot) => Number(slot.time.slice(0, 2)) >= 13)
)

const firstName = computed(() => (customer.name.trim().split(' ')[0]) || 'Maria')

const selectedSlotStillAvailable = computed(() =>
    Boolean(
        selectedSlotStartAt.value &&
        availableSlots.value.some((slot) => slot.start_at === selectedSlotStartAt.value)
    )
)

const canConfirm = computed(() =>
    Boolean(
        selectedService.value &&
        hasStaffChoice.value &&
        selectedSlotStillAvailable.value &&
        customer.name.trim() &&
        customer.phone.trim() &&
        customer.email.trim() &&
        acceptedTerms.value
    )
)

const maxReachableStep = computed(() => {
    if (selectedSlotStartAt.value && selectedSlotStillAvailable.value) {
        return 4
    }

    if (hasStaffChoice.value) {
        return 3
    }

    if (selectedService.value) {
        return 2
    }

    if (business.value) {
        return 1
    }

    return 0
})

const selectSlot = (slot: AvailableSlot) => {
    selectedSlot.value = slot.time
    selectedSlotStartAt.value = slot.start_at
    bookingError.value = ''
}

watch(
    business,
    (response) => {
        if (!response) {
            return
        }

        resetAvailabilitySelection()

        const firstBookableService = response.services.find((service) => service.staff_members.length > 0)
        const serviceQuery = String(route.query.service || '').trim()
        const staffQuery = String(route.query.staff || '').trim()
        const queriedService = response.services.find((service) => service.uuid === serviceQuery)
        const serviceForStaff = staffQuery
            ? response.services.find((service) =>
                service.staff_members.some((staff) => staff.uuid === staffQuery)
            )
            : null

        selectedServiceUuid.value = queriedService?.uuid || serviceForStaff?.uuid || firstBookableService?.uuid || ''

        const selectedServiceFromRoute = response.services.find((service) => service.uuid === selectedServiceUuid.value)
        selectedStaffUuid.value = selectedServiceFromRoute?.staff_members.some((staff) => staff.uuid === staffQuery)
            ? staffQuery
            : ''

        const requestedStep = Number.parseInt(String(route.query.step || ''), 10)
        const fallbackStep = selectedStaffUuid.value ? 2 : 0

        if (Number.isFinite(requestedStep)) {
            step.value = Math.max(0, Math.min(requestedStep, maxReachableStep.value))
        } else {
            step.value = fallbackStep
        }
    },
    { immediate: true }
)

const loadAvailableSlots = async () => {
    if (!business.value || !selectedService.value || !hasStaffChoice.value || !selectedDay.value) {
        availableSlots.value = []
        return
    }

    try {
        isLoadingSlots.value = true
        slotsError.value = ''
        selectedSlot.value = null
        selectedSlotStartAt.value = null

        let endpoint = `/public/available-slots/?business=${encodeURIComponent(business.value.slug)}&service=${selectedService.value.uuid}&date=${selectedDay.value}`

        if (selectedStaff.value) {
            endpoint += `&staff=${selectedStaff.value.uuid}`
        }

        const response = await apiFetch<{ slots: AvailableSlot[] }>(endpoint, { auth: false })

        const minNoticeMs = (business.value.booking_settings?.min_booking_notice_minutes || 0) * 60000
        const earliestAllowed = Date.now() + minNoticeMs

        availableSlots.value = response.slots
            .filter((slot) => new Date(slot.start_at).getTime() > earliestAllowed)
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    } catch (error: any) {
        console.error(error)
        availableSlots.value = []
        slotsError.value = error?.data?.date || error?.data?.service || error?.data?.staff || 'Não foi possível carregar horários.'
    } finally {
        isLoadingSlots.value = false
    }
}

const confirm = async () => {
    if (!business.value || !selectedService.value || !hasStaffChoice.value || !selectedSlotStartAt.value) {
        return
    }

    if (!selectedSlotStillAvailable.value) {
        bookingError.value = 'Este horário já não está disponível. Escolhe outro horário.'
        await loadAvailableSlots()
        return
    }

    try {
        isSubmitting.value = true
        bookingError.value = ''

        await apiFetch('/public/appointments/', {
            method: 'POST',
            auth: false,
            body: {
                business_slug: business.value.slug,
                service_uuid: selectedService.value.uuid,
                ...(selectedStaff.value ? { staff_uuid: selectedStaff.value.uuid } : {}),
                start_at: selectedSlotStartAt.value,
                customer_name: customer.name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                source: 'public_page',
            },
        })

        goTo(5)
    } catch (error: any) {
        console.error(error)
        const data = error?.data
        bookingError.value =
            data?.start_at ||
            data?.customer_phone ||
            data?.non_field_errors?.[0] ||
            'Não foi possível confirmar a marcação. Escolhe outro horário ou tenta novamente.'
    } finally {
        isSubmitting.value = false
    }
}

const reset = async () => {
    const firstBookableService = bookableServices.value[0]
    selectedServiceUuid.value = firstBookableService?.uuid || ''
    selectedStaffUuid.value = ''
    resetAvailabilitySelection()
    customer.name = ''
    customer.phone = ''
    customer.email = ''
    acceptedTerms.value = false
    await goTo(0)
}

const returnToBusinessLanding = async () => {
    await navigateTo(canonicalBookingPath.value, { replace: true })
    await reset()
}

const syncWizardRoute = async () => {
    if (!import.meta.client || isSyncingWizardRoute.value) {
        return
    }

    const currentStep = String(route.query.step || '')
    const currentService = String(route.query.service || '')
    const currentStaff = String(route.query.staff || '')

    const nextQuery: Record<string, string> = {}

    if (step.value > 0) {
        nextQuery.step = String(step.value)
    }

    if (selectedServiceUuid.value) {
        nextQuery.service = selectedServiceUuid.value
    }

    if (selectedStaffUuid.value) {
        nextQuery.staff = selectedStaffUuid.value
    }

    if (
        currentStep === String(nextQuery.step || '')
        && currentService === String(nextQuery.service || '')
        && currentStaff === String(nextQuery.staff || '')
    ) {
        return
    }

    isSyncingWizardRoute.value = true

    try {
        await router.replace({
            query: nextQuery,
        })
    } finally {
        isSyncingWizardRoute.value = false
    }
}

watch([selectedDay, selectedServiceUuid, selectedStaffUuid], () => {
    if (step.value === 3) {
        loadAvailableSlots()
    }
})

watch([step, selectedServiceUuid, selectedStaffUuid], () => {
    syncWizardRoute()
})

watch(
    [
        () => String(route.query.step || ''),
        () => String(route.query.service || ''),
        () => String(route.query.staff || ''),
    ],
    () => {
        if (isSyncingWizardRoute.value || !business.value) {
            return
        }

        const serviceQuery = String(route.query.service || '').trim()
        const staffQuery = String(route.query.staff || '').trim()
        const requestedStep = Number.parseInt(String(route.query.step || ''), 10)
        const serviceForStaff = staffQuery
            ? business.value.services.find((service) =>
                service.staff_members.some((staff) => staff.uuid === staffQuery)
            )
            : null
        const queriedService = business.value.services.find((service) => service.uuid === serviceQuery)
        const nextServiceUuid = queriedService?.uuid || serviceForStaff?.uuid || selectedServiceUuid.value
        const nextStaffUuid = serviceForStaff?.staff_members.some((staff) => staff.uuid === staffQuery) ? staffQuery : ''

        if (nextServiceUuid !== selectedServiceUuid.value) {
            selectedServiceUuid.value = nextServiceUuid
        }

        if (nextStaffUuid !== selectedStaffUuid.value) {
            selectedStaffUuid.value = nextStaffUuid
        }

        if (Number.isFinite(requestedStep)) {
            step.value = Math.max(0, Math.min(requestedStep, maxReachableStep.value))
            return
        }

        if (nextStaffUuid && step.value < 2) {
            step.value = 2
        }
    }
)

watch(slug, () => {
    selectedDay.value = days.value[1]?.iso || days.value[0]?.iso || ''
}, { immediate: true })
</script>

<style scoped>
:global(html.booking-success-lock),
:global(body.booking-success-lock) {
    height: 100%;
    overflow: hidden;
}

:global(body.booking-success-lock #__nuxt) {
    height: 100svh;
    overflow: hidden;
}

.booking-viewport {
    min-height: 100svh;
    background: #fdfcf9;
}

.device {
    width: 100%;
    min-height: 100svh;
    background: #fdfcf9;
}

.screen {
    display: flex;
    flex-direction: column;
    min-height: 100svh;
}

.state-screen {
    justify-content: center;
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

.state-screen h2 {
    margin: 0;
    font-size: 34px;
    line-height: 0.98;
}

.state-copy {
    margin: 18px 0 0;
    color: var(--tf-muted);
    line-height: 1.5;
}

/* ---- landing hero ---- */
.hero {
    position: relative;
    height: 340px;
    flex-shrink: 0;
    background: repeating-linear-gradient(135deg, #17171d 0 14px, #111116 14px 28px);
}

.hero-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(11, 11, 15, 0.35), transparent 40%, rgba(11, 11, 15, 0.85));
}

.hero-brand {
    position: absolute;
    left: 24px;
    top: 40px;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.hero-title {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 22px;
    color: #fff;
}

.hero-title h1 {
    margin: 0;
    font-size: 38px;
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.92;
}

.hero-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    font-size: 13px;
    color: #d8d5cd;
}

.rating {
    color: var(--tf-accent);
    font-weight: 800;
}

.landing-body {
    flex: 1;
    padding: 22px 24px 0;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.chip {
    padding: 8px 14px;
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

.landing-lede {
    margin: 0 0 20px;
    font-size: 15px;
    line-height: 1.6;
    color: #4a483f;
}

.landing-stats {
    display: flex;
    gap: 14px;
}

.stat {
    flex: 1;
    padding: 16px;
    border-radius: 18px;
    background: #f4f1ea;
}

.stat strong {
    display: block;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0;
}

.stat span {
    display: block;
    margin-top: 4px;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.gallery-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    margin-top: 20px;
}

.gallery-strip-photo {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 16px;
    object-fit: cover;
    background: #f1ecdf;
}

/* ---- shared step chrome ---- */
.step-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 0;
}

.back {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: #f1ecdf;
    font-size: 18px;
    font-weight: 800;
    cursor: pointer;
}

.head-spacer {
    width: 40px;
}

.progress-dots {
    display: flex;
    gap: 6px;
}

.progress-dot {
    width: 9px;
    height: 5px;
    border-radius: 9px;
    background: #e0dbcf;
    transition: width 0.2s ease, background 0.2s ease;
}

.progress-dot.active {
    width: 26px;
    background: var(--tf-black);
}

.progress-dot.done {
    background: var(--tf-black);
}

.step-intro {
    padding: 18px 24px 18px;
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

.step-intro h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 0;
}

.screen-body {
    flex: 1;
    padding: 0 24px;
    padding-bottom: 18px;
}

/* ---- service list ---- */
.service-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.service-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 18px;
    border: 1px solid var(--tf-border);
    border-radius: 20px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.service-row.selected {
    background: var(--tf-black);
    border-color: var(--tf-black);
    color: #fff;
}

.service-row.unavailable {
    opacity: 0.55;
}

.service-name {
    font-weight: 800;
    font-size: 16px;
}

.service-meta {
    margin-top: 3px;
    font-size: 13px;
    color: var(--tf-muted);
}

.service-row.selected .service-meta {
    color: #b7b3aa;
}

.service-price-col {
    text-align: right;
}

.service-price {
    font-weight: 900;
    font-size: 20px;
    letter-spacing: 0;
}

.service-row.selected .service-price {
    color: var(--tf-accent);
}

.check {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    margin: 6px 0 0 auto;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 12px;
    font-weight: 900;
}

.staff-section {
    margin-top: 24px;
}

.staff-section-head {
    margin-bottom: 14px;
}

.staff-section-head h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 0;
}

.staff-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.staff-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--tf-border);
    border-radius: 20px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.staff-card.selected {
    background: var(--tf-black);
    border-color: var(--tf-black);
    color: #fff;
}

.staff-avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #f1ecdf;
    color: var(--tf-black);
    font-weight: 900;
    font-size: 17px;
    overflow: hidden;
}

.staff-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.staff-card.selected .staff-avatar {
    background: #2a2a32;
    color: var(--tf-accent);
}

.staff-avatar-any {
    background: var(--tf-accent);
    font-size: 20px;
}

.staff-card-any {
    border-style: dashed;
}

.staff-copy {
    min-width: 0;
    flex: 1;
}

.staff-name {
    font-size: 16px;
    font-weight: 800;
}

.staff-meta {
    margin-top: 2px;
    color: var(--tf-muted);
    font-size: 12px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}

.staff-card.selected .staff-meta {
    color: #b7b3aa;
}

.staff-profile-link {
    display: inline-block;
    margin-top: 6px;
    font-family: var(--tf-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #9a958a;
    text-decoration: underline;
    text-underline-offset: 3px;
}

.staff-card.selected .staff-profile-link {
    color: var(--tf-accent);
}

.staff-check {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 12px;
    font-weight: 900;
}

/* ---- date / time ---- */
.day-row {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
}

.day {
    flex: 1;
    padding: 12px 0;
    border: 1px solid var(--tf-border);
    border-radius: 16px;
    background: #fff;
    text-align: center;
    cursor: pointer;
}

.day.selected {
    background: var(--tf-black);
    border-color: var(--tf-black);
    color: #fff;
}

.day-name {
    display: block;
    font-family: var(--tf-mono);
    font-size: 10px;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.day.selected .day-name {
    color: var(--tf-accent);
}

.day-num {
    display: block;
    margin-top: 3px;
    font-size: 20px;
    font-weight: 900;
}

.day-calendar {
    flex: 0 0 auto;
    width: 52px;
    display: grid;
    place-items: center;
}

.day-calendar-icon {
    width: 20px;
    height: 20px;
    color: var(--tf-muted);
}

.day-calendar.selected .day-calendar-icon {
    color: var(--tf-accent);
}

.slot-state {
    margin: 18px 0 0;
    padding: 18px;
    border-radius: 16px;
    background: #f4f1ea;
    color: var(--tf-muted);
    font-weight: 800;
}

.slot-state-error {
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
}

.slot-group-label {
    margin: 0 0 14px;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-muted);
}

.slot-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 22px;
}

.slot {
    padding: 14px 0;
    border: 1px solid var(--tf-border);
    border-radius: 14px;
    background: #fff;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
}

.slot.selected {
    background: var(--tf-accent);
    border-color: var(--tf-black);
}

/* ---- data ---- */
.mb {
    margin-bottom: 16px;
}

.summary-card {
    margin-top: 22px;
    padding: 20px;
    border-radius: 22px;
    background: var(--tf-black);
    color: #fff;
}

.summary-eyebrow {
    margin: 0 0 16px;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
}

.summary-service {
    font-weight: 800;
    font-size: 17px;
}

.summary-price {
    color: var(--tf-accent);
    font-weight: 900;
    font-size: 18px;
}

.summary-bottom {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding-top: 14px;
    border-top: 1px solid #26262d;
    font-size: 14px;
    color: #b7b3aa;
}

.terms-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 18px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--tf-muted);
}

.terms-row input[type='checkbox'] {
    margin-top: 3px;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.terms-row a {
    color: var(--tf-ink);
    font-weight: 700;
    text-decoration: underline;
}

.booking-error {
    margin: 16px 0 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tf-danger-bg);
    color: var(--tf-danger-fg);
    font-weight: 800;
}

/* ---- CTA footer ---- */
.screen-cta {
    position: sticky;
    bottom: 0;
    padding: 16px 24px 26px;
    background: #fdfcf9;
    border-top: 1px solid rgba(230, 225, 213, 0.75);
}

.screen-cta--fade {
    background: linear-gradient(to top, #fdfcf9 82%, rgba(253, 252, 249, 0));
    border-top: 0;
}

.block-btn {
    width: 100%;
    height: 56px;
    font-size: 17px;
}

.powered {
    margin: 12px 0 0;
    text-align: center;
    font-family: var(--tf-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #a8a397;
}

/* ---- success ---- */
.success {
    position: relative;
    height: 100svh;
    min-height: 100svh;
    overflow: hidden;
    background: var(--tf-black);
    color: #fff;
}

.success-watermark {
    position: absolute;
    bottom: -40px;
    right: -30px;
    font-size: 200px;
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.8;
    color: rgba(255, 255, 255, 0.04);
    pointer-events: none;
}

.success-body {
    position: relative;
    flex: 1;
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: clamp(22px, 4svh, 40px) 24px;
}

.success-check {
    display: grid;
    place-items: center;
    width: clamp(58px, 10svh, 82px);
    height: clamp(58px, 10svh, 82px);
    margin-bottom: clamp(14px, 3svh, 28px);
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: clamp(28px, 5svh, 40px);
    font-weight: 900;
}

.success-eyebrow {
    margin: 0 0 clamp(8px, 1.5svh, 14px);
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.success h2 {
    margin: 0;
    font-size: clamp(30px, 6svh, 40px);
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.95;
    text-transform: capitalize;
}

.success-lede {
    margin: clamp(12px, 2svh, 18px) 0 clamp(16px, 3svh, 24px);
    color: #b7b3aa;
    font-size: 15px;
    line-height: 1.55;
}

.success-card {
    padding: clamp(14px, 2.5svh, 20px);
    margin-bottom: clamp(14px, 3svh, 22px);
    border-radius: 22px;
    background: #17171d;
}

.success-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: clamp(10px, 2svh, 14px);
}

.qr {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: repeating-linear-gradient(45deg, #2a2a32 0 4px, #22222a 4px 8px);
}

.success-rows {
    display: flex;
    flex-direction: column;
    gap: clamp(6px, 1.2svh, 9px);
    font-size: 14px;
}

.success .block-btn {
    height: clamp(48px, 7svh, 56px);
}

.success .mb {
    margin-bottom: 10px;
}

.success-rows div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
}

.success-rows span:first-child {
    color: #77736a;
}

.success-rows .accent {
    color: var(--tf-accent);
    font-weight: 800;
}

@media (max-height: 720px) {
    .success-body {
        padding-top: 18px;
        padding-bottom: 18px;
    }

    .success-check {
        width: 52px;
        height: 52px;
        margin-bottom: 12px;
        font-size: 26px;
    }

    .success-eyebrow {
        margin-bottom: 7px;
        font-size: 10px;
    }

    .success h2 {
        font-size: 30px;
    }

    .success-lede {
        margin: 10px 0 14px;
        font-size: 13px;
        line-height: 1.4;
    }

    .success-card {
        padding: 12px 14px;
        margin-bottom: 12px;
        border-radius: 18px;
    }

    .success-card-top {
        margin-bottom: 8px;
    }

    .success-rows {
        gap: 5px;
        font-size: 13px;
    }

    .success .block-btn {
        height: 46px;
        font-size: 15px;
    }
}

@media (max-height: 620px) {
    .success-watermark {
        display: none;
    }

    .success-check {
        width: 46px;
        height: 46px;
        margin-bottom: 10px;
    }

    .success-lede {
        display: none;
    }

    .success-card {
        padding: 10px 12px;
    }
}

.ghost {
    background: transparent;
    color: #fff;
    border: 1px solid #2f2f37;
    font-weight: 700;
}

.ghost:hover {
    box-shadow: none;
}

@media (min-width: 760px) {

    .hero-title,
    .hero-brand,
    .landing-body,
    .step-head,
    .step-intro,
    .screen-body,
    .screen-cta,
    .success-body,
    .state-screen {
        max-width: 560px;
        margin-right: auto;
        margin-left: auto;
        width: 100%;
    }

    .hero {
        height: 380px;
    }
}

@media (min-width: 920px) {
    .booking-viewport {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
        background:
            radial-gradient(circle at 18% 18%, rgba(215, 255, 62, 0.14), transparent 28%),
            var(--tf-canvas);
    }

    .device {
        width: min(1180px, 100%);
        min-height: calc(100svh - 64px);
        border: 1px solid #d9d2c2;
        border-radius: 30px;
        box-shadow: 0 34px 90px -46px rgba(11, 11, 15, 0.48);
        overflow: hidden;
    }

    .screen {
        min-height: calc(100svh - 64px);
    }

    .landing {
        display: grid;
        grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
        grid-template-rows: 1fr auto;
        background: #fdfcf9;
    }

    .landing .hero {
        grid-row: 1 / 3;
        height: auto;
        min-height: calc(100svh - 64px);
    }

    .landing .hero-brand,
    .landing .hero-title {
        max-width: none;
        margin: 0;
    }

    .landing .hero-brand {
        top: 54px;
        left: 54px;
    }

    .landing .hero-title {
        right: 54px;
        bottom: 56px;
        left: 54px;
    }

    .landing .hero-title h1 {
        font-size: clamp(46px, 5vw, 72px);
        max-width: 9ch;
    }

    .landing-body {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 70px 72px 24px;
    }

    .landing-lede {
        max-width: 36ch;
        font-size: 20px;
    }

    .landing-stats {
        max-width: 420px;
    }

    .landing .screen-cta {
        position: static;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 24px 72px 56px;
        border-top: 0;
        background: transparent;
    }

    .landing .block-btn {
        max-width: 420px;
    }

    .screen:not(.landing):not(.success):not(.state-screen) {
        display: grid;
        grid-template-columns: minmax(300px, 0.82fr) minmax(440px, 1.18fr);
        grid-template-rows: auto 1fr auto;
        column-gap: 56px;
        padding: 44px 58px;
        background: #fdfcf9;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .step-head {
        grid-column: 1 / -1;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0 0 34px;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .step-intro {
        grid-column: 1;
        grid-row: 2 / 4;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 6px 0 0;
        align-self: start;
        position: sticky;
        top: 44px;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .step-intro h2 {
        max-width: 9ch;
        font-size: clamp(46px, 5vw, 68px);
        line-height: 0.9;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .screen-body {
        grid-column: 2;
        grid-row: 2;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 0;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .screen-cta {
        position: static;
        grid-column: 2;
        grid-row: 3;
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 24px 0 0;
        border-top: 0;
        background: transparent;
    }

    .screen:not(.landing):not(.success):not(.state-screen) .block-btn {
        max-width: 420px;
    }

    .service-list {
        gap: 14px;
    }

    .service-row {
        min-height: 98px;
        padding: 22px 24px;
        border-radius: 24px;
    }

    .service-name {
        font-size: 20px;
    }

    .service-price {
        font-size: 26px;
    }

    .staff-section {
        margin-top: 28px;
        max-width: 620px;
    }

    .staff-card {
        min-height: 88px;
        padding: 18px 20px;
        border-radius: 24px;
    }

    .staff-avatar {
        width: 56px;
        height: 56px;
        font-size: 18px;
    }

    .staff-name {
        font-size: 17px;
    }

    .day-row {
        max-width: 520px;
        gap: 14px;
    }

    .day {
        min-height: 86px;
    }

    .slot-grid {
        grid-template-columns: repeat(4, minmax(96px, 1fr));
        max-width: 640px;
        gap: 12px;
    }

    .slot {
        min-height: 58px;
        padding: 0;
        font-size: 17px;
    }

    .summary-card {
        max-width: 620px;
    }

    .success {
        align-items: center;
        height: calc(100svh - 64px);
        min-height: calc(100svh - 64px);
    }

    .success-body {
        width: min(680px, 100%);
        max-width: none;
        margin: 0 auto;
        padding: clamp(42px, 7svh, 72px) 40px;
    }

    .success h2 {
        font-size: clamp(44px, 7svh, 58px);
        max-width: 9ch;
    }

    .success-card {
        max-width: 560px;
    }

    .state-screen {
        max-width: 680px;
        margin: 0 auto;
    }
}

@media (max-width: 420px) {
    .hero {
        height: 320px;
    }

    .hero-title h1 {
        font-size: 34px;
    }

    .step-intro h2 {
        font-size: 30px;
    }

    .day-row,
    .slot-grid {
        gap: 8px;
    }

    .slot {
        font-size: 14px;
    }
}
</style>
