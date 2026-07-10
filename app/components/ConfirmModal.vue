<template>
    <Teleport to="body">
        <div v-if="open" class="confirm-modal-overlay" @click.self="handleCancel">
            <div class="confirm-modal-card">
                <button class="confirm-modal-close" type="button" aria-label="Fechar" @click="handleCancel">
                    ×
                </button>

                <span v-if="tag" class="confirm-modal-tag">{{ tag }}</span>

                <h2>{{ title }}</h2>
                <p class="confirm-modal-message">{{ message }}</p>

                <div class="confirm-modal-actions">
                    <NuxtLink
                        v-if="confirmTo"
                        :to="confirmTo"
                        class="btn btn-accent"
                        @click="handleCancel"
                    >
                        {{ confirmLabel }}
                    </NuxtLink>

                    <button
                        v-else
                        class="btn"
                        :class="danger ? 'btn-danger' : 'btn-accent'"
                        type="button"
                        @click="handleConfirm"
                    >
                        {{ confirmLabel }}
                    </button>

                    <button class="btn btn-secondary" type="button" @click="handleCancel">
                        {{ cancelLabel }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    open: boolean
    title: string
    message: string
    tag?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmTo?: string
    danger?: boolean
}>(), {
    tag: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    confirmTo: '',
    danger: false,
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    confirm: []
}>()

const handleCancel = () => {
    emit('update:open', false)
}

const handleConfirm = () => {
    emit('confirm')
    emit('update:open', false)
}
</script>

<style scoped>
.confirm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(11, 11, 15, 0.55);
}

.confirm-modal-card {
    position: relative;
    width: 100%;
    max-width: 420px;
    padding: 32px;
    border-radius: 24px;
    background: var(--tf-white);
    box-shadow: 0 40px 90px -30px rgba(11, 11, 15, 0.5);
    text-align: center;
}

.confirm-modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 34px;
    height: 34px;
    border: 1px solid var(--tf-border);
    border-radius: 50%;
    background: var(--tf-white);
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
}

.confirm-modal-tag {
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

.confirm-modal-card h2 {
    margin: 18px 0 0;
    font-size: 24px;
    letter-spacing: -0.03em;
}

.confirm-modal-message {
    margin: 12px 0 0;
    color: var(--tf-muted);
    font-size: 15px;
    line-height: 1.5;
}

.confirm-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 26px;
}
</style>
