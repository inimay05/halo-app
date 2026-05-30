import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

// Health is a float 0.05–1.0. All DB writes go through GardenEngine;
// this store is the React-facing cache.
interface GardenState {
  health:     number        // 0.05–1.0
  childId:    string | null
  loadHealth: (childId: string) => Promise<void>
}

export const useGardenStore = create<GardenState>((set) => ({
  health:  1.0,
  childId: null,

  loadHealth: async (childId) => {
    const { data } = await createClient()
      .from('child_profiles')
      .select('garden_health')
      .eq('id', childId)
      .single()
    if (data) set({ health: data.garden_health ?? 1.0, childId })
  },
}))
