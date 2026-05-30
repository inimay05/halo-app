import { create } from 'zustand'

export interface BadgeRecord {
  badge_type: string
  earned_at:  string
}

interface BadgeState {
  earned:      BadgeRecord[]
  newBadge:    BadgeRecord | null  // populated when a badge is just awarded
  setEarned:   (badges: BadgeRecord[]) => void
  pushBadge:   (badge: BadgeRecord) => void
  clearNew:    () => void
}

export const useBadgeStore = create<BadgeState>((set) => ({
  earned:    [],
  newBadge:  null,
  setEarned: (earned) => set({ earned }),
  pushBadge: (badge)  => set((s) => ({
    earned:   [...s.earned, badge],
    newBadge: badge,
  })),
  clearNew:  () => set({ newBadge: null }),
}))
