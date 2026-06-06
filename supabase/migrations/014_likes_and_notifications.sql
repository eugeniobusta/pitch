-- ============================================================
-- Migration 014: Likes system + pitch view notifications
-- ============================================================

-- 1. Add likes_count to startup_profiles
ALTER TABLE startup_profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- 2. startup_likes table (investor_id + startup profile_id, unique pair)
CREATE TABLE IF NOT EXISTS startup_likes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(investor_id, startup_id)
);

ALTER TABLE startup_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_auth" ON startup_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "likes_insert_investor" ON startup_likes FOR INSERT
  WITH CHECK (
    auth.uid() = investor_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'investor')
  );

CREATE POLICY "likes_delete_own" ON startup_likes FOR DELETE
  USING (auth.uid() = investor_id);

CREATE INDEX IF NOT EXISTS startup_likes_investor_startup_idx ON startup_likes(investor_id, startup_id);
CREATE INDEX IF NOT EXISTS startup_likes_startup_idx ON startup_likes(startup_id);

-- 3. Trigger to maintain likes_count atomically
CREATE OR REPLACE FUNCTION public.handle_like_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE startup_profiles SET likes_count = likes_count + 1 WHERE profile_id = NEW.startup_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE startup_profiles SET likes_count = GREATEST(likes_count - 1, 0) WHERE profile_id = OLD.startup_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_startup_like
  AFTER INSERT OR DELETE ON startup_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_like_change();

-- 4. pitch_viewed notification (rate-limited: once per viewer/startup pair per hour)
CREATE OR REPLACE FUNCTION public.handle_pitch_view_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_startup_profile_id UUID;
BEGIN
  IF NEW.viewer_id IS NULL THEN RETURN NEW; END IF;

  SELECT profile_id INTO v_startup_profile_id
  FROM startup_profiles WHERE id = NEW.startup_id;

  IF v_startup_profile_id IS NULL OR v_startup_profile_id = NEW.viewer_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = v_startup_profile_id
      AND type = 'pitch_viewed'
      AND (data->>'actor_id')::TEXT = NEW.viewer_id::TEXT
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_startup_profile_id,
    'pitch_viewed',
    'Your pitch is getting attention',
    'An investor just watched your full pitch.',
    jsonb_build_object('actor_id', NEW.viewer_id::TEXT)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pitch_view_notify
  AFTER INSERT ON pitch_views
  FOR EACH ROW EXECUTE FUNCTION public.handle_pitch_view_notify();

-- 5. Update get_personalized_feed to include likes_count and is_liked
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_investor_id UUID,
  p_limit       INTEGER DEFAULT 20,
  p_offset      INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, profile_id UUID, company_name TEXT, tagline TEXT, description TEXT,
  industry industry_type, stage startup_stage, founded_year INTEGER, team_size INTEGER,
  logo_url TEXT, cover_url TEXT, pitch_video_url TEXT, pitch_video_thumbnail TEXT,
  pitch_deck_url TEXT, website TEXT, linkedin_url TEXT, twitter_url TEXT,
  mrr NUMERIC, arr NUMERIC, users_count INTEGER, growth_rate NUMERIC,
  raising_amount NUMERIC, valuation NUMERIC, is_raising BOOLEAN, is_active BOOLEAN,
  views_count INTEGER, connections_count INTEGER, likes_count INTEGER,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  is_connected BOOLEAN, connection_status connection_status, is_liked BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_industries industry_type[];
  v_stages     startup_stage[];
BEGIN
  IF p_investor_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: p_investor_id must match the calling user';
  END IF;

  SELECT ip.industries, ip.stages INTO v_industries, v_stages
  FROM investor_profiles ip WHERE ip.profile_id = p_investor_id;

  RETURN QUERY
  SELECT
    sp.id, sp.profile_id, sp.company_name, sp.tagline, sp.description,
    sp.industry, sp.stage, sp.founded_year, sp.team_size,
    sp.logo_url, sp.cover_url, sp.pitch_video_url, sp.pitch_video_thumbnail,
    sp.pitch_deck_url, sp.website, sp.linkedin_url, sp.twitter_url,
    sp.mrr, sp.arr, sp.users_count, sp.growth_rate, sp.raising_amount,
    sp.valuation, sp.is_raising, sp.is_active, sp.views_count,
    sp.connections_count, sp.likes_count, sp.created_at, sp.updated_at,
    (c.id IS NOT NULL AND c.status = 'accepted') AS is_connected,
    c.status AS connection_status,
    (l.id IS NOT NULL)::BOOLEAN AS is_liked
  FROM startup_profiles sp
  LEFT JOIN connections c   ON c.investor_id = p_investor_id AND c.startup_id = sp.profile_id
  LEFT JOIN startup_likes l ON l.investor_id = p_investor_id AND l.startup_id = sp.profile_id
  WHERE sp.is_active = TRUE
  ORDER BY
    CASE WHEN v_stages IS NOT NULL AND sp.stage = ANY(v_stages) THEN 10 ELSE 0 END +
    CASE WHEN v_industries IS NOT NULL AND sp.industry = ANY(v_industries) THEN 8 ELSE 0 END +
    CASE WHEN sp.is_raising THEN 5 ELSE 0 END +
    CASE WHEN sp.mrr IS NOT NULL THEN 3 ELSE 0 END +
    CASE WHEN c.id IS NULL THEN 2 ELSE 0 END
  DESC, sp.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;
