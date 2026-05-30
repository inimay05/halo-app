'use client'

import { HTMLAttributes } from 'react'
import { COLORS } from '@/config/tokens'

type BadgeVariant = 'success' | 'warning' | 'info' | 'muted' | 'coin' | 'streak'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; icon?: string }> = {
  success: { bg: COLORS.sage,      text: COLORS.sageDark },
  warning: { bg: COLORS.warmAmber, text: COLORS.amberDark },
  info:    { bg: COLORS.sky,       text: COLORS.skyDark },
  muted:   { bg: '#EDEDF2',        text: COLORS.muted },
  coin:    { bg: COLORS.lemon,     text: COLORS.lemonDark, icon: '🪙' },
  streak:  { bg: COLORS.peach,     text: COLORS.peachDark, icon: '🔥' },
}

export function Badge({ variant = 'info', children, style, ...props }: BadgeProps) {
  const v = VARIANT_STYLES[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'Nunito', Arial, sans-serif",
        backgroundColor: v.bg,
        color: v.text,
        lineHeight: 1.6,
        ...style,
      }}
      {...props}
    >
      {v.icon && <span style={{ fontSize: 12 }}>{v.icon}</span>}
      {children}
    </span>
  )
}
