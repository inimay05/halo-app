'use client'

import { motion } from 'framer-motion'
import type { Pose } from './CompanionCharacter'

interface Props { pose: Pose; size: number }

// Gentle breathing only
const BODY_Y:   Record<Pose, number[]> = {
  idle:    [0, -2, 0],
  happy:   [0, -4, 0],
  sleepy:  [0, 1.5, 0],
  excited: [0, -5, 0],
  sorry:   [0, 2, 0],
}
const BODY_DUR: Record<Pose, number> = { idle: 4.0, happy: 2.6, sleepy: 5.5, excited: 2.0, sorry: 4.5 }

// Slow tail wag
const TAIL_R:   Record<Pose, number[]> = {
  idle:    [8, 28, 8],
  happy:   [5, 40, 5],
  sleepy:  [4, 12, 4],
  excited: [5, 45, 5],
  sorry:   [4, 10, 4],
}
const TAIL_DUR: Record<Pose, number> = { idle: 2.5, happy: 1.2, sleepy: 4.5, excited: 1.0, sorry: 4.0 }

// Gentle ear flap
const EAR_R:   Record<Pose, number[]> = {
  idle:    [-3, 3, -3],
  happy:   [-8, 8, -8],
  sleepy:  [-1, 1, -1],
  excited: [-10, 10, -10],
  sorry:   [-2, 2, -2],
}
const EAR_DUR: Record<Pose, number> = { idle: 3.8, happy: 1.8, sleepy: 6.0, excited: 1.5, sorry: 5.0 }

const HEAD_R:    Record<Pose, number>   = { idle: 0, happy: 6, sleepy: -5, excited: 3, sorry: -12 }
const EYE_SCALE: Record<Pose, number[]> = {
  idle:    [1, 0.05, 1],
  happy:   [0.35, 0.35, 0.35],
  sleepy:  [0.1, 0.1, 0.1],
  excited: [1.2, 1.2, 1.2],
  sorry:   [0.6, 0.6, 0.6],
}
const EYE_DUR: Record<Pose, number> = { idle: 4.0, happy: 99, sleepy: 99, excited: 99, sorry: 99 }

export function DogSVG({ pose, size }: Props) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible">
      <motion.g
        animate={{ y: BODY_Y[pose] }}
        transition={{ repeat: Infinity, duration: BODY_DUR[pose], ease: 'easeInOut' }}
      >
        {/* Tail — slow wag */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '78px 88px' }}
          animate={{ rotate: TAIL_R[pose] }}
          transition={{ repeat: Infinity, duration: TAIL_DUR[pose], ease: 'easeInOut' }}
        >
          <ellipse cx="88" cy="78" rx="7" ry="14" fill="#C8A882" transform="rotate(-30 88 78)" />
        </motion.g>

        {/* Body */}
        <ellipse cx="60" cy="82" rx="28" ry="24" fill="#E8D5B0" />
        {/* Belly patch */}
        <ellipse cx="60" cy="87" rx="15" ry="12" fill="#FFF9C4" />

        {/* Head */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '60px 50px' }}
          animate={{ rotate: HEAD_R[pose] }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
          <circle cx="60" cy="50" r="26" fill="#E8D5B0" />

          {/* Floppy ears — gentle flap independently */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '36px 40px' }}
            animate={{ rotate: EAR_R[pose] }}
            transition={{ repeat: Infinity, duration: EAR_DUR[pose], ease: 'easeInOut' }}
          >
            <ellipse cx="36" cy="52" rx="10" ry="16" fill="#C8A882" />
          </motion.g>
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '84px 40px' }}
            animate={{ rotate: EAR_R[pose].map((v) => -v) }}
            transition={{ repeat: Infinity, duration: EAR_DUR[pose], ease: 'easeInOut' }}
          >
            <ellipse cx="84" cy="52" rx="10" ry="16" fill="#C8A882" />
          </motion.g>

          {/* Muzzle */}
          <ellipse cx="60" cy="60" rx="14" ry="10" fill="#FFF9C4" />

          {/* Eyes */}
          <motion.ellipse
            cx="50" cy="48" rx="5" ry="6" fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2.5 }}
          />
          <motion.ellipse
            cx="70" cy="48" rx="5" ry="6" fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2.5 }}
          />
          <circle cx="52" cy="46" r="1.5" fill="white" />
          <circle cx="72" cy="46" r="1.5" fill="white" />

          {/* Nose */}
          <ellipse cx="60" cy="57" rx="5" ry="3.5" fill="#8B6B50" />

          {/* Tongue (happy / excited only) */}
          {(pose === 'happy' || pose === 'excited') && (
            <motion.ellipse
              cx="60" cy="68" rx="5" ry="6" fill="#E07090"
              animate={{ scaleY: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
          )}
          {(pose !== 'happy' && pose !== 'excited') && (
            <path d="M54,63 Q60,67 66,63" fill="none" stroke="#8B6B50" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {pose === 'sleepy' && (
            <motion.text
              x="78" y="36" fontSize="10" fill="#7C5CBF" fontWeight="bold"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              z
            </motion.text>
          )}
        </motion.g>

        {/* Paws */}
        <ellipse cx="42" cy="104" rx="11" ry="7" fill="#E8D5B0" />
        <ellipse cx="78" cy="104" rx="11" ry="7" fill="#E8D5B0" />
      </motion.g>
    </svg>
  )
}
