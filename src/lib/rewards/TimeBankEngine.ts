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

  // NOTE: resetWeeklyBank() is intended to be called by a Supabase Edge Function
  // cron running with the service-role key, NOT from the browser. Calling this
  // from the client will silently fail because the anon RLS policy only allows
  // a parent to update their own children (not a bulk cross-parent UPDATE).
  // This method is intentionally left here for reference but should not be
  // invoked client-side. Use a Supabase Edge Function + service-role key instead.
  static async resetWeeklyBank(): Promise<void> {
    if (typeof window !== 'undefined') {
      console.error('[TimeBankEngine] resetWeeklyBank() must not be called from the browser.')
      return
    }
    await createClient()
      .from('child_profiles')
      .update({ weekly_bank_ms: 0 })
      .eq('age_tier', 'schoolage')
  }
}
