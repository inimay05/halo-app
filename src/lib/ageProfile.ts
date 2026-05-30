export type AgeTier = 'infant' | 'preschool' | 'schoolage'

export function getAgeProfile(ageYears: number): AgeTier {
  if (ageYears <= 2) return 'infant'
  if (ageYears <= 5) return 'preschool'
  return 'schoolage'
}
