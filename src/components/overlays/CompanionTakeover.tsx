'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion }  from 'framer-motion'
import { useEngagementStore }       from '@/store/engagementStore'
import { useProfileStore }          from '@/store/profileStore'
import { verifyPinAction }          from '@/app/(parent)/verify-pin/actions'
import { useLongPress }             from '@/lib/hooks/useLongPress'
import { CompanionCharacter }       from '@/components/companion/CompanionCharacter'
import type { CharacterType, Pose } from '@/components/companion/CompanionCharacter'
import type { AgeTier }             from '@/lib/ageProfile'
import { COLORS }                   from '@/config/tokens'

// ─── Per–age-tier config ──────────────────────────────────────────────────────
const AGE_CONFIG: Record<AgeTier, {
  character: CharacterType
  bg: string
  text: string
  accent: string
  fontSize: number
}> = {
  infant:    { character: 'seal',  bg: COLORS.mint,     text: COLORS.mintDark,     accent: COLORS.mintDark,     fontSize: 22 },
  preschool: { character: 'cat',   bg: COLORS.peach,    text: COLORS.peachDark,    accent: COLORS.peachDark,    fontSize: 20 },
  schoolage: { character: 'dog',   bg: COLORS.lavender, text: COLORS.lavenderDark, accent: COLORS.lavenderDark, fontSize: 18 },
}

// ─── Message copy per state ───────────────────────────────────────────────────
function getMessages(tier: AgeTier, stateType: string): { headline: string; sub: string; pose: Pose } {
  if (stateType === 'fullBlock') {
    return tier === 'infant'
      ? { headline: 'Time to rest! 😴',      sub: "Your buddy's sleepy too!",       pose: 'sleepy' }
      : tier === 'preschool'
      ? { headline: 'Screen time is done!',   sub: 'Go play outside 🌳',             pose: 'sorry'  }
      : { headline: 'Screen limit reached.',  sub: 'Your parent will unlock soon.',  pose: 'sorry'  }
  }
  if (stateType === 'softWarning') {
    return { headline: '5 more minutes…',     sub: 'Almost time to wrap up!',        pose: 'happy'  }
  }
  if (stateType === 'passiveStare') {
    return { headline: 'Still there? 👋',     sub: "Don't forget to blink!",         pose: 'idle'   }
  }
  if (stateType === 'autoplayTrap') {
    return { headline: 'Lots of videos!',     sub: "Maybe do something else?",       pose: 'sorry'  }
  }
  if (stateType === 'nightRisk') {
    return { headline: 'Getting late 🌙',     sub: 'Wrap up soon for sleep.',        pose: 'sleepy' }
  }
  if (stateType === 'sleepDetected') {
    return { headline: 'Fell asleep? 💤',     sub: "Screen's locking itself.",       pose: 'sleepy' }
  }
  return { headline: 'All good!', sub: '', pose: 'idle' }
}

// ─── PIN unlock panel ─────────────────────────────────────────────────────────
function PinUnlock({ onSuccess }: { onSuccess: () => void }) {
  const [digits, setDigits]   = useState<string[]>([])
  const [error, setError]     = useState(false)
  const [loading, setLoading] = useState(false)

  const append = useCallback((d: string) => {
    setError(false)
    setDigits((prev) => {
      const next = [...prev, d].slice(0, 4)
      if (next.length === 4) {
        setLoading(true)
        verifyPinAction(next.join(''))
          .then(({ ok }) => {
            setLoading(false)
            if (ok) { onSuccess() } else { setError(true); setDigits([]) }
          })
          .catch(() => { setLoading(false); setError(true); setDigits([]) })
      }
      return next
    })
  }, [onSuccess])

  const del = useCallback(() => setDigits((p) => p.slice(0, -1)), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{
        background: 'white',
        borderRadius: 20,
        padding: '24px 28px',
        width: 240,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <p style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, margin: 0 }}>Parent PIN</p>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[0,1,2,3].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: digits[i] !== undefined ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 16, height: 16,
              borderRadius: '50%',
              background: error ? '#E53E3E' : digits[i] !== undefined ? COLORS.haloGold : '#E2E8F0',
              border: `2px solid ${error ? '#E53E3E' : COLORS.muted}`,
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
          <button
            key={i}
            disabled={loading || k === ''}
            onClick={() => k === '⌫' ? del() : k ? append(k) : undefined}
            style={{
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: k === '' ? 'transparent' : '#F7FAFC',
              fontSize: 17,
              fontWeight: 600,
              color: COLORS.ink,
              cursor: k === '' ? 'default' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {k}
          </button>
        ))}
      </div>
      {error && <p style={{ margin: 0, fontSize: 13, color: '#E53E3E' }}>Incorrect PIN</p>}
    </motion.div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
