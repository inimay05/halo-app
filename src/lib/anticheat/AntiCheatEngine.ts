import { createClient }               from '@/lib/supabase/client'
import { LocalStorageTamperDetector } from './LocalStorageTamperDetector'
import { ServerTimeChecker }          from './ServerTimeChecker'
import { ActivityPatternAnalyser }    from './ActivityPatternAnalyser'
import { MultiTabDetector }           from './MultiTabDetector'

export class AntiCheatEngine {
  private tamper:   LocalStorageTamperDetector
  private clock:    ServerTimeChecker
  private activity: ActivityPatternAnalyser
  private multiTab: MultiTabDetector

  constructor(private childId: string) {
    this.tamper   = new LocalStorageTamperDetector(this)
    this.clock    = new ServerTimeChecker(this)
    this.activity = new ActivityPatternAnalyser(this)
    this.multiTab = new MultiTabDetector(this, childId)
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return
    this.tamper.start()
    await this.clock.start()
    this.activity.start()
    this.multiTab.start()
  }

  async logEvent(
    type:     string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await createClient()
        .from('anticheat_events')
        .insert({ child_id: this.childId, event_type: type, metadata })
    } catch {
      // Silently swallow — never surface anti-cheat errors to the child UI
    }
  }

  destroy(): void {
    this.tamper.destroy()
    this.clock.destroy()
    this.activity.destroy()
    this.multiTab.destroy()
  }
}
