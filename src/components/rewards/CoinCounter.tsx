'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useCoinStore } from '@/store/coinStore'
import { COLORS }       from '@/config/tokens'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { fontSize: 14, padding: '4px 10px', iconSize: 16 },
  md: { fontSize: 18, padding: '6px 14px', iconSize: 20 },
  lg: { fontSize: 24, padding: '8px 18px', iconSize: 26 },
}

export function CoinCounter({ size = 'md' }: Props) {
  const balance  = useCoinStore((s) => s.balance)
  const controls = useAnimationControls()
  const prevRef  = useRef(balance)
  const { fontSize, padding, iconSize } = SIZE_MAP[size]

  useEffect(() => {
    if (balance === prevRef.current) return
    const increased = balance > prevRef.current
    prevRef.current = balance
    controls.start({
      scale:   increased ? [1, 1.35, 0.9, 1.1, 1] : [1, 0.85, 1.05, 1],
      y:       increased ? [0, -6, 0] : [0, 3, 0],
      transition: { duration: 0.45 },
    })
  }, [balance, controls])

  return (
    <motion.div
      animate={controls}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            6,
        background:     COLORS.lemon,
        borderRadius:   40,
        padding,
        fontWeight:     800,
        fontSize,
        color:          COLORS.lemonDark,
        userSelect:     'none',
        whiteSpace:     'nowrap',
      }}
    >
      <span style={{ fontSize: iconSize, lineHeight: 1 }}>🪙</span>
      {balance}
    </motion.div>
  )
}
