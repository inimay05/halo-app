import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AGE_PROFILES }  from '@/config/ageProfiles'
import type { AgeTier }  from '@/lib/ageProfile'

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase
    .from('child_profiles')
    .select('id, name, age_tier, active_companion, coin_balance')
    .eq('id', childId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: rules } = await supabase
    .from('parent_rules')
    .select('*')
    .eq('child_id', data.id)
    .single()

  const profile = AGE_PROFILES[data.age_tier as AgeTier]
  const merged = {
    fullBlockMs:          rules?.full_block_ms        ?? profile.fullBlockMs,
    softWarningMs:        rules?.soft_warning_ms     ?? profile.softWarningMs,
    inactivityMs:         profile.inactivityMs,
    autoplayLimit:        rules?.autoplay_limit      ?? profile.autoplayLimit,
    videoChainMaxMs:      profile.videoChainMaxMs,
    nightStartHour:       rules?.night_start_hour    ?? profile.nightStartHour,
    nightMultiplier:      profile.nightMultiplier,
    timeBankEnabled:      rules?.time_banking_enabled ?? false,
    voiceChallengeEnabled: rules?.voice_challenge_enabled ?? true,
  }

  return NextResponse.json({
    name:             data.name,
    age_tier:         data.age_tier,
    active_companion: data.active_companion,
    limitMs:          merged.fullBlockMs,
    rules:            merged,
    ageTier:          data.age_tier,
    companionType:    data.active_companion,
  })
}
