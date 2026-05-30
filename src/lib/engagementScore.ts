import { createClient } from '@/lib/supabase/client'
import { COLORS }        from '@/config/tokens'

export async function calculateScore(childId: string, date: string): Promise<number> {
  const supabase = createClient()
  const start    = `${date}T00:00:00.000Z`
  const end      = `${date}T23:59:59.999Z`

  const [trig, comp, night, child] = await Promise.all([
    supabase.from('session_events').select('*', { count: 'exact', head: true })
      .eq('child_id', childId).eq('event_type', 'fullBlock')
      .gte('created_at', start).lte('created_at', end),
    supabase.from('session_events').select('*', { count: 'exact', head: true })
      .eq('child_id', childId).eq('event_type', 'break_completed')
      .gte('created_at', start).lte('created_at', end),
    supabase.from('session_events').select('*', { count: 'exact', head: true })
      .eq('child_id', childId).eq('event_type', 'nightRisk')
      .gte('created_at', start).lte('created_at', end),
    supabase.from('child_profiles').select('garden_health').eq('id', childId).single(),
  ])

  const breakScore  = (trig.count ?? 0) > 0
    ? Math.round(((comp.count ?? 0) / (trig.count ?? 1)) * 60)
    : 60
  const nightScore  = (night.count ?? 0) === 0 ? 20 : 0
  const gardenScore = Math.round((child.data?.garden_health ?? 1.0) * 20)

  return Math.min(100, breakScore + nightScore + gardenScore)
}

// Inline variant that avoids extra DB calls when events are already fetched
export function calculateScoreInline(
  events:       { event_type: string }[],
  gardenHealth: number,
): number {
  const triggered = events.filter((e) => e.event_type === 'fullBlock').length
  const completed = events.filter((e) => e.event_type === 'break_completed').length
  const hasNight  = events.some((e) => e.event_type === 'nightRisk')

  const breakScore  = triggered > 0 ? Math.round((completed / triggered) * 60) : 60
  const nightScore  = hasNight ? 0 : 20
  const gardenScore = Math.round(gardenHealth * 20)

  return Math.min(100, breakScore + nightScore + gardenScore)
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs attention'
}

export function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.sageDark
  if (score >= 60) return COLORS.lemonDark
  if (score >= 40) return COLORS.peachDark
  return COLORS.roseDark
}
