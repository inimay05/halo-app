'use client'

import { CatSVG }  from './CatSVG'
import { DogSVG }  from './DogSVG'
import { DinoSVG } from './DinoSVG'
import { SealSVG } from './SealSVG'

export type Pose = 'idle' | 'happy' | 'sleepy' | 'excited' | 'sorry'
export type CharacterType = 'cat' | 'dog' | 'dino' | 'seal'

interface Props {
  character: CharacterType
  pose?: Pose
  size?: number
  locked?: boolean
  className?: string
}

const COMPONENTS = { cat: CatSVG, dog: DogSVG, dino: DinoSVG, seal: SealSVG }

export function CompanionCharacter({
  character,
  pose = 'idle',
  size = 120,
  locked = false,
  className,
}: Props) {
  const Char = COMPONENTS[character]
  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}
    >
      <Char pose={pose} size={size} />
      {locked && (
        <div
          style={{
            position:       'absolute',
            inset:          0,
            borderRadius:   '50%',
            background:     'rgba(100,100,120,0.55)',
            backdropFilter: 'saturate(0)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       size * 0.35,
            pointerEvents:  'none',
          }}
        >
          🔒
        </div>
      )}
    </div>
  )
}
