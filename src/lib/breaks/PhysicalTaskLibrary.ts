import type { AgeProfile } from '@/config/ageProfiles'

export type TaskCategory = 'movement' | 'eye_exercise' | 'body_exercise' | 'breathing'

export interface PhysicalTask {
  instruction:     string
  minAgeYears:     number
  durationHintSec: number
  category:        TaskCategory
}

export const PHYSICAL_TASKS: PhysicalTask[] = [
  // movement (age 3+)
  { instruction: 'Clap your hands 3 times!',                  minAgeYears: 3, durationHintSec: 5,  category: 'movement'       },
  { instruction: 'Stand up and spin around once!',            minAgeYears: 3, durationHintSec: 6,  category: 'movement'       },
  { instruction: 'Jump up and down 5 times!',                 minAgeYears: 3, durationHintSec: 8,  category: 'movement'       },
  { instruction: 'Give yourself a big hug!',                  minAgeYears: 3, durationHintSec: 4,  category: 'movement'       },
  { instruction: 'Wiggle your fingers in the air!',           minAgeYears: 3, durationHintSec: 5,  category: 'movement'       },
  { instruction: 'March on the spot for 10 seconds!',         minAgeYears: 4, durationHintSec: 10, category: 'movement'       },
  { instruction: 'Do 5 star jumps!',                          minAgeYears: 5, durationHintSec: 10, category: 'movement'       },
  // eye_exercise (age 3+)
  { instruction: 'Blink slowly 5 times!',                     minAgeYears: 3, durationHintSec: 8,  category: 'eye_exercise'   },
  { instruction: 'Roll your eyes in a big circle!',           minAgeYears: 4, durationHintSec: 8,  category: 'eye_exercise'   },
  { instruction: 'Close your eyes tight… now open wide!',     minAgeYears: 3, durationHintSec: 7,  category: 'eye_exercise'   },
  { instruction: 'Look at something far away for 10 seconds!',minAgeYears: 5, durationHintSec: 10, category: 'eye_exercise'   },
  // body_exercise (age 5+)
  { instruction: 'Stretch your arms above your head!',        minAgeYears: 5, durationHintSec: 8,  category: 'body_exercise'  },
  { instruction: 'Touch your toes!',                          minAgeYears: 5, durationHintSec: 7,  category: 'body_exercise'  },
  // breathing (age 5+)
  { instruction: 'Take 3 big deep breaths!',                  minAgeYears: 5, durationHintSec: 12, category: 'breathing'      },
  { instruction: 'Breathe in… hold… breathe out!',            minAgeYears: 5, durationHintSec: 12, category: 'breathing'      },
]

const TIER_MIN_AGE: Record<string, number> = { infant: 0, preschool: 3, schoolage: 6 }
const EYE_WEIGHT = 0.30

export function getTask(profile: AgeProfile): PhysicalTask | null {
  if (profile.ageTier === 'infant') return null

  const minAge = TIER_MIN_AGE[profile.ageTier] ?? 3
  const eligible = PHYSICAL_TASKS.filter((t) => t.minAgeYears <= minAge)
  if (eligible.length === 0) return null

  const eyeTasks  = eligible.filter((t) => t.category === 'eye_exercise')
  const otherTasks = eligible.filter((t) => t.category !== 'eye_exercise')

  let pool: PhysicalTask[]
  if (eyeTasks.length > 0 && otherTasks.length > 0) {
    pool = Math.random() < EYE_WEIGHT ? eyeTasks : otherTasks
  } else {
    pool = eligible
  }

  return pool[Math.floor(Math.random() * pool.length)]
}
