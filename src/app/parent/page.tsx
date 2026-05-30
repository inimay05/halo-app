'use client'

import { useEffect, useState }  from 'react'
import Link                      from 'next/link'
import { useProfileStore }       from '@/store/profileStore'
import { createClient }          from '@/lib/supabase/client'
import { calculateScore }        from '@/lib/engagementScore'
import { EngagementRing }        from '@/components/parent/EngagementRing'
import { GardenWidget }          from '@/components/rewards/GardenWidget'
import { CompanionCharacter }    from '@/components/companion/CompanionCharacter'
import type { CharacterType }    from '@/components/companion/CompanionCharacter'
import { COLORS }                from '@/config/tokens'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ ...CARD, flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.ink }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function WidgetStatus({ lastSeen }: { lastSeen: Date | null }) {
  const now     = Date.now()
  const diffMs  = lastSeen ? now - lastSeen.getTime() : Infinity
  const color   = diffMs < 30_000 ? COLORS.sageDark : diffMs < 120_000 ? COLORS.lemonDark : COLORS.roseDark
  const label   = diffMs < 30_000 ? 'Synced' : diffMs < 120_000 ? 'Recent' : 'Offline'
  const timeStr = lastSeen
    ? lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never'

  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Widget Status</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: COLORS.muted }}>Last sync: {timeStr}</span>
      <Link href="/install" style={{ fontSize: 12, color: COLORS.skyDark, fontWeight: 600 }}>
        Install widget →
      </Link>
    </div>
  )
}

export default function ParentOverview() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const [score,     setScore]     = useState(0)
  const [screenMs,  setScreenMs]  = useState(0)
  const [breaks,    setBreaks]    = useState(0)
  const [coins,     setCoins]     = useState(0)
  const [alerts,    setAlerts]    = useState(0)
  const [lastSeen,  setLastSeen]  = useState<Date | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!activeChild) return
    setLoading(true)

    const today    = new Date().toISOString().slice(0, 10)
    const start    = `${today}T00:00:00.000Z`
    const end      = `${today}T23:59:59.999Z`
    const supabase = createClient()

    Promise.all([
      supabase.from('session_events').select('event_type, metadata, created_at').eq('child_id', activeChild.id).gte('created_at', start).lte('created_at', end),
      supabase.from('coin_transactions').select('amount').eq('child_id', activeChild.id).gte('created_at', start).lte('created_at', end).gt('amount', 0),
      supabase.from('session_events').select('*', { count: 'exact', head: true }).eq('child_id', activeChild.id).in('event_type', ['passiveStare', 'autoplayTrap', 'nightRisk', 'anticheat_break_skipped']).gte('created_at', start).lte('created_at', end),
      supabase.from('session_events').select('created_at').eq('child_id', activeChild.id).order('created_at', { ascending: false }).limit(1),
      calculateScore(activeChild.id, today),
    ]).then(([evts, txns, alertRes, lastEvt, s]) => {
      const events  = evts.data ?? []
      const allMs   = events.filter((e) => (e.metadata as Record<string, unknown>)?.sessionMs)
        .map((e) => (e.metadata as Record<string, unknown>).sessionMs as number)
      setScreenMs(allMs.length ? Math.max(...allMs) : 0)
      setBreaks(events.filter((e) => e.event_type === 'break_completed').length)
      setCoins((txns.data ?? []).reduce((s, t) => s + t.amount, 0))
      setAlerts(alertRes.count ?? 0)
      setLastSeen(lastEvt.data?.[0] ? new Date(lastEvt.data[0].created_at) : null)
      setScore(s)
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80, color: COLORS.muted }}>
        <p style={{ fontSize: 18 }}>No child profiles yet.</p>
        <Link href="/parent/profiles" style={{ color: COLORS.skyDark, fontWeight: 700 }}>Add a profile →</Link>
      </div>
    )
  }

  const fmtTime = (ms: number) => {
    const m = Math.round(ms / 60_000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <CompanionCharacter
          character={(activeChild.active_companion ?? 'cat') as CharacterType}
          pose="idle"
          size={64}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: COLORS.ink }}>{activeChild.name}</h1>
          <span style={{
            background: COLORS.sky, borderRadius: 20, padding: '3px 10px',
            fontSize: 12, fontWeight: 700, color: COLORS.skyDark,
          }}>
            {activeChild.age_tier}
          </span>
        </div>
        {alerts > 0 && (
          <Link href="/parent/alerts" style={{
            marginLeft: 'auto', background: COLORS.rose, borderRadius: 20,
            padding: '6px 14px', fontSize: 13, fontWeight: 700, color: COLORS.roseDark,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🔔 {alerts} alert{alerts !== 1 ? 's' : ''}
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Score + stats row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 4 }}>Today&apos;s Score</span>
              <EngagementRing score={score} size={150} />
            </div>
            <div style={{ display: 'flex', flex: 1, gap: 14, flexWrap: 'wrap', alignContent: 'flex-start' }}>
              <StatCard icon="⏱" label="Screen time"     value={fmtTime(screenMs)} />
              <StatCard icon="☕" label="Breaks taken"    value={String(breaks)}   />
              <StatCard icon="🪙" label="Coins earned"   value={String(coins)}    />
            </div>
          </div>

          {/* Garden + widget status */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted }}>Garden</span>
              <GardenWidget childId={activeChild.id} size={120} />
            </div>
            <WidgetStatus lastSeen={lastSeen} />
          </div>
        </>
      )}
    </div>
  )
}
