<template>
    <div class="pro-lock" :class="{ 'is-locked': locked }">
        <div class="pro-lock-body">
            <slot />
        </div>

        <div v-if="locked" class="pro-lock-overlay">
            <div class="pro-lock-card">
                <span class="pro-lock-tag">PRO</span>
                <p class="pro-lock-message">{{ message }}</p>
                <NuxtLink to="/#precos" class="btn btn-accent pro-lock-cta">
                    Atualizar para o Pro
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    locked: boolean
    message?: string
}>(), {
    message: 'Esta funcionalidade está disponível no plano Pro.',
})
</script>

<style scoped>
.pro-lock {
    position: relative;
}

.pro-lock.is-locked .pro-lock-body {
    filter: blur(4px);
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
}

.pro-lock-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.pro-lock-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 300px;
    padding: 28px 24px;
    border-radius: 20px;
    background: rgba(246, 242, 233, 0.97);
    border: 1px solid var(--tf-border);
    box-shadow: 0 30px 70px -40px rgba(15, 15, 20, 0.45);
    text-align: center;
}

.pro-lock-tag {
    display: inline-flex;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    background: var(--tf-black);
    color: var(--tf-accent);
    font-family: var(--tf-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
}

.pro-lock-message {
    margin: 0;
    color: var(--tf-ink);
    font-weight: 700;
    font-size: 14px;
    line-height: 1.4;
}

.pro-lock-cta {
    min-height: 42px;
    padding: 0 20px;
}
</style>
