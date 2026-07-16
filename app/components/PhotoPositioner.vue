<template>
    <div
        ref="frameRef"
        class="photo-positioner"
        :class="[`photo-positioner-${shape}`, { dragging: isDragging }]"
        :style="{ width: `${width || size}px`, height: `${height || size}px` }"
        @pointerdown="startDrag"
        @pointermove="onDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
    >
        <img :src="src" :alt="alt" :style="{ objectPosition: `${x}% ${y}%` }" draggable="false" />
        <span class="photo-positioner-hint">Arrasta para posicionar</span>
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        src: string
        x: number
        y: number
        shape?: 'circle' | 'rect'
        size?: number
        width?: number
        height?: number
        alt?: string
    }>(),
    {
        shape: 'circle',
        size: 140,
        width: 0,
        height: 0,
        alt: '',
    }
)

const emit = defineEmits<{
    'update:x': [value: number]
    'update:y': [value: number]
}>()

const frameRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

let startClientX = 0
let startClientY = 0
let startX = 50
let startY = 50

const clamp = (value: number) => Math.min(100, Math.max(0, value))

const startDrag = (event: PointerEvent) => {
    isDragging.value = true
    startClientX = event.clientX
    startClientY = event.clientY
    startX = props.x
    startY = props.y
    frameRef.value?.setPointerCapture(event.pointerId)
}

const onDrag = (event: PointerEvent) => {
    if (!isDragging.value || !frameRef.value) {
        return
    }

    const { width, height } = frameRef.value.getBoundingClientRect()
    const deltaX = event.clientX - startClientX
    const deltaY = event.clientY - startClientY

    emit('update:x', clamp(startX - (deltaX / width) * 100))
    emit('update:y', clamp(startY - (deltaY / height) * 100))
}

const stopDrag = (event: PointerEvent) => {
    isDragging.value = false

    if (frameRef.value?.hasPointerCapture(event.pointerId)) {
        frameRef.value.releasePointerCapture(event.pointerId)
    }
}
</script>

<style scoped>
.photo-positioner {
    position: relative;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
    background: #f1ecdf;
    flex-shrink: 0;
}

.photo-positioner-circle {
    border-radius: 50%;
}

.photo-positioner-rect {
    border-radius: 12px;
}

.photo-positioner.dragging {
    cursor: grabbing;
}

.photo-positioner img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

.photo-positioner-hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 4px 6px;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
}

.photo-positioner:hover .photo-positioner-hint,
.photo-positioner.dragging .photo-positioner-hint {
    opacity: 1;
}
</style>
