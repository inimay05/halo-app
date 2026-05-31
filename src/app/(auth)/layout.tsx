import type { Metadata } from 'next'
import { COLORS } from '@/config/tokens'

export const metadata: Metadata = { title: 'Halo – Sign in' }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: `radial-gradient(ellipse at 60% 0%, ${COLORS.lavender} 0%, ${COLORS.cream} 55%)`,
      }}
    >
      {children}
    </main>
  )
}
