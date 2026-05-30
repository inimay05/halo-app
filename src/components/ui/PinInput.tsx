'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COLORS } from '@/config/tokens'

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => boolean | Promise<boolean>
  onSuccess?: () => void
}

export function PinInput({ length = 4, onComplete, onSuccess }: PinInputProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (status === 'success') return

    if (e.key === 'Backspace') {
      setDigits((d) => d.slice(0, -1))
      setStatus('idle')
      return
    }

    if (!/^\d$/.test(e.key)) return
    if (digits.length >= length) return

    const next = [...digits, e.key]
    setDigits(next)

    if (next.length === length) {
      const correct = await onComplete(next.join(''))
      if (correct) {
        setStatus('success')
        onSuccess?.()
      } else {
        setStatus('error')
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setDigits([])
          setStatus('idle')
          inputRef.current?.focus()
        }, 650)
      }
    }
  }

  const dotColor = (i: number) => {
    if (status === 'success') return COLORS.sageDark
    if (status === 'error')   return COLORS.roseDark
    return i < digits.length ? COLORS.lavenderDark : COLORS.lavender
  }

  return (
    <div
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
        onKeyDown={handleKey}
        readOnly
        aria-label="PIN input"
      />

      <motion.div
        style={{ display: 'flex', gap: 16, cursor: 'default' }}
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === digits.length - 1 && status !== 'error' ? [1, 1.2, 1] : 1,
              backgroundColor: dotColor(i),
            }}
            transition={{ duration: 0.2 }}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2.5px solid ${i < digits.length ? dotColor(i) : COLORS.lavender}`,
              backgroundColor: dotColor(i),
            }}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: COLORS.roseDark, fontWeight: 600, margin: 0 }}
          >
            Incorrect PIN — try again
          </motion.p>
        )}
        {status === 'success' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 12, color: COLORS.sageDark, fontWeight: 600, margin: 0 }}
          >
            ✓ Unlocked
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
