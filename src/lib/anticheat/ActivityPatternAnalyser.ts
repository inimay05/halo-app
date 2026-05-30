import type { AntiCheatEngine } from './AntiCheatEngine'

const ANALYSE_INTERVAL_MS    = 60_000  // analyse every 60 s
const UNIFORM_THRESHOLD_MS   = 10      // inter-event gap < 10ms = suspiciously uniform
const CONSECUTIVE_THRESHOLD  = 20      // flag after 20 consecutive uniform events
const MIN_EVENTS_FOR_ANALYSIS = 22

export class ActivityPatternAnalyser {
  private eventTimes: number[]  = []
  private interval: ReturnType<typeof setInterval> | null = null

  private readonly onMouseMove = () => this.eventTimes.push(Date.now())
  private readonly onKeyDown   = () => this.eventTimes.push(Date.now())

  constructor(private engine: AntiCheatEngine) {}

  start(): void {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true })
    window.addEventListener('keydown',   this.onKeyDown,   { passive: true })
    this.interval = setInterval(() => { void this.analyse() }, ANALYSE_INTERVAL_MS)
  }

  private async analyse(): Promise<void> {
    const times = this.eventTimes.splice(0)
    if (times.length < MIN_EVENTS_FOR_ANALYSIS) return

    // Compute inter-event intervals
    const intervals: number[] = []
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1])
    }

    // Find the longest run of consecutive near-zero intervals
    let maxRun = 0
    let run    = 0
    for (const iv of intervals) {
      if (iv < UNIFORM_THRESHOLD_MS) { run++; maxRun = Math.max(maxRun, run) }
      else run = 0
    }

    // Also check overall variance
    const mean     = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length

    const scripted = maxRun >= CONSECUTIVE_THRESHOLD || variance < UNIFORM_THRESHOLD_MS
    if (scripted) {
      await this.engine.logEvent('SuspiciousActivity', {
        variance: Math.round(variance),
        maxConsecutiveUniform: maxRun,
        eventCount: times.length,
      })
    }
  }

  destroy(): void {
    if (this.interval) clearInterval(this.interval)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('keydown',   this.onKeyDown)
  }
}
