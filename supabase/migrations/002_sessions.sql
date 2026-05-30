CREATE TABLE session_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID        REFERENCES child_profiles(id) ON DELETE CASCADE,
  event_type TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Parents can read/write events for their own children
CREATE POLICY "parent owns session events" ON session_events
  FOR ALL USING (
    auth.uid() = (
      SELECT parent_id FROM child_profiles WHERE id = child_id
    )
  );

-- Index for fast per-child queries (dashboard charts, history)
CREATE INDEX session_events_child_id_idx ON session_events (child_id, created_at DESC);
