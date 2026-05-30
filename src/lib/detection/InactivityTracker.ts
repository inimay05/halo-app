const DEBOUNCE_MS = 500
const WATCHED_EVENTS = ['mousemove', 'touchstart', 'keydown', 'scroll'] as const

export class InactivityTracker {
  private lastInteractionMs = Date.now()
  private debouncing = false

  private readonly handler = () => {
    if (this.debouncing) return
    this.debouncing = true
    setTimeout(() => {
      this.lastInteractionMs = Date.now()
      this.debouncing = false
    }, DEBOUNCE_MS)
  }

  start(): void {
    WATCHED_EVENTS.forEach((e) =>
      document.addEventListener(e, this.handler, { passive: true })
    )
  }

  stop(): void {
    WATCHED_EVENTS.forEach((e) =>
      document.removeEventListener(e, this.handler)
    )
  }

  getInactivityMs(): number {
    return Date.now() - this.lastInteractionMs
  }

  reset(): void {
    this.lastInteractionMs = Date.now()
  }
}
