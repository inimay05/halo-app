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
        backgroundColor: COLORS.cream,
      }}
    >
      {children}
    </main>
  )
}
