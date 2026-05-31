'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { CompanionCharacter }   from '@/components/companion/CompanionCharacter'
import type { CharacterType }   from '@/components/companion/CompanionCharacter'
import { CoinEngine, COSMETIC_COSTS } from '@/lib/rewards/CoinEngine'
import { useCoinStore }         from '@/store/coinStore'
import { useProfileStore }      from '@/store/profileStore'
import { createClient }         from '@/lib/supabase/client'
import { COLORS }               from '@/config/tokens'

// ─── Shop data ────────────────────────────────────────────────────────────────

type ItemCategory = 'accessories' | 'skins' | 'characters' | 'themes'

interface ShopItem {
  id:       string
  name:     string
  category: ItemCategory
  cost:     number
  icon:     string
  preview?: CharacterType  // character to preview when tapped
  hint?:    string
}

const ITEMS: ShopItem[] = [
  // Accessories
  { id: 'hat',            name: 'Party Hat',       category: 'accessories', cost: COSMETIC_COSTS.hat,            icon: '🎩', hint: 'A festive hat for your buddy!' },
  { id: 'glasses',        name: 'Cool Glasses',    category: 'accessories', cost: COSMETIC_COSTS.glasses,        icon: '🥽', hint: 'Looking sharp!' },
  // Skins
  { id: 'companion_skin', name: 'Rainbow Skin',    category: 'skins',       cost: COSMETIC_COSTS.companion_skin, icon: '🌈', hint: 'Give your buddy a colourful makeover.' },
  // Characters
  { id: 'unlock_dino',    name: 'Dino Buddy',      category: 'characters',  cost: COSMETIC_COSTS.unlock_dino,    icon: '🦕', preview: 'dino', hint: 'Unlock the mighty Dino companion!' },
  { id: 'unlock_seal',    name: 'Seal Buddy',      category: 'characters',  cost: COSMETIC_COSTS.unlock_seal,    icon: '🦭', preview: 'seal', hint: 'Unlock the adorable Seal companion!' },
  // Themes
  { id: 'bg_theme',       name: 'Garden Theme',    category: 'themes',      cost: COSMETIC_COSTS.bg_theme,       icon: '🌿', hint: 'A lush garden background for your screen.' },
]

const CATEGORIES: { id: ItemCategory; label: string }[] = [
  { id: 'accessories', label: 'Accessories' },
  { id: 'skins',       label: 'Skins'       },
  { id: 'characters',  label: 'Characters'  },
  { id: 'themes',      label: 'Themes'      },
]

// ─── Item card ────────────────────────────────────────────────────────────────

interface CardProps {
  item:       ShopItem
  owned:      boolean
  balance:    number
  onTap:      (item: ShopItem) => void
  onBuy:      (item: ShopItem) => void
}

