'use client'

import { useEffect, useState } from 'react'
import { useProfileStore }      from '@/store/profileStore'
import { createClient }         from '@/lib/supabase/client'
import { GardenWidget }         from '@/components/rewards/GardenWidget'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { COLORS }   from '@/config/tokens'
import { format, subDays } from 'date-fns'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
}

interface HealthPoint {
  label:  string
  health: number
}

interface WaterEntry {
  id:         string
  created_at: string
  delta:      number
}

function healthColor(h: number) {
  if (h >= 0.7) return COLORS.sageDark
  if (h >= 0.4) return COLORS.lemonDark
  if (h >= 0.2) return COLORS.peachDark
  return COLORS.roseDark
}

export default function GardenPage() {
  const activeChild  = useProfileStore((s) => s.activeChild())
  const [history,    setHistory]    = useState<HealthPoint[]>([])
  const [waterLog,   setWaterLog]   = useState<WaterEntry[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    if (!activeChild) return
    setLoading(true)
    const supabase = createClient()

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return format(d, 'yyyy-MM-dd')
    })
    const since = `${dates[0]}T00:00:00.000Z`

    Promise.all([
      supabase
        .from('garden_health_log')
        .select('health, created_at')
        .eq('child_id', activeChild.id)
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
      supabase
        .from('garden_health_log')
        .select('id, created_at, delta')
        .eq('child_id', activeChild.id)
        .gte('created_at', since)
        .gt('delta', 0)
        .order('created_at', { ascending: false })
        .limit(30),
    ]).then(([logRes, waterRes]) => {
      const logData = logRes.data ?? []

      // Collapse per-day: take last entry for each date
      const byDate = new Map<string, number>()
      logData.forEach((r: { health: number; created_at: string }) => {
        byDate.set(r.created_at.slice(0, 10), r.health)
      })

      const healthHistory: HealthPoint[] = dates.map((date) => ({
        label:  format(new Date(date), 'EEE'),
        health: byDate.get(date) ?? 0,
      }))
      setHistory(healthHistory)
      setWaterLog((waterRes.data ?? []) as WaterEntry[])
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) {
    return <div style={{ color: COLORS.muted, marginTop: 60, textAlign: 'center' }}>No child selected.</div>
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
        Garden · {activeChild.name}
      </h1>

      {/* Live plant */}
      <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 32, paddingBottom: 32 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted }}>Current Plant</span>
        <GardenWidget childId={activeChild.id} size={180} />
        <span style={{ fontSize: 13, color: COLORS.muted }}>
          Health: <strong style={{ color: healthColor(activeChild.garden_health) }}>
            {Math.round(activeChild.garden_health * 100)}%
          </strong>
        </span>
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading history…</div>
      ) : (
        <>
          {/* 7-day health chart */}
          <div style={CARD}>
            <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
              🌱 7-Day Health History
            </span>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={history} barGap={4}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 11, fill: COLORS.muted }}
                  axisLine={false} tickLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(v) => [`${Math.round(Number(v ?? 0) * 100)}%`, 'Health']}
                  labelStyle={{ fontWeight: 700 }}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
                />
                <Bar dataKey="health" name="Health" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {history.map((d, i) => (
                    <Cell key={i} fill={d.health > 0 ? healthColor(d.health) : COLORS.border} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Water log */}
          <div style={CARD}>
            <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
              💧 Recent Watering Events
            </span>
            {waterLog.length === 0 ? (
              <p style={{ color: COLORS.muted, fontSize: 14 }}>No watering events in the past 7 days.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {waterLog.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: COLORS.mint, borderRadius: 10, padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>💧</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.mintDark }}>
                        Break completed — +{Math.round(entry.delta * 100)}% health
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.mintDark, opacity: 0.75, marginTop: 2 }}>
                        {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
