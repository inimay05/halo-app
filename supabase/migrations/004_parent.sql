CREATE TABLE parent_rules (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id                UUID        REFERENCES child_profiles(id) ON DELETE CASCADE UNIQUE,
  soft_warning_ms         BIGINT,
  full_block_ms           BIGINT,
  inactivity_ms           BIGINT,
  night_start_hour        INTEGER,
  night_multiplier        FLOAT,
  autoplay_limit          INTEGER,
  allowlist               JSONB       DEFAULT '[]',
  blocklist               JSONB       DEFAULT '[]',
  weekend_soft_ms         BIGINT,
  weekend_full_ms         BIGINT,
  time_banking_enabled    BOOLEAN     DEFAULT true,
  weekly_bank_ceiling_ms  BIGINT      DEFAULT 7200000,
  voice_challenge_enabled BOOLEAN     DEFAULT false,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parent_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent owns rules" ON parent_rules
  FOR ALL USING (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );
