import type { AntiCheatEngine } from './AntiCheatEngine'

const CHANNEL_NAME = 'halo-session'

interface SessionMessage {
  type:    'session_start'
  childId: string
  ts:      number
}

export class MultiTabDetector {
  private channel: BroadcastChannel | null = null

  constructor(private engine: AntiCheatEngine, private childId: string) {}

  start(): void {
    if (typeof BroadcastChannel === 'undefined') return

    this.channel = new BroadcastChannel(CHANNEL_NAME)

    this.channel.onmessage = (evt: MessageEvent<SessionMessage>) => {
      const { type, childId } = evt.data
      if (type === 'session_start' && childId === this.childId) {
        // Another tab is attempting to start a session for the same child.
        // Fire a window event so the React layer can show a blocking overlay.
        window.dispatchEvent(new CustomEvent('halo-multitab-conflict'))
        void this.engine.logEvent('MultiTabConflict', {
          childId,
          conflictTs: Date.now(),
        })
      }
    }

    // Announce this tab's session so any already-open tab can detect the conflict.
    this.channel.postMessage({
      type:    'session_start',
      childId: this.childId,
      ts:      Date.now(),
    } satisfies SessionMessage)
  }

  destroy(): void {
    this.channel?.close()
    this.channel = null
  }
}
