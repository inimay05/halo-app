'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence }     from 'framer-motion'
import { COLORS }                      from '@/config/tokens'

const WORD_LIST = [
  'BANANA', 'RAINBOW', 'ELEPHANT', 'PENGUIN', 'UMBRELLA',
  'GIRAFFE', 'BUTTERFLY', 'DINOSAUR', 'SUNSHINE', 'WATERFALL',
  'CHOCOLATE', 'SPACESHIP', 'ADVENTURE', 'JELLYFISH', 'KANGAROO',
  'TELESCOPE', 'PINEAPPLE', 'ASTRONAUT', 'FLAMINGO', 'TRAMPOLINE',
]

export function pickWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
}

interface Props {
  word:        string
  onSuccess:   () => void
  onFallback:  () => void
  timeoutMs?:  number
}

type Phase = 'listening' | 'success' | 'fallback'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as Record<string, unknown>)['SpeechRecognition'] ??
    (window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] ??
    null
  ) as SpeechRecognitionCtor | null
}

export function VoiceChallenge({ word, onSuccess, onFallback, timeoutMs = 10_000 }: Props) {
  const [phase, setPhase]         = useState<Phase>('listening')
  const [interim, setInterim]     = useState('')
  const recogRef                  = useRef<unknown>(null)

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      // Browser doesn't support it — go straight to fallback
      onFallback()
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recog: any = new SpeechRecognition()
    recogRef.current = recog
    recog.lang         = 'en-US'
    recog.interimResults = true
    recog.maxAlternatives = 3

    let done = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (event: any) => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript
      }
      setInterim(text.toUpperCase())
      if (text.toUpperCase().includes(word)) {
        done = true
        recog.stop()
        setPhase('success')
        setTimeout(onSuccess, 800)
      }
    }

    recog.onerror = () => {
      if (!done) { setPhase('fallback'); onFallback() }
    }

    recog.onend = () => {
      if (!done) { setPhase('fallback'); onFallback() }
    }

    recog.start()

    const timer = setTimeout(() => {
      if (!done) {
        recog.stop()
        setPhase('fallback')
        onFallback()
      }
    }, timeoutMs)

    return () => {
      clearTimeout(timer)
      try { recog.abort() } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once per mount

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', marginTop: 12 }}
    >
      <AnimatePresence mode="wait">
        {phase === 'listening' && (
          <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: COLORS.muted }}>Say the word:</p>
            <p style={{
              margin: '0 0 6px',
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.ink,
              letterSpacing: '0.06em',
            }}>
              {word}
            </p>
            {interim && (
              <p style={{ margin: 0, fontSize: 12, color: COLORS.lavenderDark, opacity: 0.8 }}>
                Heard: {interim}
              </p>
            )}
            {/* Pulsing mic indicator */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ fontSize: 24, marginTop: 6 }}
            >
              🎤
            </motion.div>
          </motion.div>
        )}
        {phase === 'success' && (
          <motion.div key="success" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: COLORS.mintDark, margin: 0 }}>
              🎉 Got it!
            </p>
          </motion.div>
        )}
        {phase === 'fallback' && (
          <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
              No mic detected — hold the button below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
