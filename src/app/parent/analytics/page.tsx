'use client'

import { useEffect, useState }  from 'react'
import { useProfileStore }       from '@/store/profileStore'
import { createClient }          from '@/lib/supabase/client'
import { calculateScoreInline, getScoreColor } from '@/lib/engagementScore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { COLORS } from '@/config/tokens'
import { format, subDays } from 'date-fns'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
}

interface DayData {
  label:    string
  screenMs: number
  limitMs:  number
  score:    number
  date:     string
}

interface DomainRow {
  domain:   string
  totalMs:  number
}

export default function AnalyticsPage() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const [days,         setDays]         = useState<DayData[]>([])
  const [domains,      setDomains]      = useState<DomainRow[]>([])
  const [passiveCount, setPassiveCount] = useState(0)
  const [fastCount,    setFastCount]    = useState(0)
  const [passiveTrend, setPassiveTrend] = useState<number[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!activeChild) return
    setLoading(true)
    const supabase = createClient()

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return format(d, 'yyyy-MM-dd')
    })

    Promise.all([
      // 7-day events + rules
      supabase
        .from('session_events')
        .select('event_type, metadata, created_at')
        .eq('child_id', activeChild.id)
        .gte('created_at', `${dates[0]}T00:00:00.000Z`)
        .lte('created_at', `${dates[6]}T23:59:59.999Z`),
      supabase
        .from('parent_rules')
        .select('full_block_ms')
        .eq('child_id', activeChild.id)
        .single(),
      supabase
        .from('child_profiles')
        .select('garden_health')
        .eq('id', activeChild.id)
        .single(),
    ]).then(([evtRes, rulesRes, childRes]) => {
      const allEvents = evtRes.data ?? []
      const limitMs   = rulesRes.data?.full_block_ms ?? 3_600_000
      const gardenH   = childRes.data?.garden_health ?? 1.0

      // Build per-day data
      const dayRows: DayData[] = dates.map((date) => {
        const dayEvts = allEvents.filter((e) =>
          e.created_at.startsWith(date),
        )
        const sessionMsArr = dayEvts
          .filter((e) => (e.metadata as Record<string, unknown>)?.sessionMs)
          .map((e) => (e.metadata as Record<string, unknown>).sessionMs as number)
        const screenMs = sessionMsArr.length ? Math.max(...sessionMsArr) : 0
        const score    = calculateScoreInline(dayEvts, gardenH)
        return {
          label: format(new Date(date), 'EEE'),
          date,
          screenMs,
          limitMs,
          score,
        }
      })
      setDays(dayRows)

      // Domain breakdown
      const domainMap = new Map<string, number>()
      allEvents.forEach((e) => {
        const meta = e.metadata as Record<string, unknown>
        const domain = meta?.domain as string | undefined
        const ms     = meta?.durationMs as number | undefined
        if (domain && ms) domainMap.set(domain, (domainMap.get(domain) ?? 0) + ms)
      })
      const domainRows = Array.from(domainMap.entries())
        .map(([domain, totalMs]) => ({ domain, totalMs }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 10)
      setDomains(domainRows)

      // Passive stare & fast-switch
      setPassiveCount(allEvents.filter((e) => e.event_type === 'passiveStare').length)
      setFastCount(allEvents.filter((e) => e.event_type === 'fastSwitch').length)

      // Passive stare sparkline (per day)
      const trend = dates.map((date) =>
        allEvents.filter((e) => e.event_type === 'passiveStare' && e.created_at.startsWith(date)).length,
      )
      setPassiveTrend(trend)

      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) {
    return <div style={{ color: COLORS.muted, marginTop: 60, textAlign: 'center' }}>No child selected.</div>
  }

  const fmtTime = (ms: number) => {
    const m = Math.round(ms / 60_000)
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`
  }

  const maxMs = Math.max(...days.map((d) => Math.max(d.screenMs, d.limitMs)), 1)

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
        Analytics · {activeChild.name}
      </h1>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Screen time chart */}
          <div style={CARD}>
            <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
              📊 7-Day Screen Time
            </span>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days} barGap={4}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => fmtTime(v)}
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={false} tickLine={false}
                  domain={[0, maxMs]}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [fmtTime(Number(v ?? 0))]}
                  labelStyle={{ fontWeight: 700 }}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
                />
                <Bar dataKey="screenMs" name="Screen time" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {days.map((d, i) => (
                    <Cell key={i} fill={getScoreColor(d.score)} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey="limitMs" name="Daily limit" fill={COLORS.sky} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: COLORS.muted }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.sageDark, display: 'inline-block' }} /> Screen time (score colour)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.sky, display: 'inline-block' }} /> Daily limit
              </span>
            </div>
          </div>

          {/* Domain breakdown */}
          <div style={CARD}>
            <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
              🌐 Domain Breakdown (7 days)
            </span>
            {domains.length === 0 ? (
              <p style={{ color: COLORS.muted, fontSize: 14 }}>No domain data recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.sky}` }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: COLORS.muted, fontWeight: 700 }}>Domain</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', color: COLORS.muted, fontWeight: 700 }}>Time</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', width: 100, color: COLORS.muted, fontWeight: 700 }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((row) => {
                    const total = domains.reduce((s, r) => s + r.totalMs, 0)
                    const pct   = total > 0 ? (row.totalMs / total) * 100 : 0
                    return (
                      <tr key={row.domain} style={{ borderBottom: `1px solid #F0F4F8` }}>
                        <td style={{ padding: '8px 8px', color: COLORS.ink, fontWeight: 600 }}>{row.domain}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: COLORS.muted }}>{fmtTime(row.totalMs)}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right' }}>
                          <div style={{ background: '#EEF2F6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: COLORS.skyDark, borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Behaviour signals */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ ...CARD, flex: 1, minWidth: 200, marginBottom: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 10 }}>
                😶 Passive Stare
              </span>
              <div style={{ fontWeight: 800, fontSize: 28, color: passiveCount > 5 ? COLORS.roseDark : COLORS.ink }}>
                {passiveCount}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>events this week</div>
              {/* Sparkline */}
              <svg width="100%" height={40} viewBox={`0 0 ${passiveTrend.length * 20} 40`} preserveAspectRatio="none">
                {passiveTrend.map((v, i) => {
                  const maxV = Math.max(...passiveTrend, 1)
                  const h    = (v / maxV) * 32
                  return (
                    <rect key={i} x={i * 20 + 2} y={40 - h} width={16} height={h}
                      rx={3} fill={v > 0 ? COLORS.peachDark : COLORS.sky} fillOpacity={0.7} />
                  )
                })}
              </svg>
            </div>

            <div style={{ ...CARD, flex: 1, minWidth: 200, marginBottom: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 10 }}>
                ⚡ Fast Switching
              </span>
              <div style={{ fontWeight: 800, fontSize: 28, color: fastCount > 10 ? COLORS.roseDark : COLORS.ink }}>
                {fastCount}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>tab switches this week</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
