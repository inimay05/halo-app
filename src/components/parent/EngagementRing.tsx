'use client'

import { motion }          from 'framer-motion'
import { getScoreLabel, getScoreColor } from '@/lib/engagementScore'
import { COLORS }          from '@/config/tokens'

interface Props {
  score: number
  size?: number
}

export function EngagementRing({ score, size = 160 }: Props) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {/* Track */}
        <circle
          cx={60} cy={60} r={50}
          fill="none"
          stroke="#E8E8EC"
          strokeWidth={11}
        />
        {/* Score arc */}
        <motion.circle
          cx={60} cy={60} r={50}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      {/* Centre text overlay */}
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            2,
        pointerEvents:  'none',
      }}>
        <span style={{
          fontSize:   size * 0.26,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}>
          {score}
        </span>
        <span style={{ fontSize: size * 0.095, color: COLORS.muted, fontWeight: 600 }}>
          {label}
        </span>
      </div>
    </div>
  )
}
