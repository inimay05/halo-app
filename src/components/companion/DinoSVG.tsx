'use client'

import { motion } from 'framer-motion'
import type { Pose } from './CompanionCharacter'

interface Props { pose: Pose; size: number }

// Gentle breathing
const BODY_Y:   Record<Pose, number[]> = {
  idle:    [0, -2, 0],
  happy:   [0, -4, 0],
  sleepy:  [0, 1.5, 0],
  excited: [0, -5, 0],
  sorry:   [0, 2, 0],
}
const BODY_DUR: Record<Pose, number> = { idle: 4.2, happy: 2.8, sleepy: 5.5, excited: 2.2, sorry: 4.5 }

// Gentle arm sway
const ARM_R:   Record<Pose, number[]> = {
  idle:    [-4, 4, -4],
  happy:   [-8, 8, -8],
  sleepy:  [-2, 2, -2],
  excited: [-10, 10, -10],
  sorry:   [-2, 2, -2],
}
const ARM_DUR: Record<Pose, number> = { idle: 3.5, happy: 2.0, sleepy: 5.5, excited: 1.8, sorry: 4.5 }

const HEAD_R:    Record<Pose, number>   = { idle: 0, happy: 6, sleepy: -4, excited: 3, sorry: -12 }
const EYE_SCALE: Record<Pose, number[]> = {
  idle:    [1, 0.05, 1],
  happy:   [0.3, 0.3, 0.3],
  sleepy:  [0.1, 0.1, 0.1],
  excited: [1.2, 1.2, 1.2],
  sorry:   [0.5, 0.5, 0.5],
}
const EYE_DUR: Record<Pose, number> = { idle: 4.0, happy: 99, sleepy: 99, excited: 99, sorry: 99 }

const SPIKES = [
  { cx: 54, cy: 22, r: 5 },
  { cx: 62, cy: 16, r: 6 },
  { cx: 70, cy: 20, r: 5 },
]

export function DinoSVG({ pose, size }: Props) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible">
      <motion.g
        animate={{ y: BODY_Y[pose] }}
        transition={{ repeat: Infinity, duration: BODY_DUR[pose], ease: 'easeInOut' }}
      >
        {/* Tail */}
        <path d="M82 96 Q108 108 100 80" fill="none" stroke="#5C9B6A" strokeWidth="10" strokeLinecap="round" />

        {/* Body */}
        <ellipse cx="60" cy="82" rx="26" ry="22" fill="#7CC47E" />
        {/* Belly */}
        <ellipse cx="60" cy="85" rx="14" ry="12" fill="#D6F5D8" />

        {/* Arms */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '38px 80px' }}
          animate={{ rotate: ARM_R[pose] }}
          transition={{ repeat: Infinity, duration: ARM_DUR[pose], ease: 'easeInOut' }}
        >
          <ellipse cx="36" cy="80" rx="8" ry="5" fill="#7CC47E" transform="rotate(-30 36 80)" />
        </motion.g>
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '82px 80px' }}
          animate={{ rotate: ARM_R[pose].map((v) => -v) }}
          transition={{ repeat: Infinity, duration: ARM_DUR[pose], ease: 'easeInOut' }}
        >
          <ellipse cx="84" cy="80" rx="8" ry="5" fill="#7CC47E" transform="rotate(30 84 80)" />
        </motion.g>

        {/* Head */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '60px 48px' }}
          animate={{ rotate: HEAD_R[pose] }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
          {SPIKES.map((s, i) => (
            <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.r} ry={s.r * 1.4} fill="#5C9B6A" />
          ))}
          <circle cx="60" cy="48" r="24" fill="#7CC47E" />

          {/* Eyes */}
          <motion.ellipse
            cx="50" cy="46" rx="5" ry="6" fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2.2 }}
          />
          <motion.ellipse
            cx="70" cy="46" rx="5" ry="6" fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2.2 }}
          />
          <circle cx="52" cy="44" r="1.5" fill="white" />
          <circle cx="72" cy="44" r="1.5" fill="white" />

          {/* Mouth */}
          {(pose === 'happy' || pose === 'excited')
            ? <path d="M50,56 Q60,64 70,56" fill="none" stroke="#3A7A48" strokeWidth="2" strokeLinecap="round" />
            : <path d="M53,58 Q60,61 67,58" fill="none" stroke="#3A7A48" strokeWidth="2" strokeLinecap="round" />
          }

          {pose === 'sleepy' && (
            <motion.text
              x="76" y="36" fontSize="10" fill="#7C5CBF" fontWeight="bold"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              z
            </motion.text>
          )}
        </motion.g>

        {/* Legs */}
        <ellipse cx="46" cy="103" rx="10" ry="7" fill="#7CC47E" />
        <ellipse cx="74" cy="103" rx="10" ry="7" fill="#7CC47E" />
      </motion.g>
    </svg>
  )
}
