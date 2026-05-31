import type { DetectionRules } from './DetectionBridge'

export interface ChildConfig {
  name: string
  age_tier: string
  active_companion: string
  rules: DetectionRules
  limitMs: number
}

interface PendingEvent {
  event_type: string
  metadata: Record<string, unknown>
}

const SYNC_INTERVAL_MS = 5_000
const BACKOFF_MAX_MS   = 30_000

export class SupabaseSync {
  private eventQueue: PendingEvent[]     = []
  private backoffMs                      = SYNC_INTERVAL_MS
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private lastRulesJson                  = ''
  private onRulesChange: ((rules: DetectionRules) => void) | null = null

  constructor(
    private readonly childId: string,
    private readonly baseUrl: string,
  ) {}

  setOnRulesChange(cb: (rules: DetectionRules) => void): void {
    this.onRulesChange = cb
  }

  // ── init ──────────────────────────────────────────────────────────
  async init(): Promise<ChildConfig | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/widget/sync?childId=${encodeURIComponent(this.childId)}`
      )
      if (!res.ok) return null
      const config = await res.json() as ChildConfig
      this.lastRulesJson = JSON.stringify(config.rules)
      this.startLoop()
      return config
    } catch {
      // Retry after backoff
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.init()), this.nextBackoff())
      })
    }
  }

  // ── public API ────────────────────────────────────────────────────
  queueEvent(event: PendingEvent): void {
    this.eventQueue.push(event)
  }

  resetSession(): void {
    this.queueEvent({ event_type: 'session_reset', metadata: {} })
  }

  // ── main sync loop ────────────────────────────────────────────────
  private startLoop(): void {
    this.syncInterval = setInterval(() => this.tick(), SYNC_INTERVAL_MS)
  }

  private async tick(): Promise<void> {
    await this.flushEvents()
    await this.fetchRules()
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return
    const batch = this.eventQueue.splice(0)
    try {
      const res = await fetch(`${this.baseUrl}/api/widget/events`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ childId: this.childId, events: batch }),
      })
      if (!res.ok) {
        // Put events back on failure so they aren't lost
        this.eventQueue.unshift(...batch)
        this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS)
      } else {
        this.backoffMs = SYNC_INTERVAL_MS
      }
    } catch {
      this.eventQueue.unshift(...batch)
      this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS)
    }
  }

  // fetchRules is called only by tick() — widget.ts must NOT call it separately.
  // Use setOnRulesChange() to receive rule updates instead.
  private async fetchRules(): Promise<void> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/widget/sync?childId=${encodeURIComponent(this.childId)}`
      )
      if (!res.ok) return
      const config = await res.json() as ChildConfig
      const json = JSON.stringify(config.rules)
      if (json !== this.lastRulesJson) {
        this.lastRulesJson = json
        this.onRulesChange?.(config.rules)
      }
    } catch {
      // silent — next tick will retry
    }
  }

  stop(): void {
    if (this.syncInterval) clearInterval(this.syncInterval)
  }

  private nextBackoff(): number {
    const b = this.backoffMs
    this.backoffMs = Math.min(b * 2, BACKOFF_MAX_MS)
    return b
  }
}
