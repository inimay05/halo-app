import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  const supabase = await createClient()

  const rows = events.map((e) => ({
    child_id:   childId,
    event_type: e.event_type,
    metadata:   e.metadata,
  }))

  const { error } = await supabase.from('session_events').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Bump last-seen by updating a field the parent dashboard can query
  await supabase
    .from('child_profiles')
    .update({ weekly_bank_ms: Date.now() })  // reusing as last_seen timestamp until migration adds column
    .eq('id', childId)

  return NextResponse.json({ ok: true, flushed: rows.length })
}
