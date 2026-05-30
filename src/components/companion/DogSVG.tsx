'use client'

import { motion } from 'framer-motion'
import type { Pose } from './CompanionCharacter'

interface Props { pose: Pose; size: number }

const BODY_Y:   Record<Pose, number[]>  = {
  idle:    [0, -4, 0],
  happy:   [0, -10, 0],
  sleepy:  [0, 2, 0],
  excited: [0, -14, 0, -14, 0],
  sorry:   [0, 3, 0],
}
const BODY_DUR: Record<Pose, number>   = { idle: 2.4, happy: 1.0, sleepy: 4.0, excited: 0.5, sorry: 3.0 }
const TAIL_R:   Record<Pose, number[]> = {
  idle:    [10, 50, 10],
  happy:   [-10, 70, -10],
  sleepy:  [5, 20, 5],
  excited: [-20, 80, -20],
  sorry:   [5, 15, 5],
}
const TAIL_DUR: Record<Pose, number>  = { idle: 1.6, happy: 0.6, sleepy: 4.0, excited: 0.28, sorry: 3.5 }
const HEAD_R:   Record<Pose, number>  = { idle: 0, happy: 10, sleepy: -6, excited: 0, sorry: -18 }
const EYE_SCALE: Record<Pose, number[]> = {
  idle:    [1, 0.05, 1],
  happy:   [0.35, 0.35, 0.35],
  sleepy:  [0.1, 0.1, 0.1],
  excited: [1.3, 1.3, 1.3],
  sorry:   [0.6, 0.6, 0.6],
}
const EYE_DUR:  Record<Pose, number>  = { idle: 4.0, happy: 99, sleepy: 99, excited: 99, sorry: 99 }

export function DogSVG({ pose, size }: Props) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible">
      <motion.g
        animate={{ y: BODY_Y[pose] }}
        transition={{ repeat: Infinity, duration: BODY_DUR[pose], ease: 'easeInOut' }}
      >
        {/* Tail */}
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
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          <circle cx="60" cy="50" r="26" fill="#E8D5B0" />

          {/* Floppy ears */}
          <ellipse cx="36" cy="52" rx="10" ry="16" fill="#C8A882" />
          <ellipse cx="84" cy="52" rx="10" ry="16" fill="#C8A882" />

          {/* Muzzle */}
          <ellipse cx="60" cy="60" rx="14" ry="10" fill="#FFF9C4" />

          {/* Eyes */}
          <motion.ellipse
            cx="50" cy="48" rx="5" ry="6"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2 }}
          />
          <motion.ellipse
            cx="70" cy="48" rx="5" ry="6"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 2 }}
          />
          <circle cx="52" cy="46" r="1.5" fill="white" />
          <circle cx="72" cy="46" r="1.5" fill="white" />

          {/* Nose */}
          <ellipse cx="60" cy="57" rx="5" ry="3.5" fill="#8B6B50" />

          {/* Tongue (happy / excited) */}
          {(pose === 'happy' || pose === 'excited') && (
            <motion.ellipse
              cx="60" cy="68" rx="5" ry="6" fill="#E07090"
              animate={{ scaleY: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          )}
          {(pose !== 'happy' && pose !== 'excited') && (
            <path d="M54,63 Q60,67 66,63" fill="none" stroke="#8B6B50" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Sleepy Zzz */}
          {pose === 'sleepy' && (
            <motion.text
              x="78" y="36" fontSize="10" fill="#7C5CBF" fontWeight="bold"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
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
