-- ── Coin transactions ─────────────────────────────────────────────────────────
CREATE TABLE coin_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID        REFERENCES child_profiles(id) ON DELETE CASCADE,
  reason     TEXT        NOT NULL,
  amount     INTEGER     NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_coin_tx_child ON coin_transactions (child_id, created_at DESC);

-- ── Badges ─────────────────────────────────────────────────────────────────────
CREATE TABLE badges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID        REFERENCES child_profiles(id) ON DELETE CASCADE,
  badge_type TEXT        NOT NULL,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, badge_type)
);
CREATE INDEX idx_badges_child ON badges (child_id);

-- ── Garden health history (for 7-day sparkline in GardenWidget) ───────────────
CREATE TABLE garden_health_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID        REFERENCES child_profiles(id) ON DELETE CASCADE,
  health     REAL        NOT NULL,
  logged_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_garden_log_child ON garden_health_log (child_id, logged_at DESC);

-- ── Migrate garden_health integer → float (0.05–1.0) ─────────────────────────
ALTER TABLE child_profiles ALTER COLUMN garden_health TYPE REAL
  USING CASE
    WHEN garden_health > 1 THEN ROUND((garden_health / 100.0)::NUMERIC, 2)::REAL
    ELSE garden_health::REAL
  END;
ALTER TABLE child_profiles ALTER COLUMN garden_health SET DEFAULT 1.0;
UPDATE child_profiles SET garden_health = 1.0
  WHERE garden_health IS NULL OR garden_health > 1.0;

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_health_log  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent reads child coin transactions" ON coin_transactions
  FOR SELECT USING (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );
CREATE POLICY "parent writes child coin transactions" ON coin_transactions
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );

CREATE POLICY "parent reads child badges" ON badges
  FOR SELECT USING (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );
CREATE POLICY "parent writes child badges" ON badges
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );

CREATE POLICY "parent reads garden log" ON garden_health_log
  FOR SELECT USING (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );
CREATE POLICY "parent writes garden log" ON garden_health_log
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );
