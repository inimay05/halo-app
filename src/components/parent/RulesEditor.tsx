'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion }               from 'framer-motion'
import { CompanionCharacter }   from '@/components/companion/CompanionCharacter'
import type { CharacterType }   from '@/components/companion/CompanionCharacter'
import { saveRulesAction }      from '@/app/parent/rules/actions'
import type { ParentRulesPayload } from '@/app/parent/rules/actions'
import { createClient }         from '@/lib/supabase/client'
import { AGE_PROFILES }         from '@/config/ageProfiles'
import type { AgeTier }         from '@/lib/ageProfile'
import { COLORS }               from '@/config/tokens'

// ─── Shared styles ─────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '22px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20,
}
const SECTION_TITLE: React.CSSProperties = {
  fontWeight: 800, fontSize: 15, color: COLORS.skyDark, marginBottom: 16, display: 'block',
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function RulesSlider({
  label, value, min, max, step = 1,
  format, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  format: (v: number) => string; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 14, color: COLORS.ink, fontWeight: 600 }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.skyDark }}>{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: COLORS.skyDark }}
      />
    </div>
  )
}

function Toggle({
  label, checked, onChange, sublabel,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; sublabel?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{label}</span>
        {sublabel && <p style={{ margin: '2px 0 0', fontSize: 12, color: COLORS.muted }}>{sublabel}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: checked ? COLORS.skyDark : '#CBD5E0',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block',
        }} />
      </button>
    </div>
  )
}

function ChipInput({
  label, values, onAdd, onRemove, placeholder,
}: {
  label: string; values: string[]; onAdd: (v: string) => void;
  onRemove: (v: string) => void; placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const t = input.trim()
    if (t && !values.includes(t)) { onAdd(t); setInput('') }
  }
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: COLORS.ink, marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {values.map((v) => (
          <span key={v} style={{
            background: COLORS.sky, borderRadius: 20, padding: '3px 10px',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {v}
            <button onClick={() => onRemove(v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: COLORS.skyDark, lineHeight: 1 }}>
              ×
            </button>
          </span>
        ))}
        {values.length === 0 && <span style={{ fontSize: 13, color: COLORS.muted }}>None added</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder ?? 'example.com'}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14 }}
        />
        <button onClick={add} style={{
          padding: '7px 14px', borderRadius: 8, border: 'none',
          background: COLORS.sky, color: COLORS.skyDark, fontWeight: 700, cursor: 'pointer', fontSize: 13,
        }}>
          + Add
        </button>
      </div>
    </div>
  )
}

const ms2min  = (ms: number) => Math.round(ms / 60_000)
const min2ms  = (m: number)  => m * 60_000
const fmtMin  = (ms: number) => `${ms2min(ms)} min`
const fmtHour = (ms: number) => {
  const h = ms / 3_600_000
  return h === Math.floor(h) ? `${h} hr` : `${h.toFixed(1)} hr`
}
const fmtHour24 = (h: number) => {
  if (h === 0) return '12 AM'
  if (h < 12)  return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

const COMPANIONS: CharacterType[] = ['cat', 'dog', 'dino', 'seal']

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  childId:  string
  ageTier:  AgeTier
}

