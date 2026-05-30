'use client'

import { useState } from 'react'
import HaloLogo    from '@/components/ui/HaloLogo'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge }   from '@/components/ui/Badge'
import { COLORS }  from '@/config/tokens'

const BROWSERS = ['Chrome', 'Firefox', 'Edge'] as const
type Browser = typeof BROWSERS[number]

const STEPS: Record<Browser, { step: string; detail: string }[]> = {
  Chrome: [
    { step: 'Install Tampermonkey', detail: 'Visit the Chrome Web Store and install the Tampermonkey extension.' },
    { step: 'Create a new script',  detail: 'Click the Tampermonkey icon → Dashboard → + to create a new userscript.' },
    { step: 'Paste the script',     detail: 'Replace the default content with the snippet below, swap in your Child ID, then save (Ctrl+S).' },
    { step: 'Enable on child pages',detail: 'Navigate to any page your child uses. Tampermonkey will auto-inject the widget.' },
  ],
  Firefox: [
    { step: 'Install Tampermonkey', detail: 'Visit addons.mozilla.org and install Tampermonkey for Firefox.' },
    { step: 'Create a new script',  detail: 'Click the Tampermonkey icon → Dashboard → + to create a new userscript.' },
    { step: 'Paste the script',     detail: 'Replace the default content with the snippet below, swap in your Child ID, then save (Ctrl+S).' },
    { step: 'Enable on child pages',detail: 'Navigate to any page your child uses. Tampermonkey will auto-inject the widget.' },
  ],
  Edge: [
    { step: 'Install Tampermonkey', detail: 'Visit the Edge Add-ons store and install Tampermonkey.' },
    { step: 'Create a new script',  detail: 'Click the Tampermonkey icon → Dashboard → + to create a new userscript.' },
    { step: 'Paste the script',     detail: 'Replace the default content with the snippet below, swap in your Child ID, then save (Ctrl+S).' },
    { step: 'Enable on child pages',detail: 'Navigate to any page your child uses. Tampermonkey will auto-inject the widget.' },
  ],
}

const appUrl = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://your-halo-app.vercel.app'

function SnippetBox({ childId }: { childId: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = `// ==UserScript==
// @name         Halo Widget
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function() {
  var s = document.createElement('script');
  s.src = '${appUrl}/halo-widget.js';
  s.setAttribute('data-child-id', '${childId}');
  document.head.appendChild(s);
})();`

  const copy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        background:   COLORS.ink,
        color:        '#E8E0F7',
        borderRadius: 12,
        padding:      '20px 24px',
        fontSize:     12,
        lineHeight:   1.7,
        overflowX:    'auto',
        margin:       0,
        fontFamily:   "'Courier New', monospace",
      }}>
        {snippet}
      </pre>
      <button
        onClick={copy}
        style={{
          position:        'absolute',
          top:             12,
          right:           12,
          padding:         '6px 14px',
          borderRadius:    8,
          border:          'none',
          background:      copied ? COLORS.sageDark : COLORS.lavenderDark,
          color:           '#fff',
          fontFamily:      "'Nunito', Arial, sans-serif",
          fontWeight:      700,
          fontSize:        12,
          cursor:          'pointer',
          transition:      'background 0.2s',
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function InstallPage() {
  const [browser, setBrowser] = useState<Browser>('Chrome')
  const [childId, setChildId] = useState('YOUR_CHILD_ID')

  return (
    <main style={{
      minHeight:   '100dvh',
      background:  '#FAFAF2',
      padding:     '48px 24px',
      fontFamily:  "'Nunito', Arial, sans-serif",
      color:       COLORS.ink,
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <HaloLogo fontSize={28} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Widget Install Guide</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.muted }}>
              Add the Halo companion to any browser in 4 steps
            </p>
          </div>
        </div>

        {/* Child ID input */}
        <Card variant="pastel" style={{ marginBottom: 32 }}>
          <CardContent>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Your Child&apos;s ID <Badge variant="info">from dashboard</Badge>
            </label>
            <input
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              style={{
                width:        '100%',
                padding:      '10px 14px',
                borderRadius: 10,
                border:       `1.5px solid ${COLORS.lavender}`,
                fontSize:     14,
                fontFamily:   "'Nunito', Arial, sans-serif",
                color:        COLORS.ink,
                boxSizing:    'border-box',
                outline:      'none',
              }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </CardContent>
        </Card>

        {/* Browser tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {BROWSERS.map((b) => (
            <button
              key={b}
              onClick={() => setBrowser(b)}
              style={{
                padding:     '8px 20px',
                borderRadius: 9999,
                border:       `2px solid ${browser === b ? COLORS.lavenderDark : COLORS.lavender}`,
                background:   browser === b ? COLORS.lavenderDark : 'transparent',
                color:        browser === b ? '#fff' : COLORS.muted,
                fontWeight:   700,
                fontSize:     13,
                cursor:       'pointer',
                fontFamily:   "'Nunito', Arial, sans-serif",
                transition:   'all 0.15s',
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {STEPS[browser].map((s, i) => (
            <Card key={i} variant="elevated">
              <CardContent>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width:           32,
                    height:          32,
                    borderRadius:    '50%',
                    background:      COLORS.lavender,
                    color:           COLORS.lavenderDark,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    fontWeight:      800,
                    fontSize:        14,
                    flexShrink:      0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>{s.step}</p>
                    <p style={{ color: COLORS.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{s.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Snippet */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: COLORS.ink }}>
            Userscript to paste (step 3):
          </p>
          <SnippetBox childId={childId} />
        </div>

        <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 24, lineHeight: 1.6 }}>
          The widget runs silently on every page. It shows a small companion in the bottom-right corner.
          No page content is modified. To remove it, disable the userscript in Tampermonkey.
        </p>

      </div>
    </main>
  )
}
