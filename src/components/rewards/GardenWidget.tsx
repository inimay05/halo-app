'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { useGardenStore }   from '@/store/gardenStore'
import { GardenEngine }     from '@/lib/rewards/GardenEngine'
import type { PlantStage }  from '@/lib/rewards/GardenEngine'
import { createClient }     from '@/lib/supabase/client'
import { COLORS }           from '@/config/tokens'

// ─── SVG plant parts per stage ────────────────────────────────────────────────

function PlantPart({ stage }: { stage: PlantStage }) {
  switch (stage) {
    case 'seed':
      return (
        <ellipse cx={50} cy={94} rx={5} ry={3}
          fill="#8B5E3C" transform="rotate(-15 50 94)" />
      )
    case 'sprout':
      return (
        <g>
          <line x1={50} y1={97} x2={50} y2={74}
            stroke="#4A8C3F" strokeWidth={3} strokeLinecap="round" />
          <ellipse cx={40} cy={78} rx={11} ry={4.5}
            fill="#5AAE48" transform="rotate(-35 40 78)" />
        </g>
      )
    case 'growing':
      return (
        <g>
          <line x1={50} y1={97} x2={50} y2={50}
            stroke="#3A7A30" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={34} cy={72} rx={15} ry={5.5}
            fill="#5AAE48" transform="rotate(-20 34 72)" />
          <ellipse cx={66} cy={62} rx={15} ry={5.5}
            fill="#4A9E38" transform="rotate(20 66 62)" />
          <circle cx={50} cy={47} r={6} fill="#80C865" />
        </g>
      )
    case 'blooming':
      return (
        <g>
          <line x1={50} y1={97} x2={50} y2={38}
            stroke="#3A7A30" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={34} cy={74} rx={15} ry={5.5}
            fill="#5AAE48" transform="rotate(-20 34 74)" />
          <ellipse cx={66} cy={64} rx={15} ry={5.5}
            fill="#4A9E38" transform="rotate(20 66 64)" />
          <ellipse cx={36} cy={54} rx={12} ry={4.5}
            fill="#5AAE48" transform="rotate(-15 36 54)" />
          {/* Petals */}
          {([
            [50, 20], [40.5, 27], [44, 37], [56, 37], [59.5, 27],
          ] as [number, number][]).map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={7.5} fill="#FFB8C8" />
          ))}
          <circle cx={50} cy={28} r={7} fill="#FFE066" />
          <circle cx={50} cy={28} r={3} fill="#F0B000" />
        </g>
      )
    case 'wilting':
      return (
        <g>
          <path
            d="M 50,97 Q 64,80 56,64 Q 48,50 60,40"
            fill="none" stroke="#8AAA5A" strokeWidth={4} strokeLinecap="round"
          />
          <ellipse cx={44} cy={82} rx={14} ry={4.5}
            fill="#B8C84A" transform="rotate(40 44 82)" />
          <ellipse cx={57} cy={68} rx={12} ry={4}
            fill="#A0B43A" transform="rotate(-25 57 68)" />
        </g>
      )
  }
}

function PotGroup() {
  return (
    <g>
      {/* Pot body */}
      <path d="M 24,98 L 76,98 L 70,124 L 30,124 Z" fill="#C06030" />
      {/* Rim highlight */}
      <ellipse cx={50} cy={98} rx={27} ry={6} fill="#D0702A" />
      <ellipse cx={50} cy={98} rx={27} ry={6}
        fill="none" stroke="#A04818" strokeWidth={1.5} />
      {/* Soil */}
      <ellipse cx={50} cy={97} rx={24} ry={5} fill="#4A2E14" />
    </g>
  )
}

// ─── 7-day health sparkline tooltip ──────────────────────────────────────────

