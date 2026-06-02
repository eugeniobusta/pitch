-- Personalized feed scoring function for investors
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
  -- Get investor preferences
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
    -- Stage match score
    CASE WHEN v_stages IS NOT NULL AND sp.stage = ANY(v_stages) THEN 10 ELSE 0 END +
    -- Industry match score
    CASE WHEN v_industries IS NOT NULL AND sp.industry = ANY(v_industries) THEN 8 ELSE 0 END +
    -- Raising bonus
    CASE WHEN sp.is_raising THEN 5 ELSE 0 END +
    -- Traction bonus
    CASE WHEN sp.mrr IS NOT NULL THEN 3 ELSE 0 END +
    -- Not yet connected
    CASE WHEN c.id IS NULL THEN 2 ELSE 0 END
  DESC,
  sp.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
