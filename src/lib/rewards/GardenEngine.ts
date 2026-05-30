import { createClient }    from '@/lib/supabase/client'
import { useGardenStore }  from '@/store/gardenStore'

const FLOOR   = 0.05
const CEILING = 1.0

export type PlantStage = 'seed' | 'sprout' | 'growing' | 'blooming' | 'wilting'

export class GardenEngine {
  static async water(childId: string): Promise<void> {
    await GardenEngine._update(childId, (h) => Math.min(CEILING, +(h + 0.10).toFixed(2)))
  }

  static async penalise(childId: string): Promise<void> {
    await GardenEngine._update(childId, (h) => Math.max(FLOOR, +(h - 0.15).toFixed(2)))
  }

  static async dailyDecay(childId: string): Promise<void> {
    await GardenEngine._update(childId, (h) => Math.max(FLOOR, +(h - 0.05).toFixed(2)))
  }

  static getPlantStage(health: number): PlantStage {
    if (health < 0.10) return 'wilting'
    if (health < 0.20) return 'seed'
    if (health < 0.40) return 'sprout'
    if (health < 0.70) return 'growing'
    return 'blooming'
  }

  private static async _update(
    childId: string,
    transform: (h: number) => number,
  ): Promise<void> {
    const store = useGardenStore.getState()
    const prev  = store.health
    const next  = transform(prev)

    useGardenStore.setState({ health: next })

    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update({ garden_health: next })
      .eq('id', childId)

    if (error) { useGardenStore.setState({ health: prev }); return }

    // Log for 7-day sparkline
    await supabase
      .from('garden_health_log')
      .insert({ child_id: childId, health: next })
  }
}
