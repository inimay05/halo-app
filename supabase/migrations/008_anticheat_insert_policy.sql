-- Fix: anticheat_events INSERT policy was broken for widget (anonymous) context.
-- The widget's AntiCheatEngine uses the anon key directly (not a service-role API route),
-- so auth.uid() is null for external widget installs, causing silent insert failures.
--
-- New policy: allow inserts where child_id references a valid child_profiles row.
-- This is safe because:
--   1. The anticheat_events table is write-only from the child/widget side.
--   2. Parents can only READ via the separate SELECT policy (unchanged).
--   3. Any inserted child_id still must reference a real row (FK constraint).
--   4. The data is low-sensitivity security telemetry, not PII.

DROP POLICY IF EXISTS "child inserts anticheat events" ON anticheat_events;

CREATE POLICY "widget inserts anticheat events" ON anticheat_events
  FOR INSERT WITH CHECK (
    child_id IN (SELECT id FROM child_profiles)
  );
