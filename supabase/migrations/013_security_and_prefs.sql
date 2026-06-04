-- ============================================================
-- Migration 013: Security hardening and notification preferences
-- ============================================================

-- ── 1. Notification preferences in profiles ──────────────────────────────────
-- Per-user notification preference flags (stored client-side via AsyncStorage;
-- this column is here if a server-side preference sync is ever needed).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{}';

-- ── 2. Explicit WITH CHECK on profiles UPDATE ─────────────────────────────────
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 3. Guard: a user cannot appear as both investor and startup in a connection
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_no_self_loop;
ALTER TABLE connections ADD CONSTRAINT connections_no_self_loop
  CHECK (investor_id <> startup_id);

-- ── 4. Guard: startup_profiles.is_active can only be set to true by the owner
--        (prevents a SECURITY DEFINER function bypass from another user)
DROP POLICY IF EXISTS "startup_profiles_delete_own" ON startup_profiles;
CREATE POLICY "startup_profiles_delete_own" ON startup_profiles FOR DELETE
  USING (profile_id = auth.uid());

-- ── 5. Ensure conversations can only be updated by participants ───────────────
DROP POLICY IF EXISTS "conversations_update_participants" ON conversations;
CREATE POLICY "conversations_update_participants" ON conversations FOR UPDATE
  USING (investor_id = auth.uid() OR startup_id = auth.uid());

-- ── 6. Index on notifications for fast per-user lookup ───────────────────────
CREATE INDEX IF NOT EXISTS notifications_user_id_read_at_idx
  ON notifications (user_id, read_at)
  WHERE read_at IS NULL;
