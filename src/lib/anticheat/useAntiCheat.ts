'use client'

import { useEffect, useRef, useState } from 'react'
import { AntiCheatEngine }             from './AntiCheatEngine'

interface UseAntiCheatResult {
  /** True when another browser tab has started a session for the same child. */
  multiTabBlocked: boolean
}

export function useAntiCheat(childId: string | null): UseAntiCheatResult {
  const engineRef           = useRef<AntiCheatEngine | null>(null)
  const [multiTabBlocked, setMultiTabBlocked] = useState(false)

  useEffect(() => {
    if (!childId) return

    const engine = new AntiCheatEngine(childId)
    engineRef.current = engine
    void engine.init()

    const handleConflict = () => setMultiTabBlocked(true)
    window.addEventListener('halo-multitab-conflict', handleConflict)

    return () => {
      engine.destroy()
      engineRef.current = null
      window.removeEventListener('halo-multitab-conflict', handleConflict)
    }
  }, [childId])

  return { multiTabBlocked }
}
