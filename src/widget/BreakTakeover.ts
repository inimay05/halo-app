import { getRandomTask } from '../lib/breaks/breakTasks'

const OVERLAY_ID  = '__halo_takeover__'
const PIN_ID      = '__halo_pin__'
const LONG_MS     = 1_500

const COMPANION_EMOJI: Record<string, string> = { cat: '🐱', dog: '🐶', dino: '🦕', seal: '🦭' }

// Spring constants from spec (stiffness 40, damping 15)
const SPRING_K    = 40
const SPRING_D    = 15

export class BreakTakeover {
  private overlay: HTMLDivElement | null = null
  private pinModal: HTMLDivElement | null = null
  private visible       = false
  private longTimer: ReturnType<typeof setTimeout> | null = null
  private pinDigits: string[] = []
  private pinError      = false
  private rafId: number | null = null

  constructor(
    private readonly childId: string,
    private readonly baseUrl: string,
    private readonly onSuccess: () => void,
    private readonly companionType: string = 'cat',
  ) {}

  // ── mount ─────────────────────────────────────────────────────────
  mount(): void {
    if (document.getElementById(OVERLAY_ID)) return
    this.buildOverlay()
    this.buildPinModal()
  }

  show(): void {
    if (this.visible) return
    this.visible = true
    if (!this.overlay) return
    const task = getRandomTask()
    const taskEl = this.overlay.querySelector<HTMLElement>('#__halo_task_text__')
    const emojiEl = this.overlay.querySelector<HTMLElement>('#__halo_task_emoji__')
    if (taskEl)  taskEl.textContent  = task.text
    if (emojiEl) emojiEl.textContent = task.emoji
    this.overlay.style.opacity        = '1'
    this.overlay.style.pointerEvents  = 'all'
    this.springCompanion()
  }

