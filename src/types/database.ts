export interface Profile {
  id: string
  email: string
  pin_hash: string
  created_at: string
}

export interface ChildProfile {
  id: string
  parent_id: string
  name: string
  age_years: number
  age_tier: 'infant' | 'preschool' | 'schoolage'
  active_companion: 'cat' | 'dog' | 'dino' | 'seal'
  companion_name: string | null
  coin_balance: number
  garden_health: number
  weekly_bank_ms: number
  last_seen_at?: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Omit<Profile, 'id'>> }
      child_profiles: { Row: ChildProfile; Insert: Omit<ChildProfile, 'id' | 'created_at'>; Update: Partial<Omit<ChildProfile, 'id' | 'parent_id'>> }
    }
  }
}
