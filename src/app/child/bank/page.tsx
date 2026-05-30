'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, useAnimationControls }     from 'framer-motion'
import { useProfileStore }                  from '@/store/profileStore'
import { useEngagementStore }               from '@/store/engagementStore'
import { TimeBankEngine }                   from '@/lib/rewards/TimeBankEngine'
import { createClient }                     from '@/lib/supabase/client'
import { COLORS }                           from '@/config/tokens'

const SAVE_MS = 15 * 60_000 // 15 minutes

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
  // fill: 0–1
  const clampedFill = Math.min(1, Math.max(0, fill))
  const jarH        = 80  // inner height of liquid area
  const liquidY     = 20 + jarH * (1 - clampedFill) // top of liquid
  const liquidH     = jarH * clampedFill

  return (
    <svg width={90} height={130} viewBox="0 0 90 130" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id="jar-clip">
          <rect x={10} y={20} width={70} height={jarH + 4} rx={4} />
        </clipPath>
      </defs>
      {/* Jar body */}
      <rect x={10} y={20} width={70} height={jarH + 10} rx={8} fill="white"
        stroke={COLORS.skyDark} strokeWidth={2.5} />
      {/* Liquid */}
      {clampedFill > 0 && (
        <rect
          x={11} y={liquidY}
          width={68} height={liquidH + 2}
          fill={COLORS.sky}
          clipPath="url(#jar-clip)"
          rx={4}
        />
      )}
      {/* Jar neck */}
      <rect x={22} y={12} width={46} height={12} rx={4}
        fill="white" stroke={COLORS.skyDark} strokeWidth={2.5} />
      {/* Coin icon on jar */}
      <text x={45} y={75} textAnchor="middle" dominantBaseline="middle"
        fontSize={28} style={{ userSelect: 'none' }}>
        🪙
      </text>
      {/* Fill % label */}
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

  const [limitMs,        setLimitMs]        = useState(3_600_000)
  const [bankMs,         setBankMs]         = useState(0)
  const [ceilingMs,      setCeilingMs]      = useState(7_200_000)
  const [reaction,       setReaction]       = useState<string | null>(null)
  const [loading,        setLoading]        = useState(true)

  const companionCtrl = useAnimationControls()

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

  const handleSave = async () => {
    if (!activeChild) return
    const remaining = Math.max(0, limitMs - sessionMs)
    if (remaining < SAVE_MS) {
      await companionCtrl.start({ x: [-6, 6, -6, 4, 0], transition: { duration: 0.35 } })
      setReaction('Not enough time remaining to save!')
      setTimeout(() => setReaction(null), 2_500)
      return
    }
    await TimeBankEngine.saveMinutes(activeChild.id, SAVE_MS)
    setBankMs((b) => Math.min(b + SAVE_MS, ceilingMs))
    setReaction('Smart thinking! ⭐')
    await companionCtrl.start({ y: [0, -20, 0], transition: { duration: 0.5 } })
    setTimeout(() => setReaction(null), 2_500)
  }

  const handleUseAll = async () => {
    if (!activeChild || bankMs === 0) return
    const ok = await TimeBankEngine.spendFromBank(activeChild.id, bankMs)
    if (ok) {
      setBankMs(0)
      setReaction('Enjoy your extra time! 🎉')
      await companionCtrl.start({ rotate: [0, 12, -12, 0], transition: { duration: 0.5 } })
      setTimeout(() => setReaction(null), 2_500)
    }
  }

  if (!activeChild) return null

  const bankFill   = ceilingMs > 0 ? bankMs / ceilingMs : 0
  const bankMin    = Math.round(bankMs / 60_000)
  const bankLabel  = bankMin < 60
    ? `${bankMin} minute${bankMin !== 1 ? 's' : ''}`
    : `${Math.floor(bankMin / 60)}h ${bankMin % 60}m`

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink, marginBottom: 6 }}>
        Time Bank 🏦
      </div>
      <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>
        Save time for later or use what you&apos;ve saved.
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
              <motion.div animate={companionCtrl}>
                <CoinJar fill={bankFill} />
              </motion.div>
              <div style={{
                fontSize:   14,
                fontWeight: 800,
                color:      COLORS.skyDark,
                textAlign:  'center',
              }}>
                You have {bankLabel} saved
              </div>
            </div>
          </div>

          {/* Companion reaction */}
          {reaction && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign:    'center',
                marginBottom: 20,
                fontWeight:   800,
                fontSize:     16,
                color:        COLORS.lavenderDark,
              }}
            >
              {reaction}
            </motion.div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380, margin: '0 auto' }}>
            <button
              onClick={handleSave}
              style={{
                padding:      '16px',
                borderRadius: 16,
                border:       'none',
                background:   COLORS.lavender,
                color:        COLORS.lavenderDark,
                fontWeight:   800,
                fontSize:     15,
                cursor:       'pointer',
              }}
            >
              💜 Save 15 minutes for later
            </button>

            <button
              onClick={handleUseAll}
              disabled={bankMs === 0}
              style={{
                padding:      '16px',
                borderRadius: 16,
                border:       'none',
                background:   bankMs === 0 ? '#EDF2F7' : COLORS.peach,
                color:        bankMs === 0 ? COLORS.muted : COLORS.peachDark,
                fontWeight:   800,
                fontSize:     15,
                cursor:       bankMs === 0 ? 'default' : 'pointer',
              }}
            >
              🍑 Use all today ({bankLabel})
            </button>
          </div>

          {/* Info note */}
          <div style={{
            marginTop:    28,
            background:   COLORS.sky,
            borderRadius: 12,
            padding:      '12px 16px',
            fontSize:     13,
            color:        COLORS.skyDark,
            maxWidth:     380,
            margin:       '28px auto 0',
          }}>
            💡 Your saved time carries over through the week, up to{' '}
            <strong>{Math.round(ceilingMs / 3_600_000)} hours</strong>.
          </div>
        </>
      )}
    </div>
  )
}
