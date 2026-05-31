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

const SIDEBAR_W = 64

const NAV = [
  { href: '/child',         icon: '🏠', label: 'Home'    },
  { href: '/child/journey', icon: '🗺️', label: 'Journey' },
  { href: '/child/shop',    icon: '🛍️', label: 'Shop'    },
  { href: '/child/bank',    icon: '🏦', label: 'Bank'    },
]

interface Props {
  profile:  ChildProfile
  children: React.ReactNode
}

function InfantScreen({ profile }: { profile: ChildProfile }) {
  return (
    <div style={{
      minHeight:      '100dvh',
      background:     COLORS.cream,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            24,
      fontFamily:     'var(--font-nunito), sans-serif',
    }}>
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CompanionCharacter character={profile.active_companion} pose="happy" size={220} />
      </motion.div>
      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.lavenderDark }}>
        Hi, {profile.name}! 👋
      </div>
      {/* Overlays still work — they mount in this tree */}
      <EngagementProvider />
      <CompanionTakeover />
    </div>
  )
}

export function ChildShell({ profile, children }: Props) {
  const pathname                    = usePathname()
  const { setActiveChild } = useProfileStore()
  const loadBalance                 = useCoinStore((s) => s.loadBalance)
  const loadBadges                  = useCallback(() => BadgeEngine.loadBadges(profile.id), [profile.id])

  const { multiTabBlocked } = useAntiCheat(profile.id)
  const { breakVisible, currentTask, handleBreakComplete, handleBreakSkipped } = useBreakManager()
  const isBlocked   = useEngagementStore((s) => s.isBlocked)
  const isSleeping  = useEngagementStore((s) => s.state.type === 'sleepDetected')

  const [showSheet,   setShowSheet]   = useState(false)
  const [showHero,    setShowHero]    = useState(false)
  const [mounted,     setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)
    setActiveChild(profile.id)
    loadBalance(profile.id)
    loadBadges()
  }, [profile.id, setActiveChild, loadBalance, loadBadges])

  const handleDoneConfirm = useCallback(async () => {
    setShowSheet(false)
    // Award early-exit coins
    await CoinEngine.award(profile.id, 'early_exit', COIN_REWARDS.early_exit)
    await BadgeEngine.checkAndAward(profile.id, 'early_exit')
    // Log event
    await createClient()
      .from('session_events')
      .insert({ child_id: profile.id, event_type: 'early_exit', metadata: { ts: Date.now() } })
    setShowHero(true)
  }, [profile.id])

  const handleHeroDone = useCallback(() => setShowHero(false), [])

  // Infant / Preschool — simpler screen
  if (profile.age_tier === 'infant' || profile.age_tier === 'preschool') {
    return <InfantScreen profile={profile} />
  }

  return (
    <div style={{
      display:    'flex',
      flexDirection: 'column',
      minHeight:  '100dvh',
      background: '#F4F0FC',
      fontFamily: 'var(--font-nunito), sans-serif',
    }}>
      {/* ── Engagement engine (singleton) ── */}
      <EngagementProvider />
      <CompanionTakeover />
      <BreakOverlay
        visible={breakVisible}
        task={currentTask}
        onBreakComplete={handleBreakComplete}
        onBreakSkipped={handleBreakSkipped}
      />
      <SleepCreep active={isSleeping} />
      <MissionCard active={!isBlocked} />

      {/* ── Multi-tab blocking overlay ── */}
      {multiTabBlocked && (
        <div style={{
          position:       'fixed',
          inset:          0,
          zIndex:         10003,
          background:     COLORS.lavender,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            16,
          textAlign:      'center',
          padding:        32,
        }}>
          <div style={{ fontSize: 56 }}>📱</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.lavenderDark }}>
            Session active in another tab
          </div>
          <div style={{ fontSize: 15, color: COLORS.lavenderDark, opacity: 0.8, maxWidth: 320 }}>
            Halo is already open somewhere else. Please close this tab and continue there.
          </div>
        </div>
      )}

      {/* ── Badge celebration overlay ── */}
      {mounted && <ChildBadgeCelebration companion={profile.active_companion} />}

      {/* ── Hero-exit overlay ── */}
      <AnimatePresence>
        {mounted && showHero && (
          <HeroExitOverlay companion={profile.active_companion} onDone={handleHeroDone} />
        )}
      </AnimatePresence>

      {/* ── "I am done" confirmation sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 9000 }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                position:     'fixed',
                bottom:       0,
                left:         0,
                right:        0,
                background:   'white',
                borderRadius: '24px 24px 0 0',
                padding:      '28px 24px 40px',
                zIndex:       9001,
                textAlign:    'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.ink, marginBottom: 8 }}>
                Are you done for now?
              </div>
              <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 28 }}>
                Great job today! You can always come back later.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowSheet(false)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                    background: '#F0F4F8', color: COLORS.ink,
                    fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  }}
                >
                  Not yet
                </button>
                <button
                  onClick={handleDoneConfirm}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14, border: 'none',
                    background: COLORS.sage, color: COLORS.sageDark,
                    fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  }}
                >
                  Yes! 🌟
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '14px 20px 14px 84px', // 84px left = sidebar + gap
        background:      COLORS.lavender,
        boxShadow:       '0 2px 8px rgba(124,92,191,0.08)',
        position:        'sticky',
        top:             0,
        zIndex:          100,
      }}>
        {/* Logo */}
        <HaloLogo fontSize={22} />

        {/* Right: "I am done" + companion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowSheet(true)}
            style={{
              padding:      '8px 18px',
              borderRadius: 20,
              border:       'none',
              background:   COLORS.sage,
              color:        COLORS.sageDark,
              fontWeight:   800,
              fontSize:     13,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
            }}
          >
            I am done 🌿
          </button>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CompanionCharacter
              character={profile.active_companion}
              pose="idle"
              size={44}
            />
          </motion.div>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width:          SIDEBAR_W,
          flexShrink:     0,
          background:     COLORS.lavender,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          paddingTop:     20,
          gap:            8,
          borderRight:    '1px solid rgba(124,92,191,0.10)',
          position:       'sticky',
          top:            '57px', // header height
          height:         'calc(100dvh - 57px)',
          overflowY:      'auto',
        }}>
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== '/child' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={label}
                style={{
                  width:          44,
                  height:         44,
                  borderRadius:   12,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       22,
                  background:     active ? 'white' : 'transparent',
                  boxShadow:      active ? '0 2px 8px rgba(124,92,191,0.14)' : 'none',
                  textDecoration: 'none',
                  transition:     'background 0.15s',
                }}
              >
                {icon}
              </Link>
            )
          })}
        </aside>

        {/* Content */}
        <main style={{
          flex:      1,
          padding:   '28px 28px',
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
