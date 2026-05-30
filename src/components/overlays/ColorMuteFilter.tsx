'use client'

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  active?: boolean
  saturation?: number
}

// Wraps children in a reduced-saturation container for infant/preschool age tiers.
// Apply at the page/layout level so interactive children still receive pointer events.
export function ColorMuteFilter({ children, active = true, saturation = 0.75 }: Props) {
  return (
    <div style={{ filter: active ? `saturate(${saturation})` : undefined }}>
      {children}
    </div>
  )
}
