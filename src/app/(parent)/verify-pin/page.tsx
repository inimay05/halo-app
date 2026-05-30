'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AgeThemeProvider } from '@/components/ui/AgeThemeProvider'
import HaloLogo from '@/components/ui/HaloLogo'
import { Card, CardContent } from '@/components/ui/Card'
import { PinInput } from '@/components/ui/PinInput'
import { Avatar } from '@/components/ui/Avatar'
import { useSessionStore } from '@/store/sessionStore'
import { COLORS } from '@/config/tokens'
import { verifyPinAction } from './actions'

const MAX_ATTEMPTS = 3
const LOCKOUT_SECS = 30

function VerifyPinForm() {
  const router = useRouter()
  const setParentVerified = useSessionStore((s) => s.setParentVerified)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [resetKey, setResetKey] = useState(0)

  // Countdown timer during lockout
  useEffect(() => {
    if (!lockedUntil) return
    const tick = setInterval(() => {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (secs <= 0) {
        setLockedUntil(null)
        setAttempts(0)
        setResetKey((k) => k + 1)
        clearInterval(tick)
      } else {
        setRemaining(secs)
      }
    }, 500)
    return () => clearInterval(tick)
  }, [lockedUntil])

  const handlePin = (pin: string): boolean => {
    if (lockedUntil) return false

    startTransition(async () => {
      const result = await verifyPinAction(pin)
      if (result.ok) {
        setParentVerified(true)
        router.push('/parent')
        router.refresh()
      } else {
        const next = attempts + 1
        setAttempts(next)
        if (next >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECS * 1000)
          setRemaining(LOCKOUT_SECS)
        }
        // Let PinInput handle the shake — return false signals wrong PIN
      }
    })

    // Optimistic: return false so PinInput shakes; we'll handle success via router
    return false
  }

  const isLocked = !!lockedUntil

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <HaloLogo fontSize={40} />
      </div>

      <Card variant="elevated" style={{ padding: 36 }}>
        <CardContent>
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                  <Avatar character="cat" size={72} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>
                  Too many attempts
                </h2>
                <p style={{ fontSize: 14, color: COLORS.muted, marginBottom: 4 }}>
                  Try again in
                </p>
                <p style={{ fontSize: 36, fontWeight: 800, color: COLORS.lavenderDark, margin: '8px 0 0' }}>
                  {remaining}s
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, textAlign: 'center', marginBottom: 8 }}>
                  Parent PIN
                </h1>
                <p style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 32 }}>
                  Enter your PIN to access the parent dashboard
                </p>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <PinInput key={resetKey} length={4} onComplete={handlePin} />
                </div>

                {attempts > 0 && (
                  <p style={{ textAlign: 'center', fontSize: 13, color: COLORS.peachDark, marginTop: 16, fontWeight: 600 }}>
                    {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
                  </p>
                )}

                {isPending && (
                  <p style={{ textAlign: 'center', fontSize: 13, color: COLORS.muted, marginTop: 8 }}>
                    Checking…
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyPinPage() {
  return (
    <AgeThemeProvider>
      <VerifyPinForm />
    </AgeThemeProvider>
  )
}
