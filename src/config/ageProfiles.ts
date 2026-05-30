import type { AgeTier } from '@/lib/ageProfile'

export interface AgeProfile {
  ageTier: AgeTier
  // Inactivity thresholds
  inactivityMs: number       // passiveStare warning threshold
  // Session time limits
  softWarningMs: number      // warn before block
  fullBlockMs: number        // hard session cap
  // Video / autoplay
  autoplayLimit: number      // max consecutive autoplay videos
  videoChainMaxMs: number    // max cumulative video session time
  // Night mode
  nightStartHour: number     // 0-23, hour night multiplier kicks in
  nightMultiplier: number    // effectiveLimit = fullBlockMs / multiplier
}

export const AGE_PROFILES: Record<AgeTier, AgeProfile> = {
  infant: {
    ageTier:         'infant',
    inactivityMs:    2 * 60 * 1000,   // 2 min → passiveStare
    softWarningMs:   8 * 60 * 1000,   // 8 min → warning
    fullBlockMs:     10 * 60 * 1000,  // 10 min → block
    autoplayLimit:   2,
    videoChainMaxMs: 10 * 60 * 1000,
    nightStartHour:  19,              // 7 pm
    nightMultiplier: 2,
  },
  preschool: {
    ageTier:         'preschool',
    inactivityMs:    3 * 60 * 1000,
    softWarningMs:   18 * 60 * 1000,
    fullBlockMs:     20 * 60 * 1000,
    autoplayLimit:   3,
    videoChainMaxMs: 20 * 60 * 1000,
    nightStartHour:  20,              // 8 pm
    nightMultiplier: 1.5,
  },
  schoolage: {
    ageTier:         'schoolage',
    inactivityMs:    5 * 60 * 1000,
    softWarningMs:   40 * 60 * 1000,
    fullBlockMs:     45 * 60 * 1000,
    autoplayLimit:   5,
    videoChainMaxMs: 30 * 60 * 1000,
    nightStartHour:  21,              // 9 pm
    nightMultiplier: 1.5,
  },
}