export function RulesEditor({ childId, ageTier }: Props) {
  const defaults = AGE_PROFILES[ageTier]

  const [rules, setRules] = useState<ParentRulesPayload>({
    child_id:                childId,
    soft_warning_ms:         defaults.softWarningMs,
    full_block_ms:           defaults.fullBlockMs,
    inactivity_ms:           defaults.inactivityMs,
    night_start_hour:        defaults.nightStartHour,
    night_multiplier:        defaults.nightMultiplier,
    autoplay_limit:          defaults.autoplayLimit,
    allowlist:               [],
    blocklist:               [],
    weekend_soft_ms:         null,
    weekend_full_ms:         null,
    time_banking_enabled:    true,
    weekly_bank_ceiling_ms:  7_200_000,
    voice_challenge_enabled: false,
    day_overrides:           {},
  })

  const [weekendEnabled, setWeekendEnabled] = useState(false)
  const [perDayEnabled,  setPerDayEnabled]  = useState(false)
  const [companion, setCompanion]           = useState<CharacterType>('cat')
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)

  // Load existing rules
  useEffect(() => {
    const supabase = createClient()
    supabase.from('parent_rules').select('*').eq('child_id', childId).single()
      .then(({ data }) => {
        if (!data) return
        setRules({
          child_id:                childId,
          soft_warning_ms:         data.soft_warning_ms ?? defaults.softWarningMs,
          full_block_ms:           data.full_block_ms ?? defaults.fullBlockMs,
          inactivity_ms:           data.inactivity_ms ?? defaults.inactivityMs,
          night_start_hour:        data.night_start_hour ?? defaults.nightStartHour,
          night_multiplier:        data.night_multiplier ?? defaults.nightMultiplier,
          autoplay_limit:          data.autoplay_limit ?? defaults.autoplayLimit,
          allowlist:               (data.allowlist as string[]) ?? [],
          blocklist:               (data.blocklist as string[]) ?? [],
          weekend_soft_ms:         data.weekend_soft_ms,
          weekend_full_ms:         data.weekend_full_ms,
          time_banking_enabled:    data.time_banking_enabled ?? true,
          weekly_bank_ceiling_ms:  data.weekly_bank_ceiling_ms ?? 7_200_000,
          voice_challenge_enabled: data.voice_challenge_enabled ?? false,
          day_overrides:           (data.day_overrides as Record<string, number>) ?? {},
        })
        setWeekendEnabled(!!data.weekend_soft_ms)
        setPerDayEnabled(Object.keys(data.day_overrides ?? {}).length > 0)
      })
    supabase.from('child_profiles').select('active_companion').eq('id', childId).single()
      .then(({ data }) => { if (data?.active_companion) setCompanion(data.active_companion as CharacterType) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  const set = useCallback(<K extends keyof ParentRulesPayload>(key: K, val: ParentRulesPayload[K]) => {
    setRules((r) => ({ ...r, [key]: val }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload: ParentRulesPayload = {
      ...rules,
      weekend_soft_ms: weekendEnabled ? rules.weekend_soft_ms ?? rules.soft_warning_ms : null,
      weekend_full_ms: weekendEnabled ? rules.weekend_full_ms ?? rules.full_block_ms   : null,
    }
    await saveRulesAction(payload)
    // Also update companion
    await createClient().from('child_profiles').update({ active_companion: companion }).eq('id', childId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2_500)
  }

  return (
    <div style={{ maxWidth: 660 }}>
      {/* Time limits */}
      <div style={CARD}>
        <span style={SECTION_TITLE}>⏱ Time Limits</span>
        <RulesSlider label="Screen time warning" value={rules.soft_warning_ms!} min={min2ms(5)} max={min2ms(120)} step={min2ms(1)} format={fmtMin} onChange={(v) => set('soft_warning_ms', v)} />
        <RulesSlider label="Screen time limit"   value={rules.full_block_ms!}   min={min2ms(10)} max={min2ms(180)} step={min2ms(5)} format={fmtMin} onChange={(v) => set('full_block_ms', v)} />
        <RulesSlider label="Inactivity warning"  value={rules.inactivity_ms!}   min={min2ms(1)}  max={min2ms(30)}  step={min2ms(1)} format={fmtMin} onChange={(v) => set('inactivity_ms', v)} />
      </div>

      {/* Night mode */}
      <div style={CARD}>
        <span style={SECTION_TITLE}>🌙 Night Mode</span>
        <RulesSlider label="Bedtime hour" value={rules.night_start_hour!} min={18} max={23} step={1} format={fmtHour24} onChange={(v) => set('night_start_hour', v)} />
        <RulesSlider label="Night limit multiplier" value={rules.night_multiplier!} min={1.0} max={3.0} step={0.1} format={(v) => `×${v.toFixed(1)}`} onChange={(v) => set('night_multiplier', v)} />
        <RulesSlider label="Autoplay limit" value={rules.autoplay_limit!} min={1} max={10} step={1} format={(v) => `${v} video${v === 1 ? '' : 's'}`} onChange={(v) => set('autoplay_limit', v)} />
      </div>

      {/* App lists */}
      <div style={CARD}>
        <span style={SECTION_TITLE}>🔒 App Controls</span>
        <ChipInput label="Allowlist (always permitted)" values={rules.allowlist} placeholder="example.com" onAdd={(v) => set('allowlist', [...rules.allowlist, v])} onRemove={(v) => set('allowlist', rules.allowlist.filter((x) => x !== v))} />
        <ChipInput label="Blocklist (always blocked)"   values={rules.blocklist} placeholder="example.com" onAdd={(v) => set('blocklist', [...rules.blocklist, v])} onRemove={(v) => set('blocklist', rules.blocklist.filter((x) => x !== v))} />
      </div>

      {/* Weekend mode */}
      <div style={CARD}>
        <Toggle label="Weekend Mode" sublabel="Separate limits for Sat & Sun" checked={weekendEnabled} onChange={setWeekendEnabled} />
        {weekendEnabled && (
          <>
            <RulesSlider label="Weekend warning"   value={rules.weekend_soft_ms ?? rules.soft_warning_ms!} min={min2ms(5)}  max={min2ms(180)} step={min2ms(5)} format={fmtMin} onChange={(v) => set('weekend_soft_ms', v)} />
            <RulesSlider label="Weekend limit"     value={rules.weekend_full_ms ?? rules.full_block_ms!}   min={min2ms(10)} max={min2ms(240)} step={min2ms(5)} format={fmtMin} onChange={(v) => set('weekend_full_ms', v)} />
          </>
        )}
      </div>

      {/* Per-day limits */}
      <div style={CARD}>
        <Toggle label="Per-day Limits" sublabel="Override the daily limit for individual days" checked={perDayEnabled} onChange={(v) => {
          setPerDayEnabled(v)
          if (!v) set('day_overrides', {})
        }} />
        {perDayEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['mon','tue','wed','thu','fri','sat','sun'] as const).map((day) => {
              const LABELS: Record<string, string> = { mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun' }
              const val = rules.day_overrides[day] ?? rules.full_block_ms!
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ width: 32, fontWeight: 700, fontSize: 13, color: COLORS.ink }}>{LABELS[day]}</span>
                  <input
                    type="range"
                    min={min2ms(10)} max={min2ms(240)} step={min2ms(5)}
                    value={val}
                    onChange={(e) => set('day_overrides', { ...rules.day_overrides, [day]: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: COLORS.skyDark }}
                  />
                  <span style={{ width: 52, fontSize: 13, fontWeight: 700, color: COLORS.skyDark, textAlign: 'right' }}>{fmtMin(val)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Time banking */}
      <div style={CARD}>
        <Toggle label="Time Banking" sublabel="Children earn banked minutes from early exits" checked={rules.time_banking_enabled} onChange={(v) => set('time_banking_enabled', v)} />
        {rules.time_banking_enabled && (
          <RulesSlider label="Weekly bank ceiling" value={rules.weekly_bank_ceiling_ms} min={3_600_000} max={36_000_000} step={3_600_000} format={fmtHour} onChange={(v) => set('weekly_bank_ceiling_ms', v)} />
        )}
      </div>

      {/* Voice challenge */}
      {ageTier === 'schoolage' && (
        <div style={CARD}>
          <Toggle label="Voice Challenge" sublabel="Child says a random word aloud to confirm break completion" checked={rules.voice_challenge_enabled} onChange={(v) => set('voice_challenge_enabled', v)} />
        </div>
      )}

      {/* Companion picker */}
      <div style={CARD}>
        <span style={SECTION_TITLE}>🐾 Companion</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {COMPANIONS.map((c) => (
            <button
              key={c}
              onClick={() => setCompanion(c)}
              style={{
                background:  companion === c ? COLORS.sky : 'transparent',
                border:      companion === c ? `2px solid ${COLORS.skyDark}` : '2px solid transparent',
                borderRadius: 16, padding: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <CompanionCharacter character={c} pose={companion === c ? 'happy' : 'idle'} size={64} />
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.skyDark, textTransform: 'capitalize' }}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: saved ? COLORS.sageDark : COLORS.skyDark,
          color: 'white', fontWeight: 800, fontSize: 16,
          cursor: saving ? 'wait' : 'pointer', transition: 'background 0.3s',
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
      </motion.button>
    </div>
  )
}
