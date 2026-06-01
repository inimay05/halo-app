'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname }                       from 'next/navigation'
import Link                                  from 'next/link'
import { motion, AnimatePresence }           from 'framer-motion'
import HaloLogo                              from '@/components/ui/HaloLogo'
import { CompanionCharacter }                from '@/components/companion/CompanionCharacter'
import { EngagementProvider }               from '@/components/providers/EngagementProvider'
import { CompanionTakeover }                from '@/components/overlays/CompanionTakeover'
import { HeroExitOverlay }                  from '@/components/child/HeroExitOverlay'
import { ChildBadgeCelebration }            from '@/components/child/ChildBadgeCelebration'
import { BreakOverlay }                     from '@/components/breaks/BreakOverlay'
import { SleepCreep }                       from '@/components/overlays/SleepCreep'
import { MissionCard }                      from '@/components/breaks/MissionCard'
import { useBreakManager }                  from '@/lib/breaks/BreakManager'
import { useEngagementStore }               from '@/store/engagementStore'
import { CoinEngine, COIN_REWARDS }         from '@/lib/rewards/CoinEngine'
import { createClient }                     from '@/lib/supabase/client'
import { useProfileStore }                  from '@/store/profileStore'
import { useCoinStore }                     from '@/store/coinStore'
import { BadgeEngine }                      from '@/lib/rewards/BadgeEngine'
import { useAntiCheat }                     from '@/lib/anticheat/useAntiCheat'
import type { ChildProfile }                from '@/types/database'
import { COLORS }                           from '@/config/tokens'

const SIDEBAR_W = 180

const NAV = [
  { href: '/child',         icon: '🏠', label: 'Dashboard' },
  { href: '/child/journey', icon: '🗺️', label: 'Journey'   },
  { href: '/child/shop',    icon: '🛍️', label: 'Shop'      },
  { href: '/child/bank',    icon: '🏦', label: 'Bank'      },
]

const TIER_LABEL: Record<string, string> = {
  infant:    'Little One',
  preschool: 'Explorer',
  schoolage: 'Adventurer',
}

interface Props {
  profile:  ChildProfile
  children: React.ReactNode
}

export function ChildShell({ profile, children }: Props) {
  const pathname                    = usePathname()
  const { setActiveChild, setChildProfiles } = useProfileStore()
  const loadBalance                 = useCoinStore((s) => s.loadBalance)
  const loadBadges                  = useCallback(() => BadgeEngine.loadBadges(profile.id), [profile.id])

  const { multiTabBlocked }         = useAntiCheat(profile.id)
  const { breakVisible, currentTask, handleBreakComplete, handleBreakSkipped } = useBreakManager()
  const isBlocked   = useEngagementStore((s) => s.isBlocked)
  const isSleeping  = useEngagementStore((s) => s.state.type === 'sleepDetected')

  const [showSheet, setShowSheet] = useState(false)
  const [showHero,  setShowHero]  = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    setChildProfiles([profile])
    setActiveChild(profile.id)
    loadBalance(profile.id)
    loadBadges()
  }, [profile.id, setActiveChild, setChildProfiles, loadBalance, loadBadges])

  const handleDoneConfirm = useCallback(async () => {
    setShowSheet(false)
    await CoinEngine.award(profile.id, 'early_exit', COIN_REWARDS.early_exit)
    await BadgeEngine.checkAndAward(profile.id, 'early_exit')
    await createClient()
      .from('session_events')
      .insert({ child_id: profile.id, event_type: 'early_exit', metadata: { ts: Date.now() } })
    setShowHero(true)
  }, [profile.id])

  const handleHeroDone = useCallback(() => setShowHero(false), [])

  return (
    <div style={{
      display:       'flex',
      minHeight:     '100dvh',
      background:    COLORS.cream,
      fontFamily:    'var(--font-nunito), sans-serif',
    }}>
      {/* ── Overlays ── */}
      <EngagementProvider />
      <CompanionTakeover />
      <BreakOverlay visible={breakVisible} task={currentTask} onBreakComplete={handleBreakComplete} onBreakSkipped={handleBreakSkipped} />
      <SleepCreep active={isSleeping} />
      <MissionCard active={!isBlocked} />

      {/* ── Multi-tab overlay ── */}
      {multiTabBlocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10003, background: COLORS.lavender, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 56 }}>📱</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.lavenderDark }}>Session active in another tab</div>
          <div style={{ fontSize: 15, color: COLORS.lavenderDark, opacity: 0.8, maxWidth: 320 }}>Halo is already open somewhere else. Please close this tab and continue there.</div>
        </div>
      )}

      {mounted && <ChildBadgeCelebration companion={profile.active_companion} />}

      <AnimatePresence>
        {mounted && showHero && <HeroExitOverlay companion={profile.active_companion} onDone={handleHeroDone} />}
      </AnimatePresence>

      {/* ── "I am done" sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 9000 }} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', zIndex: 9001, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Are you done for now?</div>
              <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>Great job today! You can always come back later.</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowSheet(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: COLORS.neutral, color: COLORS.ink, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Not yet
                </button>
                <button onClick={handleDoneConfirm} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: COLORS.sage, color: COLORS.sageDark, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Yes! 🌟
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside style={{
        width:         SIDEBAR_W,
        flexShrink:    0,
        background:    COLORS.lavender,
        display:       'flex',
        flexDirection: 'column',
        padding:       '24px 14px',
        position:      'sticky',
        top:           0,
        height:        '100dvh',
        overflowY:     'auto',
        borderRight:   '1px solid rgba(124,92,191,0.10)',
      }}>
        {/* Child identity */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.lavenderDark }}>{profile.name}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>{TIER_LABEL[profile.age_tier] ?? 'Explorer'}</div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== '/child' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                padding:        '10px 12px',
                borderRadius:   10,
                background:     active ? 'white' : 'transparent',
                color:          active ? COLORS.lavenderDark : COLORS.ink,
                fontWeight:     active ? 700 : 500,
                fontSize:       13,
                textDecoration: 'none',
                transition:     'background 0.15s',
                boxShadow:      active ? '0 1px 4px rgba(124,92,191,0.12)' : 'none',
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <button onClick={() => setShowSheet(true)} style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          background: COLORS.lavenderDark, color: 'white',
          border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: 8,
        }}>
          I am done 🌿
        </button>
        <div style={{ fontSize: 11, color: COLORS.muted, textAlign: 'center' }}>Halo is watching over you</div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 24px',
          background:     COLORS.cream,
          borderBottom:   `1px solid ${COLORS.border}`,
          position:       'sticky',
          top:            0,
          zIndex:         100,
        }}>
          <HaloLogo fontSize={20} />
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            <CompanionCharacter character={profile.active_companion} pose="idle" size={40} />
          </motion.div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
