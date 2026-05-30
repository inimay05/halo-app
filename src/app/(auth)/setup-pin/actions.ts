'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function setupPinAction(pin: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const pin_hash = await bcrypt.hash(pin, 10)

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    pin_hash,
  })

  if (error) throw new Error(error.message)

  redirect('/parent/dashboard')
}
