CREATE TABLE anticheat_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID        REFERENCES child_profiles(id) ON DELETE CASCADE,
  event_type TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE anticheat_events ENABLE ROW LEVEL SECURITY;

-- Parents can read events for their own children
CREATE POLICY "parent reads anticheat events" ON anticheat_events
  FOR SELECT USING (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );

-- Inserts come from the widget / child session (anon or authenticated child session)
CREATE POLICY "child inserts anticheat events" ON anticheat_events
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM child_profiles WHERE parent_id = auth.uid())
  );

-- Fast per-child lookups for the security tab
CREATE INDEX anticheat_events_child_id_idx ON anticheat_events (child_id, created_at DESC);
