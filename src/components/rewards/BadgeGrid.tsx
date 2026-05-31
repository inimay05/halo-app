'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal }                      from 'react-dom'
import { motion, AnimatePresence }           from 'framer-motion'
import { useBadgeStore }                     from '@/store/badgeStore'
import type { BadgeType }                    from '@/lib/rewards/BadgeEngine'
import { COLORS }                            from '@/config/tokens'
import { format }                            from 'date-fns'

// ─── Badge metadata ───────────────────────────────────────────────────────────

interface BadgeMeta {
  name:        string
  description: string
  icon:        string
  color:       string
}

const BADGE_META: Record<BadgeType, BadgeMeta> = {
  first_break:          { name: 'First Break!',      description: 'Completed your very first screen break.',        icon: '🌟', color: COLORS.lemon       },
  week_streak:          { name: 'Week Warrior',       description: 'Took a break every day for 7 days in a row.',   icon: '🔥', color: COLORS.peach       },
  hero_exit_5:          { name: 'Screen-Time Hero',   description: 'Exited early or stayed off for 30 min × 5.',    icon: '🦸', color: COLORS.lavender    },
  garden_bloom:         { name: 'Green Thumb',        description: 'Grew your garden all the way to full bloom!',   icon: '🌸', color: COLORS.mint        },
  night_champion_7:     { name: 'Night Champion',     description: 'Kept healthy screen habits at night × 7.',      icon: '🌙', color: COLORS.sky         },
  mission_explorer_10:  { name: 'Mission Explorer',   description: 'Completed 10 eye & body missions.',             icon: '🚀', color: COLORS.sage        },
  fifty_coins:          { name: 'Coin Collector',     description: 'Accumulated 50 coins.',                         icon: '🪙', color: COLORS.lemon       },
  voice_hero:           { name: 'Voice Hero',         description: 'Completed a voice challenge.',                  icon: '🎤', color: COLORS.lavender    },
}

const ALL_BADGES = Object.keys(BADGE_META) as BadgeType[]

const CONFETTI_COLORS = [
  COLORS.lavender, COLORS.mint, COLORS.peach, COLORS.sky,
  COLORS.rose, COLORS.lemon, COLORS.sage, COLORS.warmAmber,
]

// ─── Confetti celebration (3 seconds) ────────────────────────────────────────

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id:       i,
  x:        Math.random() * 100,         // vw %
  size:     8 + Math.random() * 8,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 1.4 + Math.random() * 1.2,
  delay:    Math.random() * 0.5,
  rotate:   Math.random() * 720 - 360,
}))

function Confetti({ badge, onDone }: { badge: BadgeMeta; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3_200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
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
            height:       p.size * 0.6,
            background:   p.color,
            borderRadius: 2,
          }}
        />
      ))}
      {/* Centre badge reveal */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        style={{
          position:       'fixed',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            12,
          pointerEvents:  'none',
        }}
      >
        <div style={{
          background:   'white',
          borderRadius: 24,
          padding:      '28px 40px',
          textAlign:    'center',
          boxShadow:    '0 8px 40px rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>{badge.icon}</div>
          <p style={{ margin: '10px 0 4px', fontWeight: 800, fontSize: 22, color: COLORS.ink }}>
            {badge.name}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.muted }}>
            {badge.description}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Individual badge cell ─────────────────────────────────────────────────────

function BadgeCell({
  type,
  earnedAt,
}: {
  type:       BadgeType
  earnedAt?:  string
}) {
  const meta    = BADGE_META[type]
  const earned  = !!earnedAt
  const [tip, setTip] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileHover={earned ? { scale: 1.08 } : {}}
        whileTap={earned ? { scale: 0.95 } : {}}
        onClick={() => earned && setTip((v) => !v)}
        style={{
          width:        72,
          height:       72,
          borderRadius: 18,
          border:       'none',
          background:   earned ? meta.color : '#E8E8EC',
          cursor:       earned ? 'pointer' : 'default',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     32,
          filter:       earned ? 'none' : 'grayscale(1) opacity(0.35)',
          position:     'relative',
          overflow:     'visible',
        }}
        aria-label={meta.name}
      >
        {meta.icon}
        {earned && (
          <span style={{
            position:   'absolute',
            bottom:     -6,
            right:      -6,
            background: COLORS.haloGold,
            borderRadius: '50%',
            width:      18,
            height:     18,
            fontSize:   10,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color:      'white',
          }}>✓</span>
        )}
      </motion.button>

      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              position:     'absolute',
              bottom:       '110%',
              left:         '50%',
              transform:    'translateX(-50%)',
              background:   'white',
              borderRadius: 12,
              padding:      '10px 14px',
              boxShadow:    '0 4px 20px rgba(0,0,0,0.14)',
              width:        180,
              zIndex:       200,
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: COLORS.ink }}>
              {meta.name}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: COLORS.muted }}>
              {meta.description}
            </p>
            {earnedAt && (
              <p style={{ margin: 0, fontSize: 11, color: COLORS.lavenderDark, fontWeight: 600 }}>
                Earned {format(new Date(earnedAt), 'MMM d, yyyy')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main grid ────────────────────────────────────────────────────────────────

export function BadgeGrid() {
  const { earned, newBadge, clearNew } = useBadgeStore()
  const [mounted, setMounted]          = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const earnedMap = Object.fromEntries(earned.map((b) => [b.badge_type, b.earned_at]))

  const handleConfettiDone = useCallback(() => clearNew(), [clearNew])

  return (
    <>
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 72px)',
        gap:                 16,
        justifyContent:      'center',
      }}>
        {ALL_BADGES.map((type) => (
          <BadgeCell
            key={type}
            type={type}
            earnedAt={earnedMap[type]}
          />
        ))}
      </div>

      {/* Full-screen celebration portal */}
      {mounted && newBadge && createPortal(
        <AnimatePresence>
          <Confetti
            key={newBadge.badge_type}
            badge={BADGE_META[newBadge.badge_type as BadgeType]}
            onDone={handleConfettiDone}
          />
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
