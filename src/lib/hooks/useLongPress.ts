'use client'

import { useRef, useCallback } from 'react'

export function useLongPress(callback: () => void, ms = 1_000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    timer.current = setTimeout(callback, ms)
  }, [callback, ms])

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  return {
    onMouseDown:  start,
    onMouseUp:    cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd:   cancel,
    onTouchCancel: cancel,
  }
}
