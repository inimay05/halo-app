'use client'

import { usePathname, useRouter }   from 'next/navigation'
import Link                         from 'next/link'
import { useState }                 from 'react'
import { useProfileStore }          from '@/store/profileStore'
import type { ChildProfile }        from '@/types/database'
import { COLORS }                   from '@/config/tokens'

const NAV_ITEMS = [
  { href: '/parent',           icon: '🏠', label: 'Overview'  },
  { href: '/parent/analytics', icon: '📊', label: 'Analytics' },
  { href: '/parent/alerts',    icon: '🔔', label: 'Alerts'    },
  { href: '/parent/rules',     icon: '⚙️',  label: 'Rules'     },
  { href: '/parent/garden',    icon: '🌱', label: 'Garden'    },
  { href: '/parent/profiles',  icon: '👦', label: 'Profiles'  },
]

const SIDEBAR_W = 220

interface Props {
  profiles: ChildProfile[]
  children: React.ReactNode
}

function ChildSwitcher({ profiles }: { profiles: ChildProfile[] }) {
  const { activeChildId, setActiveChild } = useProfileStore()
  const active   = profiles.find((p) => p.id === activeChildId) ?? profiles[0]
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width:        '100%',
          background:   'white',
          borderRadius: 12,
          padding:      '10px 12px',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          fontWeight:   700,
          fontSize:     14,
          color:        COLORS.ink,
          boxShadow:    '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <span>
          {active ? `${active.name}` : 'Select child'}
        </span>
        <span style={{ opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && profiles.length > 0 && (
        <div style={{
          position:     'absolute',
          top:          '110%',
          left:         0,
          right:        0,
          background:   'white',
          borderRadius: 12,
          boxShadow:    '0 4px 20px rgba(0,0,0,0.12)',
          zIndex:       100,
          overflow:     'hidden',
        }}>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveChild(p.id); setOpen(false) }}
              style={{
                width:      '100%',
                padding:    '10px 14px',
                border:     'none',
                background: p.id === activeChildId ? COLORS.sky : 'white',
                cursor:     'pointer',
                textAlign:  'left',
                fontSize:   14,
                fontWeight: p.id === activeChildId ? 700 : 400,
                color:      COLORS.ink,
              }}
            >
              {p.name} · {p.age_tier}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ParentShell({ profiles, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#F4F8FC' }}>
      {/* Sidebar */}
      <aside style={{
        width:            SIDEBAR_W,
        flexShrink:       0,
        background:       COLORS.sky,
        padding:          '24px 16px',
        display:          'flex',
        flexDirection:    'column',
        borderRight:      `1px solid rgba(26,90,138,0.10)`,
        position:         'sticky',
        top:              0,
        height:           '100dvh',
        overflowY:        'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span style={{ fontSize: 22 }}>😇</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: COLORS.skyDark }}>Halo</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginLeft: 2 }}>Parent</span>
        </div>

        {/* Child switcher */}
        <ChildSwitcher profiles={profiles} />

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== '/parent' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  padding:      '10px 12px',
                  borderRadius: 10,
                  background:   active ? 'white' : 'transparent',
                  color:        active ? COLORS.skyDark : COLORS.ink,
                  fontWeight:   active ? 700 : 500,
                  fontSize:     14,
                  textDecoration: 'none',
                  transition:   'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <button
          onClick={() => router.push('/logout')}
          style={{
            background: 'none',
            border:     'none',
            color:      COLORS.muted,
            fontSize:   13,
            cursor:     'pointer',
            padding:    '8px 0',
            textAlign:  'left',
          }}
        >
          Sign out
        </button>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
