import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { childId, pin } = await req.json() as { childId: string; pin: string }

  if (!childId || !pin) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Resolve child → parent → pin_hash
  const { data: child } = await supabase
    .from('child_profiles')
    .select('parent_id')
    .eq('id', childId)
    .single()

  if (!child?.parent_id) return NextResponse.json({ ok: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', child.parent_id)
    .single()

  if (!profile?.pin_hash) return NextResponse.json({ ok: false })

  const match = await bcrypt.compare(pin, profile.pin_hash)
  return NextResponse.json({ ok: match })
}
