'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal }                             from 'react-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { CompanionCharacter }  from '@/components/companion/CompanionCharacter'
import { useLongPress }        from '@/lib/hooks/useLongPress'
import { useProfileStore }     from '@/store/profileStore'
import { getTask }             from '@/lib/breaks/PhysicalTaskLibrary'
import { AGE_PROFILES }        from '@/config/ageProfiles'
import type { AgeTier }        from '@/lib/ageProfile'
import type { PhysicalTask }   from '@/lib/breaks/PhysicalTaskLibrary'
import type { CharacterType }  from '@/components/companion/CompanionCharacter'
import { COLORS }              from '@/config/tokens'

export const BLINK_MISSION_INTERVAL_MS = 20 * 60 * 1_000

const COUNTDOWN_SEC = 15

// ─── Mini countdown ring ───────────────────────────────────────────────────────
function MiniRing({ running }: { running: boolean }) {
  return (
    <svg viewBox="0 0 56 56" width={56} height={56}>
      <circle cx={28} cy={28} r={22} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={5} />
      <motion.circle
        cx={28} cy={28} r={22}
        fill="none"
        stroke={COLORS.lemonDark}
        strokeWidth={5}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        initial={{ pathLength: 1 }}
        animate={{ pathLength: running ? 0 : 1 }}
        transition={{ duration: COUNTDOWN_SEC, ease: 'linear' }}
      />
    </svg>
  )
}

// ─── Card content ──────────────────────────────────────────────────────────────
interface CardProps {
  task:       PhysicalTask
  character:  CharacterType
  onDone:     () => void
  onDismiss:  () => void
}

function Card({ task, character, onDone, onDismiss }: CardProps) {
  const [seconds, setSeconds] = useState(COUNTDOWN_SEC)
  const [phase, setPhase]     = useState<'active' | 'done'>('active')
  const wiggle                = useAnimationControls()
  const firedRef              = useRef(false)

  const finish = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true
    setPhase('done')
    setTimeout(onDone, 1_500)
  }, [onDone])

  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(id); finish(); return 0 }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(id)
  }, [phase, finish])

  const longPressFiredRef = useRef(false)
  const longPress = useLongPress(() => {
    longPressFiredRef.current = true
    finish()
  }, 1_500)

  const handleUp = useCallback(() => {
    if (!longPressFiredRef.current) {
      wiggle.start({ x: [-4, 4, -4, 4, 0], transition: { duration: 0.35 } })
    }
    longPressFiredRef.current = false
  }, [wiggle])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      style={{
        position:     'fixed',
        bottom:       24,
        left:         '50%',
        transform:    'translateX(-50%)',
        width:        'min(380px, calc(100vw - 32px))',
        zIndex:       9997,
        borderRadius: 24,
        background:   COLORS.lemon,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.16)',
        padding:      '20px 24px',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:          12,
      }}
    >
      {/* Dismiss (×) */}
      {phase === 'active' && (
        <button
          onClick={onDismiss}
          style={{
            position:  'absolute',
            top:       10,
            right:     12,
            background:'none',
            border:    'none',
            fontSize:  18,
            cursor:    'pointer',
            color:     COLORS.muted,
          }}
          aria-label="Dismiss mission"
        >
          ×
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'active' ? (
          <motion.div key="active" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%' }}>
            {/* Companion holding mission sign */}
            <motion.div animate={wiggle} style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
              <CompanionCharacter character={character} pose="excited" size={72} />
              <div style={{
                background: 'white',
                borderRadius: 12,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.lemonDark,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                maxWidth: 200,
              }}>
                ⚡ Eye & Body Mission!
              </div>
            </motion.div>

            <p style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: COLORS.ink,
              textAlign: 'center',
            }}>
              {task.instruction}
            </p>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <MiniRing running />
              <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.lemonDark }}>{seconds}s</span>
            </div>

            <button
              {...longPress}
              onMouseUp={() => { longPress.onMouseUp?.(); handleUp() }}
              onTouchEnd={() => { longPress.onTouchEnd?.(); handleUp() }}
              style={{
                padding:      '10px 32px',
                borderRadius: 40,
                border:       'none',
                background:   COLORS.mint,
                color:        COLORS.mintDark,
                fontWeight:   700,
                fontSize:     15,
                cursor:       'pointer',
                userSelect:   'none',
              }}
            >
              Done ✔
            </button>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ textAlign:'center', padding:'8px 0' }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.mintDark }}>Great job! 🌟</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Timer-driven portal wrapper ──────────────────────────────────────────────
interface MissionCardProps {
  active?: boolean  // pause missions when false (e.g. session blocked)
}

export function MissionCard({ active = true }: MissionCardProps) {
  const [visible, setVisible]     = useState(false)
  const [task, setTask]           = useState<PhysicalTask | null>(null)
  const [mounted, setMounted]     = useState(false)
  const activeChild               = useProfileStore((s) => s.activeChild())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!active) return
    const fire = () => {
      if (!activeChild) return
      const profile = AGE_PROFILES[activeChild.age_tier as AgeTier]
      const t = getTask(profile)
      if (t) { setTask(t); setVisible(true) }
    }
    const id = setInterval(fire, BLINK_MISSION_INTERVAL_MS)
    return () => clearInterval(id)
  }, [active, activeChild])

  const handleDone    = useCallback(() => setVisible(false), [])
  const handleDismiss = useCallback(() => setVisible(false), [])

  if (!mounted || !task) return null

  const character = (activeChild?.active_companion ?? 'cat') as CharacterType

  return createPortal(
    <AnimatePresence>
      {visible && (
        <Card
          key="mission"
          task={task}
          character={character}
          onDone={handleDone}
          onDismiss={handleDismiss}
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}
