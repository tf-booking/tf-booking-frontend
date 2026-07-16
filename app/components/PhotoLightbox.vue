<template>
    <Teleport to="body">
        <div v-if="open" class="lightbox-overlay" @click.self="close">
            <button class="lightbox-close" type="button" aria-label="Fechar" @click="close">×</button>

            <button
                v-if="photos.length > 1"
                class="lightbox-nav lightbox-prev"
                type="button"
                aria-label="Foto anterior"
                @click="prev"
            >
                ‹
            </button>

            <img :src="photos[currentIndex]" :alt="alt" class="lightbox-image" />

            <button
                v-if="photos.length > 1"
                class="lightbox-nav lightbox-next"
                type="button"
                aria-label="Foto seguinte"
                @click="next"
            >
                ›
            </button>

            <div v-if="photos.length > 1" class="lightbox-counter">{{ currentIndex + 1 }} / {{ photos.length }}</div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        open: boolean
        photos: string[]
        index?: number
        alt?: string
    }>(),
    {
        index: 0,
        alt: '',
    }
)

const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

const currentIndex = ref(props.index)

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            currentIndex.value = props.index
        }
    }
)

const close = () => {
    emit('update:open', false)
}

const prev = () => {
    currentIndex.value = (currentIndex.value - 1 + props.photos.length) % props.photos.length
}

const next = () => {
    currentIndex.value = (currentIndex.value + 1) % props.photos.length
}

const onKeydown = (event: KeyboardEvent) => {
    if (!props.open) {
        return
    }

    if (event.key === 'Escape') {
        close()
    } else if (event.key === 'ArrowLeft') {
        prev()
    } else if (event.key === 'ArrowRight') {
        next()
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.lightbox-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(11, 11, 15, 0.9);
}

.lightbox-image {
    max-width: min(90vw, 900px);
    max-height: 85vh;
    border-radius: 12px;
    object-fit: contain;
}

.lightbox-close {
    position: absolute;
    top: 18px;
    right: 20px;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
}

.lightbox-close:hover {
    background: rgba(255, 255, 255, 0.22);
}

.lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
}

.lightbox-nav:hover {
    background: rgba(255, 255, 255, 0.22);
}

.lightbox-prev {
    left: 16px;
}

.lightbox-next {
    right: 16px;
}

.lightbox-counter {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
}
</style>
