'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal }                              from 'react-dom'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { CompanionCharacter }  from '@/components/companion/CompanionCharacter'
import { VoiceChallenge, pickWord } from './VoiceChallenge'
import { useLongPress }        from '@/lib/hooks/useLongPress'
import { useProfileStore }     from '@/store/profileStore'
import type { PhysicalTask }   from '@/lib/breaks/PhysicalTaskLibrary'
import type { AgeTier }        from '@/lib/ageProfile'
import type { CharacterType }  from '@/components/companion/CompanionCharacter'
import { COLORS }              from '@/config/tokens'

const COUNTDOWN_SEC     = 15
const WELL_DONE_MS      = 2_000
const LONG_PRESS_MS     = 1_500

// ─── Countdown ring ────────────────────────────────────────────────────────────
function CountdownRing({
  seconds,
  tier,
  running,
}: {
  seconds: number
  tier: AgeTier
  running: boolean
}) {
  const r   = 45
  const sz  = 120
  const cx  = 60
  const cy  = 60
  const showNumber = tier === 'schoolage'

  return (
    <div style={{ position: 'relative', width: sz, height: sz }}>
      <svg viewBox={`0 0 ${sz} ${sz}`} width={sz} height={sz}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="7" />
        {/* Progress — pathLength animates 1→0 over 15s */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={tier === 'schoolage' ? COLORS.lavenderDark : tier === 'preschool' ? COLORS.peachDark : COLORS.mintDark}
          strokeWidth="7"
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          initial={{ pathLength: 1 }}
          animate={{ pathLength: running ? 0 : 1 }}
          transition={{ duration: COUNTDOWN_SEC, ease: 'linear' }}
        />
      </svg>
      {showNumber && (
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 800,
          color: COLORS.ink,
        }}>
          {seconds}
        </span>
      )}
    </div>
  )
}

// ─── Inner overlay (portalled) ─────────────────────────────────────────────────
interface InnerProps {
  task:              PhysicalTask | null
  tier:              AgeTier
  character:         CharacterType
  voiceEnabled?:     boolean
  onBreakComplete:   () => void
  onBreakSkipped:    () => void
}

type Phase = 'active' | 'done'

function Inner({ task, tier, character, voiceEnabled, onBreakComplete }: InnerProps) {
  const [phase, setPhase]           = useState<Phase>('active')
  const [seconds, setSeconds]       = useState(COUNTDOWN_SEC)
  const [showTooltip, setShowTooltip] = useState(false)
  const [voiceFallback, setVoiceFallback] = useState(false)
  const [word] = useState(() => pickWord())
  const completedRef = useRef(false)
  const wiggle       = useAnimationControls()

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setPhase('done')
    setTimeout(onBreakComplete, WELL_DONE_MS)
  }, [onBreakComplete])

  // 1-second tick for the displayed number
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

  // Long-press done button
  const longPressFiredRef = useRef(false)
  const longPress = useLongPress(() => {
    longPressFiredRef.current = true
    finish()
  }, LONG_PRESS_MS)

  const handleButtonUp = useCallback(() => {
    if (!longPressFiredRef.current) {
      // Short press — wiggle companion + show tooltip
      wiggle.start({ x: [-6, 6, -6, 6, 0], transition: { duration: 0.4 } })
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2_000)
    }
    longPressFiredRef.current = false
  }, [wiggle])

  const bg = tier === 'infant' ? COLORS.mint : tier === 'preschool' ? COLORS.peach : COLORS.lavender
  const textColor = tier === 'infant' ? COLORS.mintDark : tier === 'preschool' ? COLORS.peachDark : COLORS.lavenderDark

  const showVoice = tier === 'schoolage' && voiceEnabled && !voiceFallback

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          9998,
        background:      `${bg}E8`,  // 90% opacity hex
        backdropFilter:  'blur(2px)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             16,
        padding:         40,
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 'active' ? (
          <motion.div
            key="active"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Companion */}
            <motion.div animate={wiggle}>
              <CompanionCharacter character={character} pose="excited" size={150} />
            </motion.div>

            {/* Task instruction */}
            {task && (
              <p style={{
                margin:     0,
                fontSize:   28,
                fontWeight: 800,
                color:      textColor,
                textAlign:  'center',
                maxWidth:   340,
                lineHeight: 1.25,
              }}>
                {task.instruction}
              </p>
            )}

            {/* Countdown ring */}
            <CountdownRing seconds={seconds} tier={tier} running />

            {/* Voice challenge for schoolage */}
            {tier === 'schoolage' && voiceEnabled && (
              <VoiceChallenge
                word={word}
                onSuccess={finish}
                onFallback={() => setVoiceFallback(true)}
              />
            )}

            {/* Done button (shown always; required after voice fallback) */}
            {(!showVoice || voiceFallback) && (
              <div style={{ position: 'relative' }}>
                <button
                  {...longPress}
                  onMouseUp={() => { longPress.onMouseUp?.(); handleButtonUp() }}
                  onTouchEnd={() => { longPress.onTouchEnd?.(); handleButtonUp() }}
                  style={{
                    padding:      '14px 40px',
                    borderRadius: 50,
                    border:       'none',
                    background:   COLORS.mint,
                    color:        COLORS.mintDark,
                    fontWeight:   800,
                    fontSize:     18,
                    cursor:       'pointer',
                    userSelect:   'none',
                  }}
                >
                  Done ✔
                </button>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position:    'absolute',
                        bottom:      '110%',
                        left:        '50%',
                        transform:   'translateX(-50%)',
                        background:  COLORS.ink,
                        color:       'white',
                        fontSize:    12,
                        padding:     '4px 10px',
                        borderRadius: 8,
                        whiteSpace:  'nowrap',
                      }}
                    >
                      Hold it down!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center' }}
          >
            <CompanionCharacter character={character} pose="happy" size={160} />
            <p style={{ margin: '20px 0 0', fontSize: 32, fontWeight: 800, color: textColor }}>
              Well done! 🎉
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Portal wrapper ─────────────────────────────────────────────────────────
interface BreakOverlayProps {
  visible:           boolean
  task:              PhysicalTask | null
  voiceEnabled?:     boolean
  onBreakComplete:   () => void
  onBreakSkipped:    () => void
}

export function BreakOverlay({ visible, task, voiceEnabled, onBreakComplete, onBreakSkipped }: BreakOverlayProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const activeChild = useProfileStore((s) => s.activeChild())
  const tier        = (activeChild?.age_tier ?? 'schoolage') as AgeTier
  const character   = (activeChild?.active_companion ?? 'dog') as CharacterType

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <Inner
          key="break"
          task={task}
          tier={tier}
          character={character}
          voiceEnabled={voiceEnabled}
          onBreakComplete={onBreakComplete}
          onBreakSkipped={onBreakSkipped}
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}
