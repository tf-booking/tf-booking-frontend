<template>
    <div class="tf-spinner" :style="{ width: `${size}px`, height: `${size}px` }" role="status" aria-label="A carregar">
        <span class="sr-only">A carregar...</span>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), {
    size: 40,
})
</script>

<style scoped>
.tf-spinner {
    display: inline-block;
    border-radius: 50%;
    border: 4px solid var(--tf-black);
    border-top-color: var(--tf-accent-strong);
    animation: tf-spin 0.7s linear infinite;
}

@keyframes tf-spin {
    to {
        transform: rotate(360deg);
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}
</style>
