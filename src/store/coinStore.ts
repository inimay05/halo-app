import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

interface CoinState {
  balance: number
  childId: string | null
  loadBalance: (childId: string) => Promise<void>
  award: (reason: string, amount: number) => Promise<void>
  spend: (item: string, cost: number) => Promise<boolean>
}

export const useCoinStore = create<CoinState>((set, get) => ({
  balance: 0,
  childId: null,

  loadBalance: async (childId) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('child_profiles')
      .select('coin_balance')
      .eq('id', childId)
      .single()
    if (data) set({ balance: data.coin_balance, childId })
  },

  award: async (reason, amount) => {
    const { childId, balance } = get()
    if (!childId) return
    const next = balance + amount
    // Optimistic update
    set({ balance: next })
    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update({ coin_balance: next })
      .eq('id', childId)
    if (error) set({ balance }) // rollback
  },

  spend: async (item, cost) => {
    const { childId, balance } = get()
    if (!childId || balance < cost) return false
    const next = balance - cost
    set({ balance: next })
    const supabase = createClient()
    const { error } = await supabase
      .from('child_profiles')
      .update({ coin_balance: next })
      .eq('id', childId)
    if (error) {
      set({ balance }) // rollback
      return false
    }
    return true
  },
}))
