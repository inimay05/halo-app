'use client'

import { motion } from 'framer-motion'
import type { Pose } from './CompanionCharacter'

interface Props { pose: Pose; size: number }

const BODY_Y:    Record<Pose, number[]>  = {
  idle:    [0, -4, 0],
  happy:   [0, -10, 0],
  sleepy:  [0, 2, 0],
  excited: [0, -14, 0, -14, 0],
  sorry:   [0, 3, 0],
}
const BODY_DUR:  Record<Pose, number>  = { idle: 2.6, happy: 1.0, sleepy: 4.5, excited: 0.45, sorry: 3.2 }
// Clapping flippers: rotate up/down
const FLIP_R:    Record<Pose, number[]> = {
  idle:    [-10, 10, -10],
  happy:   [-30, 30, -30],
  sleepy:  [-5, 5, -5],
  excited: [-50, 50, -50],
  sorry:   [-6, 6, -6],
}
const FLIP_DUR:  Record<Pose, number>  = { idle: 1.8, happy: 0.7, sleepy: 5.0, excited: 0.25, sorry: 4.0 }
const HEAD_R:    Record<Pose, number>  = { idle: 0, happy: 8, sleepy: -6, excited: 0, sorry: -16 }
const EYE_SCALE: Record<Pose, number[]> = {
  idle:    [1, 0.05, 1],
  happy:   [0.3, 0.3, 0.3],
  sleepy:  [0.1, 0.1, 0.1],
  excited: [1.3, 1.3, 1.3],
  sorry:   [0.55, 0.55, 0.55],
}
const EYE_DUR:   Record<Pose, number>  = { idle: 3.2, happy: 99, sleepy: 99, excited: 99, sorry: 99 }

export function SealSVG({ pose, size }: Props) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible">
      <motion.g
        animate={{ y: BODY_Y[pose] }}
        transition={{ repeat: Infinity, duration: BODY_DUR[pose], ease: 'easeInOut' }}
      >
        {/* Body — round blob */}
        <ellipse cx="60" cy="84" rx="30" ry="25" fill="#8EB8D4" />
        {/* Belly */}
        <ellipse cx="60" cy="88" rx="18" ry="14" fill="#D6EAF8" />

        {/* Left flipper */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '34px 82px' }}
          animate={{ rotate: FLIP_R[pose] }}
          transition={{ repeat: Infinity, duration: FLIP_DUR[pose], ease: 'easeInOut' }}
        >
          <ellipse cx="30" cy="86" rx="12" ry="6" fill="#6A9AB8" transform="rotate(-40 30 86)" />
        </motion.g>

        {/* Right flipper */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '86px 82px' }}
          animate={{ rotate: FLIP_R[pose].map((v) => -v) }}
          transition={{ repeat: Infinity, duration: FLIP_DUR[pose], ease: 'easeInOut' }}
        >
          <ellipse cx="90" cy="86" rx="12" ry="6" fill="#6A9AB8" transform="rotate(40 90 86)" />
        </motion.g>

        {/* Tail fluke */}
        <ellipse cx="60" cy="108" rx="18" ry="7" fill="#6A9AB8" />
        <ellipse cx="46" cy="110" rx="8" ry="4.5" fill="#5A8AA8" />
        <ellipse cx="74" cy="110" rx="8" ry="4.5" fill="#5A8AA8" />

        {/* Head */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '60px 52px' }}
          animate={{ rotate: HEAD_R[pose] }}
          transition={{ type: 'spring', stiffness: 115, damping: 14 }}
        >
          <circle cx="60" cy="52" r="26" fill="#8EB8D4" />

          {/* Eyes — big round seal eyes */}
          <motion.ellipse
            cx="49" cy="50" rx="6" ry="7"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 1.4 }}
          />
          <motion.ellipse
            cx="71" cy="50" rx="6" ry="7"
            fill="#2D2D3A"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: EYE_SCALE[pose] }}
            transition={{ repeat: Infinity, duration: EYE_DUR[pose], ease: 'easeInOut', repeatDelay: 1.4 }}
          />
          {/* Shine */}
          <circle cx="51" cy="47" r="2" fill="white" />
          <circle cx="73" cy="47" r="2" fill="white" />

          {/* Nose */}
          <ellipse cx="60" cy="60" rx="4" ry="2.5" fill="#4A7A98" />

          {/* Whisker dots */}
          <circle cx="50" cy="62" r="1.2" fill="#4A7A98" />
          <circle cx="54" cy="64" r="1.2" fill="#4A7A98" />
          <circle cx="70" cy="62" r="1.2" fill="#4A7A98" />
          <circle cx="66" cy="64" r="1.2" fill="#4A7A98" />

          {/* Mouth */}
          {(pose === 'happy' || pose === 'excited')
            ? <path d="M52,65 Q60,72 68,65" fill="none" stroke="#4A7A98" strokeWidth="1.8" strokeLinecap="round" />
            : <path d="M55,66 Q60,69 65,66" fill="none" stroke="#4A7A98" strokeWidth="1.8" strokeLinecap="round" />
          }

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
      </motion.g>
    </svg>
  )
}
