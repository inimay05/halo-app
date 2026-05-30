const POLL_MS = 5_000

export class VideoDetector {
  private interval: ReturnType<typeof setInterval> | null = null
  private tracked = new Set<HTMLVideoElement>()
  private _autoplayCount = 0
  private _isVideoSession = false

  private readonly onEnded = () => {
    this._autoplayCount++
  }

  start(): void {
    this.poll()
    this.interval = setInterval(() => this.poll(), POLL_MS)
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval)
    this.tracked.forEach((v) => v.removeEventListener('ended', this.onEnded))
    this.tracked.clear()
  }

  get isVideoSession(): boolean {
    return this._isVideoSession
  }

  getAutoplayCount(): number {
    return this._autoplayCount
  }

  reset(): void {
    this._autoplayCount  = 0
    this._isVideoSession = false
  }

  private poll(): void {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'))

    this._isVideoSession = videos.some(
      (v) => !v.paused && !v.ended && v.readyState > 2
    )

    // Attach ended listener to newly discovered videos
    videos.forEach((v) => {
      if (!this.tracked.has(v)) {
        v.addEventListener('ended', this.onEnded)
        this.tracked.add(v)
      }
    })

    // Prune detached nodes
    this.tracked.forEach((v) => {
      if (!document.contains(v)) {
        v.removeEventListener('ended', this.onEnded)
        this.tracked.delete(v)
      }
    })
  }
}