function ItemCard({ item, owned, balance, onTap, onBuy }: CardProps) {
  const canAfford    = balance >= item.cost
  const shakeCtrl   = useAnimationControls()

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canAfford) {
      shakeCtrl.start({ x: [-6, 6, -6, 6, 0], transition: { duration: 0.38 } })
      return
    }
    onBuy(item)
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={() => onTap(item)}
      style={{
        background:   COLORS.cream,
        borderRadius: 18,
        padding:      '16px 14px 14px',
        cursor:       'pointer',
        textAlign:    'center',
        boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
        border:       `1.5px solid ${owned ? COLORS.mintDark : 'transparent'}`,
        position:     'relative',
      }}
    >
      {owned && (
        <span style={{
          position:     'absolute',
          top:          8,
          right:        8,
          background:   COLORS.mintDark,
          color:        'white',
          fontSize:     10,
          fontWeight:   700,
          padding:      '2px 7px',
          borderRadius: 10,
        }}>Owned</span>
      )}

      <div style={{
        fontSize:   36,
        lineHeight: 1,
        marginBottom: 8,
        filter:     !owned && (item.id === 'unlock_dino' || item.id === 'unlock_seal')
          ? 'grayscale(1) opacity(0.4)'
          : undefined,
        transition: 'filter 0.3s',
      }}>
        {item.icon}
      </div>
      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 13, color: COLORS.ink }}>
        {item.name}
      </p>

      {/* For locked characters: show progress bar */}
      {(item.id === 'unlock_dino' || item.id === 'unlock_seal') && !owned && (
        <div style={{ margin: '6px 0 8px' }}>
          <div style={{
            height:       5,
            borderRadius: 4,
            background:   '#E8E8EC',
            overflow:     'hidden',
          }}>
            <div style={{
              height:     '100%',
              width:      `${Math.min(100, (balance / item.cost) * 100)}%`,
              background: COLORS.lavenderDark,
              borderRadius: 4,
              transition: 'width 0.4s',
            }} />
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 10, color: COLORS.muted }}>
            {balance} / {item.cost} coins
          </p>
        </div>
      )}

      {!owned && (
        <motion.button
          animate={shakeCtrl}
          onClick={handleBuyClick}
          disabled={!canAfford}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          4,
            padding:      '6px 14px',
            borderRadius: 20,
            border:       'none',
            background:   canAfford ? COLORS.lemon : '#E8E8EC',
            color:        canAfford ? COLORS.lemonDark : COLORS.muted,
            fontWeight:   700,
            fontSize:     13,
            cursor:       canAfford ? 'pointer' : 'not-allowed',
          }}
        >
          🪙 {item.cost}
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({ item, character, owned }: { item: ShopItem; character: CharacterType; owned: boolean }) {
  const previewChar  = item.preview ?? character
  const isLocked     = !owned && (item.id === 'unlock_dino' || item.id === 'unlock_seal')
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            8,
        padding:        '12px 0',
      }}
    >
      <div style={{ position: 'relative', filter: isLocked ? 'grayscale(1) opacity(0.45)' : undefined, transition: 'filter 0.3s' }}>
        <CompanionCharacter character={previewChar} pose="happy" size={100} />
        <span style={{
          position:   'absolute',
          top:        -8,
          right:      -8,
          fontSize:   28,
        }}>{item.icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: COLORS.muted, textAlign: 'center', maxWidth: 180 }}>
        {item.hint}
      </p>
    </motion.div>
  )
}

// ─── Buy confirmation sheet ────────────────────────────────────────────────────

function ConfirmSheet({
  item,
  onConfirm,
  onCancel,
}: {
  item:      ShopItem
  onConfirm: () => void
  onCancel:  () => void
}) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position:        'fixed',
        bottom:          0,
        left:            0,
        right:           0,
        background:      'white',
        borderTopLeftRadius:  24,
        borderTopRightRadius: 24,
        padding:         '24px 28px 36px',
        boxShadow:       '0 -4px 32px rgba(0,0,0,0.12)',
        zIndex:          10001,
        textAlign:       'center',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 8 }}>{item.icon}</div>
      <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 18, color: COLORS.ink }}>
        {item.name}
      </p>
      <p style={{ margin: '0 0 20px', fontSize: 15, color: COLORS.muted }}>
        Spend <strong style={{ color: COLORS.lemonDark }}>🪙 {item.cost} coins</strong>?
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onConfirm}
          style={{
            padding:      '12px 32px',
            borderRadius: 28,
            border:       'none',
            background:   COLORS.mintDark,
            color:        'white',
            fontWeight:   800,
            fontSize:     16,
            cursor:       'pointer',
          }}
        >
          Yes! 🎉
        </button>
        <button
          onClick={onCancel}
          style={{
            padding:      '12px 32px',
            borderRadius: 28,
            border:       `2px solid ${COLORS.muted}`,
            background:   'transparent',
            color:        COLORS.muted,
            fontWeight:   700,
            fontSize:     16,
            cursor:       'pointer',
          }}
        >
          Not yet
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main shop ────────────────────────────────────────────────────────────────

