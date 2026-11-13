<template>
    <div v-if="isVisible" class="cookie-consent" role="dialog" aria-live="polite" aria-label="Cookies">
        <p class="cookie-text">
            Usamos cookies para medir de onde vêm as visitas e melhorar os nossos anúncios
            (Meta). Podes aceitar ou recusar.
            <NuxtLink to="/privacidade" class="cookie-link">Saber mais</NuxtLink>
        </p>

        <div class="cookie-actions">
            <button type="button" class="btn btn-secondary cookie-btn" @click="setConsent('denied')">
                Recusar
            </button>
            <button type="button" class="btn btn-accent cookie-btn" @click="setConsent('granted')">
                Aceitar
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { consent, setConsent } = useMetaPixel()

const isMounted = ref(false)

onMounted(() => {
    isMounted.value = true
})

// Só aparece nas páginas onde o pixel corre e enquanto a pessoa ainda não escolheu.
const isVisible = computed(() => isMounted.value && consent.value === null && isMetaPixelPath(route.path))
</script>

<style scoped>
.cookie-consent {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    z-index: 1000;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px 20px;
    max-width: 760px;
    margin: 0 auto;
    padding: 18px 20px;
    border-radius: 20px;
    background: var(--tf-black);
    color: var(--tf-white);
    box-shadow: 0 20px 50px rgba(11, 11, 15, 0.25);
}

.cookie-text {
    flex: 1 1 320px;
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #d6d2c8;
}

.cookie-link {
    color: var(--tf-accent);
    font-weight: 700;
}

.cookie-actions {
    display: flex;
    gap: 10px;
}

.cookie-btn {
    min-height: 44px;
    padding: 0 20px;
}
</style>
