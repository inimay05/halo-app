'use client'

import { useEffect, useState }   from 'react'
import { motion }                 from 'framer-motion'
import { useProfileStore }        from '@/store/profileStore'
import { useCoinStore }           from '@/store/coinStore'
import { useEngagementStore }     from '@/store/engagementStore'
import { CompanionCharacter }     from '@/components/companion/CompanionCharacter'
import { GardenWidget }           from '@/components/rewards/GardenWidget'
import { createClient }           from '@/lib/supabase/client'
import { COLORS }                 from '@/config/tokens'

const CARD = (bg: string): React.CSSProperties => ({
  background:   bg,
  borderRadius: 16,
  padding:      '16px 18px',
  flex:         1,
  minWidth:     90,
})

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function ChildHome() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const coins       = useCoinStore((s) => s.balance)
  const sessionMs   = useEngagementStore((s) => s.sessionMs)

  const [breaks,    setBreaks]    = useState(0)
  const [limitMs,   setLimitMs]   = useState(3_600_000)
  const [streak,    setStreak]    = useState(0)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!activeChild) return
    const supabase = createClient()
    const today    = new Date().toISOString().slice(0, 10)
    const start    = `${today}T00:00:00.000Z`
    const end      = `${today}T23:59:59.999Z`

    Promise.all([
      supabase
        .from('session_events')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', activeChild.id)
        .eq('event_type', 'break_completed')
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('parent_rules')
        .select('full_block_ms')
        .eq('child_id', activeChild.id)
        .single(),
      // Streak: count consecutive days with at least one break_completed
      supabase
        .from('session_events')
        .select('created_at')
        .eq('child_id', activeChild.id)
        .eq('event_type', 'break_completed')
        .order('created_at', { ascending: false })
        .limit(60),
    ]).then(([bRes, rRes, sRes]) => {
      setBreaks(bRes.count ?? 0)
      setLimitMs(rRes.data?.full_block_ms ?? 3_600_000)

      // Compute streak
      const days = new Set<string>()
      ;(sRes.data ?? []).forEach((e) => days.add(e.created_at.slice(0, 10)))
      let s = 0
      const d = new Date()
      while (days.has(d.toISOString().slice(0, 10))) {
        s++
        d.setDate(d.getDate() - 1)
      }
      setStreak(s)
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) return null

  const remaining   = Math.max(0, limitMs - sessionMs)
  const remainMin   = Math.round(remaining / 60_000)
  const fmtRemain   = remainMin < 60
    ? `${remainMin} min`
    : `${Math.floor(remainMin / 60)}h ${remainMin % 60}m`

  const gardenLabel = (h: number) => {
    if (h >= 0.70) return 'Blooming'
    if (h >= 0.40) return 'Growing'
    if (h >= 0.20) return 'Sprouting'
    return 'Resting'
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{
        fontSize:   32,
        fontWeight: 800,
        color:      COLORS.ink,
        marginBottom: 4,
      }}>
        {greeting()}, {activeChild.name}!
      </div>
      <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>
        Here&apos;s how your day is going 🌟
      </div>

      {/* Companion */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CompanionCharacter
            character={activeChild.active_companion}
            pose="idle"
            size={160}
          />
        </motion.div>
      </div>

      {/* Stats row */}
      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Coins */}
          <div style={CARD(COLORS.lemon)}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🪙</div>
            <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.lemonDark }}>{coins}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.lemonDark, opacity: 0.75 }}>
              earned today
            </div>
          </div>

          {/* Breaks */}
          <div style={CARD(COLORS.sage)}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>☕</div>
            <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.sageDark }}>{breaks}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.sageDark, opacity: 0.75 }}>
              completed
            </div>
          </div>

          {/* Time left */}
          <div style={CARD(COLORS.sky)}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>⏳</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: COLORS.skyDark }}>{fmtRemain}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.skyDark, opacity: 0.75 }}>
              left today
            </div>
          </div>
        </div>
      )}

      {/* Garden + streak */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Garden */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '16px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <GardenWidget childId={activeChild.id} size={90} />
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: COLORS.sageDark,
          }}>
            {gardenLabel(activeChild.garden_health)}
          </div>
        </div>

        {/* Streak badge */}
        {streak >= 2 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background:   COLORS.warmAmber,
              borderRadius: 16,
              padding:      '16px 20px',
              display:      'flex',
              flexDirection: 'column',
              alignItems:   'center',
              gap:          6,
              minWidth:     100,
            }}
          >
            <div style={{ fontSize: 36 }}>🔥</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.amberDark }}>{streak}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.amberDark, opacity: 0.85 }}>
              day streak!
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
