import { create } from 'zustand'

type AppType = 'video' | 'interactive' | 'learning'

interface SessionState {
  parentVerified: boolean
  sessionStartMs: number
  currentAppType: AppType
  setParentVerified: (v: boolean) => void
  startSession: (appType?: AppType) => void
  endSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  parentVerified: false,
  sessionStartMs: 0,
  currentAppType: 'interactive',

  setParentVerified: (v) => set({ parentVerified: v }),

  startSession: (appType = 'interactive') =>
    set({ sessionStartMs: Date.now(), currentAppType: appType }),

  endSession: () => set({ sessionStartMs: 0 }),
}))
