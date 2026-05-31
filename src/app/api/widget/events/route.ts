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

  const rows = events.map((e) => ({
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
