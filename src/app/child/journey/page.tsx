'use client'

import { useState }          from 'react'
// framer-motion used in future milestone animations
import { useBadgeStore }     from '@/store/badgeStore'
import type { BadgeType }    from '@/lib/rewards/BadgeEngine'
import { COLORS }            from '@/config/tokens'
import { format }            from 'date-fns'

// ─── Badge metadata ────────────────────────────────────────────────────────────

interface MilestoneMeta {
  type:        BadgeType
  name:        string
  description: string
  icon:        string
  color:       string
}

const MILESTONES: MilestoneMeta[] = [
  { type: 'first_break',      name: 'First Break!',    description: 'You took your very first screen break.',      icon: '🌟', color: COLORS.lemon    },
  { type: 'week_streak',      name: 'Week Warrior',    description: 'You took a break every day for 7 days!',      icon: '🔥', color: COLORS.peach    },
  { type: 'fifty_coins',      name: 'Coin Collector',  description: 'You saved up 50 coins!',                      icon: '🪙', color: COLORS.lemon    },
  { type: 'night_champion_7', name: 'Night Champion',  description: 'You kept healthy habits at night × 7.',       icon: '🌙', color: COLORS.sky      },
  { type: 'voice_hero',       name: 'Voice Hero',      description: 'You completed a voice challenge!',            icon: '🎤', color: COLORS.lavender },
  { type: 'garden_bloom',     name: 'Green Thumb',     description: 'Your garden grew all the way to full bloom!', icon: '🌸', color: COLORS.mint     },
]

// ─── SVG path layout ──────────────────────────────────────────────────────────

const SVG_W  = 860
const SVG_H  = 260
const NODES: Array<{ x: number; y: number }> = [
  { x:  90, y: 140 },
  { x: 220, y:  80 },
  { x: 360, y: 160 },
  { x: 490, y:  80 },
  { x: 630, y: 150 },
  { x: 760, y:  80 },
]

// Smooth cubic bezier path through nodes
function buildPath(): string {
  const pts = NODES
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cx1  = prev.x + (curr.x - prev.x) * 0.4
    const cy1  = prev.y
    const cx2  = curr.x - (curr.x - prev.x) * 0.4
    const cy2  = curr.y
    d += ` C ${cx1} ${cy1} ${cx2} ${cy2} ${curr.x} ${curr.y}`
  }
  return d
}

const PATH_D = buildPath()

// Zone backgrounds: alternating mint / cream rectangles
const ZONES = [
  { x: 0,   w: 150, color: COLORS.mint   + '55' },
  { x: 150, w: 160, color: COLORS.cream  },
  { x: 310, w: 160, color: COLORS.mint   + '55' },
  { x: 470, w: 160, color: COLORS.cream  },
  { x: 630, w: 230, color: COLORS.mint   + '55' },
]

// ─── Milestone node ────────────────────────────────────────────────────────────

function MilestoneNode({
  meta, earnedAt, cx, cy,
}: {
  meta:     MilestoneMeta
  earnedAt: string | undefined
  cx:       number
  cy:       number
}) {
  const [tip, setTip] = useState(false)
  const earned        = !!earnedAt
  const R             = 30

  return (
    <g
      style={{ cursor: earned ? 'pointer' : 'default' }}
      onClick={() => earned && setTip((v) => !v)}
    >
      {/* Outer glow for earned */}
      {earned && (
        <circle cx={cx} cy={cy} r={R + 6} fill={meta.color} fillOpacity={0.3} />
      )}
      {/* Circle */}
      <circle
        cx={cx} cy={cy} r={R}
        fill={earned ? meta.color : COLORS.neutral}
        stroke={earned ? 'white' : COLORS.neutralDark}
        strokeWidth={3}
      />
      {/* Icon */}
      <text
        x={cx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={earned ? 22 : 20}
        style={{ filter: earned ? 'none' : 'grayscale(1) opacity(0.4)' }}
      >
        {meta.icon}
      </text>
      {/* Check for earned */}
      {earned && (
        <circle cx={cx + R * 0.72} cy={cy - R * 0.72} r={9} fill={COLORS.haloGold} />
      )}

      {/* Tooltip (outside SVG via foreignObject) */}
      {tip && (
        <foreignObject x={cx - 90} y={cy - R - 110} width={180} height={105}>
          <div
            style={{
              background:   'white',
              borderRadius: 12,
              padding:      '10px 12px',
              boxShadow:    '0 4px 20px rgba(0,0,0,0.15)',
              fontSize:     12,
              color:        COLORS.ink,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 3 }}>{meta.name}</div>
            <div style={{ color: COLORS.muted, marginBottom: 4 }}>{meta.description}</div>
            {earnedAt && (
              <div style={{ color: COLORS.lavenderDark, fontWeight: 700, fontSize: 11 }}>
                {format(new Date(earnedAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const { earned } = useBadgeStore()
  const earnedMap  = Object.fromEntries(earned.map((b) => [b.badge_type, b.earned_at]))

  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink, marginBottom: 6 }}>
        Your Journey 🗺️
      </div>
      <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 24 }}>
        Collect all milestones — tap an earned one to see it.
      </div>

      {/* Horizontally scrollable map */}
      <div style={{
        overflowX:    'auto',
        overflowY:    'visible',
        borderRadius: 20,
        boxShadow:    '0 4px 20px rgba(0,0,0,0.08)',
        background:   COLORS.cream,
        paddingBottom: 8,
      }}>
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block' }}
        >
          {/* Zone backgrounds */}
          {ZONES.map((z, i) => (
            <rect key={i} x={z.x} y={0} width={z.w} height={SVG_H} fill={z.color} />
          ))}

          {/* Path */}
          <path
            d={PATH_D}
            fill="none"
            stroke={COLORS.lavender}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 10"
          />
          <path
            d={PATH_D}
            fill="none"
            stroke={COLORS.lavenderDark}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14 10"
            opacity={0.5}
          />

          {/* Milestone nodes */}
          {MILESTONES.map((meta, i) => (
            <MilestoneNode
              key={meta.type}
              meta={meta}
              earnedAt={earnedMap[meta.type]}
              cx={NODES[i].x}
              cy={NODES[i].y}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap',
        fontSize: 13, color: COLORS.muted,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS.lemon, border: `2px solid white`, display: 'inline-block' }} />
          Earned
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS.neutral, border: `2px solid ${COLORS.neutralDark}`, display: 'inline-block' }} />
          Coming soon
        </span>
      </div>

      {/* Badge list below */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink, marginBottom: 14 }}>
          All milestones
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MILESTONES.map((meta) => {
            const earnedAt = earnedMap[meta.type]
            const earned   = !!earnedAt
            return (
              <div
                key={meta.type}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          14,
                  background:   earned ? meta.color : COLORS.neutral,
                  borderRadius: 14,
                  padding:      '12px 16px',
                  opacity:      earned ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: 28 }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.ink }}>{meta.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 1 }}>{meta.description}</div>
                </div>
                {earned ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: COLORS.lavenderDark,
                    background: 'white', borderRadius: 10, padding: '3px 8px',
                  }}>
                    {format(new Date(earnedAt), 'MMM d')}
                  </span>
                ) : (
                  <span style={{ fontSize: 18, opacity: 0.3 }}>🔒</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
