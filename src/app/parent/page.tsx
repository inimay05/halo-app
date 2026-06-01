'use client'

import { useEffect, useState }  from 'react'
import Link                      from 'next/link'
import { motion }                from 'framer-motion'
import { useProfileStore }       from '@/store/profileStore'
import { createClient }          from '@/lib/supabase/client'
import { calculateScore }        from '@/lib/engagementScore'
import { EngagementRing }        from '@/components/parent/EngagementRing'
import { COLORS }                from '@/config/tokens'
import {
  LineChart, Line, XAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import { format, subDays } from 'date-fns'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: '22px 24px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function ParentOverview() {
  const activeChild    = useProfileStore((s) => s.activeChild())
  const [score,        setScore]        = useState(0)
  const [screenMs,     setScreenMs]     = useState(0)
  const [breaks,       setBreaks]       = useState(0)
  const [coins,        setCoins]        = useState(0)
  const [alerts,       setAlerts]       = useState<{ id: string; event_type: string; created_at: string }[]>([])
  const [weekData,     setWeekData]     = useState<{ day: string; score: number; screenM: number }[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!activeChild) return
    setLoading(true)

    const today    = new Date().toISOString().slice(0, 10)
    const start    = `${today}T00:00:00.000Z`
    const end      = `${today}T23:59:59.999Z`
    const supabase = createClient()

    // Build last-7-days trend
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
    })

    Promise.all([
      supabase.from('session_events').select('event_type, metadata, created_at').eq('child_id', activeChild.id).gte('created_at', start).lte('created_at', end),
      supabase.from('coin_transactions').select('amount').eq('child_id', activeChild.id).gte('created_at', start).lte('created_at', end).gt('amount', 0),
      supabase.from('session_events').select('id, event_type, created_at').eq('child_id', activeChild.id).in('event_type', ['passiveStare', 'autoplayTrap', 'nightRisk', 'anticheat_break_skipped']).gte('created_at', start).lte('created_at', end).limit(3),
      calculateScore(activeChild.id, today),
      ...days.map((d) => calculateScore(activeChild.id, d.date)),
    ]).then(([evts, txns, alertRes, s, ...dayScores]) => {
      const events = evts.data ?? []
      const allMs  = events.filter((e) => (e.metadata as Record<string, unknown>)?.sessionMs)
        .map((e) => (e.metadata as Record<string, unknown>).sessionMs as number)
      setScreenMs(allMs.length ? Math.max(...allMs) : 0)
      setBreaks(events.filter((e) => e.event_type === 'break_completed').length)
      setCoins((txns.data ?? []).reduce((s, t) => s + t.amount, 0))
      setAlerts(alertRes.data ?? [])
      setScore(s)
      setWeekData(days.map((d, i) => ({ day: d.label, score: dayScores[i] as number, screenM: 0 })))
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80, color: COLORS.muted }}>
        <p style={{ fontSize: 18 }}>No child profiles yet.</p>
        <Link href="/parent/profiles" style={{ color: COLORS.lavenderDark, fontWeight: 700 }}>Add a profile →</Link>
      </div>
    )
  }

  const fmtTime = (ms: number) => {
    const m = Math.round(ms / 60_000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const alertLabels: Record<string, string> = {
    passiveStare:             'Extended passive viewing detected',
    autoplayTrap:             'Autoplay chain triggered',
    nightRisk:                'Screen use after bedtime',
    anticheat_break_skipped:  'Break was skipped',
  }

  return (
    <div>
      {/* Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: COLORS.ink }}>
          {greeting()}, {activeChild.name.split(' ')[0]}!
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: COLORS.haloGoldDark, fontWeight: 600 }}>
          Here&apos;s how {activeChild.name} is growing and exploring today.
        </p>
      </motion.div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Row 1: Engagement score + Activity trends */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Engagement Score */}
            <div style={CARD}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 16 }}>
                Engagement Score
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <EngagementRing score={score} size={130} />
                <p style={{ margin: 0, fontSize: 12, color: COLORS.muted, textAlign: 'center', maxWidth: 160 }}>
                  {score >= 70
                    ? `${activeChild.name} is engaging with curiosity and focus today!`
                    : score >= 40
                    ? `${activeChild.name} is having a steady screen day.`
                    : `${activeChild.name} may need a break soon.`}
                </p>
              </div>
            </div>

            {/* Activity Trends */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted }}>Activity Trends</span>
                <span style={{
                  background: COLORS.sage, color: COLORS.sageDark,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>Last 7 Days</span>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart data={weekData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: COLORS.muted }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.10)', fontSize: 12 }}
                    formatter={(v: unknown) => [`${v}`, 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke={COLORS.lavenderDark} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2: Recent Alerts + Rules & Daily Rhythm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {/* Recent Alerts */}
            <div style={{ ...CARD, borderLeft: `4px solid ${COLORS.haloGold}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted }}>Recent Alerts</span>
                <Link href="/parent/alerts" style={{ fontSize: 12, color: COLORS.lavenderDark, fontWeight: 700, textDecoration: 'none' }}>
                  See all →
                </Link>
              </div>
              {alerts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 0', color: COLORS.muted }}>
                  <span style={{ fontSize: 28 }}>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>All clear today!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {alerts.slice(0, 2).map((a) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: '50%', background: COLORS.warmAmber,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0,
                      }}>🔔</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>
                          {alertLabels[a.event_type] ?? a.event_type}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                          {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rules & Daily Rhythm */}
            <div style={CARD}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 14 }}>
                Rules &amp; Daily Rhythm
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>Focus Time</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.lavenderDark }}>
                      {fmtTime(screenMs)}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: COLORS.neutral, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (screenMs / 3_600_000) * 100)}%`, height: '100%', background: COLORS.lavenderDark, borderRadius: 4 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>Coins Earned</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.haloGoldDark }}>{coins} 🪙</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: COLORS.neutral, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (coins / 50) * 100)}%`, height: '100%', background: COLORS.haloGold, borderRadius: 4 }} />
                  </div>
                </div>
                <Link
                  href="/parent/rules"
                  style={{
                    marginTop: 4,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: COLORS.lavenderDark, color: 'white',
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    justifyContent: 'center',
                  }}
                >
                  ⚙️ Manage Rules
                </Link>
              </div>
            </div>
          </div>

          {/* Quick stat pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            {[
              { label: 'Screen time', value: fmtTime(screenMs), bg: COLORS.sky,       text: COLORS.skyDark },
              { label: 'Breaks',      value: String(breaks),    bg: COLORS.sage,      text: COLORS.sageDark },
              { label: 'Coins',       value: `${coins} 🪙`,     bg: COLORS.lemon,     text: COLORS.lemonDark },
            ].map(({ label, value, bg, text }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: '10px 18px', flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{value}</div>
                <div style={{ fontSize: 11, color: text, opacity: 0.75, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
