import type { AgeProfile } from '@/config/ageProfiles'

export class NightChecker {
  getNightMultiplier(profile: AgeProfile): number {
    const hour = new Date().getHours()
    // Night window: nightStartHour through 5 am
    if (hour >= profile.nightStartHour || hour < 6) {
      return profile.nightMultiplier
    }
    return 1
  }
}
