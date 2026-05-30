'use client'

import { useAgeTheme } from './AgeThemeProvider'
import { COLORS } from '@/config/tokens'

interface ProgressBarProps {
  value: number
  color?: string
  label?: string
  showLabel?: boolean
}

export function ProgressBar({ value, color, label, showLabel = false }: ProgressBarProps) {
  const theme = useAgeTheme()
  const clamped = Math.max(0, Math.min(100, value))
  const fillColor = color ?? theme.text

  return (
    <div style={{ fontFamily: "'Nunito', Arial, sans-serif", width: '100%' }}>
      {(showLabel || label) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.muted,
          }}
        >
          {label && <span>{label}</span>}
          {showLabel && <span>{clamped}%</span>}
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: 10,
          backgroundColor: theme.bg,
          borderRadius: 9999,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            backgroundColor: fillColor,
            borderRadius: 9999,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}
