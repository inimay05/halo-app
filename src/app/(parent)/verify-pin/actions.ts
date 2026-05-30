'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function verifyPinAction(pin: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', user.id)
    .single()

  if (!profile?.pin_hash) return { ok: false, error: 'No PIN set' }

  const match = await bcrypt.compare(pin, profile.pin_hash)
  if (!match) return { ok: false }

  // Set a short-lived cookie so middleware can verify parent access
  const cookieStore = await cookies()
  cookieStore.set('parent_verified', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
    path: '/',
  })

  return { ok: true }
}
