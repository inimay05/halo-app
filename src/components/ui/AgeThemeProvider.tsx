'use client'

import { createContext, useContext } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { AGE_THEME } from '@/config/tokens'

type AgeTheme = (typeof AGE_THEME)[keyof typeof AGE_THEME]

const AgeThemeContext = createContext<AgeTheme>(AGE_THEME.schoolage)

export function AgeThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useProfileStore((s) => s.theme)
  return (
    <AgeThemeContext.Provider value={theme}>
      {children}
    </AgeThemeContext.Provider>
  )
}

export function useAgeTheme(): AgeTheme {
  return useContext(AgeThemeContext)
}
