'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter }            from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import HaloLogo                 from '@/components/ui/HaloLogo'
import { useSessionStore }      from '@/store/sessionStore'
import { COLORS }               from '@/config/tokens'
import { verifyPinAction }      from './actions'

const MAX_ATTEMPTS = 3
const LOCKOUT_SECS = 30
const ATTEMPTS_KEY = 'halo_pin_attempts'
const LOCKED_KEY   = 'halo_pin_locked_until'

function getPersistedAttempts(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(document.cookie.match(/halo_pin_attempts=(\d+)/)?.[1] ?? '0', 10)
}
function getPersistedLockedUntil(): number | null {
  if (typeof window === 'undefined') return null
  const v = parseInt(document.cookie.match(/halo_pin_locked_until=(\d+)/)?.[1] ?? '0', 10)
  return v > Date.now() ? v : null
}
function setCookieValue(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};samesite=lax`
}
function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function VerifyPinPage() {
  const router             = useRouter()
  const setParentVerified  = useSessionStore((s) => s.setParentVerified)

  const [digits,      setDigits]      = useState<string[]>([])
  const [error,       setError]       = useState(false)
  const [attempts,    setAttempts]    = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [remaining,   setRemaining]   = useState(0)
  const [isPending,   startTransition] = useTransition()

  useEffect(() => {
    setAttempts(getPersistedAttempts())
    const lu = getPersistedLockedUntil()
    if (lu) { setLockedUntil(lu); setRemaining(Math.ceil((lu - Date.now()) / 1000)) }
  }, [])

  useEffect(() => {
    if (!lockedUntil) return
    const tick = setInterval(() => {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (secs <= 0) {
        setLockedUntil(null); setAttempts(0); setRemaining(0)
        deleteCookie(ATTEMPTS_KEY); deleteCookie(LOCKED_KEY)
        clearInterval(tick)
      } else setRemaining(secs)
    }, 500)
    return () => clearInterval(tick)
  }, [lockedUntil])

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (digits.length !== 4 || isPending) return
    startTransition(async () => {
      const result = await verifyPinAction(digits.join(''))
      if (result.ok) {
        setParentVerified(true)
        deleteCookie(ATTEMPTS_KEY); deleteCookie(LOCKED_KEY)
        router.push('/parent'); router.refresh()
      } else {
        setError(true)
        setTimeout(() => { setError(false); setDigits([]) }, 700)
        const next = attempts + 1
        setAttempts(next)
        setCookieValue(ATTEMPTS_KEY, String(next), LOCKOUT_SECS * 2)
        if (next >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECS * 1000
          setLockedUntil(until); setRemaining(LOCKOUT_SECS)
          setCookieValue(LOCKED_KEY, String(until), LOCKOUT_SECS)
        }
      }
    })
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  const press = (k: string) => {
    if (lockedUntil || isPending) return
    if (k === '⌫') { setDigits((d) => d.slice(0, -1)); setError(false); return }
    if (k === '') return
    if (digits.length >= 4) return
    setDigits((d) => [...d, k])
  }

  return (
    <div style={{
      minHeight:      '100dvh',
      background:     COLORS.cream,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '32px 24px',
      fontFamily:     "'Nunito', sans-serif",
    }}>
      <HaloLogo fontSize={36} />

      <div style={{ height: 32 }} />

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[0,1,2].map((i) => (
          <div key={i} style={{ width: i === 2 ? 24 : 8, height: 8, borderRadius: 4, background: i === 2 ? COLORS.haloGold : COLORS.neutralDark }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {lockedUntil ? (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.ink, margin: '0 0 8px' }}>Too many attempts</h2>
            <p style={{ color: COLORS.muted, fontSize: 14, margin: '0 0 4px' }}>Try again in</p>
            <p style={{ fontSize: 40, fontWeight: 800, color: COLORS.lavenderDark, margin: 0 }}>{remaining}s</p>
          </motion.div>
        ) : (
          <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 320 }}>
            {/* Lock icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: COLORS.warmAmber,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 20,
              boxShadow: '0 4px 16px rgba(212,160,23,0.25)',
            }}>
              🔒
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink, margin: '0 0 8px', textAlign: 'center' }}>
              Secure the Halo
            </h1>
            <p style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', margin: '0 0 28px' }}>
              Enter your 4-digit Parent PIN to keep things safe.
            </p>

            {/* PIN dots */}
            <motion.div
              style={{ display: 'flex', gap: 18, marginBottom: 32 }}
              animate={error ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  width:        18,
                  height:       18,
                  borderRadius: '50%',
                  border:       `2.5px solid ${error ? COLORS.roseDark : i < digits.length ? COLORS.haloGoldDark : COLORS.neutralDark}`,
                  background:   i < digits.length ? (error ? COLORS.roseDark : COLORS.haloGold) : 'transparent',
                  transition:   'all 0.15s',
                }} />
              ))}
            </motion.div>

            {/* Circular numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: '100%' }}>
              {KEYS.map((k, idx) => (
                <button
                  key={idx}
                  onClick={() => press(k)}
                  disabled={k === '' || isPending || !!lockedUntil}
                  style={{
                    width:        64,
                    height:       64,
                    borderRadius: '50%',
                    border:       k === '' ? 'none' : `1.5px solid ${COLORS.border}`,
                    background:   k === '' ? 'transparent' : 'white',
                    fontSize:     k === '⌫' ? 20 : 22,
                    fontWeight:   600,
                    color:        COLORS.ink,
                    cursor:       k === '' ? 'default' : 'pointer',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    margin:       '0 auto',
                    boxShadow:    k === '' ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                    fontFamily:   'inherit',
                    transition:   'transform 0.1s',
                  }}
                  onMouseDown={(e) => { if (k !== '') (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
                  onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                >
                  {k}
                </button>
              ))}
            </div>

            {attempts > 0 && (
              <p style={{ marginTop: 20, fontSize: 13, color: COLORS.peachDark, fontWeight: 600, textAlign: 'center' }}>
                {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
              </p>
            )}

            {isPending && (
              <p style={{ marginTop: 12, fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>Checking…</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
