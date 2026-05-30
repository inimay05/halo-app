'use client'

import { CoinCounter }    from '@/components/rewards/CoinCounter'
import { CompanionShop }  from '@/components/rewards/CompanionShop'
import { useProfileStore } from '@/store/profileStore'
import { COLORS }         from '@/config/tokens'

export default function ShopPage() {
  const activeChild = useProfileStore((s) => s.activeChild())

  if (!activeChild) return null

  return (
    <div>
      {/* Header row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   24,
        flexWrap:       'wrap',
        gap:            12,
      }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.ink }}>
          Companion Shop 🛍️
        </div>
        <CoinCounter size="md" />
      </div>

      <CompanionShop childId={activeChild.id} />
    </div>
  )
}
