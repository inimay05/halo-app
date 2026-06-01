import { InactivityTracker } from './InactivityTracker'
import { SessionTimer }      from './SessionTimer'
import { VideoDetector }     from './VideoDetector'
import { NightChecker }      from './NightChecker'
import type { EngagementState } from './EngagementState'
import type { AgeProfile }      from '@/config/ageProfiles'

const POLL_MS           = 5_000
const SLEEP_AUTOLOCK_MS = 10 * 60 * 1000  // 10 min of zero interaction → sleep
const TAB_SWITCH_WINDOW = 10 * 60 * 1000  // rolling window for fast-switch detection
const TAB_SWITCH_LIMIT  = 3               // switches within window before warning

export class EngagementEngine {
  private inactivity = new InactivityTracker()
  private session    = new SessionTimer()
  private video      = new VideoDetector()
  private night      = new NightChecker()

  private pollId: ReturnType<typeof setInterval> | null = null
  private state: EngagementState = { type: 'healthy', sessionMs: 0 }

  // Rolling list of timestamps when tab was hidden (tab switch proxy)
  private tabHideTimes: number[] = []

  private readonly visibilityHandler = () => {
    if (document.hidden) {
      const now = Date.now()
      this.tabHideTimes.push(now)
      // Trim to rolling window
      this.tabHideTimes = this.tabHideTimes.filter(
        (t) => now - t <= TAB_SWITCH_WINDOW
      )
    }
  }

  constructor(
    private readonly profile: AgeProfile,
    private readonly onStateChange: (s: EngagementState) => void
  ) {}

  start(): void {
    // Infants don't interact with the device themselves — the parent does.
    // Passive-stare detection is meaningless and would fire constantly.
    if (this.profile.ageTier !== 'infant') this.inactivity.start()
    this.session.start()
    this.video.start()
    document.addEventListener('visibilitychange', this.visibilityHandler)
    this.poll()
    this.pollId = setInterval(() => this.poll(), POLL_MS)
  }

  stop(): void {
    if (this.pollId) clearInterval(this.pollId)
    this.inactivity.stop()
    this.session.stop()
    this.video.stop()
    document.removeEventListener('visibilitychange', this.visibilityHandler)
  }

  getState(): EngagementState {
    return this.state
  }

  reset(): void {
    this.session.start()       // restarts the timer from zero
    this.inactivity.reset()
    this.video.reset()
    this.tabHideTimes = []
    this.state = { type: 'healthy', sessionMs: 0 }
    this.onStateChange(this.state)
  }

  private poll(): void {
    const sessionMs      = this.session.getSessionMs()
    const inactivityMs   = this.inactivity.getInactivityMs()
    const nightMultiplier = this.night.getNightMultiplier(this.profile)
    const autoplayCount  = this.video.getAutoplayCount()
    const isVideoSession = this.video.isVideoSession

    // Tighten limits at night: effectiveLimit = fullBlockMs / multiplier
    const effectiveFullBlock = this.profile.fullBlockMs / nightMultiplier
    const effectiveSoftWarn  = this.profile.softWarningMs / nightMultiplier

    let next: EngagementState

    if (this.tabHideTimes.length > TAB_SWITCH_LIMIT) {
      // Fast tab switching — likely trying to avoid detection
      next = {
        type:          'softWarning',
        reason:        'fast_tab_switch',
        timeToBlockMs: Math.max(0, effectiveFullBlock - sessionMs),
      }
    } else if (isVideoSession) {
      if (
        sessionMs > this.profile.videoChainMaxMs ||
        autoplayCount > this.profile.autoplayLimit
      ) {
        next = { type: 'fullBlock', reason: 'autoplay_trap' }
      } else if (autoplayCount >= Math.ceil(this.profile.autoplayLimit * 0.7)) {
        next = { type: 'autoplayTrap', chainCount: autoplayCount }
      } else if (nightMultiplier > 1) {
        next = { type: 'nightRisk', multiplier: nightMultiplier }
      } else {
        next = { type: 'healthy', sessionMs }
      }
    } else {
      // Interactive session
      const checkInactivity = this.profile.ageTier !== 'infant'
      if (checkInactivity && inactivityMs > SLEEP_AUTOLOCK_MS) {
        next = { type: 'sleepDetected' }
      } else if (checkInactivity && inactivityMs > this.profile.inactivityMs) {
        next = { type: 'passiveStare', inactivityMs }
      } else if (sessionMs > effectiveFullBlock) {
        next = { type: 'fullBlock', reason: 'time_limit' }
      } else if (sessionMs > effectiveSoftWarn) {
        next = {
          type:          'softWarning',
          reason:        'approaching_limit',
          timeToBlockMs: Math.max(0, effectiveFullBlock - sessionMs),
        }
      } else if (nightMultiplier > 1 && sessionMs > effectiveFullBlock * 0.5) {
        next = { type: 'nightRisk', multiplier: nightMultiplier }
      } else {
        next = { type: 'healthy', sessionMs }
      }
    }

    const prevType = this.state.type
    this.state = next

    // Always update React state; Supabase logging is deduplicated in the hook
    this.onStateChange(next)

    // Reset inactivity if we just woke from sleep so it doesn't instantly re-trigger
    if (prevType === 'sleepDetected' && next.type !== 'sleepDetected') {
      this.inactivity.reset()
    }
  }
}
