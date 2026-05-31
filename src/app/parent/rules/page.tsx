'use client'

import { useState, useTransition } from 'react'
import { useProfileStore }          from '@/store/profileStore'
import { RulesEditor }              from '@/components/parent/RulesEditor'
import { grantTimeBankAction }      from './actions'
import { COLORS }                   from '@/config/tokens'
import type { AgeTier }             from '@/lib/ageProfile'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20, maxWidth: 660,
}

const PRESET_MINUTES = [5, 15, 30, 60]

function GrantTimeBankPanel({ childId }: { childId: string }) {
  const [minutes, setMinutes]     = useState(15)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage]     = useState<string | null>(null)

  const handleGrant = () => {
    startTransition(async () => {
      const res = await grantTimeBankAction(childId, minutes)
      setMessage(res.ok ? `✓ Granted ${minutes} minutes` : `Error: ${res.error}`)
      setTimeout(() => setMessage(null), 3_000)
    })
  }

  return (
    <div style={CARD}>
      <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
        🏦 Grant Time Bank Minutes
      </span>
      <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 16, margin: '0 0 16px' }}>
        Add bonus minutes to your child&apos;s time bank. Only parents can grant time — children cannot add it themselves.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {PRESET_MINUTES.map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: minutes === m ? COLORS.skyDark : COLORS.sky,
              color: minutes === m ? 'white' : COLORS.skyDark,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            {m} min
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <input
          type="number"
          min={1}
          max={120}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
          style={{
            width: 80, padding: '8px 12px', borderRadius: 8,
            border: `1.5px solid ${COLORS.lavender}`, fontSize: 15, fontWeight: 700,
            textAlign: 'center',
          }}
        />
        <span style={{ fontSize: 14, color: COLORS.muted }}>minutes</span>
      </div>

      <button
        onClick={handleGrant}
        disabled={isPending}
        style={{
          padding: '11px 24px', borderRadius: 10, border: 'none',
          background: COLORS.skyDark, color: 'white',
          fontWeight: 800, fontSize: 14, cursor: isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Granting…' : '+ Grant Minutes'}
      </button>

      {message && (
        <div style={{
          marginTop: 12, padding: '9px 14px', borderRadius: 8,
          background: message.startsWith('✓') ? COLORS.sage : COLORS.rose,
          color: message.startsWith('✓') ? COLORS.sageDark : COLORS.roseDark,
          fontSize: 13, fontWeight: 700,
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

export default function RulesPage() {
  const activeChild = useProfileStore((s) => s.activeChild())

  if (!activeChild) {
    return (
      <div style={{ color: COLORS.muted, marginTop: 60, textAlign: 'center' }}>
        No child profile selected.
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
        Rules for {activeChild.name}
      </h1>
      <GrantTimeBankPanel childId={activeChild.id} />
      <RulesEditor childId={activeChild.id} ageTier={activeChild.age_tier as AgeTier} />
    </div>
  )
}
