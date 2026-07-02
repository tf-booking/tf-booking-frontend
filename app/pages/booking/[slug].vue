<template>
    <div class="booking-viewport">
        <div class="device">
            <section v-if="isLoadingBusiness" class="screen state-screen">
                <div class="state-mark">TF</div>
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
                    <div class="hero-overlay"></div>
                    <div class="hero-brand">TF Booking</div>
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
                        <span
                            v-for="chip in categoryChips"
                            :key="chip"
                            class="chip"
                            :class="{ 'chip-dark': chip === categoryChips[0] }"
                        >
                            {{ chip }}
                        </span>
                    </div>

                    <p class="landing-lede">
                        Escolhe o serviço, vê os horários disponíveis e confirma a marcação em segundos.
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
                </div>

                <div class="screen-cta screen-cta--fade">
                    <button
                        class="btn btn-accent block-btn"
                        type="button"
                        :disabled="bookableServices.length === 0"
                        @click="goTo(1)"
                    >
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

                <div class="screen-body service-list">
                    <button
                        v-for="service in business.services"
                        :key="service.uuid"
                        type="button"
                        class="service-row"
                        :class="{
                            selected: selectedServiceUuid === service.uuid,
                            unavailable: service.staff_members.length === 0,
                        }"
                        :disabled="service.staff_members.length === 0"
                        @click="selectService(service)"
                    >
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

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!selectedService" @click="goTo(2)">
                        Continuar →
                    </button>
                </div>
            </section>

            <!-- ============ STEP 2 · DATE / TIME ============ -->
            <section v-else-if="step === 2" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(1)">‹</button>
                    <ProgressDots :current="2" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 2 de 4</p>
                    <h2>Quando queres vir?</h2>
                </div>

                <div class="screen-body">
                    <div class="day-row">
                        <button
                            v-for="day in days"
                            :key="day.iso"
                            type="button"
                            class="day"
                            :class="{ selected: selectedDay === day.iso }"
                            @click="selectedDay = day.iso"
                        >
                            <span class="day-name">{{ day.weekday }}</span>
                            <span class="day-num">{{ day.num }}</span>
                        </button>
                    </div>

                    <p v-if="isLoadingSlots" class="slot-state">A procurar horários disponíveis...</p>
                    <p v-else-if="slotsError" class="slot-state slot-state-error">{{ slotsError }}</p>
                    <p v-else-if="availableSlots.length === 0" class="slot-state">
                        Sem horários disponíveis para este dia.
                    </p>

                    <template v-else>
                        <template v-if="morningSlots.length">
                            <p class="slot-group-label">Manhã</p>
                            <div class="slot-grid">
                                <button
                                    v-for="slot in morningSlots"
                                    :key="slot.start_at"
                                    type="button"
                                    class="slot"
                                    :class="{ selected: selectedSlotStartAt === slot.start_at }"
                                    @click="selectSlot(slot)"
                                >
                                    {{ slot.time }}
                                </button>
                            </div>
                        </template>

                        <template v-if="afternoonSlots.length">
                            <p class="slot-group-label">Tarde</p>
                            <div class="slot-grid">
                                <button
                                    v-for="slot in afternoonSlots"
                                    :key="slot.start_at"
                                    type="button"
                                    class="slot"
                                    :class="{ selected: selectedSlotStartAt === slot.start_at }"
                                    @click="selectSlot(slot)"
                                >
                                    {{ slot.time }}
                                </button>
                            </div>
                        </template>
                    </template>
                </div>

                <div class="screen-cta">
                    <button
                        class="btn btn-accent block-btn"
                        type="button"
                        :disabled="!selectedSlotStartAt"
                        @click="goTo(3)"
                    >
                        Continuar<span v-if="selectedSlot"> → {{ selectedSlot }}</span>
                    </button>
                </div>
            </section>

            <!-- ============ STEP 3 · DATA ============ -->
            <section v-else-if="step === 3" class="screen">
                <header class="step-head">
                    <button class="back" type="button" @click="goTo(2)">‹</button>
                    <ProgressDots :current="3" />
                    <span class="head-spacer"></span>
                </header>

                <div class="step-intro">
                    <p class="step-count">Passo 3 de 4</p>
                    <h2>Os teus dados</h2>
                </div>

                <div class="screen-body">
                    <label class="label">Nome</label>
                    <input v-model="customer.name" class="input mb" type="text" placeholder="Maria Silva" />

                    <label class="label">Telemóvel</label>
                    <input v-model="customer.phone" class="input mb" type="tel" placeholder="+351 912 345 678" />

                    <label class="label">Email</label>
                    <input v-model="customer.email" class="input" type="email" placeholder="maria@email.pt" />

                    <div class="summary-card">
                        <p class="summary-eyebrow">Resumo</p>
                        <div class="summary-top">
                            <span class="summary-service">{{ selectedService?.name }}</span>
                            <span class="summary-price">{{ selectedService ? formatPrice(selectedService.price) : '' }}</span>
                        </div>
                        <div class="summary-bottom">
                            <span>{{ selectedDayLabel }} · {{ selectedSlot }}</span>
                            <span>{{ selectedService?.duration_minutes }} min · {{ selectedStaff?.name }}</span>
                        </div>
                    </div>

                    <p v-if="bookingError" class="booking-error">{{ bookingError }}</p>
                </div>

                <div class="screen-cta">
                    <button
                        class="btn btn-accent block-btn"
                        type="button"
                        :disabled="!canConfirm || isSubmitting"
                        @click="confirm"
                    >
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
                            <div><span>Local</span><span>{{ business.name }}{{ business.city ? `, ${business.city}` : '' }}</span></div>
                            <div><span>Total</span><span class="accent">{{ selectedService ? formatPrice(selectedService.price) : '' }}</span></div>
                        </div>
                    </div>

                    <button class="btn btn-accent block-btn mb" type="button" @click="reset">
                        Fazer nova marcação
                    </button>
                    <NuxtLink class="btn ghost block-btn" :to="`/${business.slug}`">
                        Ver página do negócio
                    </NuxtLink>
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
    service_count: number
    customer_count: number
    services: PublicService[]
}

