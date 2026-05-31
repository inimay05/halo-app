'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AgeThemeProvider } from '@/components/ui/AgeThemeProvider'
import HaloLogo from '@/components/ui/HaloLogo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { COLORS } from '@/config/tokens'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/verify-pin')
    router.refresh()
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <HaloLogo fontSize={40} />
      </div>

      <Card variant="elevated" style={{ padding: 32 }}>
        <CardContent>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: COLORS.ink,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            Welcome back
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>

            {error && (
              <p style={{ fontSize: 13, color: COLORS.roseDark, margin: 0, textAlign: 'center' }}>
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 8 }}>
              Sign in
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: COLORS.muted }}>
            New here?{' '}
            <Link href="/register" style={{ color: COLORS.lavenderDark, fontWeight: 700, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1.5px solid ${COLORS.lavender}`,
  fontSize: 15,
  fontFamily: "'Nunito', Arial, sans-serif",
  color: COLORS.ink,
  backgroundColor: '#fff',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

export default function LoginPage() {
  return (
    <AgeThemeProvider>
      <LoginForm />
    </AgeThemeProvider>
  )
}
