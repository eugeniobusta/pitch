-- Profiles
CREATE INDEX idx_profiles_account_type ON profiles(account_type);

-- Startup profiles
CREATE INDEX idx_startup_profiles_profile_id ON startup_profiles(profile_id);
CREATE INDEX idx_startup_profiles_industry ON startup_profiles(industry);
CREATE INDEX idx_startup_profiles_stage ON startup_profiles(stage);
CREATE INDEX idx_startup_profiles_is_active ON startup_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_startup_profiles_is_raising ON startup_profiles(is_raising) WHERE is_raising = TRUE;
CREATE INDEX idx_startup_profiles_views ON startup_profiles(views_count DESC);
CREATE INDEX idx_startup_search_vector ON startup_profiles USING GIN(search_vector);
CREATE INDEX idx_startup_company_name ON startup_profiles USING GIN(company_name gin_trgm_ops);

-- Investor profiles
CREATE INDEX idx_investor_profiles_profile_id ON investor_profiles(profile_id);
CREATE INDEX idx_investor_industries ON investor_profiles USING GIN(industries);
CREATE INDEX idx_investor_stages ON investor_profiles USING GIN(stages);

-- Connections
CREATE INDEX idx_connections_investor ON connections(investor_id);
CREATE INDEX idx_connections_startup ON connections(startup_id);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_investor_status ON connections(investor_id, status);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id) WHERE read_at IS NULL;

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- Pitch views
CREATE INDEX idx_pitch_views_startup ON pitch_views(startup_id, created_at DESC);
CREATE INDEX idx_pitch_views_viewer ON pitch_views(viewer_id);
