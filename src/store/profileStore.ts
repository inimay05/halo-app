import { create } from 'zustand'
import { AGE_THEME } from '@/config/tokens'
import { createClient } from '@/lib/supabase/client'
import type { ChildProfile } from '@/types/database'

type AgeGroup = keyof typeof AGE_THEME

interface ProfileState {
  // Manual age override (design page / fallback when no active child)
  ageGroup: AgeGroup
  setAgeGroup: (group: AgeGroup) => void
  theme: (typeof AGE_THEME)[AgeGroup]

  // Child profiles
  activeChildId: string | null
  childProfiles: ChildProfile[]
  setActiveChild: (id: string | null) => void
  setChildProfiles: (profiles: ChildProfile[]) => void
  loadProfiles: (parentId: string) => Promise<void>
  activeChild: () => ChildProfile | null
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  ageGroup: 'schoolage',
  theme: AGE_THEME.schoolage,
  setAgeGroup: (group) =>
    set({ ageGroup: group, theme: AGE_THEME[group] }),

  activeChildId: null,
  childProfiles: [],

  setChildProfiles: (profiles) => {
    const { activeChildId } = get()
    // If there's no active child yet, set to first profile
    const firstId = profiles[0]?.id ?? null
    const newActiveId = activeChildId && profiles.find((p) => p.id === activeChildId)
      ? activeChildId
      : firstId
    const child = profiles.find((p) => p.id === newActiveId) ?? null
    const ageGroup = (child?.age_tier ?? get().ageGroup) as AgeGroup
    set({ childProfiles: profiles, activeChildId: newActiveId, ageGroup, theme: AGE_THEME[ageGroup] })
  },

  setActiveChild: (id) => {
    const child = get().childProfiles.find((c) => c.id === id) ?? null
    const ageGroup = (child?.age_tier ?? get().ageGroup) as AgeGroup
    set({
      activeChildId: id,
      ageGroup,
      theme: AGE_THEME[ageGroup],
    })
  },

  loadProfiles: async (parentId) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at')
    if (data) set({ childProfiles: data as ChildProfile[] })
  },

  activeChild: () => {
    const { activeChildId, childProfiles } = get()
    return childProfiles.find((c) => c.id === activeChildId) ?? null
  },
}))