interface Props {
  childId: string
}

export function CompanionShop({ childId }: Props) {
  const balance       = useCoinStore((s) => s.balance)
  const activeChild   = useProfileStore((s) => s.activeChild())
  const character     = (activeChild?.active_companion ?? 'cat') as CharacterType

  const [activeTab, setActiveTab]       = useState<ItemCategory>('accessories')
  const [previewing, setPreviewing]     = useState<ShopItem | null>(null)
  const [confirming, setConfirming]     = useState<ShopItem | null>(null)
  const [owned, setOwned]               = useState<Set<string>>(new Set())
  const [buySuccess, setBuySuccess]     = useState<string | null>(null)
  const previewTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load owned cosmetics from coin_transactions
  useEffect(() => {
    const COSMETIC_IDS = Object.keys(COSMETIC_COSTS)
    createClient()
      .from('coin_transactions')
      .select('reason')
      .eq('child_id', childId)
      .lt('amount', 0)
      .in('reason', COSMETIC_IDS)
      .then(({ data }) => {
        if (data) setOwned(new Set(data.map((r) => r.reason)))
      })
  }, [childId])

  const visibleItems = ITEMS.filter((i) => i.category === activeTab)

  const handleTap = useCallback((item: ShopItem) => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    setPreviewing(item)
    previewTimerRef.current = setTimeout(() => setPreviewing(null), 2_000)
  }, [])

  const handleBuy = useCallback((item: ShopItem) => {
    setPreviewing(null)
    setConfirming(item)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!confirming) return
    setConfirming(null)
    const ok = await CoinEngine.spend(
      childId,
      { type: 'cosmetic', name: confirming.id },
      confirming.cost,
    )
    if (ok) {
      setOwned((prev) => { const s = new Set(prev); s.add(confirming.id); return s })
      setBuySuccess(confirming.name)
      setTimeout(() => setBuySuccess(null), 2_500)
    }
  }, [confirming, childId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Balance + preview row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 4px',
      }}>
        <div style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        6,
          background: COLORS.lemon,
          borderRadius: 20,
          padding:    '5px 14px',
          fontWeight: 800,
          fontSize:   16,
          color:      COLORS.lemonDark,
        }}>
          🪙 {balance}
        </div>
        <AnimatePresence mode="wait">
          {previewing ? (
            <PreviewPanel key={previewing.id} item={previewing} character={character} owned={owned.has(previewing.id)} />
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <CompanionCharacter character={character} pose="idle" size={72} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding:      '7px 16px',
              borderRadius: 20,
              border:       'none',
              background:   activeTab === cat.id ? COLORS.lavenderDark : COLORS.lavender,
              color:        activeTab === cat.id ? 'white' : COLORS.lavenderDark,
              fontWeight:   700,
              fontSize:     13,
              cursor:       'pointer',
              whiteSpace:   'nowrap',
              transition:   'background 0.2s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap:                 12,
        }}
      >
        {visibleItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            owned={owned.has(item.id)}
            balance={balance}
            onTap={handleTap}
            onBuy={handleBuy}
          />
        ))}
      </motion.div>

      {/* Buy success toast */}
      <AnimatePresence>
        {buySuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position:       'fixed',
              bottom:         24,
              left:           '50%',
              transform:      'translateX(-50%)',
              background:     COLORS.mintDark,
              color:          'white',
              padding:        '10px 22px',
              borderRadius:   20,
              fontWeight:     700,
              fontSize:       14,
              zIndex:         10002,
              whiteSpace:     'nowrap',
            }}
          >
            ✓ {buySuccess} unlocked!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm bottom sheet + scrim */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(null)}
              style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 10000 }}
            />
            <ConfirmSheet
              key="sheet"
              item={confirming}
              onConfirm={handleConfirm}
              onCancel={() => setConfirming(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
