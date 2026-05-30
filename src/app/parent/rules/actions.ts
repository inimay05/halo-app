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

export async function saveRulesAction(
  payload: ParentRulesPayload,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('parent_rules')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'child_id' })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/rules')
  return { ok: true }
}
