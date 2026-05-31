'use server'

import bcrypt           from 'bcryptjs'
import { cookies }      from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getAgeProfile } from '@/lib/ageProfile'
import type { AgeTier } from '@/lib/ageProfile'

export interface OnboardingPayload {
  childName:     string
  ageYears:      number          // 1 = infant, 4 = preschool, 8 = schoolage
  companion:     'cat' | 'dog'
  companionName: string | null
  pin:           string
}

export async function completeOnboardingAction(
  payload: OnboardingPayload,
): Promise<{ ok: boolean; ageTier?: AgeTier; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const ageTier  = getAgeProfile(payload.ageYears)
  const pin_hash = await bcrypt.hash(payload.pin, 10)

  // 1. Save parent PIN
  const { error: profErr } = await supabase.from('profiles').upsert({
    id:       user.id,
    email:    user.email!,
    pin_hash,
  })
  if (profErr) return { ok: false, error: profErr.message }

  // 2. Create child profile
  const { error: childErr } = await supabase.from('child_profiles').insert({
    parent_id:        user.id,
    name:             payload.childName,
    age_years:        payload.ageYears,
    age_tier:         ageTier,
    active_companion: payload.companion,
    companion_name:   payload.companionName || null,
    coin_balance:     0,
    garden_health:    1.0,
    weekly_bank_ms:   0,
  })
  if (childErr) return { ok: false, error: childErr.message }

  // Set parent_verified cookie so redirect to /parent works without re-entering PIN
  const cookieStore = await cookies()
  cookieStore.set('parent_verified', '1', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   4 * 60 * 60,
    path:     '/',
  })

  return { ok: true, ageTier }
}
