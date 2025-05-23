<script>
    import { scale } from 'svelte/transition';
    import { blur } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

    // MISC
    import { currentColor, frames, currentFrame, frameStore, currentTool, brushSize } from '../js/stores'
    import { indexToPos } from '../js/utils'
    import { config } from '../js/config'
    import { brushSizeMap } from '../js/defaults'

    // Components
    import Pixel from './Pixel.svelte'

    // Pictures
    import CheckCircleIcon from '../../static/img/check-circle.svg'

    export let itemCreated;

    let painting = false;

    let pixelSize = "35";
    let num_of_pixels = config.frameWidth

    const handleClick = (e) => {
        if (painting) return;
        let index = e.detail.index
        let button = e.detail.button
        if ($currentTool === "paint-1") paint(index, button)
        if ($currentTool === "fill") fill(index, button)
    }

    const changeColor = (index, button) => {
        let color = $currentColor[button]
        if (!color) {
            return
        }
        frameStore.update(state => {
            let framesInfo = state.frames[state.active].frames;
            framesInfo[$currentFrame][index] = color;
            return state;
        })
    }

    const paint = (index, button) => {
        let painting = true;
        let center = index;
        let centerPos = indexToPos(index)
        let topLeft = (center - (brushSizeMap[$brushSize][0] * config.frameWidth)) - brushSizeMap[$brushSize][0]
        let minY = centerPos.y - brushSizeMap[$brushSize][0]
        if (minY < 0 ) minY = 0
        let maxY = centerPos.y + brushSizeMap[$brushSize][0]
        if (maxY > config.frameWidth - 1 ) maxY = config.frameWidth - 1
        let minX = centerPos.x - brushSizeMap[$brushSize][0]
        if (minX < 0 ) minX = 0
        let maxX = centerPos.x + brushSizeMap[$brushSize][0]
        if (maxX > config.frameWidth - 1 ) maxX = config.frameWidth - 1

        for (let y = 0; y <= brushSizeMap[$brushSize][1] ; y++){
            for (let x = 0; x <= brushSizeMap[$brushSize][1] ; x++){
                let pixelToPaint = (topLeft + (config.frameWidth * y)) + x
                let pixelToPaintPos = indexToPos(pixelToPaint)
                if (
                    pixelToPaintPos.y >= minY &&
                    pixelToPaintPos.y <= maxY &&
                    pixelToPaintPos.x >= minX &&
                    pixelToPaintPos.x <= maxX &&
                    pixelToPaint >= 0 &&
                    pixelToPaint <= config.totalPixels - 1) {
                    if ($frameStore.frames[$frameStore.active].frames[$currentFrame][pixelToPaint] !== $currentColor[button]) {
                        changeColor(pixelToPaint, button)
                    }
                }
            }
        }
        painting = false;
    }

    const fill = async (index, button) => {
        let painting = true;
        const colorFrom = $frameStore.frames[$frameStore.active].frames[$currentFrame][index]
        let checked = new Set([])

        const paintAround = async (pixelIndex) => {
            let row = parseInt(index / config.frameWidth )
            let leftBoundery = row * config.frameWidth
            let rightBoundery = (leftBoundery + config.frameWidth) - 1

            let center = pixelIndex
            let left = center - 1
            let right = center + 1
            let up = center - 25
            let down = center + 25
            let pixelsToPaint = [
                center,
                left >= leftBoundery ? left : null,
                right <= rightBoundery ? right : null,
                up,
                down
            ].filter(f => {
                if (f === null) return false
                let pixelColor = $frameStore.frames[$frameStore.active].frames[$currentFrame][f]
                return f >= 0 &&
                        f <= config.totalPixels - 1 &&
                        !checked.has(f) &&
                        pixelColor === colorFrom
            })
            checked = new Set([...checked, ...pixelsToPaint])
            pixelsToPaint.map(pixel => {
                changeColor(pixel, button)
                paintAround(pixel)
            })
        }
        await paintAround(index)
        painting = false;
    }

    // Group undo/redo per user action
    const handlePointerDown = () => {
        frameStore.snapshot();
    }
    const handlePointerUp = () => {
        frameStore.snapshot();
    }
</script>

<style>
    .board {
        display: grid;
        grid-template-columns: repeat(25, 25px);
        grid-template-rows: repeat(25, 25px);
        background-color: var(--color-background-primary);
        border-radius: var(--border-radius, 8px);
        border: 1px solid var(--color-border-secondary, #e0e0e0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: var(--space-lg, 24px);
        position: relative;
    }
    .paint-cursor{
        cursor: url('/img/paint_brush.svg') 5 7, auto;
    }
    .fill-cursor{
        cursor: url('/img/paint_bucket.svg') 5 20, auto;
    }
    .checkmark{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
    }
</style>

<div class="board"
     class:fill-cursor={$currentTool === 'fill'}
     class:paint-cursor={$currentTool.startsWith('paint')}
     on:drag|preventDefault
     on:contextmenu|preventDefault
     on:mousedown={handlePointerDown}
     on:mouseup={handlePointerUp}
     on:touchstart={handlePointerDown}
     on:touchend={handlePointerUp}>
    {#if $frames && Array.isArray($frames[$currentFrame])}
        {#each $frames[$currentFrame] as pixel, index}
            <Pixel {pixel} {index} on:colorChange={handleClick}/>
        {/each}
    {/if}

   {#if itemCreated}
        <div in:scale="{{duration: 1000, delay: 0, opacity: 0.0, start: 0.2, easing: quintOut}}"
             out:blur="{{duration: 1000, delay: 0, opacity: 0.0, amount: 20, easing: quintOut}}"
             class="checkmark"
             style={`width: ${config.totalPixels}px`}>
            <CheckCircleIcon width={`${config.totalPixels}px`} />
        </div>
    {/if}
</div>