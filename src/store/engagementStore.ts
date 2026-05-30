import { create } from 'zustand'
import type { EngagementState } from '@/lib/detection/EngagementState'

// Singleton store written to by EngagementProvider and read by any component.
// Avoids running multiple EngagementEngine instances when both
// CompanionTakeover and BreakManager are mounted.

interface EngagementStoreState {
  state:        EngagementState
  sessionMs:    number
  isBlocked:    boolean
  resetSession: () => void
  _update: (
    state:        EngagementState,
    sessionMs:    number,
    isBlocked:    boolean,
    resetSession: () => void,
  ) => void
}

export const useEngagementStore = create<EngagementStoreState>((set) => ({
  state:        { type: 'healthy', sessionMs: 0 },
  sessionMs:    0,
  isBlocked:    false,
  resetSession: () => {},
  _update: (state, sessionMs, isBlocked, resetSession) =>
    set({ state, sessionMs, isBlocked, resetSession }),
}))
