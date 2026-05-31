'use server'

import { createClient }   from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAgeProfile }  from '@/lib/ageProfile'

export async function addChildAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { count } = await supabase
    .from('child_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', user.id)
  if ((count ?? 0) >= 4) return { ok: false, error: 'Maximum 4 profiles reached' }

  const name      = (formData.get('name') as string)?.trim()
  const ageYears  = Number(formData.get('age'))
  const companion = formData.get('companion') as string

  if (!name || !ageYears || !companion) return { ok: false, error: 'All fields are required' }

  const { error } = await supabase.from('child_profiles').insert({
    parent_id:        user.id,
    name,
    age_years:        ageYears,
    age_tier:         getAgeProfile(ageYears),
    active_companion: companion,
    companion_name:   null,
    coin_balance:     0,
    garden_health:    1.0,
    weekly_bank_ms:   0,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/profiles')
  return { ok: true }
}

export async function deleteChildAction(
  childId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  // Verify authenticated parent owns this child (defense-in-depth beyond RLS)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('child_profiles')
    .delete()
    .eq('id', childId)
    .eq('parent_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/profiles')
  return { ok: true }
}

export async function updateChildAction(
  childId: string,
  updates: { name?: string; active_companion?: string },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  // Verify authenticated parent owns this child (defense-in-depth beyond RLS)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('child_profiles')
    .update(updates)
    .eq('id', childId)
    .eq('parent_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/parent/profiles')
  return { ok: true }
}
