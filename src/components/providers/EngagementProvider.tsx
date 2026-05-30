'use client'

import { useEffect } from 'react'
import { useEngagementEngine } from '@/lib/detection/useEngagementEngine'
import { useEngagementStore }  from '@/store/engagementStore'

// Mount this once in the child session layout.
// It runs the single EngagementEngine instance and syncs results to
// useEngagementStore so any subtree component can subscribe without
// spawning a second engine.
export function EngagementProvider() {
  const { state, sessionMs, isBlocked, resetSession } = useEngagementEngine()
  const _update = useEngagementStore((s) => s._update)

  useEffect(() => {
    _update(state, sessionMs, isBlocked, resetSession)
  }, [state, sessionMs, isBlocked, resetSession, _update])

  return null
}
