<template>
    <div class="booking-viewport">
        <div class="device">
            <!-- ============ STEP 0 · LANDING ============ -->
            <section v-if="step === 0" class="screen landing">
                <div class="hero">
                    <div class="hero-overlay"></div>
                    <div class="hero-brand">TF Booking</div>
                    <div class="hero-title">
                        <h1>{{ businessName }}</h1>
                        <div class="hero-meta">
                            <span class="rating">★ 4.9</span>
                            <span>·</span>
                            <span>Estética &amp; Cabelo</span>
                            <span>·</span>
                            <span>Porto</span>
                        </div>
                    </div>
                </div>

                <div class="landing-body">
                    <div class="chips">
                        <span class="chip chip-dark">Cabelo</span>
                        <span class="chip">Pele</span>
                        <span class="chip">Unhas</span>
                    </div>

                    <p class="landing-lede">
                        Cuidamos de ti do início ao fim. Marca em segundos e recebe
                        confirmação por WhatsApp.
                    </p>

                    <div class="landing-stats">
                        <div class="stat">
                            <strong>2.4k</strong>
                            <span>Clientes</span>
                        </div>
                        <div class="stat">
                            <strong>12</strong>
                            <span>Serviços</span>
                        </div>
                    </div>
                </div>

                <div class="screen-cta screen-cta--fade">
                    <button class="btn btn-accent block-btn" type="button" @click="goTo(1)">
                        Marcar agora →
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
                    <button v-for="service in services" :key="service.id" type="button" class="service-row"
                        :class="{ selected: selectedServiceId === service.id }" @click="selectedServiceId = service.id">
                        <div>
                            <div class="service-name">{{ service.name }}</div>
                            <div class="service-meta">{{ service.duration }} min · com {{ service.staff }}</div>
                        </div>
                        <div class="service-price-col">
                            <div class="service-price">{{ service.price }}€</div>
                            <span v-if="selectedServiceId === service.id" class="check">✓</span>
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
                        <button v-for="day in days" :key="day.iso" type="button" class="day"
                            :class="{ selected: selectedDay === day.iso }" @click="selectedDay = day.iso">
                            <span class="day-name">{{ day.weekday }}</span>
                            <span class="day-num">{{ day.num }}</span>
                        </button>
                    </div>

                    <p class="slot-group-label">Manhã</p>
                    <div class="slot-grid">
                        <button v-for="slot in morningSlots" :key="slot.time" type="button" class="slot"
                            :class="{ selected: selectedSlot === slot.time, unavailable: !slot.available }"
                            :disabled="!slot.available" @click="selectedSlot = slot.time">
                            {{ slot.time }}
                        </button>
                    </div>

                    <p class="slot-group-label">Tarde</p>
                    <div class="slot-grid">
                        <button v-for="slot in afternoonSlots" :key="slot.time" type="button" class="slot"
                            :class="{ selected: selectedSlot === slot.time, unavailable: !slot.available }"
                            :disabled="!slot.available" @click="selectedSlot = slot.time">
                            {{ slot.time }}
                        </button>
                    </div>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!selectedSlot" @click="goTo(3)">
                        Continuar → {{ selectedSlot }}
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
                    <input v-model="customer.phone" class="input" type="tel" placeholder="+351 912 345 678" />

                    <div class="summary-card">
                        <p class="summary-eyebrow">Resumo</p>
                        <div class="summary-top">
                            <span class="summary-service">{{ selectedService?.name }}</span>
                            <span class="summary-price">{{ selectedService?.price }}€</span>
                        </div>
                        <div class="summary-bottom">
                            <span>{{ selectedDayLabel }} · {{ selectedSlot }}</span>
                            <span>{{ selectedService?.duration }} min · {{ selectedService?.staff }}</span>
                        </div>
                    </div>
                </div>

                <div class="screen-cta">
                    <button class="btn btn-accent block-btn" type="button" :disabled="!canConfirm" @click="confirm">
                        Confirmar marcação
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
                        Enviámos os detalhes por WhatsApp. Podes remarcar até 24h antes.
                    </p>

                    <div class="success-card">
                        <div class="success-card-top">
                            <span class="summary-service">{{ selectedService?.name }}</span>
                            <span class="qr"></span>
                        </div>
                        <div class="success-rows">
                            <div><span>Data</span><span>{{ selectedDayLabel }} · {{ selectedSlot }}</span></div>
                            <div><span>Local</span><span>{{ businessName }}, Porto</span></div>
                            <div><span>Total</span><span class="accent">{{ selectedService?.price }}€</span></div>
                        </div>
                    </div>

                    <button class="btn btn-accent block-btn mb" type="button">Adicionar ao calendário</button>
                    <button class="btn ghost block-btn" type="button" @click="reset">Ver a minha marcação</button>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: false,
})

