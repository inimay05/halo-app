import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Simple in-process rate limiter: max 5 attempts per childId per 60 seconds.
// This is a best-effort defence for single-instance deployments.
// For multi-instance / edge deployments, use an external store (Redis, KV, etc.).
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS     = 60_000
const MAX_ATTEMPTS  = 5

function isRateLimited(key: string): boolean {
  const now    = Date.now()
  const bucket = attempts.get(key)
  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  bucket.count++
  if (bucket.count > MAX_ATTEMPTS) return true
  return false
}

export async function POST(req: NextRequest) {
  let body: { childId?: string; pin?: string }
  try {
    body = await req.json() as { childId?: string; pin?: string }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { childId, pin } = body

  if (!childId || !pin || typeof childId !== 'string' || typeof pin !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Validate PIN is exactly 4 digits
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Rate limit by childId (proxy for the parent)
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const rateLimitKey = `${childId}:${ip}`
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 })
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
