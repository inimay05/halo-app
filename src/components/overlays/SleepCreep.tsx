'use client'

import { useEffect, useRef } from 'react'

interface Props {
  active: boolean
  durationMs?: number
}

// Pointer-events:none div that fades saturation 1→0 over `durationMs`.
// When `active` goes false the filter is removed instantly.
export function SleepCreep({ active, durationMs = 180_000 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!active) {
      el.style.transition = 'none'
      el.style.filter     = 'saturate(1)'
      return
    }

    // Force repaint at saturate(1) so transition plays from start
    el.style.transition = 'none'
    el.style.filter     = 'saturate(1)'
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect() // flush layout

    el.style.transition = `filter ${durationMs}ms linear`
    el.style.filter     = 'saturate(0)'
  }, [active, durationMs])

  return (
    <div
      ref={ref}
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        9990,
        filter:        'saturate(1)',
      }}
    />
  )
}