function Overlay({
  stateType,
  tier,
  onDismiss,
}: {
  stateType: string
  tier: AgeTier
  onDismiss: () => void
}) {
  const cfg = AGE_CONFIG[tier]
  const { headline, sub, pose } = getMessages(tier, stateType)

  const isFullBlock = stateType === 'fullBlock' || stateType === 'sleepDetected'
  const [pinOpen, setPinOpen] = useState(false)

  const longPress = useLongPress(() => setPinOpen(true), 1500)

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0, y: isFullBlock ? '100%' : 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isFullBlock ? '100%' : 40 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      style={{
        position:   'fixed',
        inset:      isFullBlock ? 0 : 'auto 0 0 0',
        background: cfg.bg,
        zIndex:     9999,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding:    isFullBlock ? 40 : '28px 24px',
        minHeight:  isFullBlock ? '100dvh' : 260,
        borderTopLeftRadius:  isFullBlock ? 0 : 28,
        borderTopRightRadius: isFullBlock ? 0 : 28,
      }}
    >
      {/* Character */}
      <CompanionCharacter character={cfg.character} pose={pose} size={isFullBlock ? 160 : 110} />

      {/* Copy */}
      <p style={{ margin: '16px 0 6px', fontWeight: 800, fontSize: cfg.fontSize, color: cfg.text, textAlign: 'center' }}>
        {headline}
      </p>
      {sub && (
        <p style={{ margin: 0, fontSize: cfg.fontSize - 4, color: cfg.text, opacity: 0.75, textAlign: 'center' }}>
          {sub}
        </p>
      )}

      {/* Dismiss (soft states only) */}
      {!isFullBlock && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 20,
            padding:   '10px 28px',
            borderRadius: 20,
            border: 'none',
            background: cfg.accent,
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Got it!
        </button>
      )}

      {/* Long-press PIN unlock hint (full block) */}
      {isFullBlock && !pinOpen && (
        <p
          style={{
            marginTop: 28,
            fontSize: 12,
            color: cfg.text,
            opacity: 0.5,
            cursor: 'default',
            userSelect: 'none',
          }}
          {...longPress}
        >
          Parent? Hold here to unlock.
        </p>
      )}

      <AnimatePresence>
        {pinOpen && (
          <div
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
            onClick={(e) => { if (e.target === e.currentTarget) setPinOpen(false) }}
          >
            <PinUnlock onSuccess={() => { setPinOpen(false); onDismiss() }} />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Hook-driven portal wrapper ────────────────────────────────────────────────
const SHOW_STATES = new Set(['softWarning', 'passiveStare', 'autoplayTrap', 'nightRisk', 'sleepDetected', 'fullBlock'])

export function CompanionTakeover() {
  const { state, resetSession }        = useEngagementStore()
  const activeChild                    = useProfileStore((s) => s.activeChild())
  const [dismissed, setDismissed]      = useState<string | null>(null)
  const prevTypeRef                    = useRef<string>(state.type)
  const [mounted, setMounted]          = useState(false)

  // Only show overlay in browser
  useEffect(() => { setMounted(true) }, [])

  // Clear dismiss when state type changes
  useEffect(() => {
    if (state.type !== prevTypeRef.current) {
      prevTypeRef.current = state.type
      setDismissed(null)
    }
  }, [state.type])

  const handleDismiss = useCallback(() => {
    if (state.type === 'fullBlock' || state.type === 'sleepDetected') {
      resetSession()
    }
    setDismissed(state.type)
  }, [state.type, resetSession])

  if (!mounted) return null
  if (!activeChild) return null

  const tier       = (activeChild.age_tier ?? 'schoolage') as AgeTier
  const shouldShow = SHOW_STATES.has(state.type) && dismissed !== state.type

  return createPortal(
    <AnimatePresence>
      {shouldShow && (
        <Overlay
          key={state.type}
          stateType={state.type}
          tier={tier}
          onDismiss={handleDismiss}
        />
      )}
    </AnimatePresence>,
    document.body
  )
}
