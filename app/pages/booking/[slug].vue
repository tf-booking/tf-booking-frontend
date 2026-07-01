<template>
    <div class="page booking-page">
        <section class="booking-hero">
            <div class="container booking-hero-grid">
                <div>
                    <p class="tf-eyebrow">TF Booking</p>

                    <h1>{{ businessName }}</h1>

                    <p>
                        Marca a tua visita de forma simples. Escolhe serviço, horário e
                        deixa os teus dados.
                    </p>
                </div>

                <div class="hero-badge">
                    <span>Powered by</span>
                    <strong>TF Creative</strong>
                </div>
            </div>
        </section>

        <section class="container booking-content">
            <article class="card booking-card">
                <div class="step-number">01</div>
                <h2>Escolhe o serviço</h2>

                <div class="option-list">
                    <button v-for="service in services" :key="service.id" class="option"
                        :class="{ selected: selectedService === service.id }" @click="selectedService = service.id">
                        <div>
                            <strong>{{ service.name }}</strong>
                            <span>{{ service.duration }} min</span>
                        </div>

                        <strong>{{ service.price }}€</strong>
                    </button>
                </div>
            </article>

            <article class="card booking-card">
                <div class="step-number">02</div>
                <h2>Escolhe o horário</h2>

                <div class="slots">
                    <button v-for="slot in slots" :key="slot" class="slot" :class="{ selected: selectedSlot === slot }"
                        @click="selectedSlot = slot">
                        {{ slot }}
                    </button>
                </div>
            </article>

            <article class="card booking-card dark-card">
                <div class="step-number">03</div>
                <h2>Os teus dados</h2>

                <form class="form">
                    <div>
                        <label class="label">Nome</label>
                        <input v-model="customer.name" class="input" type="text" />
                    </div>

                    <div>
                        <label class="label">Telemóvel</label>
                        <input v-model="customer.phone" class="input" type="tel" />
                    </div>

                    <div>
                        <label class="label">Email</label>
                        <input v-model="customer.email" class="input" type="email" />
                    </div>

                    <button class="btn btn-accent" type="button" @click="submitBooking">
                        Confirmar marcação
                    </button>
                </form>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()

const businessName = computed(() => {
    const slug = String(route.params.slug || 'demo')
    return slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
})

const selectedService = ref<number | null>(null)
const selectedSlot = ref<string | null>(null)

const customer = reactive({
    name: '',
    phone: '',
    email: '',
})

const services = [
    {
        id: 1,
        name: 'Corte cabelo',
        duration: 30,
        price: 15,
    },
    {
        id: 2,
        name: 'Barba',
        duration: 20,
        price: 10,
    },
    {
        id: 3,
        name: 'Limpeza de pele',
        duration: 60,
        price: 35,
    },
]

const slots = [
    '09:00',
    '09:30',
    '10:00',
    '11:00',
    '14:00',
    '14:30',
    '15:00',
    '16:00',
]

const submitBooking = () => {
    alert('Marcação simulada. A seguir ligamos isto ao backend.')
}
</script>

<style scoped>
.booking-page {
    background: var(--tf-bg);
}

.booking-hero {
    padding: 72px 0;
    background: var(--tf-black);
    color: var(--tf-white);
}

.booking-hero-grid {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 32px;
}

.booking-hero .tf-eyebrow {
    color: var(--tf-accent);
}

.booking-hero h1 {
    margin: 0;
    font-size: clamp(48px, 8vw, 96px);
    line-height: 0.9;
    letter-spacing: -0.075em;
}

.booking-hero p {
    max-width: 620px;
    margin: 22px 0 0;
    color: #c8c8c8;
    font-size: 18px;
    line-height: 1.55;
}

.hero-badge {
    min-width: 220px;
    padding: 18px;
    border-radius: 24px;
    background: var(--tf-accent);
    color: var(--tf-black);
}

.hero-badge span {
    display: block;
    font-size: 13px;
    font-weight: 800;
    opacity: 0.7;
}

.hero-badge strong {
    display: block;
    margin-top: 4px;
    font-size: 22px;
    letter-spacing: -0.04em;
}

.booking-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 32px 0 88px;
}

.booking-card {
    position: relative;
    padding: 30px;
}

.step-number {
    margin-bottom: 22px;
    color: var(--tf-muted);
    font-weight: 950;
}

.booking-card h2 {
    margin: 0 0 22px;
    font-size: 32px;
    letter-spacing: -0.05em;
}

.option-list {
    display: grid;
    gap: 12px;
}

.option {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--tf-border);
    border-radius: 22px;
    background: var(--tf-white);
    cursor: pointer;
    text-align: left;
}

.option span {
    display: block;
    margin-top: 4px;
    color: var(--tf-muted);
}

.option.selected,
.slot.selected {
    border-color: var(--tf-black);
    background: var(--tf-accent);
}

.slots {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.slot {
    min-width: 88px;
    padding: 13px 18px;
    border: 1px solid var(--tf-border);
    border-radius: 999px;
    background: var(--tf-white);
    cursor: pointer;
    font-weight: 900;
}

.dark-card {
    background: var(--tf-black);
    color: var(--tf-white);
}

.dark-card .label {
    color: #c8c8c8;
}

.dark-card .step-number {
    color: var(--tf-accent);
}

.form {
    display: grid;
    gap: 16px;
}

@media (max-width: 760px) {
    .booking-hero-grid {
        align-items: start;
        flex-direction: column;
    }

    .hero-badge {
        width: 100%;
    }
}
</style>