'use client'

import { useState, useTransition } from 'react'
import { AgeThemeProvider } from '@/components/ui/AgeThemeProvider'
import HaloLogo from '@/components/ui/HaloLogo'
import { Card, CardContent } from '@/components/ui/Card'
import { PinInput } from '@/components/ui/PinInput'
import { COLORS } from '@/config/tokens'
import { setupPinAction } from './actions'

function SetupPinForm() {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleFirst = (pin: string) => {
    setFirstPin(pin)
    setStep('confirm')
    return true
  }

  const handleConfirm = (pin: string): boolean => {
    if (pin !== firstPin) {
      setMismatch(true)
      setTimeout(() => {
        setMismatch(false)
        setStep('enter')
        setFirstPin('')
      }, 800)
      return false
    }
    startTransition(() => setupPinAction(pin))
    return true
  }

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <HaloLogo fontSize={40} />
      </div>

      <Card variant="elevated" style={{ padding: 36 }}>
        <CardContent>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.ink, textAlign: 'center', marginBottom: 8 }}>
            {step === 'enter' ? 'Set your parent PIN' : 'Confirm your PIN'}
          </h1>
          <p style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 32 }}>
            {step === 'enter'
              ? 'Choose a 4-digit PIN to lock the parent dashboard'
              : 'Enter the same PIN again to confirm'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {step === 'enter' ? (
              <PinInput key="enter" length={4} onComplete={handleFirst} />
            ) : (
              <PinInput key="confirm" length={4} onComplete={handleConfirm} />
            )}
          </div>

          {mismatch && (
            <p style={{ textAlign: 'center', color: COLORS.roseDark, fontSize: 13, marginTop: 16, fontWeight: 600 }}>
              PINs didn&apos;t match — try again
            </p>
          )}
          {isPending && (
            <p style={{ textAlign: 'center', color: COLORS.muted, fontSize: 13, marginTop: 16 }}>
              Saving…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SetupPinPage() {
  return (
    <AgeThemeProvider>
      <SetupPinForm />
    </AgeThemeProvider>
  )
}
