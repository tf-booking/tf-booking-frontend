// Mosaico estilo Pinterest com CSS Grid: cada item ocupa `grid-row-end: span N`,
// calculado a partir da altura real da imagem depois de carregada, para que
// as fotos se empilhem lado a lado preservando a proporção original (sem
// cortar em quadrados). Evita a técnica de `column-count`, que em testes
// anteriores empilhava tudo na primeira coluna quando havia poucos itens.
export const useMasonryLayout = (rowPx = 10, gapPx = 12) => {
    const spans = ref<number[]>([])
    const imageEls = ref<(HTMLImageElement | null)[]>([])

    const computeSpan = (heightPx: number) => Math.ceil((heightPx + gapPx) / (rowPx + gapPx))

    const setImageEl = (el: Element | null, index: number) => {
        imageEls.value[index] = el as HTMLImageElement | null
    }

    const onImageLoad = (index: number) => {
        const img = imageEls.value[index]

        if (img) {
            spans.value[index] = computeSpan(img.offsetHeight)
        }
    }

    const recompute = () => {
        imageEls.value.forEach((img, index) => {
            if (img && img.complete) {
                spans.value[index] = computeSpan(img.offsetHeight)
            }
        })
    }

    let resizeHandler: (() => void) | null = null

    onMounted(() => {
        resizeHandler = () => recompute()
        window.addEventListener('resize', resizeHandler)
    })

    onBeforeUnmount(() => {
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler)
        }
    })

    const tileStyle = (index: number) => {
        const span = spans.value[index]
        return span ? { gridRowEnd: `span ${span}` } : {}
    }

    return { setImageEl, onImageLoad, tileStyle }
}
