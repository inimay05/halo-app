'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion }        from 'framer-motion'
import { CompanionCharacter } from '@/components/companion/CompanionCharacter'
import type { CharacterType } from '@/components/companion/CompanionCharacter'
import { COLORS } from '@/config/tokens'

const CONFETTI_COLORS = [
  COLORS.lavender, COLORS.mint, COLORS.peach, COLORS.sky, COLORS.lemon,
]

const PIECES = Array.from({ length: 36 }, (_, i) => ({
  id:       i,
  x:        Math.random() * 100,
  size:     10 + Math.random() * 10,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 1.6 + Math.random() * 1.4,
  delay:    Math.random() * 0.6,
  rotate:   Math.random() * 720 - 360,
}))

interface Props {
  companion: CharacterType
  onDone:   () => void
}

export function HeroExitOverlay({ companion, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3_200)
    return () => clearTimeout(t)
  }, [onDone])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         10001,
        background:     COLORS.sage,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            24,
      }}
    >
      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        {PIECES.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}vw`, y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', rotate: p.rotate, opacity: [1, 1, 0] }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
            style={{
              position:     'fixed',
              top:          0,
              left:         0,
              width:        p.size,
              height:       p.size * 0.55,
              borderRadius: '50%',
              background:   p.color,
            }}
          />
        ))}
      </div>

      {/* Companion dancing */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CompanionCharacter character={companion} pose="excited" size={160} />
      </motion.div>

      {/* Hero text */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        style={{ textAlign: 'center', padding: '0 32px' }}
      >
        <div style={{
          fontSize:   40,
          fontWeight: 800,
          color:      COLORS.sageDark,
          lineHeight: 1.15,
        }}>
          You are a<br />Screen Hero!
        </div>
        <div style={{
          marginTop:  12,
          fontSize:   18,
          color:      COLORS.sageDark,
          fontWeight: 600,
          opacity:    0.8,
        }}>
          Great choice. See you next time! 🌟
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
