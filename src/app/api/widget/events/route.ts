import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface EventPayload {
  childId: string
  events: Array<{ event_type: string; metadata: Record<string, unknown> }>
}

export async function POST(req: NextRequest) {
  const body = await req.json() as EventPayload
  const { childId, events } = body

  if (!childId || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify childId references a real child profile before inserting events
  const { data: childCheck, error: childCheckError } = await supabase
    .from('child_profiles')
    .select('id')
    .eq('id', childId)
    .single()

  if (childCheckError || !childCheck) {
    return NextResponse.json({ error: 'Invalid childId' }, { status: 403 })
  }

  // Allowlist of valid event_type values to prevent arbitrary data injection
  const VALID_EVENT_TYPES = new Set([
    'healthy', 'softWarning', 'passiveStare', 'autoplayTrap', 'nightRisk',
    'sleepDetected', 'fullBlock', 'session_reset',
    'break_completed', 'break_skipped', 'anticheat_break_skipped',
    'anticheat_tamper_detected', 'anticheat_rapid_toggle',
    'early_exit', 'stayed_off_30min', 'fastSwitch', 'night_champion',
    'exercise_mission', 'voice_challenge',
  ])

  const validEvents = events.filter((e) => VALID_EVENT_TYPES.has(e.event_type))
  if (validEvents.length === 0) {
    return NextResponse.json({ error: 'No valid events' }, { status: 400 })
  }

  const rows = validEvents.map((e) => ({
    child_id:   childId,
    event_type: e.event_type,
    metadata:   e.metadata,
  }))

  const { error } = await supabase.from('session_events').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_seen_at timestamp
  await supabase
    .from('child_profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', childId)

  return NextResponse.json({ ok: true, flushed: rows.length })
}