const route = useRoute()

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

const businessName = computed(() => {
    const slug = String(route.params.slug || 'estudio-marta')
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
})

const step = ref(0)

const goTo = (target: number) => {
    step.value = target
    if (import.meta.client) {
        window.scrollTo({ top: 0 })
    }
}

type Service = {
    id: number
    name: string
    duration: number
    staff: string
    price: number
}

const services: Service[] = [
    { id: 1, name: 'Limpeza de pele', duration: 60, staff: 'Maria', price: 35 },
    { id: 2, name: 'Corte + Barba', duration: 50, staff: 'Tó', price: 25 },
    { id: 3, name: 'Manicure gel', duration: 45, staff: 'Ana', price: 28 },
    { id: 4, name: 'Coloração', duration: 90, staff: 'Rita', price: 55 },
]

const selectedServiceId = ref<number | null>(1)
const selectedService = computed(() =>
    services.find((service) => service.id === selectedServiceId.value) || null
)

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

const selectedDay = ref<string>('')

const selectedDayData = computed(() =>
    days.value.find((day) => day.iso === selectedDay.value) || days.value[1]
)

const selectedDayLabel = computed(() => {
    const day = selectedDayData.value
    return day ? `${day.weekday}, ${day.num} ${day.month}` : ''
})

const selectedDayName = computed(() => selectedDayData.value?.weekdayLong || '')

const morningSlots = [
    { time: '09:00', available: true },
    { time: '09:30', available: false },
    { time: '10:00', available: true },
    { time: '11:00', available: true },
    { time: '11:30', available: true },
    { time: '12:00', available: false },
]

const afternoonSlots = [
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:30', available: true },
]

const selectedSlot = ref<string | null>('15:00')

const customer = reactive({
    name: '',
    phone: '',
})

const firstName = computed(() => (customer.name.trim().split(' ')[0]) || 'Maria')

const canConfirm = computed(() =>
    Boolean(selectedService.value && selectedSlot.value && customer.name.trim() && customer.phone.trim())
)

const confirm = () => {
    // NOTE: when a public business/services endpoint exists, POST to
    // /public/appointments/ here with the real service_uuid + staff_uuid.
    goTo(4)
}

const reset = () => {
    selectedServiceId.value = 1
    selectedSlot.value = '15:00'
    customer.name = ''
    customer.phone = ''
    goTo(0)
}

onMounted(() => {
    selectedDay.value = days.value[1]?.iso || days.value[0]?.iso || ''
})
</script>

<style scoped>
.booking-viewport {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 32px 16px;
    background:
        radial-gradient(1200px 600px at 50% -10%, #f4f1ea 0%, var(--tf-canvas) 60%);
}

.device {
    width: min(420px, 100%);
    min-height: 780px;
    border-radius: 40px;
    overflow: hidden;
    background: #fdfcf9;
    box-shadow: 0 50px 110px -40px rgba(15, 15, 20, 0.55);
    border: 1px solid var(--tf-border);
}

.screen {
    display: flex;
    flex-direction: column;
    min-height: 780px;
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
    letter-spacing: -0.05em;
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
    letter-spacing: -0.04em;
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
    letter-spacing: -0.045em;
}

.screen-body {
    flex: 1;
    padding: 0 24px;
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
    letter-spacing: -0.03em;
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

.slot.unavailable {
    color: #c5c0b4;
    text-decoration: line-through;
    cursor: not-allowed;
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
    padding-top: 14px;
    border-top: 1px solid #26262d;
    font-size: 14px;
    color: #b7b3aa;
}

/* ---- CTA footer ---- */
.screen-cta {
    padding: 16px 24px 26px;
}

.screen-cta--fade {
    background: linear-gradient(to top, #fdfcf9 70%, transparent);
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
    letter-spacing: -0.09em;
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
    letter-spacing: -0.05em;
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
</style>
