import type { AntiCheatEngine } from './AntiCheatEngine'

const POLL_INTERVAL_MS = 5 * 60_000   // 5 minutes
const MAX_DRIFT_MS     = 300_000       // 5 minutes

export class ServerTimeChecker {
  private interval: ReturnType<typeof setInterval> | null = null

  constructor(private engine: AntiCheatEngine) {}

  async start(): Promise<void> {
    // Initial check on session start
    await this.check()
    this.interval = setInterval(() => { void this.check() }, POLL_INTERVAL_MS)
  }

  private async check(): Promise<void> {
    try {
      const clientTime = Date.now()
      const res        = await fetch('/api/servertime')
      if (!res.ok) return
      const { ts: serverTime } = (await res.json()) as { ts: number }
      const drift = Math.abs(serverTime - clientTime)
      if (drift > MAX_DRIFT_MS) {
        await this.engine.logEvent('ClockDiscrepancy', {
          serverTime,
          clientTime,
          driftMs: drift,
        })
      }
    } catch {
      // Network offline — not a fault
    }
  }

  destroy(): void {
    if (this.interval) clearInterval(this.interval)
  }
}
