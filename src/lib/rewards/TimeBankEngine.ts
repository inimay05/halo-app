import { createClient } from '@/lib/supabase/client'

export const WEEKLY_BANK_CEILING_MS = 7_200_000 // 2 hours default

export class TimeBankEngine {
  static async saveMinutes(childId: string, ms: number): Promise<void> {
    const db = createClient()
    const { data } = await db
      .from('child_profiles')
      .select('weekly_bank_ms')
      .eq('id', childId)
      .single()
    if (!data) return
    const next = data.weekly_bank_ms + ms
    await db
      .from('child_profiles')
      .update({ weekly_bank_ms: next })
      .eq('id', childId)
  }

  static async spendFromBank(childId: string, ms: number): Promise<boolean> {
    const db = createClient()
    const { data } = await db
      .from('child_profiles')
      .select('weekly_bank_ms')
      .eq('id', childId)
      .single()
    if (!data || data.weekly_bank_ms < ms) return false
    const next = data.weekly_bank_ms - ms
    const { error } = await db
      .from('child_profiles')
      .update({ weekly_bank_ms: next })
      .eq('id', childId)
    return !error
  }

  // Called by Supabase Edge Function cron every Sunday 00:00
  static async resetWeeklyBank(): Promise<void> {
    await createClient()
      .from('child_profiles')
      .update({ weekly_bank_ms: 0 })
      .eq('age_tier', 'schoolage')
  }
}
