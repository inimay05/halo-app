export interface DetectionState {
  type: 'healthy' | 'softWarning' | 'passiveStare' | 'autoplayTrap' | 'nightRisk' | 'sleepDetected' | 'fullBlock'
  sessionMs: number
  inactivityMs: number
  isVideoSession: boolean
  autoplayCount: number
  nightMultiplier: number
}

export interface DetectionRules {
  fullBlockMs: number
  softWarningMs: number
  inactivityMs: number
  autoplayLimit: number
  videoChainMaxMs: number
  nightStartHour: number
  nightMultiplier: number
  ageTier: string
}

const SLEEP_AUTOLOCK_MS = 10 * 60 * 1000
const VIDEO_POLL_MS     = 5_000
const DEBOUNCE_MS       = 500

export class DetectionBridge {
  private lastInteractionMs = Date.now()
  private sessionStartMs    = Date.now()
  private accumulatedMs     = 0
  private debouncing        = false
  private autoplayCount     = 0
  private isVideoSession    = false
  private videoInterval: ReturnType<typeof setInterval> | null = null
  private tracked           = new Set<HTMLVideoElement>()

  private rules: DetectionRules = {
    fullBlockMs:     45 * 60 * 1000,
    softWarningMs:   40 * 60 * 1000,
    inactivityMs:    5  * 60 * 1000,
    autoplayLimit:   5,
    videoChainMaxMs: 30 * 60 * 1000,
    nightStartHour:  21,
    nightMultiplier: 1.5,
    ageTier:         'schoolage',
  }

  // ── event handlers ────────────────────────────────────────────────
  private readonly activityHandler = () => {
    if (this.debouncing) return
    this.debouncing = true
    setTimeout(() => {
      this.lastInteractionMs = Date.now()
      this.debouncing = false
    }, DEBOUNCE_MS)
  }

  private readonly visibilityHandler = () => {
    if (document.hidden) {
      this.accumulatedMs += Date.now() - this.sessionStartMs
    } else {
      this.sessionStartMs = Date.now()
    }
  }

  private readonly onVideoEnded = () => {
    this.autoplayCount++
  }

  // ── public API ────────────────────────────────────────────────────
  start(): void {
    document.addEventListener('mousemove',  this.activityHandler, { passive: true })
    document.addEventListener('touchstart', this.activityHandler, { passive: true })
    document.addEventListener('keydown',    this.activityHandler, { passive: true })
    document.addEventListener('visibilitychange', this.visibilityHandler)
    this.videoInterval = setInterval(() => this.pollVideos(), VIDEO_POLL_MS)
    this.pollVideos()
  }

  stop(): void {
    document.removeEventListener('mousemove',  this.activityHandler)
    document.removeEventListener('touchstart', this.activityHandler)
    document.removeEventListener('keydown',    this.activityHandler)
    document.removeEventListener('visibilitychange', this.visibilityHandler)
    if (this.videoInterval) clearInterval(this.videoInterval)
    this.tracked.forEach((v) => v.removeEventListener('ended', this.onVideoEnded))
    this.tracked.clear()
  }

  reset(): void {
    this.sessionStartMs   = Date.now()
    this.accumulatedMs    = 0
    this.lastInteractionMs = Date.now()
    this.autoplayCount    = 0
  }

  applyRules(rules: Partial<DetectionRules>): void {
    Object.assign(this.rules, rules)
  }

  getState(): DetectionState {
    const sessionMs      = this.getSessionMs()
    const inactivityMs   = this.getInactivityMs()
    const nightMultiplier = this.getNightMultiplier()
    const effectiveFull  = this.rules.fullBlockMs / nightMultiplier
    const effectiveSoft  = this.rules.softWarningMs / nightMultiplier

    let type: DetectionState['type'] = 'healthy'

    if (this.isVideoSession) {
      if (sessionMs > this.rules.videoChainMaxMs || this.autoplayCount > this.rules.autoplayLimit) {
        type = 'fullBlock'
      } else if (this.autoplayCount >= Math.ceil(this.rules.autoplayLimit * 0.7)) {
        type = 'autoplayTrap'
      } else if (nightMultiplier > 1) {
        type = 'nightRisk'
      }
    } else {
      const checkInactivity = this.rules.ageTier !== 'infant'
      if      (checkInactivity && inactivityMs > SLEEP_AUTOLOCK_MS)      type = 'sleepDetected'
      else if (checkInactivity && inactivityMs > this.rules.inactivityMs) type = 'passiveStare'
      else if (sessionMs > effectiveFull)             type = 'fullBlock'
      else if (sessionMs > effectiveSoft)             type = 'softWarning'
      else if (nightMultiplier > 1 && sessionMs > effectiveFull * 0.5) type = 'nightRisk'
    }

    return { type, sessionMs, inactivityMs, isVideoSession: this.isVideoSession, autoplayCount: this.autoplayCount, nightMultiplier }
  }

  // ── private ───────────────────────────────────────────────────────
  private getSessionMs(): number {
    return document.hidden
      ? this.accumulatedMs
      : this.accumulatedMs + (Date.now() - this.sessionStartMs)
  }

  private getInactivityMs(): number {
    return Date.now() - this.lastInteractionMs
  }

  private getNightMultiplier(): number {
    const h = new Date().getHours()
    return (h >= this.rules.nightStartHour || h < 6) ? this.rules.nightMultiplier : 1
  }

  private pollVideos(): void {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'))
    this.isVideoSession = videos.some((v) => !v.paused && !v.ended && v.readyState > 2)

    videos.forEach((v) => {
      if (!this.tracked.has(v)) {
        v.addEventListener('ended', this.onVideoEnded)
        this.tracked.add(v)
      }
    })
    this.tracked.forEach((v) => {
      if (!document.contains(v)) {
        v.removeEventListener('ended', this.onVideoEnded)
        this.tracked.delete(v)
      }
    })
  }
}
