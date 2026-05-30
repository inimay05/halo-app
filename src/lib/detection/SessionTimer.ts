export class SessionTimer {
  private startMs = Date.now()
  private accumulatedMs = 0

  private readonly handler = () => {
    if (document.hidden) {
      // Pause: bank elapsed time
      this.accumulatedMs += Date.now() - this.startMs
    } else {
      // Resume: reset the live-start reference
      this.startMs = Date.now()
    }
  }

  start(): void {
    this.startMs = Date.now()
    this.accumulatedMs = 0
    document.addEventListener('visibilitychange', this.handler)
  }

  stop(): void {
    document.removeEventListener('visibilitychange', this.handler)
  }

  getSessionMs(): number {
    if (document.hidden) return this.accumulatedMs
    return this.accumulatedMs + (Date.now() - this.startMs)
  }
}
