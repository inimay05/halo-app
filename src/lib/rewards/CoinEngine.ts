import { createClient } from '@/lib/supabase/client'
import { useCoinStore }  from '@/store/coinStore'

export const COIN_REWARDS: Record<string, number> = {
  break_completed:  5,
  physical_task:    3,
  stayed_off_30min: 10,
  early_exit:       15,
  week_streak:      25,
  exercise_mission: 5,
}

export const COSMETIC_COSTS: Record<string, number> = {
  hat:            20,
  glasses:        30,
  bg_theme:       50,
  companion_skin: 75,
  unlock_dino:    200,
  unlock_seal:    350,
}

export class CoinEngine {
  static async award(childId: string, reason: string, amount: number): Promise<void> {
    const store    = useCoinStore.getState()
    const prev     = store.balance
    const next     = prev + amount

    useCoinStore.setState({ balance: next })

    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update({ coin_balance: next })
      .eq('id', childId)

    if (error) { useCoinStore.setState({ balance: prev }); return }

    await supabase
      .from('coin_transactions')
      .insert({ child_id: childId, reason, amount })
  }

  static async spend(
    childId: string,
    item: { type: string; name: string },
    cost: number,
  ): Promise<boolean> {
    if (item.type === 'screen_time') {
      throw new Error('Coins cannot be spent on screen time extensions.')
    }

    const store = useCoinStore.getState()
    const prev  = store.balance
    if (prev < cost) return false

    const next     = prev - cost
    useCoinStore.setState({ balance: next })

    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update({ coin_balance: next })
      .eq('id', childId)

    if (error) { useCoinStore.setState({ balance: prev }); return false }

    await supabase
      .from('coin_transactions')
      .insert({ child_id: childId, reason: item.name, amount: -cost })

    return true
  }
}
