'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { useAgeTheme } from './AgeThemeProvider'
import { COLORS } from '@/config/tokens'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const sizeStyles: Record<Size, { padding: string; fontSize: string; minHeight: string }> = {
  sm: { padding: '0 16px', fontSize: '13px', minHeight: '36px' },
  md: { padding: '0 24px', fontSize: '15px', minHeight: '48px' },
  lg: { padding: '0 32px', fontSize: '17px', minHeight: '56px' },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, style, ...props }, ref) => {
    const theme = useAgeTheme()
    const sz = sizeStyles[size]
    const isDisabled = disabled || loading

    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 9999,
      fontFamily: "'Nunito', Arial, sans-serif",
      fontWeight: 700,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.55 : 1,
      transition: 'transform 0.15s ease, opacity 0.15s ease',
      border: '2px solid transparent',
      outline: 'none',
      position: 'relative',
      ...sz,
      ...style,
    }

    const variantStyles: Record<Variant, React.CSSProperties> = {
      primary: {
        backgroundColor: theme.bg,
        color: theme.text,
        borderColor: theme.bg,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: theme.text,
        borderColor: theme.text,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: COLORS.muted,
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: COLORS.rose,
        color: COLORS.roseDark,
        borderColor: COLORS.rose,
      },
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{ ...base, ...variantStyles[variant] }}
        onMouseEnter={(e) => {
          if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
        {...props}
      >
        {loading ? (
          <>
            <Spinner color={variantStyles[variant].color as string} />
            <span style={{ visibility: 'hidden', position: 'absolute' }}>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

function Spinner({ color }: { color: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      style={{ animation: 'halo-spin 0.75s linear infinite' }}
      aria-label="Loading"
    >
      <circle cx={9} cy={9} r={7} stroke={color} strokeOpacity={0.25} strokeWidth={2.5} />
      <path d="M16 9a7 7 0 0 0-7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}
