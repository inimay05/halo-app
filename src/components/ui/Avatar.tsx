'use client'

import { COLORS } from '@/config/tokens'

type Character = 'cat' | 'dog' | 'dino' | 'seal'

interface AvatarProps {
  character: Character
  size?: number
  animated?: boolean
  locked?: boolean
}

const CHARACTER_EMOJI: Record<Character, string> = {
  cat:  '🐱',
  dog:  '🐶',
  dino: '🦕',
  seal: '🦭',
}

const CHARACTER_BG: Record<Character, string> = {
  cat:  COLORS.lavender,
  dog:  COLORS.peach,
  dino: COLORS.mint,
  seal: COLORS.sky,
}

export function Avatar({ character, size = 64, animated = false, locked = false }: AvatarProps) {
  const bg = locked ? '#E0E0E8' : CHARACTER_BG[character]
  const emoji = CHARACTER_EMOJI[character]

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.48,
        userSelect: 'none',
        transition: 'transform 0.2s ease',
        animation: animated && !locked ? 'halo-bounce 2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}
      aria-label={locked ? `${character} (locked)` : character}
    >
      <span style={{ filter: locked ? 'grayscale(1) opacity(0.45)' : 'none' }}>
        {emoji}
      </span>
      {locked && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.32,
            backgroundColor: 'rgba(0,0,0,0.18)',
          }}
          aria-hidden="true"
        >
          🔒
        </span>
      )}
    </div>
  )
}
