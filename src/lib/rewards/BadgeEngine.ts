import { createClient }  from '@/lib/supabase/client'
import { useBadgeStore } from '@/store/badgeStore'

export type BadgeType =
  | 'first_break'
  | 'week_streak'
  | 'hero_exit_5'
  | 'garden_bloom'
  | 'night_champion_7'
  | 'mission_explorer_10'
  | 'fifty_coins'
  | 'voice_hero'

// Map of badge → which trigger events should prompt a check
const BADGE_TRIGGERS: Record<BadgeType, string[]> = {
  first_break:          ['break_completed'],
  week_streak:          ['break_completed'],
  hero_exit_5:          ['early_exit', 'stayed_off_30min'],
  garden_bloom:         ['garden_water'],
  night_champion_7:     ['night_champion'],
  mission_explorer_10:  ['break_completed', 'exercise_mission'],
  fifty_coins:          ['break_completed', 'early_exit', 'voice_challenge', 'week_streak'],
  voice_hero:           ['voice_challenge'],
}

type SupabaseClient = ReturnType<typeof createClient>

const CONDITIONS: Record<BadgeType, (childId: string, db: SupabaseClient) => Promise<boolean>> = {
  first_break: async (childId, db) => {
    const { count } = await db
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('event_type', 'break_completed')
    return (count ?? 0) >= 1
  },

  week_streak: async (childId, db) => {
    // At least 7 distinct calendar days with a break in the last 14 days
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await db
      .from('session_events')
      .select('created_at')
      .eq('child_id', childId)
      .eq('event_type', 'break_completed')
      .gte('created_at', since)
    const days = new Set((data ?? []).map((r) => r.created_at.slice(0, 10)))
    return days.size >= 7
  },

  hero_exit_5: async (childId, db) => {
    const { count } = await db
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .in('event_type', ['early_exit', 'stayed_off_30min'])
    return (count ?? 0) >= 5
  },

  garden_bloom: async (childId, db) => {
    const { data } = await db
      .from('child_profiles')
      .select('garden_health')
      .eq('id', childId)
      .single()
    return (data?.garden_health ?? 0) >= 0.70
  },

  night_champion_7: async (childId, db) => {
    const { count } = await db
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('event_type', 'night_champion')
    return (count ?? 0) >= 7
  },

  mission_explorer_10: async (childId, db) => {
    const { count } = await db
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .in('event_type', ['break_completed', 'exercise_mission'])
    return (count ?? 0) >= 10
  },

  fifty_coins: async (childId, db) => {
    const { data } = await db
      .from('child_profiles')
      .select('coin_balance')
      .eq('id', childId)
      .single()
    return (data?.coin_balance ?? 0) >= 50
  },

  voice_hero: async (childId, db) => {
    const { count } = await db
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('event_type', 'voice_challenge')
    return (count ?? 0) >= 1
  },
}

export class BadgeEngine {
  static async checkAndAward(childId: string, trigger: string): Promise<void> {
    const db = createClient()

    // Fetch already-earned badge types
    const { data: existing } = await db
      .from('badges')
      .select('badge_type')
      .eq('child_id', childId)
    const earned = new Set((existing ?? []).map((b) => b.badge_type))

    // Check every badge that responds to this trigger
    for (const [badgeType, triggers] of Object.entries(BADGE_TRIGGERS) as [BadgeType, string[]][]) {
      if (earned.has(badgeType)) continue
      if (!triggers.includes(trigger)) continue

      const met = await CONDITIONS[badgeType](childId, db)
      if (!met) continue

      const { data: inserted, error } = await db
        .from('badges')
        .insert({ child_id: childId, badge_type: badgeType })
        .select()
        .single()

      // UNIQUE constraint prevents double-insert; ignore the duplicate error
      if (error || !inserted) continue

      useBadgeStore.getState().pushBadge({
        badge_type: inserted.badge_type,
        earned_at:  inserted.earned_at,
      })
    }
  }

  static async loadBadges(childId: string): Promise<void> {
    const { data } = await createClient()
      .from('badges')
      .select('badge_type, earned_at')
      .eq('child_id', childId)
      .order('earned_at', { ascending: true })
    if (data) useBadgeStore.getState().setEarned(data)
  }
}
