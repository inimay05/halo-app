import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AGE_PROFILES }  from '@/config/ageProfiles'
import type { AgeTier }  from '@/lib/ageProfile'

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('child_profiles')
    .select('name, age_tier, active_companion, coin_balance')
    .eq('id', childId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = AGE_PROFILES[data.age_tier as AgeTier]

  return NextResponse.json({
    name:             data.name,
    age_tier:         data.age_tier,
    active_companion: data.active_companion,
    limitMs:          profile.fullBlockMs,
    rules: {
      fullBlockMs:     profile.fullBlockMs,
      softWarningMs:   profile.softWarningMs,
      inactivityMs:    profile.inactivityMs,
      autoplayLimit:   profile.autoplayLimit,
      videoChainMaxMs: profile.videoChainMaxMs,
      nightStartHour:  profile.nightStartHour,
      nightMultiplier: profile.nightMultiplier,
    },
  })
}
