import type { DetectionState } from './DetectionBridge'

// Token colours inlined — widget is a standalone bundle
const C = {
  mint:      '#D6F5EC',
  peach:     '#FCE8D8',
  warmAmber: '#FEF3C7',
}

const EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', dino: '🦕', seal: '🦭',
}

const FLOAT_ID = '__halo_companion__'
const SIZE_BASE = 64
const SIZE_MAX  = 80

export class WidgetCompanion {
  private el: HTMLDivElement | null = null
  private limitMs = 45 * 60 * 1000  // updated by sync

  mount(): void {
    if (document.getElementById(FLOAT_ID)) return
    const el = document.createElement('div')
    el.id = FLOAT_ID
    Object.assign(el.style, {
      position:        'fixed',
      bottom:          '16px',
      right:           '16px',
      width:           `${SIZE_BASE}px`,
      height:          `${SIZE_BASE}px`,
      borderRadius:    '50%',
      zIndex:          '2147483647',
      backgroundColor: C.mint,
      border:          `3px solid ${C.mint}`,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontSize:        '32px',
      cursor:          'default',
      userSelect:      'none',
      transition:      'transform 0.6s ease, border-color 0.6s ease, background-color 0.6s ease, opacity 0.3s ease',
      boxShadow:       '0 4px 20px rgba(0,0,0,0.14)',
      transformOrigin: 'center',
    } as CSSStyleDeclaration)
    el.textContent = EMOJI.cat
    document.body.appendChild(el)
    this.el = el
  }

  setCompanion(type: string): void {
    if (this.el) this.el.textContent = EMOJI[type] ?? EMOJI.cat
  }

  setLimitMs(ms: number): void {
    this.limitMs = ms
  }

  updateFromState(state: DetectionState): void {
    if (!this.el) return
    const blocked = state.type === 'fullBlock' || state.type === 'sleepDetected'
    this.el.style.opacity = blocked ? '0' : '1'
    if (!blocked) this.updateTide(state.sessionMs / this.limitMs)
  }

  reset(): void {
    this.updateTide(0)
    if (this.el) this.el.style.opacity = '1'
  }

  private updateTide(progress: number): void {
    if (!this.el) return
    const p = Math.max(0, Math.min(1, progress))

    // Scale: SIZE_BASE → SIZE_MAX
    const scale = SIZE_BASE / SIZE_BASE + (p * (SIZE_MAX - SIZE_BASE)) / SIZE_BASE
    this.el.style.transform = `scale(${scale.toFixed(3)})`

    // Border: mint → peach → warmAmber
    const border = p < 0.5
      ? lerpHex(C.mint, C.peach, p * 2)
      : lerpHex(C.peach, C.warmAmber, (p - 0.5) * 2)

    this.el.style.borderColor = border

    // Subtle background tint follows the same gradient at lower opacity
    this.el.style.backgroundColor = p < 0.5
      ? lerpHex(C.mint, '#FCF5F0', p * 2)
      : lerpHex('#FCF5F0', C.warmAmber, (p - 0.5) * 2)
  }
}

// ── colour helpers ────────────────────────────────────────────────────
function lerpHex(a: string, b: string, t: number): string {
  const { r: ar, g: ag, b: ab } = hexRgb(a)
  const { r: br, g: bg, b: bb } = hexRgb(b)
  return `rgb(${lerp(ar, br, t)},${lerp(ag, bg, t)},${lerp(ab, bb, t)})`
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

function hexRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 0, b: 0 }
}
