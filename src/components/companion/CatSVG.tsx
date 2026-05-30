'use client'

import { motion } from 'framer-motion'
import type { Pose } from './CompanionCharacter'

interface Props { pose: Pose; size: number }

// Per-pose animation config
const BODY_Y:   Record<Pose, number[]>   = {
  idle:    [0, -4, 0],
  happy:   [0, -10, 0],
  sleepy:  [0, 2, 0],
  excited: [0, -14, 0, -14, 0],
  sorry:   [0, 3, 0],
}
const BODY_DUR: Record<Pose, number> = { idle: 2.4, happy: 1.0, sleepy: 4.0, excited: 0.5, sorry: 3.0 }
const EYE_SCALE: Record<Pose, number[]> = {
  idle:    [1, 0.05, 1],
  happy:   [0.4, 0.4, 0.4],
  sleepy:  [0.15, 0.15, 0.15],
  excited: [1.2, 1.2, 1.2],
  sorry:   [0.7, 0.7, 0.7],
}
const EYE_DUR:  Record<Pose, number>  = { idle: 3.5, happy: 99, sleepy: 99, excited: 99, sorry: 99 }
const TAIL_R:   Record<Pose, number[]> = {
  idle:    [-20, 20, -20],
  happy:   [-35, 35, -35],
  sleepy:  [-8, 8, -8],
  excited: [-45, 45, -45],
  sorry:   [-10, 10, -10],
}
const TAIL_DUR: Record<Pose, number>  = { idle: 2.0, happy: 0.8, sleepy: 4.0, excited: 0.35, sorry: 3.0 }
const HEAD_R:   Record<Pose, number>  = { idle: 0, happy: 8, sleepy: -5, excited: 0, sorry: -15 }

export function CatSVG({ pose, size }: Props) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible">
      <motion.g
        animate={{ y: BODY_Y[pose] }}
        transition={{ repeat: Infinity, duration: BODY_DUR[pose], ease: 'easeInOut' }}
      >
        {/* Tail */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={{ rotate: TAIL_R[pose] }}
          transition={{ repeat: Infinity, duration: TAIL_DUR[pose], ease: 'easeInOut' }}
        >
          <path
            d="M75 95 Q100 110 95 85"
            fill="none"
            stroke="#E8824A"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Body */}
        <ellipse cx="60" cy="82" rx="28" ry="24" fill="#F4A460" />
        {/* Belly */}
        <ellipse cx="60" cy="86" rx="16" ry="14" fill="#FCE8D8" />

        {/* Head */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '60px 50px' }}
          animate={{ rotate: HEAD_R[pose] }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          <circle cx="60" cy="50" r="26" fill="#F4A460" />
          {/* Left ear */}
          <polygon points="36,30 28,10 50,28" fill="#F4A460" />
          <polygon points="38,29 32,15 48,27" fill="#FCB8B8" />
          {/* Right ear */}
          <polygon points="84,30 92,10 70,28" fill="#F4A460" />
          <polygon points="82,29 88,15 72,27" fill="#FCB8B8" />

          {/* Eyes */}
          <motion.ellipse
            cx="50" cy="50" rx="5" ry="6"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 1.5 }}
          />
          <motion.ellipse
            cx="70" cy="50" rx="5" ry="6"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 1.5 }}
          />
          {/* Shine */}
          <circle cx="52" cy="48" r="1.5" fill="white" />
          <circle cx="72" cy="48" r="1.5" fill="white" />

          {/* Nose + mouth */}
          <ellipse cx="60" cy="58" rx="3" ry="2" fill="#E07070" />
          {pose === 'happy' || pose === 'excited'
            ? <path d="M54,62 Q60,68 66,62" fill="none" stroke="#E07070" strokeWidth="1.5" strokeLinecap="round" />
            : <path d="M57,61 Q60,63 63,61" fill="none" stroke="#E07070" strokeWidth="1.5" strokeLinecap="round" />
          }

          {/* Whiskers */}
          <line x1="38" y1="57" x2="55" y2="59" stroke="#C07840" strokeWidth="1" opacity="0.6" />
          <line x1="38" y1="61" x2="55" y2="61" stroke="#C07840" strokeWidth="1" opacity="0.6" />
          <line x1="65" y1="59" x2="82" y2="57" stroke="#C07840" strokeWidth="1" opacity="0.6" />
          <line x1="65" y1="61" x2="82" y2="61" stroke="#C07840" strokeWidth="1" opacity="0.6" />

          {/* Sleepy Zzz */}
          {pose === 'sleepy' && (
            <motion.text
              x="78" y="38" fontSize="10" fill="#7C5CBF" fontWeight="bold"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            >
              z
            </motion.text>
          )}
        </motion.g>

        {/* Paws */}
        <ellipse cx="42" cy="104" rx="10" ry="6" fill="#F4A460" />
        <ellipse cx="78" cy="104" rx="10" ry="6" fill="#F4A460" />
      </motion.g>
    </svg>
  )
}
