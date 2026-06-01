'use client'

import { COLORS } from '@/config/tokens'

interface HaloLogoProps {
  fontSize?: number
  className?: string
}

export default function HaloLogo({ fontSize = 40, className = '' }: HaloLogoProps) {
  const w   = fontSize * 1.8
  const h   = fontSize * 0.55
  const rx  = w * 0.42
  const ry  = h * 0.55
  const cx  = w / 2
  const cy  = h * 0.52

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      style={{ gap: fontSize * 0.14, userSelect: 'none' }}
    >
      {/* 3-D oval halo ring */}
      <svg
        width={w}
        height={h + 4}
        viewBox={`0 0 ${w} ${h + 4}`}
        overflow="visible"
        aria-hidden="true"
      >
        <defs>
          {/* Ring face gradient — bright top, shaded sides */}
          <linearGradient id="haloFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#F5D86A" />
            <stop offset="40%"  stopColor={COLORS.haloGold} />
            <stop offset="100%" stopColor={COLORS.haloGoldDark} />
          </linearGradient>
          {/* Shadow underneath the ring */}
          <radialGradient id="haloShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="haloGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Drop shadow ellipse */}
        <ellipse
          cx={cx} cy={cy + 3}
          rx={rx * 0.88} ry={ry * 0.5}
          fill="url(#haloShadow)"
        />

        {/* Ring tube — thick stroke = the ring body */}
        <ellipse
          cx={cx} cy={cy}
          rx={rx} ry={ry}
          fill="none"
          stroke="url(#haloFace)"
          strokeWidth={fontSize * 0.115}
          filter="url(#haloGlow)"
        />

        {/* Top highlight — thin bright arc to give 3-D roundness */}
        <ellipse
          cx={cx} cy={cy - ry * 0.18}
          rx={rx * 0.58} ry={ry * 0.28}
          fill="none"
          stroke="rgba(255,248,200,0.75)"
          strokeWidth={fontSize * 0.045}
          strokeLinecap="round"
        />

        {/* Sparkles */}
        {[
          { x: cx - rx * 1.18, y: cy - ry * 0.6,  s: 0.9 },
          { x: cx + rx * 1.18, y: cy - ry * 0.55, s: 0.75 },
          { x: cx - rx * 0.5,  y: cy - ry * 1.6,  s: 0.6 },
          { x: cx + rx * 0.4,  y: cy - ry * 1.55, s: 0.5 },
          { x: cx,              y: cy - ry * 1.9,  s: 0.65 },
        ].map(({ x, y, s }, i) => (
          <g key={i} transform={`translate(${x},${y})`}>
            <line x1={0} y1={-3.5 * s} x2={0} y2={3.5 * s}  stroke={COLORS.haloGold} strokeWidth={1.1 * s} strokeLinecap="round" />
            <line x1={-3.5 * s} y1={0} x2={3.5 * s} y2={0}  stroke={COLORS.haloGold} strokeWidth={1.1 * s} strokeLinecap="round" />
            <line x1={-2.2 * s} y1={-2.2 * s} x2={2.2 * s} y2={2.2 * s} stroke={COLORS.haloGold} strokeWidth={0.8 * s} strokeLinecap="round" opacity={0.6} />
            <line x1={2.2 * s} y1={-2.2 * s}  x2={-2.2 * s} y2={2.2 * s} stroke={COLORS.haloGold} strokeWidth={0.8 * s} strokeLinecap="round" opacity={0.6} />
          </g>
        ))}
      </svg>

      {/* Word mark */}
      <span
        style={{
          fontFamily:    "'Nunito', Arial, sans-serif",
          fontWeight:    400,
          fontSize:      fontSize,
          color:         '#9B7260',
          lineHeight:    1,
          letterSpacing: '0.04em',
        }}
      >
        Halo
      </span>
    </div>
  )
}
