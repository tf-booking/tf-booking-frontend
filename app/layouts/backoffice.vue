<template>
    <div class="backoffice">
        <AppSidebar />

        <main class="backoffice-main">
            <slot />
        </main>
    </div>
</template>

<style scoped>
.backoffice {
    display: flex;
    min-height: 100vh;
    background: var(--tf-canvas);
}

.backoffice-main {
    flex: 1;
    min-width: 0;
}

@media (max-width: 900px) {
    .backoffice {
        flex-direction: column;
    }
}
</style>
