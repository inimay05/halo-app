'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter }                              from 'next/navigation'
import { motion, AnimatePresence }                from 'framer-motion'
import HaloLogo                                   from '@/components/ui/HaloLogo'
import { CompanionCharacter }                     from '@/components/companion/CompanionCharacter'
import { PinInput }                               from '@/components/ui/PinInput'
import { completeOnboardingAction }               from './actions'
import { COLORS }                                 from '@/config/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step      = 1 | 2 | 3 | 4 | 5 | 6
type AgeBucket = '0-2' | '3-5' | '6-10'
type Companion = 'cat' | 'dog'

const AGE_OPTIONS: { bucket: AgeBucket; label: string; bg: string; text: string; years: number }[] = [
  { bucket: '0-2', label: '0 to 2 years',  bg: COLORS.mint,     text: COLORS.mintDark,     years: 1 },
  { bucket: '3-5', label: '3 to 5 years',  bg: COLORS.peach,    text: COLORS.peachDark,    years: 4 },
  { bucket: '6-10',label: '6 to 10 years', bg: COLORS.lavender, text: COLORS.lavenderDark, years: 8 },
]

const BG_FOR_STEP: Record<Step, string> = {
  1: COLORS.cream, 2: COLORS.cream, 3: COLORS.cream,
  4: COLORS.cream, 5: COLORS.sky,   6: COLORS.sage,
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function NextButton({ label = 'Next', onClick, disabled = false }: {
  label?:    string
  onClick:   () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:      '14px 36px',
        borderRadius: 28,
        border:       'none',
        background:   disabled ? COLORS.border : COLORS.lavender,
        color:        disabled ? COLORS.muted : COLORS.lavenderDark,
        fontWeight:   800,
        fontSize:     16,
        cursor:       disabled ? 'default' : 'pointer',
        transition:   'background 0.15s',
        fontFamily:   'inherit',
      }}
    >
      {label}
    </button>
  )
}

function StepDots({ step }: { step: Step }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
      {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
        <div
          key={s}
          style={{
            width:        s === step ? 24 : 8,
            height:       8,
            borderRadius: 4,
            background:   s === step ? COLORS.lavenderDark : COLORS.lavender,
            transition:   'width 0.25s, background 0.25s',
          }}
        />
      ))}
    </div>
  )
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
      <HaloLogo fontSize={44} />

      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CompanionCharacter character="cat" pose="excited" size={160} />
      </motion.div>

      <h1 style={{
        fontSize:   28,
        fontWeight: 800,
        color:      COLORS.lavenderDark,
        lineHeight: 1.25,
        maxWidth:   340,
        margin:     0,
      }}>
        Hi! I am going to help your family use screens healthily!
      </h1>

      <NextButton label="Let us get started" onClick={onNext} />
    </div>
  )
}

