'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EngagementEngine }   from './EngagementEngine'
import type { EngagementState } from './EngagementState'
import { AGE_PROFILES }       from '@/config/ageProfiles'
import { createClient }       from '@/lib/supabase/client'
import { useProfileStore }    from '@/store/profileStore'

export function useEngagementEngine() {
  const activeChild   = useProfileStore((s) => s.activeChild())
  const [state, setState] = useState<EngagementState>({ type: 'healthy', sessionMs: 0 })

  const engineRef         = useRef<EngagementEngine | null>(null)
  const activeChildRef    = useRef(activeChild)
  const lastLoggedTypeRef = useRef<string | null>(null)

  // Keep ref in sync so the stable callback can read current child without re-creating
  useEffect(() => {
    activeChildRef.current = activeChild
  }, [activeChild])

  // Stable callback — uses refs so engine never needs to restart due to closure drift
  const handleStateChange = useCallback((s: EngagementState) => {
    setState(s)

    // Write to Supabase only on state-type transitions (not every 5s poll)
    if (s.type !== lastLoggedTypeRef.current) {
      lastLoggedTypeRef.current = s.type
      const child = activeChildRef.current
      if (child) {
        createClient()
          .from('session_events')
          .insert({
            child_id:   child.id,
            event_type: s.type,
            metadata:   s as unknown as Record<string, unknown>,
          })
          .then() // fire-and-forget; errors are non-critical
      }
    }
  }, []) // deliberately empty — reads only refs

  // Restart engine only when the active child ID changes, not on every coin/health update.
  // We read the full profile from the ref inside the effect, so the dep is intentionally narrow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeChild) return

    const profile = AGE_PROFILES[activeChild.age_tier]
    const engine  = new EngagementEngine(profile, handleStateChange)
    engineRef.current = engine
    engine.start()

    return () => {
      engine.stop()
      engineRef.current = null
    }
  }, [activeChild?.id, handleStateChange])

  const isBlocked = state.type === 'fullBlock' || state.type === 'sleepDetected'
  const sessionMs = state.type === 'healthy' ? state.sessionMs : 0

  const resetSession = useCallback(() => {
    engineRef.current?.reset()
    lastLoggedTypeRef.current = null
  }, [])

  return { state, sessionMs, isBlocked, engine: engineRef, resetSession }
}
