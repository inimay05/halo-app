'use client'

import { useState } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { COLORS }          from '@/config/tokens'

const BROWSERS = ['Chrome', 'Firefox', 'Edge'] as const
type Browser = typeof BROWSERS[number]

const STORE_LINKS: Record<Browser, string> = {
  Chrome:  'https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo',
  Firefox: 'https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/',
  Edge:    'https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd',
}

const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
}

function StepBubble({ n }: { n: number }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: COLORS.lavenderDark, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 16,
    }}>{n}</div>
  )
}

function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position: 'relative', marginTop: 10 }}>
      <pre style={{
        background: '#1e1e2e', color: '#cdd6f4',
        borderRadius: 12, padding: '18px 20px',
        fontSize: 12, lineHeight: 1.7, overflowX: 'auto',
        margin: 0, fontFamily: "'Courier New', monospace",
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>{text}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        style={{
          position: 'absolute', top: 10, right: 10,
          padding: '5px 14px', borderRadius: 8, border: 'none',
          background: copied ? COLORS.sageDark : COLORS.lavenderDark,
          color: 'white', fontWeight: 700, fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >{copied ? '✓ Copied!' : 'Copy'}</button>
    </div>
  )
}

export default function WidgetSetupPage() {
  const activeChild = useProfileStore((s) => s.activeChild())
  const [browser, setBrowser] = useState<Browser>('Chrome')

  const appUrl  = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'
  const childId = activeChild?.id ?? 'YOUR_CHILD_ID'

  const script = `// ==UserScript==
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

  return (
    <div style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
          Widget Setup 📲
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: COLORS.muted, lineHeight: 1.6 }}>
          The Halo widget sits quietly on your child&apos;s browser and shows their companion character
          on every website they visit. It tracks screen time and reminds them to take breaks —
          without interrupting what they&apos;re doing.
        </p>
      </div>

      {/* What it looks like */}
      <div style={{ ...CARD, marginBottom: 20, background: COLORS.lavender }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.lavenderDark, marginBottom: 10 }}>
          What your child will see
        </div>
        {/* Mini browser mockup */}
        <div style={{ background: '#e8e8f0', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          {/* Browser chrome */}
          <div style={{ background: '#f1f1f4', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#888' }}>
              youtube.com
            </div>
          </div>
          {/* Page content */}
          <div style={{ padding: 20, position: 'relative', minHeight: 120, background: 'white' }}>
            {/* Fake page content */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ width: 110, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ height: 62, background: '#ddd' }} />
                  <div style={{ padding: 6 }}>
                    <div style={{ height: 8, background: '#ccc', borderRadius: 3, marginBottom: 4 }} />
                    <div style={{ height: 6, background: '#e0e0e0', borderRadius: 3, width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Widget bubble */}
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              width: 52, height: 52, borderRadius: '50%',
              background: '#D6F5EC', border: '3px solid #D6F5EC',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>🐱</div>
            <div style={{
              position: 'absolute', bottom: 68, right: 8,
              background: 'white', borderRadius: 10, padding: '5px 10px',
              fontSize: 11, fontWeight: 700, color: COLORS.lavenderDark,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap',
            }}>45 min left today ⏱</div>
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: COLORS.lavenderDark, fontWeight: 600 }}>
          A small bubble appears in the bottom-right corner of every website. It grows and changes colour as screen time is used up.
        </p>
      </div>

      {/* Child ID info */}
      {activeChild ? (
        <div style={{ ...CARD, marginBottom: 20, borderLeft: `4px solid ${COLORS.sageDark}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink, marginBottom: 4 }}>
            ✅ Your child&apos;s ID has been filled in automatically
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            Setting up for: <strong style={{ color: COLORS.ink }}>{activeChild.name}</strong>
          </div>
        </div>
      ) : (
        <div style={{ ...CARD, marginBottom: 20, borderLeft: `4px solid ${COLORS.peachDark}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>
            ⚠️ No child profile selected — go to Profiles to set one up first
          </div>
        </div>
      )}

      {/* Step 1 */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBubble n={1} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>
              Install Tampermonkey on your child&apos;s browser
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
              Tampermonkey is a free, trusted browser extension (used by millions of people) that lets
              small helper scripts run alongside websites. Think of it like the glue that connects
              Halo to your child&apos;s browser.
            </p>
            {/* Browser selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {BROWSERS.map((b) => (
                <button key={b} onClick={() => setBrowser(b)} style={{
                  padding: '6px 16px', borderRadius: 20,
                  border: `2px solid ${browser === b ? COLORS.lavenderDark : COLORS.border}`,
                  background: browser === b ? COLORS.lavenderDark : 'transparent',
                  color: browser === b ? 'white' : COLORS.muted,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}>{b}</button>
              ))}
            </div>
            <a
              href={STORE_LINKS[browser]}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: COLORS.lavenderDark, color: 'white',
                padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
                fontWeight: 700, fontSize: 13,
              }}
            >
              Install Tampermonkey for {browser} →
            </a>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBubble n={2} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>
              Open the Tampermonkey dashboard
            </div>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
              After installing, you&apos;ll see the Tampermonkey icon in the top-right corner of the browser
              (it looks like a monkey face 🐵). Click it, then click <strong>Dashboard</strong>.
              On the dashboard, click the big <strong>+</strong> button to create a new script.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div style={{ ...CARD, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBubble n={3} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>
              Paste this code and save
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
              You&apos;ll see a text editor with some default code. <strong>Select all of it and delete it</strong>,
              then paste the code below. Press <strong>Ctrl+S</strong> (or Cmd+S on Mac) to save.
            </p>
            <CopyBox text={script} />
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBubble n={4} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>
              Open any website — you&apos;re done! 🎉
            </div>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, lineHeight: 1.6 }}>
              Have your child open any website (YouTube, Google, etc.). The companion character
              should appear in the bottom-right corner within a few seconds. If it doesn&apos;t appear,
              try refreshing the page once.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment note */}
      <div style={{
        background: COLORS.warmAmber, borderRadius: 14, padding: '14px 18px',
        fontSize: 13, color: COLORS.amberDark, lineHeight: 1.6,
      }}>
        <strong>⚠️ Important:</strong> The widget only works once your Halo app is deployed online
        (e.g. on Vercel). It won&apos;t work on <code>localhost</code> from a different device.
        If you haven&apos;t deployed yet, ask your developer to help with that step first.
      </div>
    </div>
  )
}
