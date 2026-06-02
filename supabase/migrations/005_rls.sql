-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- STARTUP_PROFILES
CREATE POLICY "startup_profiles_select_active" ON startup_profiles FOR SELECT USING (is_active = TRUE OR profile_id = auth.uid());
CREATE POLICY "startup_profiles_insert_own" ON startup_profiles FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "startup_profiles_update_own" ON startup_profiles FOR UPDATE USING (profile_id = auth.uid());

-- INVESTOR_PROFILES
CREATE POLICY "investor_profiles_select_all" ON investor_profiles FOR SELECT USING (TRUE);
CREATE POLICY "investor_profiles_insert_own" ON investor_profiles FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "investor_profiles_update_own" ON investor_profiles FOR UPDATE USING (profile_id = auth.uid());

-- CONNECTIONS
CREATE POLICY "connections_select_own" ON connections FOR SELECT
  USING (investor_id = auth.uid() OR startup_id = auth.uid());
CREATE POLICY "connections_insert_investor" ON connections FOR INSERT
  WITH CHECK (investor_id = auth.uid());
CREATE POLICY "connections_update_startup" ON connections FOR UPDATE
  USING (startup_id = auth.uid() OR investor_id = auth.uid());

-- CONVERSATIONS
CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = conversations.connection_id
        AND (c.investor_id = auth.uid() OR c.startup_id = auth.uid())
    )
  );

-- MESSAGES
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations cv
      JOIN connections c ON c.id = cv.connection_id
      WHERE cv.id = messages.conversation_id
        AND (c.investor_id = auth.uid() OR c.startup_id = auth.uid())
    )
  );
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations cv
      JOIN connections c ON c.id = cv.connection_id
      WHERE cv.id = conversation_id
        AND (c.investor_id = auth.uid() OR c.startup_id = auth.uid())
        AND c.status = 'accepted'
    )
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- PITCH_VIEWS
CREATE POLICY "pitch_views_insert_any" ON pitch_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "pitch_views_select_startup_own" ON pitch_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM startup_profiles sp WHERE sp.id = pitch_views.startup_id AND sp.profile_id = auth.uid())
    OR viewer_id = auth.uid()
  );

-- ANALYTICS_EVENTS
CREATE POLICY "analytics_insert_any" ON analytics_events FOR INSERT WITH CHECK (TRUE);
