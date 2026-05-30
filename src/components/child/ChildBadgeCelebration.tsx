'use client'

import { useEffect, useCallback } from 'react'
import { createPortal }            from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBadgeStore }           from '@/store/badgeStore'
import { CompanionCharacter }      from '@/components/companion/CompanionCharacter'
import type { CharacterType }      from '@/components/companion/CompanionCharacter'
import { COLORS }                  from '@/config/tokens'

const CONFETTI_COLORS = [
  COLORS.lavender, COLORS.mint, COLORS.peach, COLORS.sky, COLORS.lemon,
]

const PIECES = Array.from({ length: 32 }, (_, i) => ({
  id:       i,
  x:        Math.random() * 100,
  size:     9 + Math.random() * 9,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 1.5 + Math.random() * 1.3,
  delay:    Math.random() * 0.5,
  rotate:   Math.random() * 720 - 360,
}))

const BADGE_NAMES: Record<string, string> = {
  first_break:         'First Break!',
  week_streak:         'Week Warrior',
  hero_exit_5:         'Screen-Time Hero',
  garden_bloom:        'Green Thumb',
  night_champion_7:    'Night Champion',
  mission_explorer_10: 'Mission Explorer',
}

const BADGE_ICONS: Record<string, string> = {
  first_break:         '🌟',
  week_streak:         '🔥',
  hero_exit_5:         '🦸',
  garden_bloom:        '🌸',
  night_champion_7:    '🌙',
  mission_explorer_10: '🚀',
}

interface Props {
  companion: CharacterType
}

export function ChildBadgeCelebration({ companion }: Props) {
  const { newBadge, clearNew } = useBadgeStore()
  const handleDone = useCallback(() => clearNew(), [clearNew])

  useEffect(() => {
    if (!newBadge) return
    const t = setTimeout(handleDone, 3_200)
    return () => clearTimeout(t)
  }, [newBadge, handleDone])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {newBadge && (
        <motion.div
          key={newBadge.badge_type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position:       'fixed',
            inset:          0,
            zIndex:         10002,
            background:     COLORS.sage,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            20,
          }}
        >
          {/* Confetti dots */}
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
                  height:       p.size,
                  borderRadius: '50%',
                  background:   p.color,
                }}
              />
            ))}
          </div>

          {/* Companion dancing */}
          <motion.div
            animate={{ y: [0, -18, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 0.65, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CompanionCharacter character={companion} pose="excited" size={140} />
          </motion.div>

          {/* Badge reveal */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
            style={{
              background:   'white',
              borderRadius: 24,
              padding:      '24px 36px',
              textAlign:    'center',
              boxShadow:    '0 8px 40px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ fontSize: 52, lineHeight: 1 }}>
              {BADGE_ICONS[newBadge.badge_type] ?? '🏅'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: COLORS.ink, marginTop: 10 }}>
              {BADGE_NAMES[newBadge.badge_type] ?? 'New Badge!'}
            </div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
              You earned a new badge!
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
