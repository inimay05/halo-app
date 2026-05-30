'use client'

import { COLORS } from '@/config/tokens'

interface HaloLogoProps {
  fontSize?: number
  className?: string
}

export default function HaloLogo({ fontSize = 40, className = '' }: HaloLogoProps) {
  const ringW = fontSize * 1.5
  const ringH = fontSize * 0.38
  const gradId = 'haloGradient'

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      style={{ gap: fontSize * 0.18 }}
    >
      {/* Halo ring SVG — elliptical arc, not a full circle */}
      <svg
        width={ringW}
        height={ringH + 4}
        viewBox={`0 0 ${ringW} ${ringH + 4}`}
        style={{ filter: 'drop-shadow(0 0 6px rgba(240,192,64,0.45))' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={COLORS.haloGold} />
            <stop offset="100%" stopColor={COLORS.haloGoldDark} />
          </linearGradient>
        </defs>
        {/*
          Elliptical arc: M start → A rx ry x-rot large-arc sweep end
          We draw 270° of the ellipse (skip the bottom ~90°) to create an open-bottom halo.
        */}
        <path
          d={`
            M ${ringW * 0.15} ${ringH * 0.85}
            A ${ringW * 0.43} ${ringH * 0.9} 0 1 1 ${ringW * 0.85} ${ringH * 0.85}
          `}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </svg>

      {/* Word mark */}
      <span
        style={{
          fontFamily: "'Nunito', Arial, sans-serif",
          fontWeight: 800,
          fontSize: fontSize,
          color: COLORS.lavenderDark,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        Halo
      </span>
    </div>
  )
}
