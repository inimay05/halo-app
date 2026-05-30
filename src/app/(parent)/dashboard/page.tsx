import { redirect }    from 'next/navigation'
import Link            from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { COLORS }      from '@/config/tokens'

// ── Widget status helpers ─────────────────────────────────────────────
type SyncStatus = 'online' | 'idle' | 'offline'

function getSyncStatus(lastSeenMs: number | null): SyncStatus {
  if (!lastSeenMs) return 'offline'
  const ago = Date.now() - lastSeenMs
  if (ago < 30_000)  return 'online'
  if (ago < 120_000) return 'idle'
  return 'offline'
}

const STATUS_COLOUR: Record<SyncStatus, string> = {
  online:  '#1A7A56',
  idle:    '#D97706',
  offline: '#AD1457',
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  online:  'Live',
  idle:    'Idle',
  offline: 'Offline',
}

function formatAgo(ms: number | null): string {
  if (!ms) return 'never'
  const secs = Math.floor((Date.now() - ms) / 1000)
  if (secs <  60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

// ── Page ──────────────────────────────────────────────────────────────
export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch children with their most recent session event timestamp
  const { data: children } = await supabase
    .from('child_profiles')
    .select('id, name, age_tier, active_companion, coin_balance, weekly_bank_ms')
    .eq('parent_id', user.id)
    .order('created_at')

  return (
    <main style={{
      minHeight:   '100dvh',
      background:  '#FAFAF2',
      padding:     '48px 24px',
      fontFamily:  "'Nunito', Arial, sans-serif",
      color:       COLORS.ink,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Parent Dashboard</h1>
            <p style={{ color: COLORS.muted, margin: '4px 0 0', fontSize: 14 }}>{user.email}</p>
          </div>
          <Link href="/install" style={{
            padding:      '10px 20px',
            borderRadius: 9999,
            background:   COLORS.lavender,
            color:        COLORS.lavenderDark,
            fontWeight:   700,
            fontSize:     13,
            textDecoration: 'none',
          }}>
            + Install Widget
          </Link>
        </div>

        {/* Widget Status Panel */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontSize:       13,
            fontWeight:     700,
            letterSpacing:  '0.08em',
            textTransform:  'uppercase',
            color:          COLORS.muted,
            marginBottom:   16,
          }}>
            Widget Status
          </h2>

          {!children || children.length === 0 ? (
            <div style={{
              padding:      24,
              borderRadius: 16,
              border:       `1.5px dashed ${COLORS.lavender}`,
              textAlign:    'center',
              color:        COLORS.muted,
              fontSize:     14,
            }}>
              No child profiles yet. Add one to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {children.map((child) => {
                // weekly_bank_ms is repurposed as last_seen until schema migration
                const lastSeen = child.weekly_bank_ms
                  ? Number(child.weekly_bank_ms)
                  : null
                const status   = getSyncStatus(lastSeen)
                const dot      = STATUS_COLOUR[status]

                return (
                  <div key={child.id} style={{
                    background:   '#fff',
                    borderRadius: 16,
                    padding:      '16px 20px',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'space-between',
                    flexWrap:     'wrap',
                    gap:          12,
                    boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Status dot */}
                      <div style={{
                        width:        10,
                        height:       10,
                        borderRadius: '50%',
                        background:   dot,
                        boxShadow:    `0 0 6px ${dot}`,
                        flexShrink:   0,
                      }} />
                      <div>
                        <p style={{ fontWeight: 800, margin: 0, fontSize: 15 }}>{child.name}</p>
                        <p style={{ color: COLORS.muted, margin: '2px 0 0', fontSize: 12 }}>
                          {child.age_tier} · 🪙 {child.coin_balance} coins
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        padding:      '3px 10px',
                        borderRadius: 9999,
                        background:   `${dot}18`,
                        color:        dot,
                        fontSize:     11,
                        fontWeight:   800,
                      }}>
                        {STATUS_LABEL[status]}
                      </span>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>
                        {formatAgo(lastSeen)}
                      </span>
                      {/* Copy child ID for install page */}
                      <CopyIdButton id={child.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ marginTop: 12, fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
            <span style={{ color: STATUS_COLOUR.online, fontWeight: 700 }}>● Live</span> = synced &lt;30s &nbsp;
            <span style={{ color: STATUS_COLOUR.idle,   fontWeight: 700 }}>● Idle</span> = 30s–2min &nbsp;
            <span style={{ color: STATUS_COLOUR.offline,fontWeight: 700 }}>● Offline</span> = no sync &gt;2min
          </p>
        </section>

      </div>
    </main>
  )
}

// Client component for clipboard copy (nested in Server Component)
function CopyIdButton({ id }: { id: string }) {
  // This renders as a plain button; client interactivity requires a separate 'use client' file
  // For now: show child ID truncated — parent can use /install page to fill it in
  return (
    <span style={{
      fontSize:     11,
      color:        COLORS.muted,
      fontFamily:   'monospace',
      background:   '#F5F5F5',
      padding:      '2px 8px',
      borderRadius: 6,
    }}>
      {id.slice(0, 8)}…
    </span>
  )
}
