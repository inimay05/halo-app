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

function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // If email confirmation is required, session will be null
    if (!data.session) {
      setError('Check your email and click the confirmation link, then come back to sign in.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
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
            Create your account
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
                placeholder="At least 8 characters"
                style={inputStyle}
              />
            </Field>

            <Field label="Confirm Password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              Create account
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: COLORS.muted }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: COLORS.lavenderDark, fontWeight: 700, textDecoration: 'none' }}>
              Sign in
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

export default function RegisterPage() {
  return (
    <AgeThemeProvider>
      <RegisterForm />
    </AgeThemeProvider>
  )
}
