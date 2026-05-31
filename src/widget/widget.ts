/**
 * Halo Widget — self-contained IIFE
 * Install: <script src="https://your-app/halo-widget.js" data-child-id="CHILD_UUID"></script>
 */
import { DetectionBridge } from './DetectionBridge'
import { WidgetCompanion }  from './WidgetCompanion'
import { BreakTakeover }    from './BreakTakeover'
import { SupabaseSync }     from './SupabaseSync'

;(function haloWidget() {
  // ── resolve script attributes ──────────────────────────────────────
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-child-id]')
  const script  = scripts[scripts.length - 1]

  const childId = script?.getAttribute('data-child-id') ?? ''
  const baseUrl = script?.src
    ? script.src.replace(/\/halo-widget\.js.*$/, '')
    : 'http://localhost:3000'

  if (!childId) {
    console.warn('[Halo] Missing data-child-id on script tag.')
    return
  }

  // ── instantiate modules ────────────────────────────────────────────
  const detection = new DetectionBridge()
  const companion = new WidgetCompanion()
  const sync      = new SupabaseSync(childId, baseUrl)

  // ── mount companion immediately ────────────────────────────────────
  companion.mount()

  // ── boot ──────────────────────────────────────────────────────────
  sync.init().then((config) => {
    if (!config) {
      console.warn('[Halo] Failed to fetch child config.')
      return
    }

    // BreakTakeover uses companion type from config to show correct emoji
    const takeover = new BreakTakeover(childId, baseUrl, () => {
      // Parent unlocked via PIN
      detection.reset()
      companion.reset()
      takeover.hide()
      sync.resetSession()
    }, config.active_companion)

    takeover.mount()

    companion.setCompanion(config.active_companion)
    companion.setLimitMs(config.limitMs)
    detection.applyRules(config.rules)
    detection.start()

    // ── main 5-second loop ─────────────────────────────────────────
    setInterval(() => {
      const state = detection.getState()

      companion.updateFromState(state)

      const isBlocked = state.type === 'fullBlock' || state.type === 'sleepDetected'
      if (isBlocked) {
        takeover.show()
      }

      // Enqueue event for batch upload
      sync.queueEvent({
        event_type: state.type,
        metadata:   state as unknown as Record<string, unknown>,
      })

      // Pull rule changes (SupabaseSync deduplicates unchanged responses)
      sync.fetchRules().then((rules) => {
        if (rules) detection.applyRules(rules)
      })
    }, 5_000)
  })
})()
