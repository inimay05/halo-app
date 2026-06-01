import type { AntiCheatEngine } from './AntiCheatEngine'

const CHANNEL_NAME = 'halo-session'
const TAB_ID       = typeof crypto !== 'undefined'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2)

interface SessionMessage {
  type:    'session_start'
  childId: string
  tabId:   string
  ts:      number
}

export class MultiTabDetector {
  private channel: BroadcastChannel | null = null

  constructor(private engine: AntiCheatEngine, private childId: string) {}

  start(): void {
    if (typeof BroadcastChannel === 'undefined') return

    this.channel = new BroadcastChannel(CHANNEL_NAME)

    // Start listening BEFORE posting so we don't miss responses,
    // but ignore messages from this same tab.
    this.channel.onmessage = (evt: MessageEvent<SessionMessage>) => {
      const { type, childId, tabId } = evt.data
      if (type === 'session_start' && childId === this.childId && tabId !== TAB_ID) {
        window.dispatchEvent(new CustomEvent('halo-multitab-conflict'))
        void this.engine.logEvent('MultiTabConflict', {
          childId,
          conflictTs: Date.now(),
        })
      }
    }

    // Small delay so we don't react to our own echo in the same tick
    setTimeout(() => {
      this.channel?.postMessage({
        type:    'session_start',
        childId: this.childId,
        tabId:   TAB_ID,
        ts:      Date.now(),
      } satisfies SessionMessage)
    }, 80)
  }

  destroy(): void {
    this.channel?.close()
    this.channel = null
  }
}