function HealthTooltip({ health, history }: { health: number; history: number[] }) {
  const pct = Math.round(health * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6 }}
      style={{
        position:     'absolute',
        bottom:       '105%',
        left:         '50%',
        transform:    'translateX(-50%)',
        background:   'white',
        borderRadius: 14,
        padding:      '10px 14px',
        boxShadow:    '0 4px 20px rgba(0,0,0,0.14)',
        minWidth:     160,
        zIndex:       100,
      }}
    >
      <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13, color: COLORS.ink, textAlign: 'center' }}>
        Garden health: {pct}%
      </p>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 32 }}>
        {history.length === 0
          ? <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>No history yet</p>
          : history.map((h, i) => (
              <div
                key={i}
                title={`${Math.round(h * 100)}%`}
                style={{
                  flex:         1,
                  height:       `${Math.max(4, h * 32)}px`,
                  borderRadius: 3,
                  background:   h >= 0.7 ? COLORS.mintDark
                    : h >= 0.4 ? COLORS.lemonDark
                    : COLORS.peachDark,
                }}
              />
            ))}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 10, color: COLORS.muted, textAlign: 'center' }}>
        Last {history.length} readings
      </p>
    </motion.div>
  )
}

// ─── Water droplets ────────────────────────────────────────────────────────────

function WaterDroplets() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.ellipse
          key={i}
          cx={42 + i * 8} cy={30}
          rx={2.5} ry={3.5}
          fill="#5BBFE0"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 62, opacity: [1, 1, 0] }}
          transition={{ delay: i * 0.18, duration: 0.75, ease: 'easeIn' }}
        />
      ))}
    </>
  )
}

// ─── Main widget ───────────────────────────────────────────────────────────────

interface Props {
  childId:  string
  size?:    number
}

export function GardenWidget({ childId, size = 140 }: Props) {
  const health       = useGardenStore((s) => s.health)
  const [isWatering, setIsWatering]   = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [history, setHistory]         = useState<number[]>([])
  const prevHealthRef = useRef(health)
  const swayControls  = useAnimationControls()

  const stage = GardenEngine.getPlantStage(health)

  // Start ambient sway
  useEffect(() => {
    swayControls.start({
      rotate: [-1.5, 1.5, -1.5],
      transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detect health changes for animations
  useEffect(() => {
    if (health === prevHealthRef.current) return
    if (health > prevHealthRef.current) {
      setIsWatering(true)
      setTimeout(() => setIsWatering(false), 1_400)
    } else {
      // Wilt shake then resume sway
      swayControls.start({
        rotate: [-5, 8, -3, 5, 0],
        transition: { duration: 0.55 },
      }).then(() => {
        swayControls.start({
          rotate: [-1.5, 1.5, -1.5],
          transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
        })
      })
    }
    prevHealthRef.current = health
  }, [health, swayControls])

  const handleClick = useCallback(async () => {
    setTooltipOpen((v) => !v)
    if (!tooltipOpen) {
      const { data } = await createClient()
        .from('garden_health_log')
        .select('health')
        .eq('child_id', childId)
        .order('logged_at', { ascending: false })
        .limit(7)
      setHistory(((data ?? []).map((d) => d.health) as number[]).reverse())
    }
  }, [tooltipOpen, childId])

  const svgW = 100
  const svgH = 130

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onClick={handleClick}
    >
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={size} height={Math.round(size * svgH / svgW)}>
        {/* Water droplets (behind plant) */}
        <AnimatePresence>
          {isWatering && <WaterDroplets key="drops" />}
        </AnimatePresence>

        {/* Animated plant */}
        <motion.g
          animate={swayControls}
          style={{ transformOrigin: '50px 97px' }}
        >
          <PlantPart stage={stage} />
        </motion.g>

        {/* Static pot — drawn on top so it clips the stem base */}
        <PotGroup />
      </svg>

      <AnimatePresence>
        {tooltipOpen && (
          <HealthTooltip key="tip" health={health} history={history} />
        )}
      </AnimatePresence>
    </div>
  )
}
