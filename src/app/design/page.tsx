'use client'

import { useState } from 'react'
import { AgeThemeProvider } from '@/components/ui/AgeThemeProvider'
import { useProfileStore } from '@/store/profileStore'
import HaloLogo from '@/components/ui/HaloLogo'
import { Button }      from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge }       from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PinInput }    from '@/components/ui/PinInput'
import { Avatar }      from '@/components/ui/Avatar'
import { COLORS, AGE_THEME } from '@/config/tokens'

type AgeGroup = keyof typeof AGE_THEME

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        marginBottom: 20,
        paddingBottom: 8,
        borderBottom: `1px solid ${COLORS.lavender}`,
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      {children}
    </div>
  )
}

function DesignContent() {
  const { ageGroup, setAgeGroup } = useProfileStore()
  const [progress, setProgress] = useState(62)
  const [loadingBtn, setLoadingBtn] = useState(false)

  const demoLoading = () => {
    setLoadingBtn(true)
    setTimeout(() => setLoadingBtn(false), 2000)
  }

  const AGE_GROUPS: AgeGroup[] = ['infant', 'preschool', 'schoolage', 'parent']

  return (
    <div style={{
      maxWidth: 860,
      margin: '0 auto',
      padding: '48px 24px',
      fontFamily: "'Nunito', Arial, sans-serif",
      color: COLORS.ink,
    }}>

      {/* Header */}
      <div style={{ marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Design System · Visual QA
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.ink, margin: 0 }}>
            Halo Component Library
          </h1>
        </div>
        {/* Age theme switcher */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AGE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setAgeGroup(g)}
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                border: `2px solid ${AGE_THEME[g].bg}`,
                backgroundColor: ageGroup === g ? AGE_THEME[g].bg : 'transparent',
                color: AGE_THEME[g].text,
                fontFamily: "'Nunito', Arial, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── HaloLogo ── */}
      <Section title="HaloLogo">
        <HaloLogo fontSize={24} />
        <HaloLogo fontSize={40} />
        <HaloLogo fontSize={56} />
        <HaloLogo fontSize={72} />
      </Section>

      {/* ── Buttons ── */}
      <Section title="Button — variants">
        <Row>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Row>
      </Section>

      <Section title="Button — sizes">
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
      </Section>

      <Section title="Button — states">
        <Row>
          <Button disabled>Disabled</Button>
          <Button loading={loadingBtn} onClick={demoLoading}>
            {loadingBtn ? 'Loading…' : 'Click to load'}
          </Button>
        </Row>
      </Section>

      {/* ── Cards ── */}
      <Section title="Card — variants">
        {(['default', 'pastel', 'elevated'] as const).map((v) => (
          <Card key={v} variant={v} style={{ width: 220 }}>
            <CardHeader>{v} card</CardHeader>
            <CardContent>
              <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>
                Card body content with some sample text to show layout.
              </p>
            </CardContent>
          </Card>
        ))}
      </Section>

      {/* ── Badges ── */}
      <Section title="Badge — variants">
        <Row>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="muted">Muted</Badge>
          <Badge variant="coin">120 coins</Badge>
          <Badge variant="streak">7-day streak</Badge>
        </Row>
      </Section>

      {/* ── ProgressBar ── */}
      <Section title="ProgressBar">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ProgressBar value={progress} label="Progress" showLabel />
          <ProgressBar value={33} label="Reading" showLabel />
          <ProgressBar value={100} label="Complete" showLabel />
          <ProgressBar value={0} label="Not started" showLabel />
          <input
            type="range" min={0} max={100} value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            style={{ cursor: 'pointer', accentColor: COLORS.lavenderDark }}
          />
        </div>
      </Section>

      {/* ── Avatars ── */}
      <Section title="Avatar — characters">
        <Row>
          {(['cat', 'dog', 'dino', 'seal'] as const).map((c) => (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Avatar character={c} size={64} animated />
              <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>{c}</span>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Avatar — locked">
        <Row>
          {(['cat', 'dog', 'dino', 'seal'] as const).map((c) => (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Avatar character={c} size={64} locked />
              <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>{c}</span>
            </div>
          ))}
        </Row>
      </Section>

      {/* ── PinInput ── */}
      <Section title="PinInput (correct PIN: 1234)">
        <div style={{ padding: 24, backgroundColor: '#fff', borderRadius: 16, border: `1px solid ${COLORS.lavender}` }}>
          <PinInput
            length={4}
            onComplete={(pin) => pin === '1234'}
          />
          <p style={{ margin: '16px 0 0', fontSize: 11, color: COLORS.muted, textAlign: 'center' }}>
            Try 1234 (correct) or any other PIN (wrong)
          </p>
        </div>
      </Section>

      {/* ── Color tokens ── */}
      <Section title="Color tokens">
        {Object.entries(COLORS).map(([name, hex]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: hex,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }} />
            <span style={{ fontSize: 9, color: COLORS.muted, fontWeight: 700, textAlign: 'center', maxWidth: 52, lineHeight: 1.3 }}>
              {name}
            </span>
          </div>
        ))}
      </Section>

    </div>
  )
}

export default function DesignPage() {
  return (
    <AgeThemeProvider>
      <DesignContent />
    </AgeThemeProvider>
  )
}