type AvailableSlot = {
    time: string
    start_at: string
    end_at: string
}

const route = useRoute()
const { apiFetch } = useApi()

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

const business = ref<PublicBusiness | null>(null)
const isLoadingBusiness = ref(true)
const businessError = ref('')

const step = ref(0)
const selectedServiceUuid = ref('')
const selectedStaffUuid = ref('')
const selectedDay = ref('')
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

const selectedService = computed(() =>
    business.value?.services.find((service) => service.uuid === selectedServiceUuid.value) || null
)

const selectedStaff = computed(() =>
    selectedService.value?.staff_members.find((staff) => staff.uuid === selectedStaffUuid.value) ||
    selectedService.value?.staff_members[0] ||
    null
)

const bookableServices = computed(() =>
    business.value?.services.filter((service) => service.staff_members.length > 0) || []
)

const primaryCategory = computed(() => categoryChips.value[0] || 'Marcações')

const categoryChips = computed(() => {
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

    if (target === 2) {
        await loadAvailableSlots()
    }

    if (import.meta.client) {
        window.scrollTo({ top: 0 })
    }
}

const selectService = (service: PublicService) => {
    selectedServiceUuid.value = service.uuid
    selectedStaffUuid.value = service.staff_members[0]?.uuid || ''
    selectedSlot.value = null
    selectedSlotStartAt.value = null
    slotsError.value = ''
}

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

const days = computed(() => {
    const base = new Date()
    return Array.from({ length: 4 }, (_, index) => {
        const date = new Date(base)
        date.setDate(base.getDate() + index)
        const iso = date.toISOString().slice(0, 10)
        return {
            iso,
            weekday: weekdayShort[date.getDay()],
            weekdayLong: weekdayLong[date.getDay()],
            num: String(date.getDate()).padStart(2, '0'),
            month: monthShort[date.getMonth()],
        }
    })
})

const selectedDayData = computed(() =>
    days.value.find((day) => day.iso === selectedDay.value) || days.value[0]
)

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

const canConfirm = computed(() =>
    Boolean(
        selectedService.value &&
        selectedStaff.value &&
        selectedSlotStartAt.value &&
        customer.name.trim() &&
        customer.phone.trim()
    )
)

const selectSlot = (slot: AvailableSlot) => {
    selectedSlot.value = slot.time
    selectedSlotStartAt.value = slot.start_at
    bookingError.value = ''
}

const loadPublicBusiness = async () => {
    if (!slug.value) {
        business.value = null
        businessError.value = 'Link inválido.'
        isLoadingBusiness.value = false
        return
    }

    try {
        isLoadingBusiness.value = true
        businessError.value = ''

        const response = await apiFetch<PublicBusiness>(`/public/businesses/${encodeURIComponent(slug.value)}/`)
        business.value = response

        const firstBookableService = response.services.find((service) => service.staff_members.length > 0)
        selectedServiceUuid.value = firstBookableService?.uuid || ''
        selectedStaffUuid.value = firstBookableService?.staff_members[0]?.uuid || ''
        selectedSlot.value = null
        selectedSlotStartAt.value = null
        step.value = 0
    } catch (error: any) {
        console.error(error)
        business.value = null
        businessError.value = error?.data?.business || 'Não foi possível carregar esta página de marcações.'
    } finally {
        isLoadingBusiness.value = false
    }
}

const loadAvailableSlots = async () => {
    if (!business.value || !selectedService.value || !selectedStaff.value || !selectedDay.value) {
        availableSlots.value = []
        return
    }

    try {
        isLoadingSlots.value = true
        slotsError.value = ''
        selectedSlot.value = null
        selectedSlotStartAt.value = null

        const response = await apiFetch<{ slots: AvailableSlot[] }>(
            `/public/available-slots/?business=${encodeURIComponent(business.value.slug)}&service=${selectedService.value.uuid}&staff=${selectedStaff.value.uuid}&date=${selectedDay.value}`
        )

        availableSlots.value = response.slots
    } catch (error: any) {
        console.error(error)
        availableSlots.value = []
        slotsError.value = error?.data?.date || error?.data?.service || error?.data?.staff || 'Não foi possível carregar horários.'
    } finally {
        isLoadingSlots.value = false
    }
}

const confirm = async () => {
    if (!business.value || !selectedService.value || !selectedStaff.value || !selectedSlotStartAt.value) {
        return
    }

    try {
        isSubmitting.value = true
        bookingError.value = ''

        await apiFetch('/public/appointments/', {
            method: 'POST',
            body: {
                business_slug: business.value.slug,
                service_uuid: selectedService.value.uuid,
                staff_uuid: selectedStaff.value.uuid,
                start_at: selectedSlotStartAt.value,
                customer_name: customer.name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                source: 'public_page',
            },
        })

        goTo(4)
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
    selectedStaffUuid.value = firstBookableService?.staff_members[0]?.uuid || ''
    selectedSlot.value = null
    selectedSlotStartAt.value = null
    availableSlots.value = []
    customer.name = ''
    customer.phone = ''
    customer.email = ''
    bookingError.value = ''
    await goTo(0)
}

watch([selectedDay, selectedServiceUuid, selectedStaffUuid], () => {
    if (step.value === 2) {
        loadAvailableSlots()
    }
})

onMounted(() => {
    selectedDay.value = days.value[1]?.iso || days.value[0]?.iso || ''
    loadPublicBusiness()
})
</script>

<style scoped>
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 30px;
}

.success-check {
    display: grid;
    place-items: center;
    width: 82px;
    height: 82px;
    margin-bottom: 32px;
    border-radius: 50%;
    background: var(--tf-accent);
    color: var(--tf-black);
    font-size: 40px;
    font-weight: 900;
}

.success-eyebrow {
    margin: 0 0 14px;
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--tf-accent);
}

.success h2 {
    margin: 0;
    font-size: 40px;
    font-weight: 900;
    letter-spacing: 0;
    line-height: 0.95;
    text-transform: capitalize;
}

.success-lede {
    margin: 18px 0 30px;
    color: #b7b3aa;
    font-size: 15px;
    line-height: 1.55;
}

.success-card {
    padding: 20px;
    margin-bottom: 26px;
    border-radius: 22px;
    background: #17171d;
}

.success-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
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
    gap: 9px;
    font-size: 14px;
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