  hide(): void {
    this.visible = false
    if (this.overlay) {
      this.overlay.style.opacity       = '0'
      this.overlay.style.pointerEvents = 'none'
    }
    this.hidePinModal()
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  // ── private — overlay build ───────────────────────────────────────
  private buildOverlay(): void {
    const el = document.createElement('div')
    el.id = OVERLAY_ID
    Object.assign(el.style, {
      position:        'fixed',
      inset:           '0',
      zIndex:          '2147483646',
      backgroundColor: '#FEF3C7',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      opacity:         '0',
      pointerEvents:   'none',
      transition:      'opacity 0.5s ease',
      fontFamily:      "'Nunito', Arial, sans-serif",
      gap:             '0',
    } as CSSStyleDeclaration)

    el.innerHTML = `
      <span id="__halo_big_emoji__"
        style="font-size:80px;line-height:1;transform:scale(0);display:block;transform-origin:center">
        ${COMPANION_EMOJI[this.companionType] ?? '🐱'}
      </span>
      <h2 style="color:#C05621;font-size:26px;font-weight:800;margin:28px 0 10px 0;text-align:center">
        Time for a break!
      </h2>
      <p style="display:flex;align-items:center;gap:8px;color:#C05621;font-size:17px;
                max-width:320px;text-align:center;line-height:1.5;margin:0">
        <span id="__halo_task_emoji__">🌬️</span>
        <span id="__halo_task_text__">Take 10 slow, deep breaths</span>
      </p>
      <p style="color:#D97706;font-size:12px;margin-top:36px;opacity:0.6">
        Hold to unlock parent dashboard
      </p>
    `

    // Long-press to open PIN
    el.addEventListener('pointerdown',  () => this.startLongPress())
    el.addEventListener('pointerup',    () => this.cancelLongPress())
    el.addEventListener('pointerleave', () => this.cancelLongPress())

    document.body.appendChild(el)
    this.overlay = el
  }

  private buildPinModal(): void {
    const el = document.createElement('div')
    el.id = PIN_ID
    Object.assign(el.style, {
      position:        'fixed',
      inset:           '0',
      zIndex:          '2147483647',
      backgroundColor: 'rgba(0,0,0,0.55)',
      display:         'none',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             '24px',
      fontFamily:      "'Nunito', Arial, sans-serif",
    } as CSSStyleDeclaration)

    el.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:36px;text-align:center;min-width:280px">
        <p style="font-weight:800;font-size:18px;color:#2D2D3A;margin:0 0 24px">
          Parent PIN
        </p>
        <div id="__halo_dots__" style="display:flex;gap:16px;justify-content:center">
          ${[0,1,2,3].map((i) =>
            `<div id="__halo_dot_${i}__"
              style="width:18px;height:18px;border-radius:50%;
                     background:#E8E0F7;border:2.5px solid #E8E0F7;
                     transition:background 0.15s,border-color 0.15s">
            </div>`
          ).join('')}
        </div>
        <p id="__halo_pin_error__"
          style="color:#AD1457;font-size:13px;font-weight:600;margin:14px 0 0;opacity:0;transition:opacity 0.2s">
          Incorrect PIN
        </p>
      </div>
    `

    document.body.appendChild(el)
    this.pinModal = el

    document.addEventListener('keydown', this.handleKeydown)
  }

  // ── PIN logic ─────────────────────────────────────────────────────
  private readonly handleKeydown = (e: KeyboardEvent) => {
    if (!this.pinModal || this.pinModal.style.display === 'none') return
    if (this.pinError) return

    if (e.key === 'Backspace') {
      this.pinDigits.pop()
      this.renderDots()
      return
    }

    if (!/^\d$/.test(e.key) || this.pinDigits.length >= 4) return

    this.pinDigits.push(e.key)
    this.renderDots()

    if (this.pinDigits.length === 4) {
      this.submitPin(this.pinDigits.join(''))
    }
  }

  private renderDots(): void {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`__halo_dot_${i}__`)
      if (!dot) continue
      const filled = i < this.pinDigits.length
      dot.style.background    = filled ? '#7C5CBF' : '#E8E0F7'
      dot.style.borderColor   = filled ? '#7C5CBF' : '#E8E0F7'
    }
  }

  private async submitPin(pin: string): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/widget/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: this.childId, pin }),
      })
      const data = await res.json() as { ok: boolean }

      if (data.ok) {
        // Success: green dots then dismiss
        for (let i = 0; i < 4; i++) {
          const d = document.getElementById(`__halo_dot_${i}__`)
          if (d) { d.style.background = '#1A7A56'; d.style.borderColor = '#1A7A56' }
        }
        setTimeout(() => {
          this.hidePinModal()
          this.onSuccess()
        }, 400)
      } else {
        this.flashError()
      }
    } catch {
      this.flashError()
    }
  }

  private flashError(): void {
    this.pinError = true
    const errEl = document.getElementById('__halo_pin_error__')
    if (errEl) errEl.style.opacity = '1'
    const dots = document.getElementById('__halo_dots__')
    if (dots) {
      dots.style.animation = 'none'
      // CSS shake via transform sequence
      let phase = 0
      const shakes = [8, -8, 6, -6, 3, -3, 0]
      const shake = () => {
        if (phase >= shakes.length) {
          dots.style.transform = ''
          setTimeout(() => {
            if (errEl) errEl.style.opacity = '0'
            this.pinDigits = []
            this.renderDots()
            this.pinError = false
          }, 300)
          return
        }
        dots.style.transform = `translateX(${shakes[phase]}px)`
        phase++
        setTimeout(shake, 60)
      }
      shake()
    }
  }

  private hidePinModal(): void {
    if (this.pinModal) this.pinModal.style.display = 'none'
    this.pinDigits = []
    this.renderDots()
  }

  // ── spring animation ──────────────────────────────────────────────
  private springCompanion(): void {
    const el = document.getElementById('__halo_big_emoji__')
    if (!el) return
    let pos = 0, vel = 0
    const target = 1
    let last = performance.now()

    const tick = (now: number) => {
      const dt  = Math.min((now - last) / 1000, 0.05)
      last = now
      const force = -SPRING_K * (pos - target) - SPRING_D * vel
      vel += force * dt
      pos += vel * dt

      el.style.transform = `scale(${pos.toFixed(4)})`

      if (Math.abs(pos - target) > 0.001 || Math.abs(vel) > 0.001) {
        this.rafId = requestAnimationFrame(tick)
      } else {
        el.style.transform = 'scale(1)'
        this.rafId = null
      }
    }
    this.rafId = requestAnimationFrame(tick)
  }

  // ── long press ────────────────────────────────────────────────────
  private startLongPress(): void {
    this.longTimer = setTimeout(() => {
      if (this.pinModal) this.pinModal.style.display = 'flex'
      this.pinDigits = []
      this.renderDots()
    }, LONG_MS)
  }

  private cancelLongPress(): void {
    if (this.longTimer) { clearTimeout(this.longTimer); this.longTimer = null }
  }
}
