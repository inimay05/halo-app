'use client'

import { useProfileStore } from '@/store/profileStore'
import { RulesEditor }     from '@/components/parent/RulesEditor'
import { COLORS }          from '@/config/tokens'
import type { AgeTier }    from '@/lib/ageProfile'

export default function RulesPage() {
  const activeChild = useProfileStore((s) => s.activeChild())

  if (!activeChild) {
    return (
      <div style={{ color: COLORS.muted, marginTop: 60, textAlign: 'center' }}>
        No child profile selected.
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
        Rules for {activeChild.name}
      </h1>
      <RulesEditor childId={activeChild.id} ageTier={activeChild.age_tier as AgeTier} />
    </div>
  )
}