function Step2({
  childName, setChildName, ageBucket, setAgeBucket, onNext,
}: {
  childName:    string
  setChildName: (v: string) => void
  ageBucket:    AgeBucket | null
  setAgeBucket: (v: AgeBucket) => void
  onNext:       () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 380 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, margin: 0, textAlign: 'center' }}>
        Tell us about your child
      </h2>

      <div style={{ width: '100%' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 10 }}>
          What is your child&apos;s name?
        </label>
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="e.g. Emma"
          maxLength={40}
          style={{
            width:        '100%',
            padding:      '12px 16px',
            borderRadius: 12,
            border:       '2px solid #E2E8F0',
            fontSize:     16,
            fontFamily:   'inherit',
            outline:      'none',
            boxSizing:    'border-box',
          }}
        />
      </div>

      <div style={{ width: '100%' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 12 }}>
          How old are they?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AGE_OPTIONS.map((opt) => {
            const selected = ageBucket === opt.bucket
            return (
              <button
                key={opt.bucket}
                onClick={() => setAgeBucket(opt.bucket)}
                style={{
                  padding:      '14px 20px',
                  borderRadius: 14,
                  border:       selected ? `2px solid ${opt.text}` : '2px solid transparent',
                  background:   opt.bg,
                  color:        opt.text,
                  fontWeight:   700,
                  fontSize:     15,
                  cursor:       'pointer',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                  fontFamily:   'inherit',
                  transition:   'border 0.15s',
                }}
              >
                {opt.label}
                {selected && <span style={{ fontSize: 18 }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <NextButton
        onClick={onNext}
        disabled={!childName.trim() || !ageBucket}
      />
    </div>
  )
}

function Step3({
  companion, setCompanion, onNext,
}: {
  companion:    Companion | null
  setCompanion: (v: Companion) => void
  onNext:       () => void
}) {
  const LOCKED = [
    { type: 'dino' as const, label: 'Dino Buddy',  icon: '🦕' },
    { type: 'seal' as const, label: 'Seal Buddy',   icon: '🦭' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 400 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, margin: 0, textAlign: 'center' }}>
        Choose your companion
      </h2>

      {/* Available */}
      <div style={{ display: 'flex', gap: 16, width: '100%' }}>
        {(['cat', 'dog'] as Companion[]).map((c) => {
          const selected = companion === c
          return (
            <button
              key={c}
              onClick={() => setCompanion(c)}
              style={{
                flex:         1,
                padding:      '16px 8px',
                borderRadius: 18,
                border:       selected ? `2.5px solid ${COLORS.lavenderDark}` : '2.5px solid transparent',
                background:   selected ? COLORS.lavender : 'white',
                cursor:       'pointer',
                display:      'flex',
                flexDirection: 'column',
                alignItems:   'center',
                gap:          8,
                boxShadow:    '0 2px 12px rgba(0,0,0,0.07)',
                transition:   'border 0.15s, background 0.15s',
              }}
            >
              <motion.div
                animate={selected ? { y: [0, -10, 0] } : { y: 0 }}
                transition={selected ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                <CompanionCharacter character={c} pose={selected ? 'happy' : 'idle'} size={90} />
              </motion.div>
              <span style={{
                fontWeight: 700, fontSize: 14, color: COLORS.lavenderDark,
                textTransform: 'capitalize',
              }}>
                {c}
                {selected && ' ✓'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Locked */}
      <div style={{ display: 'flex', gap: 16, width: '100%' }}>
        {LOCKED.map(({ type, label, icon }) => (
          <div
            key={type}
            style={{
              flex:         1,
              padding:      '16px 8px',
              borderRadius: 18,
              border:       '2.5px solid transparent',
              background:   COLORS.neutral,
              display:      'flex',
              flexDirection: 'column',
              alignItems:   'center',
              gap:          8,
              opacity:      0.6,
            }}
          >
            <div style={{ fontSize: 52, filter: 'grayscale(1)', lineHeight: 1 }}>{icon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.muted }}>{label}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Unlock later!</div>
            </div>
          </div>
        ))}
      </div>

      <NextButton onClick={onNext} disabled={!companion} />
    </div>
  )
}

function Step4({
  companion, companionName, setCompanionName, onNext,
}: {
  companion:        Companion
  companionName:    string
  setCompanionName: (v: string) => void
  onNext:           () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 360 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, margin: 0, textAlign: 'center' }}>
        Meet your companion!
      </h2>

      <motion.div
        animate={{ rotate: [0, 10, -10, 6, 0], y: [0, -8, 0] }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <CompanionCharacter character={companion} pose="excited" size={180} />
      </motion.div>

      <div style={{ width: '100%' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 10 }}>
          Would you like to give them a name? <span style={{ fontWeight: 400, color: COLORS.muted }}>(optional)</span>
        </label>
        <input
          value={companionName}
          onChange={(e) => setCompanionName(e.target.value.slice(0, 10))}
          placeholder="e.g. Whiskers"
          maxLength={10}
          style={{
            width:        '100%',
            padding:      '12px 16px',
            borderRadius: 12,
            border:       '2px solid #E2E8F0',
            fontSize:     16,
            fontFamily:   'inherit',
            outline:      'none',
            boxSizing:    'border-box',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: 12, color: COLORS.muted, marginTop: 4 }}>
          {companionName.length}/10
        </div>
      </div>

      <NextButton label="Looks great!" onClick={onNext} />
    </div>
  )
}

function Step5({
  onPinConfirmed,
}: {
  onPinConfirmed: (pin: string) => void
}) {
  const [pinStep,  setPinStep]  = useState<'enter' | 'confirm'>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [tryAgain, setTryAgain] = useState(false)

  const handleFirst = useCallback((pin: string): true => {
    setFirstPin(pin)
    setTryAgain(false)
    setTimeout(() => setPinStep('confirm'), 50)
    return true
  }, [])

  const handleConfirm = useCallback((pin: string): boolean => {
    if (pin !== firstPin) {
      setTryAgain(true)
      setTimeout(() => {
        setPinStep('enter')
        setFirstPin('')
        setTryAgain(false)
      }, 700)
      return false
    }
    onPinConfirmed(pin)
    return true
  }, [firstPin, onPinConfirmed])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 360 }}>
      <div style={{ fontSize: 48 }}>🔒</div>

      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.ink, margin: 0, textAlign: 'center' }}>
        {pinStep === 'enter' ? 'Set your parent PIN' : 'Confirm your PIN'}
      </h2>

      <p style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', margin: 0 }}>
        This keeps your parent settings safe
      </p>

      <div style={{
        background:   'white',
        borderRadius: 20,
        padding:      '32px 40px',
        boxShadow:    '0 4px 20px rgba(0,0,0,0.08)',
        display:      'flex',
        flexDirection: 'column',
        alignItems:   'center',
        gap:          16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted }}>
          {pinStep === 'enter' ? 'Enter 4 digits' : 'Enter the same PIN again'}
        </div>

        {pinStep === 'enter'
          ? <PinInput key="enter"   length={4} onComplete={handleFirst}   />
          : <PinInput key="confirm" length={4} onComplete={handleConfirm} />
        }

        <AnimatePresence>
          {tryAgain && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: 13, color: COLORS.roseDark, fontWeight: 700 }}
            >
              Try again — PINs did not match
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Step6({
  companion, childName,
}: {
  companion: Companion
  childName: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
      <motion.div
        animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CompanionCharacter character={companion} pose="happy" size={200} />
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
      >
        <h2 style={{
          fontSize:   32,
          fontWeight: 800,
          color:      COLORS.sageDark,
          margin:     '0 0 8px',
          lineHeight: 1.2,
        }}>
          All set, {childName}!
        </h2>
        <p style={{ fontSize: 16, color: COLORS.sageDark, opacity: 0.85, margin: 0 }}>
          Your Halo family is ready. Let us go! 🌟
        </p>
      </motion.div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()

  const [step,          setStep]          = useState<Step>(1)
  const [childName,     setChildName]     = useState('')
  const [ageBucket,     setAgeBucket]     = useState<AgeBucket | null>(null)
  const [companion,     setCompanion]     = useState<Companion | null>(null)
  const [companionName, setCompanionName] = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [isPending,     startTransition]  = useTransition()

  const ageYears = AGE_OPTIONS.find((o) => o.bucket === ageBucket)?.years ?? 8

  const advance = useCallback(() => {
    setStep((s) => Math.min(s + 1, 6) as Step)
  }, [])

  const handlePinConfirmed = useCallback((pin: string) => {
    setSubmitting(true)
    setError(null)
    startTransition(async () => {
      const res = await completeOnboardingAction({
        childName:     childName.trim(),
        ageYears,
        companion:     companion!,
        companionName: companionName.trim() || null,
        pin,
      })
      if (!res.ok) {
        setError(res.error ?? 'Something went wrong')
        setSubmitting(false)
        return
      }
      setStep(6)
      // Redirect after 2.5 s so the child can enjoy the celebration
      setTimeout(() => {
        router.push(res.ageTier === 'schoolage' ? '/child' : '/parent')
      }, 2_500)
    })
  }, [childName, ageYears, companion, companionName, router, startTransition])

  const bg = BG_FOR_STEP[step]

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     bg,
      overflowY:      'auto',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '32px 20px',
      fontFamily:     "'Nunito', sans-serif",
      transition:     'background 0.4s ease',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <StepDots step={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            {step === 1 && <Step1 onNext={advance} />}

            {step === 2 && (
              <Step2
                childName={childName}    setChildName={setChildName}
                ageBucket={ageBucket}    setAgeBucket={setAgeBucket}
                onNext={advance}
              />
            )}

            {step === 3 && (
              <Step3
                companion={companion}    setCompanion={setCompanion}
                onNext={advance}
              />
            )}

            {step === 4 && companion && (
              <Step4
                companion={companion}
                companionName={companionName}
                setCompanionName={setCompanionName}
                onNext={advance}
              />
            )}

            {step === 5 && (
              <Step5 onPinConfirmed={handlePinConfirmed} />
            )}

            {step === 6 && companion && (
              <Step6 companion={companion} childName={childName} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop:    20,
                background:   COLORS.rose,
                borderRadius: 12,
                padding:      '12px 16px',
                fontSize:     14,
                color:        COLORS.roseDark,
                fontWeight:   700,
                textAlign:    'center',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saving indicator */}
        {(submitting || isPending) && step !== 6 && (
          <div style={{ textAlign: 'center', marginTop: 16, color: COLORS.muted, fontSize: 14 }}>
            Setting up your family…
          </div>
        )}
      </div>
    </div>
  )
}
