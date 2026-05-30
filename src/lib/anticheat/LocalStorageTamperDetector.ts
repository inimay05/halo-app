import type { AntiCheatEngine } from './AntiCheatEngine'

const PREFIX = 'halo_'
type StorageSetItem = (key: string, value: string) => void

export class LocalStorageTamperDetector {
  private snapshot        = new Map<string, string | null>()
  private legitimateWrites = new Set<string>()
  private interval:        ReturnType<typeof setInterval> | null = null
  private origSetItem:     StorageSetItem

  constructor(private engine: AntiCheatEngine) {
    this.origSetItem = localStorage.setItem.bind(localStorage)
  }

  start(): void {
    this.takeSnapshot()
    this.installProxy()
    this.interval = setInterval(() => this.check(), 10_000)
  }

  private takeSnapshot(): void {
    this.snapshot.clear()
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX)) {
        this.snapshot.set(k, localStorage.getItem(k))
      }
    }
  }

  private installProxy(): void {
    const orig      = this.origSetItem
    const tracked   = this.legitimateWrites
    ;(localStorage as unknown as Record<string, StorageSetItem>).setItem = (
      key: string, value: string,
    ): void => {
      tracked.add(key)
      orig(key, value)
    }
  }

  private check(): void {
    // Detect changed values on known keys
    for (const [key, expected] of Array.from(this.snapshot)) {
      const actual = localStorage.getItem(key)
      if (actual !== expected && !this.legitimateWrites.has(key)) {
        void this.engine.logEvent('LocalStorageTamper', {
          key,
          expected: expected ?? null,
          actual,
        })
      }
    }

    // Detect newly added halo_ keys that our code never wrote
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX) && !this.snapshot.has(k) && !this.legitimateWrites.has(k)) {
        void this.engine.logEvent('LocalStorageTamper', {
          key: k,
          expected: null,
          actual: localStorage.getItem(k),
        })
      }
    }

    // Reset for next cycle
    this.takeSnapshot()
    this.legitimateWrites.clear()
  }

  destroy(): void {
    if (this.interval) clearInterval(this.interval)
    ;(localStorage as unknown as Record<string, StorageSetItem>).setItem = this.origSetItem
  }
}
