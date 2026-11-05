import type { MouseEvent, PointerEvent } from 'react'
import { useRef } from 'react'

export function useCarouselSwipe(onSwipe: (direction: -1 | 1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    start.current = { x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!start.current) return
    const deltaX = event.clientX - start.current.x
    const deltaY = event.clientY - start.current.y
    start.current = null

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return
    swiped.current = true
    onSwipe(deltaX < 0 ? 1 : -1)
  }

  function onPointerCancel() {
    start.current = null
  }

  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!swiped.current) return
    swiped.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return { onPointerDown, onPointerUp, onPointerCancel, onClickCapture }
}
