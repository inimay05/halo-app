'use client'

import { useEffect, useState }   from 'react'
import Link                       from 'next/link'
import { motion }                 from 'framer-motion'
import { useProfileStore }        from '@/store/profileStore'
import { useCoinStore }           from '@/store/coinStore'
import { useEngagementStore }     from '@/store/engagementStore'
import { CompanionCharacter }     from '@/components/companion/CompanionCharacter'
import { GardenWidget }           from '@/components/rewards/GardenWidget'
import { createClient }           from '@/lib/supabase/client'
import { COLORS }                 from '@/config/tokens'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function gardenStatus(h: number) {
  if (h >= 0.70) return { label: 'Thriving', color: COLORS.sageDark, bg: COLORS.sage }
  if (h >= 0.40) return { label: 'Growing',  color: COLORS.mintDark, bg: COLORS.mint }
  if (h >= 0.20) return { label: 'Sprouting',color: COLORS.lemonDark,bg: COLORS.lemon }
  return           { label: 'Resting',  color: COLORS.muted,    bg: COLORS.neutral }
}

export default function ChildHome() {
  const activeChild  = useProfileStore((s) => s.activeChild())
  const coins        = useCoinStore((s) => s.balance)
  const sessionMs    = useEngagementStore((s) => s.sessionMs)

  const [breaks,  setBreaks]  = useState(0)  // eslint-disable-line @typescript-eslint/no-unused-vars
  const [limitMs, setLimitMs] = useState(3_600_000)
  const [streak,  setStreak]  = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeChild) return
    const supabase = createClient()
    const today    = new Date().toISOString().slice(0, 10)
    const start    = `${today}T00:00:00.000Z`
    const end      = `${today}T23:59:59.999Z`

    Promise.all([
      supabase.from('session_events').select('*', { count: 'exact', head: true })
        .eq('child_id', activeChild.id).eq('event_type', 'break_completed')
        .gte('created_at', start).lte('created_at', end),
      supabase.from('parent_rules').select('full_block_ms')
        .eq('child_id', activeChild.id).single(),
      supabase.from('session_events').select('created_at')
        .eq('child_id', activeChild.id).eq('event_type', 'break_completed')
        .order('created_at', { ascending: false }).limit(60),
    ]).then(([bRes, rRes, sRes]) => {
      setBreaks(bRes.count ?? 0)
      setLimitMs(rRes.data?.full_block_ms ?? 3_600_000)
      const days = new Set<string>()
      ;(sRes.data ?? []).forEach((e) => days.add(e.created_at.slice(0, 10)))
      let s = 0
      const d = new Date()
      while (days.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) }
      setStreak(s)
      setLoading(false)
    })
  }, [activeChild?.id])

  if (!activeChild) return null

  const remaining  = Math.max(0, limitMs - sessionMs)
  const remainMin  = Math.round(remaining / 60_000)
  const fmtRemain  = remainMin < 60 ? `${remainMin}:00` : `${Math.floor(remainMin / 60)}:${String(remainMin % 60).padStart(2, '0')}`
  const garden     = gardenStatus(activeChild.garden_health)

  return (
    <div>
      {/* Greeting + time remaining */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: COLORS.ink }}>
            Hello, {activeChild.name}!
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.haloGoldDark, fontWeight: 600 }}>
            {greeting() === 'Good morning'
              ? 'The sun is shining in your digital world today.'
              : greeting() === 'Good afternoon'
              ? 'Your journey is going great — keep it up!'
              : 'Wind down gently and end the day well.'}
          </p>
        </div>

        {/* Time remaining badge */}
        <div style={{
          background:   COLORS.lavenderDark,
          borderRadius: 14,
          padding:      '8px 14px',
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          flexShrink:   0,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>TIME REMAINING</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>⏱ {fmtRemain}</span>
        </div>
      </motion.div>

      {/* Main two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Screen Garden — large feature card */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '20px 22px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>Screen Garden</div>
          <div style={{ fontSize: 12, color: COLORS.haloGoldDark, fontWeight: 600, marginBottom: 14 }}>
            Your curiosity keeps it blooming!
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <GardenWidget childId={activeChild.id} size={110} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: garden.bg, color: garden.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
              {garden.label}
            </span>
            <span style={{ background: COLORS.warmAmber, color: COLORS.amberDark, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
              Level {Math.max(1, Math.ceil(activeChild.garden_health * 5))}
            </span>
          </div>
        </div>

        {/* Companion Shop preview */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '18px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>Companion Shop</span>
            <span style={{ background: COLORS.haloGold, color: COLORS.haloGoldDark, fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '3px 10px' }}>
              {coins} 🪙
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <CompanionCharacter
              character={activeChild.active_companion}
              pose="idle"
              size={80}
            />
          </div>

          <Link href="/child/shop" style={{
            display: 'block', textAlign: 'center',
            background: COLORS.lavender, color: COLORS.lavenderDark,
            borderRadius: 12, padding: '8px',
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
          }}>
            Visit Shop →
          </Link>
        </div>
      </div>

      {/* Bottom row: 3 nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { href: '/child', icon: '🌱', label: 'Mindful Garden', sub: 'Water your seeds', bg: COLORS.warmAmber, text: COLORS.amberDark },
          { href: '/child/journey', icon: '📖', label: 'Journey Map', sub: 'See where you\'ve been', bg: COLORS.lavender, text: COLORS.lavenderDark },
          { href: '/child/shop', icon: '🏪', label: 'Treasure Shop', sub: 'Spend your coins', bg: COLORS.mint, text: COLORS.mintDark },
        ].map(({ href, icon, label, sub, bg, text }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>
                {icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Streak badge (shown if earned) */}
      {!loading && streak >= 2 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            marginTop: 16, background: COLORS.warmAmber, borderRadius: 16,
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.amberDark }}>{streak}-day streak!</div>
            <div style={{ fontSize: 12, color: COLORS.amberDark, opacity: 0.8 }}>Keep it going!</div>
          </div>
          <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 28, color: COLORS.amberDark }}>{streak}</div>
        </motion.div>
      )}
    </div>
  )
}
