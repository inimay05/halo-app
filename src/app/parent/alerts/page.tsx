'use client'

import { useEffect, useState } from 'react'
import { useProfileStore }      from '@/store/profileStore'
import { createClient }         from '@/lib/supabase/client'
import { COLORS }               from '@/config/tokens'
import { format }               from 'date-fns'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
}

const ALERT_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  passiveStare:             { icon: '😶', label: 'Passive stare detected',        color: COLORS.peachDark,   bg: COLORS.peach   },
  autoplayTrap:             { icon: '🔁', label: 'Autoplay trap',                  color: COLORS.lemonDark,   bg: COLORS.lemon   },
  nightRisk:                { icon: '🌙', label: 'Night usage detected',           color: COLORS.roseDark,    bg: COLORS.rose    },
  anticheat_break_skipped:  { icon: '⏭', label: 'Break skipped',                  color: COLORS.amberDark,   bg: COLORS.warmAmber },
  fastSwitch:               { icon: '⚡', label: 'Rapid tab switching',            color: COLORS.lavenderDark, bg: COLORS.lavender },
  fullBlock:                { icon: '🚫', label: 'Screen time limit reached',      color: COLORS.roseDark,    bg: COLORS.rose    },
}

type Severity = 'high' | 'medium' | 'low'

interface AntiCheatMeta { icon: string; label: string; severity: Severity }

const ANTICHEAT_META: Record<string, AntiCheatMeta> = {
  // session_events anticheat types
  anticheat_break_skipped:   { icon: '⏭', label: 'Break skipped',            severity: 'low'    },
  anticheat_tamper_detected: { icon: '🛡', label: 'Widget tamper attempt',    severity: 'high'   },
  anticheat_rapid_toggle:    { icon: '🔀', label: 'Rapid focus toggling',     severity: 'medium' },
  // anticheat_events engine types
  LocalStorageTamper:        { icon: '🗝️', label: 'Storage value modified',   severity: 'high'   },
  ClockDiscrepancy:          { icon: '🕐', label: 'Clock discrepancy noticed', severity: 'high'   },
  SuspiciousActivity:        { icon: '🤖', label: 'Unusual input pattern',    severity: 'medium' },
  MultiTabConflict:          { icon: '🪟', label: 'Session opened twice',     severity: 'low'    },
}

const SEVERITY_STYLE: Record<Severity, { bg: string; color: string }> = {
  high:   { bg: COLORS.rose,       color: COLORS.roseDark    },
  medium: { bg: COLORS.warmAmber,  color: COLORS.amberDark   },
  low:    { bg: COLORS.lemon,      color: COLORS.lemonDark   },
}

const SEVERITY_LABEL: Record<Severity, string> = {
  high: 'Notable', medium: 'Watch', low: 'Info',
}

const ALERT_TYPES = Object.keys(ALERT_META)
// session_events anticheat types (break skips, tamper, rapid toggle)
const ANTICHEAT_TYPES_SESSION = [
  'anticheat_break_skipped',
  'anticheat_tamper_detected',
  'anticheat_rapid_toggle',
]

interface AlertEvent {
  id:         string
  event_type: string
  created_at: string
  metadata:   Record<string, unknown>
}

type Tab = 'alerts' | 'security'

export default function AlertsPage() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const [tab,      setTab]      = useState<Tab>('alerts')
  const [alerts,   setAlerts]   = useState<AlertEvent[]>([])
  const [security, setSecurity] = useState<AlertEvent[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!activeChild) return
    setLoading(true)
    const supabase = createClient()
    const since    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    Promise.all([
      supabase
        .from('session_events')
        .select('id, event_type, created_at, metadata')
        .eq('child_id', activeChild.id)
        .in('event_type', ALERT_TYPES)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('session_events')
        .select('id, event_type, created_at, metadata')
        .eq('child_id', activeChild.id)
        .in('event_type', ANTICHEAT_TYPES_SESSION)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('anticheat_events')
        .select('id, event_type, created_at, metadata')
        .eq('child_id', activeChild.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
    ]).then(([alertRes, secSessionRes, secEngineRes]) => {
      setAlerts((alertRes.data ?? []) as AlertEvent[])
      // Merge session anticheat events + engine anticheat events, sort newest first
      const merged = [
        ...((secSessionRes.data ?? []) as AlertEvent[]),
        ...((secEngineRes.data  ?? []) as AlertEvent[]),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setSecurity(merged)
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) {
    return <div style={{ color: COLORS.muted, marginTop: 60, textAlign: 'center' }}>No child selected.</div>
  }

  const renderEmpty = (label: string) => (
    <div style={{
      ...CARD, display: 'flex', alignItems: 'center', gap: 12,
      background: COLORS.sage, boxShadow: 'none',
    }}>
      <span style={{ fontSize: 24 }}>🌿</span>
      <div>
        <div style={{ fontWeight: 700, color: COLORS.sageDark }}>All clear</div>
        <div style={{ fontSize: 13, color: COLORS.sageDark, opacity: 0.8 }}>{label}</div>
      </div>
    </div>
  )

  const renderAlertItem = (evt: AlertEvent) => {
    const meta  = ALERT_META[evt.event_type] ?? { icon: '⚠️', label: evt.event_type, color: COLORS.ink, bg: COLORS.lemon }
    const time  = format(new Date(evt.created_at), 'MMM d, h:mm a')
    return (
      <div
        key={evt.id}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: meta.bg, borderRadius: 12, padding: '12px 14px',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: meta.color }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: meta.color, opacity: 0.75, marginTop: 2 }}>{time}</div>
        </div>
      </div>
    )
  }

  const renderSecurityItem = (evt: AlertEvent) => {
    const meta     = ANTICHEAT_META[evt.event_type] ?? { icon: '🛡', label: evt.event_type, severity: 'low' as Severity }
    const severity = meta.severity
    const style    = SEVERITY_STYLE[severity]
    const time     = format(new Date(evt.created_at), 'MMM d, h:mm a')
    return (
      <div
        key={evt.id}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: style.bg, borderRadius: 12, padding: '12px 14px',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: style.color }}>{meta.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: style.color,
              background: 'rgba(255,255,255,0.55)', borderRadius: 8,
              padding: '2px 7px', letterSpacing: '0.04em',
            }}>
              {SEVERITY_LABEL[severity]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: style.color, opacity: 0.75, marginTop: 2 }}>{time}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
        Alerts · {activeChild.name}
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['alerts', 'security'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14,
              background: tab === t ? COLORS.skyDark : COLORS.sky,
              color:      tab === t ? 'white' : COLORS.skyDark,
              transition: 'background 0.15s',
            }}
          >
            {t === 'alerts' ? `🔔 Alerts (${alerts.length})` : `🛡 Security (${security.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      ) : tab === 'alerts' ? (
        <div>
          {alerts.length === 0
            ? renderEmpty('No alert events in the past 7 days.')
            : alerts.map(renderAlertItem)}
        </div>
      ) : (
        <div>
          {security.length === 0
            ? renderEmpty('No security events in the past 7 days.')
            : security.map(renderSecurityItem)}
        </div>
      )}
    </div>
  )
}
