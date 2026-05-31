'use client'

import { HTMLAttributes } from 'react'
import { useAgeTheme } from './AgeThemeProvider'
import { COLORS } from '@/config/tokens'

type CardVariant = 'default' | 'pastel' | 'elevated'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  const theme = useAgeTheme()

  const base: React.CSSProperties = {
    borderRadius: 16,
    padding: 24,
    fontFamily: "'Nunito', Arial, sans-serif",
  }

  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      backgroundColor: '#ffffff',
      border: `1px solid ${theme.bg}`,
    },
    pastel: {
      backgroundColor: theme.bg,
      border: `1px solid ${theme.bg}`,
    },
    elevated: {
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: 'none',
    },
  }

  return (
    <div style={{ ...base, ...variantStyles[variant], ...style }} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16, color: COLORS.ink, ...style }} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>
}
