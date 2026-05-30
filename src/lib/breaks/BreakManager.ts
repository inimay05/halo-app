import { useEffect, useState, useRef, useCallback } from 'react'
import { getTask }               from './PhysicalTaskLibrary'
import type { PhysicalTask }     from './PhysicalTaskLibrary'
import { createClient }          from '@/lib/supabase/client'
import { CoinEngine, COIN_REWARDS } from '@/lib/rewards/CoinEngine'
import { GardenEngine }          from '@/lib/rewards/GardenEngine'
import { BadgeEngine }           from '@/lib/rewards/BadgeEngine'
import { useEngagementStore }    from '@/store/engagementStore'
import { useProfileStore }       from '@/store/profileStore'
import { AGE_PROFILES }          from '@/config/ageProfiles'
import type { EngagementState }  from '@/lib/detection/EngagementState'
import type { AgeTier }          from '@/lib/ageProfile'

// ─── Pure class ───────────────────────────────────────────────────────────────

export class BreakManager {
  private lastBlockType: string | null = null

  constructor(
    private readonly cb: {
      onShowBreak:    (task: PhysicalTask | null) => void
      onResetSession: () => void
    }
  ) {}

  handleState(state: EngagementState, ageTier: AgeTier): void {
    if (
      (state.type === 'fullBlock' || state.type === 'sleepDetected') &&
      this.lastBlockType !== state.type
    ) {
      this.lastBlockType = state.type
      this.cb.onShowBreak(getTask(AGE_PROFILES[ageTier]))
    }
    if (state.type === 'healthy') this.lastBlockType = null
  }

  async handleBreakComplete(childId: string): Promise<void> {
    this.lastBlockType = null
    await CoinEngine.award(childId, 'break_completed', COIN_REWARDS.break_completed)
    await GardenEngine.water(childId)
    await BadgeEngine.checkAndAward(childId, 'break_completed')
    await BadgeEngine.checkAndAward(childId, 'garden_water')
    this.cb.onResetSession()
    await logEvent(childId, 'break_completed')
  }

  async handleBreakSkipped(childId: string): Promise<void> {
    this.lastBlockType = null
    await GardenEngine.penalise(childId)
    await logEvent(childId, 'break_skipped')
    await logEvent(childId, 'anticheat_break_skipped', { ts: Date.now() })
  }
}

async function logEvent(
  childId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await createClient()
    .from('session_events')
    .insert({ child_id: childId, event_type: eventType, metadata })
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useBreakManager() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const { state }   = useEngagementStore()
  const [breakVisible, setBreakVisible] = useState(false)
  const [currentTask, setCurrentTask]   = useState<PhysicalTask | null>(null)

  const managerRef     = useRef<BreakManager | null>(null)
  const activeChildRef = useRef(activeChild)

  useEffect(() => { activeChildRef.current = activeChild }, [activeChild])

  useEffect(() => {
    managerRef.current = new BreakManager({
      onShowBreak:    (task) => { setCurrentTask(task); setBreakVisible(true) },
      onResetSession: () => useEngagementStore.getState().resetSession(),
    })
  }, [])

  useEffect(() => {
    const child = activeChildRef.current
    if (!child || !managerRef.current) return
    managerRef.current.handleState(state, child.age_tier as AgeTier)
  }, [state])

  const handleBreakComplete = useCallback(async () => {
    setBreakVisible(false)
    const child = activeChildRef.current
    if (child) await managerRef.current?.handleBreakComplete(child.id)
  }, [])

  const handleBreakSkipped = useCallback(async () => {
    setBreakVisible(false)
    const child = activeChildRef.current
    if (child) await managerRef.current?.handleBreakSkipped(child.id)
  }, [])

  return { breakVisible, currentTask, handleBreakComplete, handleBreakSkipped }
}
