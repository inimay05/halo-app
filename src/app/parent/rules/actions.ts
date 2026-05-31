'use server'

import { createClient }    from '@/lib/supabase/server'
import { revalidatePath }  from 'next/cache'

export interface ParentRulesPayload {
  child_id:                string
  soft_warning_ms:         number | null
  full_block_ms:           number | null
  inactivity_ms:           number | null
  night_start_hour:        number | null
  night_multiplier:        number | null
  autoplay_limit:          number | null
  allowlist:               string[]
  blocklist:               string[]
  weekend_soft_ms:         number | null
  weekend_full_ms:         number | null
  time_banking_enabled:    boolean
  weekly_bank_ceiling_ms:  number
  voice_challenge_enabled: boolean
}

export async function grantTimeBankAction(
  childId: string,
  minutes: number,
): Promise<{ ok: boolean; error?: string }> {
  if (minutes <= 0) return { ok: false, error: 'Minutes must be positive' }
  if (minutes > 120) return { ok: false, error: 'Cannot grant more than 120 minutes at once' }
  const supabase = await createClient()

  // Verify authenticated parent owns this child (defense-in-depth beyond RLS)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: child } = await supabase
    .from('child_profiles')
    .select('weekly_bank_ms')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (!child) return { ok: false, error: 'Child not found' }

  const { error } = await supabase
    .from('child_profiles')
    .update({ weekly_bank_ms: child.weekly_bank_ms + minutes * 60_000 })
    .eq('id', childId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/rules')
  return { ok: true }
}

export async function saveRulesAction(
  payload: ParentRulesPayload,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify authenticated parent owns this child (defense-in-depth beyond RLS)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: ownership } = await supabase
    .from('child_profiles')
    .select('id')
    .eq('id', payload.child_id)
    .eq('parent_id', user.id)
    .single()
  if (!ownership) return { ok: false, error: 'Child not found' }

  const { error } = await supabase
    .from('parent_rules')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'child_id' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/rules')
  return { ok: true }
}
