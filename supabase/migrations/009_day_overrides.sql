-- Per-day screen time overrides.
-- Stored as a JSONB map: { "mon": 3600000, "tue": 3600000, ... }
-- Keys: mon tue wed thu fri sat sun  (all optional)
-- Value: full-block limit in milliseconds for that day.
-- If a day key is absent the global full_block_ms applies.
ALTER TABLE parent_rules ADD COLUMN IF NOT EXISTS day_overrides JSONB DEFAULT '{}';
