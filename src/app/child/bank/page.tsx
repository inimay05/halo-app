'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion }                            from 'framer-motion'
import { useProfileStore }                   from '@/store/profileStore'
import { useEngagementStore }                from '@/store/engagementStore'
import { createClient }                      from '@/lib/supabase/client'
import { COLORS }                            from '@/config/tokens'

// ─── Circular ring ─────────────────────────────────────────────────────────────

function ProgressRing({
  used, total, size = 180,
}: { used: number; total: number; size?: number }) {
  const r          = 50
  const fraction   = total > 0 ? Math.min(used / total, 1) : 0
  const color      = fraction < 0.7 ? COLORS.skyDark : fraction < 0.9 ? COLORS.lemonDark : COLORS.peachDark
  const remaining  = Math.max(0, total - used)
  const remMin     = Math.round(remaining / 60_000)
  const fmtRem     = remMin < 60 ? `${remMin}m` : `${Math.floor(remMin / 60)}h ${remMin % 60}m`

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#E8E8EC" strokeWidth={11} />
        <motion.circle
          cx={60} cy={60} r={r}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        pointerEvents:  'none',
      }}>
        <div style={{ fontSize: size * 0.13, fontWeight: 800, color, lineHeight: 1 }}>
          {fmtRem}
        </div>
        <div style={{ fontSize: size * 0.085, color: COLORS.muted, fontWeight: 600 }}>
          left today
        </div>
      </div>
    </div>
  )
}

// ─── Coin jar SVG ──────────────────────────────────────────────────────────────

function CoinJar({ fill }: { fill: number }) {
  const clampedFill = Math.min(1, Math.max(0, fill))
  const jarH        = 80
  const liquidY     = 20 + jarH * (1 - clampedFill)
  const liquidH     = jarH * clampedFill

  return (
    <svg width={90} height={130} viewBox="0 0 90 130" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id="jar-clip">
          <rect x={10} y={20} width={70} height={jarH + 4} rx={4} />
        </clipPath>
      </defs>
      <rect x={10} y={20} width={70} height={jarH + 10} rx={8} fill="white"
        stroke={COLORS.skyDark} strokeWidth={2.5} />
      {clampedFill > 0 && (
        <rect
          x={11} y={liquidY}
          width={68} height={liquidH + 2}
          fill={COLORS.sky}
          clipPath="url(#jar-clip)"
          rx={4}
        />
      )}
      <rect x={22} y={12} width={46} height={12} rx={4}
        fill="white" stroke={COLORS.skyDark} strokeWidth={2.5} />
      <text x={45} y={75} textAnchor="middle" dominantBaseline="middle"
        fontSize={28} style={{ userSelect: 'none' }}>
        🪙
      </text>
      {clampedFill > 0.15 && (
        <text
          x={45} y={liquidY + liquidH * 0.5}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={11} fontWeight="800" fill={COLORS.skyDark}
          style={{ userSelect: 'none' }}
        >
          {Math.round(clampedFill * 100)}%
        </text>
      )}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankPage() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const sessionMs   = useEngagementStore((s) => s.sessionMs)

  const [limitMs,   setLimitMs]   = useState(3_600_000)
  const [bankMs,    setBankMs]    = useState(0)
  const [ceilingMs, setCeilingMs] = useState(7_200_000)
  const [loading,   setLoading]   = useState(true)

  const refresh = useCallback(async (childId: string) => {
    const supabase = createClient()
    const [profRes, ruleRes] = await Promise.all([
      supabase.from('child_profiles').select('weekly_bank_ms').eq('id', childId).single(),
      supabase.from('parent_rules').select('full_block_ms, weekly_bank_ceiling_ms').eq('child_id', childId).single(),
    ])
    setBankMs(profRes.data?.weekly_bank_ms ?? 0)
    setLimitMs(ruleRes.data?.full_block_ms ?? 3_600_000)
    setCeilingMs(ruleRes.data?.weekly_bank_ceiling_ms ?? 7_200_000)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (activeChild) refresh(activeChild.id)
  }, [activeChild?.id, refresh])

  if (!activeChild) return null

  const bankFill  = ceilingMs > 0 ? bankMs / ceilingMs : 0
  const bankMin   = Math.round(bankMs / 60_000)
  const bankLabel = bankMin < 60
    ? `${bankMin} minute${bankMin !== 1 ? 's' : ''}`
    : `${Math.floor(bankMin / 60)}h ${bankMin % 60}m`

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink, marginBottom: 6 }}>
        Time Bank 🏦
      </div>
      <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>
        Your screen time and saved minutes.
      </div>

      {loading ? (
        <div style={{ color: COLORS.muted, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* Ring + jar row */}
          <div style={{
            display:        'flex',
            gap:            32,
            alignItems:     'center',
            justifyContent: 'center',
            flexWrap:       'wrap',
            marginBottom:   32,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <ProgressRing used={sessionMs} total={limitMs} size={180} />
              <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>
                Today&apos;s screen time
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CoinJar fill={bankFill} />
              <div style={{
                fontSize:   14,
                fontWeight: 800,
                color:      COLORS.skyDark,
                textAlign:  'center',
              }}>
                {bankMs > 0 ? `${bankLabel} banked` : 'No time banked'}
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{
            background:   COLORS.sky,
            borderRadius: 12,
            padding:      '14px 18px',
            fontSize:     14,
            color:        COLORS.skyDark,
            maxWidth:     380,
            margin:       '0 auto',
            textAlign:    'center',
            lineHeight:   1.6,
          }}>
            💙 Ask a parent to add bonus time
            <br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              Parents can grant minutes from the Rules page.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
