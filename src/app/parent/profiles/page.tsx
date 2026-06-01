'use client'

import { useState, useTransition } from 'react'
import { useProfileStore }          from '@/store/profileStore'
import { CompanionCharacter }       from '@/components/companion/CompanionCharacter'
import {
  addChildAction,
  deleteChildAction,
} from './actions'
import type { ChildProfile } from '@/types/database'
import { COLORS }            from '@/config/tokens'
import { useRouter }         from 'next/navigation'

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '20px 22px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

function ProfileCard({
  profile, isActive, onSwitch, onDelete,
}: {
  profile:  ChildProfile
  isActive: boolean
  onSwitch: () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending,    startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      await deleteChildAction(profile.id)
      setConfirming(false)
      onDelete()
    })
  }

  return (
    <div style={{
      ...CARD,
      border: isActive ? `2px solid ${COLORS.skyDark}` : '2px solid transparent',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <CompanionCharacter character={profile.active_companion} pose={isActive ? 'happy' : 'idle'} size={64} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.ink }}>{profile.name}</div>
        <div style={{ fontSize: 13, color: COLORS.muted }}>
          Age {profile.age_years} · {profile.age_tier}
          {isActive && (
            <span style={{
              marginLeft: 8, background: COLORS.sky, borderRadius: 20,
              padding: '2px 8px', fontSize: 11, fontWeight: 700, color: COLORS.skyDark,
            }}>
              Active
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
          🪙 {profile.coin_balance} coins · 🌱 {Math.round(profile.garden_health * 100)}% health
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        {!isActive && (
          <button
            onClick={onSwitch}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: COLORS.sky, color: COLORS.skyDark,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Switch
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: confirming ? COLORS.roseDark : COLORS.rose,
            color:      confirming ? 'white' : COLORS.roseDark,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {confirming ? 'Confirm delete' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

export default function ProfilesPage() {
  const { activeChildId, setActiveChild, childProfiles } = useProfileStore()
  const router = useRouter()

  const [showAdd,  setShowAdd]  = useState(false)
  const [name,     setName]     = useState('')
  const [age,      setAge]      = useState<number>(8)
  const [error,    setError]    = useState<string | null>(null)
  const [pending,  startTransition] = useTransition()

  const handleAdd = () => {
    setError(null)
    const fd = new FormData()
    fd.append('name', name)
    fd.append('age',  String(age))
    // Default companion is cat — child can change it in the shop
    fd.append('companion', 'cat')
    startTransition(async () => {
      const res = await addChildAction(fd)
      if (!res.ok) { setError(res.error ?? 'Unknown error'); return }
      setShowAdd(false)
      setName('')
      setAge(8)
      router.refresh()
    })
  }

  const canAdd = childProfiles.length < 4

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: COLORS.ink }}>Profiles</h1>
        {canAdd && (
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: COLORS.skyDark, color: 'white',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {showAdd ? '✕ Cancel' : '+ Add child'}
          </button>
        )}
      </div>

      {!canAdd && (
        <div style={{
          background: COLORS.lemon, borderRadius: 12, padding: '12px 16px',
          fontSize: 13, color: COLORS.lemonDark, fontWeight: 600, marginBottom: 20,
        }}>
          Maximum of 4 profiles reached.
        </div>
      )}

      {showAdd && (
        <div style={{ ...CARD, marginBottom: 24 }}>
          <span style={{ display: 'block', fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16 }}>
            New Child Profile
          </span>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emma"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 6 }}>
              Age: <strong style={{ color: COLORS.skyDark }}>{age}</strong>
            </label>
            <input
              type="range" min={1} max={10} value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              style={{ width: '100%', accentColor: COLORS.skyDark }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
              <span>1 (infant)</span><span>3–5 (preschool)</span><span>6–10 (schoolage)</span>
            </div>
          </div>

          <div style={{ background: COLORS.lavender, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: COLORS.lavenderDark, fontWeight: 600, marginBottom: 16 }}>
            🐱 Your child will start with a cat companion. They can unlock more in the shop!
          </div>

          {error && (
            <div style={{ background: COLORS.rose, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: COLORS.roseDark, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={pending || !name.trim()}
            style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: COLORS.skyDark, color: 'white',
              fontWeight: 800, fontSize: 15, cursor: pending ? 'wait' : 'pointer',
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            {pending ? 'Adding…' : 'Add Profile'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {childProfiles.length === 0 ? (
          <div style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            No profiles yet. Add your first child above.
          </div>
        ) : (
          childProfiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              isActive={p.id === activeChildId}
              onSwitch={() => setActiveChild(p.id)}
              onDelete={() => router.refresh()}
            />
          ))
        )}
      </div>
    </div>
  )
}
