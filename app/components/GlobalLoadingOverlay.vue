<template>
    <Teleport to="body">
        <Transition name="tf-overlay-fade">
            <div v-if="isLoading" class="tf-global-loading-overlay">
                <Spinner :size="56" />
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
const { isLoading } = useGlobalLoading()
</script>

<style scoped>
.tf-global-loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.5);
}

.tf-overlay-fade-enter-active,
.tf-overlay-fade-leave-active {
    transition: opacity 0.15s ease;
}

.tf-overlay-fade-enter-from,
.tf-overlay-fade-leave-to {
    opacity: 0;
}
</style>
