-- ============================================================
-- Security fixes — addresses audit findings
-- ============================================================

-- ── 1. PROFILES: require authentication for SELECT ────────────────────────────
-- Prevents anonymous callers from reading emails and push tokens.
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 2. INVESTOR_PROFILES: require authentication for SELECT ───────────────────
DROP POLICY IF EXISTS "investor_profiles_select_all" ON investor_profiles;
CREATE POLICY "investor_profiles_select_authenticated" ON investor_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 3. PITCH_VIEWS: require auth + viewer must match caller ───────────────────
DROP POLICY IF EXISTS "pitch_views_insert_any" ON pitch_views;
CREATE POLICY "pitch_views_insert_auth" ON pitch_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND viewer_id = auth.uid());

-- ── 4. ANALYTICS_EVENTS: require authentication ───────────────────────────────
DROP POLICY IF EXISTS "analytics_insert_any" ON analytics_events;
CREATE POLICY "analytics_insert_auth" ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── 5. CONNECTIONS: track initiator so we can prevent self-acceptance ─────────
ALTER TABLE connections ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES profiles(id);

-- Trigger sets initiated_by to the caller on every new connection row
CREATE OR REPLACE FUNCTION public.set_connection_initiator()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.initiated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connections_set_initiator ON connections;
CREATE TRIGGER connections_set_initiator
  BEFORE INSERT ON connections
  FOR EACH ROW EXECUTE FUNCTION public.set_connection_initiator();

-- Back-fill existing rows (assume investor was the initiator for old rows)
UPDATE connections SET initiated_by = investor_id WHERE initiated_by IS NULL;

-- Only the receiving party can change status (prevents self-acceptance)
DROP POLICY IF EXISTS "connections_update_startup" ON connections;
CREATE POLICY "connections_update_recipient" ON connections FOR UPDATE
  USING (
    (investor_id = auth.uid() OR startup_id = auth.uid())
    AND auth.uid() IS DISTINCT FROM initiated_by
  )
  WITH CHECK (status IN ('accepted', 'rejected'));

-- ── 6. CONNECTIONS INSERT: enforce role — users can only occupy their own slot ─
DROP POLICY IF EXISTS "connections_insert_investor" ON public.connections;
DROP POLICY IF EXISTS "connections_insert_either"   ON public.connections;

CREATE POLICY "connections_insert_either" ON public.connections FOR INSERT
  WITH CHECK (
    (
      investor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'investor'
      )
    )
    OR
    (
      startup_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'startup'
      )
    )
  );

-- ── 7. STORAGE thumbnails: scope upload to caller's own folder ────────────────
DROP POLICY IF EXISTS "thumbnails_auth_upload" ON storage.objects;
CREATE POLICY "thumbnails_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ── 8. FEED FUNCTION: verify caller owns the investor id passed in ─────────────
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_investor_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  profile_id UUID,
  company_name TEXT,
  tagline TEXT,
  description TEXT,
  industry industry_type,
  stage startup_stage,
  founded_year INTEGER,
  team_size INTEGER,
  logo_url TEXT,
  cover_url TEXT,
  pitch_video_url TEXT,
  pitch_video_thumbnail TEXT,
  pitch_deck_url TEXT,
  website TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  mrr NUMERIC,
  arr NUMERIC,
  users_count INTEGER,
  growth_rate NUMERIC,
  raising_amount NUMERIC,
  valuation NUMERIC,
  is_raising BOOLEAN,
  is_active BOOLEAN,
  views_count INTEGER,
  connections_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_connected BOOLEAN,
  connection_status connection_status
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_industries industry_type[];
  v_stages startup_stage[];
BEGIN
  IF p_investor_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: p_investor_id must match the calling user';
  END IF;

  SELECT ip.industries, ip.stages
  INTO v_industries, v_stages
  FROM investor_profiles ip
  WHERE ip.profile_id = p_investor_id;

  RETURN QUERY
  SELECT
    sp.id, sp.profile_id, sp.company_name, sp.tagline, sp.description,
    sp.industry, sp.stage, sp.founded_year, sp.team_size,
    sp.logo_url, sp.cover_url, sp.pitch_video_url, sp.pitch_video_thumbnail,
    sp.pitch_deck_url, sp.website, sp.linkedin_url, sp.twitter_url,
    sp.mrr, sp.arr, sp.users_count, sp.growth_rate, sp.raising_amount,
    sp.valuation, sp.is_raising, sp.is_active, sp.views_count,
    sp.connections_count, sp.created_at, sp.updated_at,
    (c.id IS NOT NULL AND c.status = 'accepted') AS is_connected,
    c.status AS connection_status
  FROM startup_profiles sp
  LEFT JOIN connections c ON c.investor_id = p_investor_id AND c.startup_id = sp.profile_id
  WHERE sp.is_active = TRUE
  ORDER BY
    CASE WHEN v_stages IS NOT NULL AND sp.stage = ANY(v_stages) THEN 10 ELSE 0 END +
    CASE WHEN v_industries IS NOT NULL AND sp.industry = ANY(v_industries) THEN 8 ELSE 0 END +
    CASE WHEN sp.is_raising THEN 5 ELSE 0 END +
    CASE WHEN sp.mrr IS NOT NULL THEN 3 ELSE 0 END +
    CASE WHEN c.id IS NULL THEN 2 ELSE 0 END
  DESC,
  sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
