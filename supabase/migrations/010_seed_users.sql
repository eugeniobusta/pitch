-- ============================================================
-- SEED: 10 realistic fake users (5 investors + 5 founders)
-- All passwords: Test1234!
--
-- WARNING: This file is for LOCAL DEVELOPMENT ONLY.
-- It MUST NOT be applied to a production database.
-- Canonical seed data going forward lives in supabase/seed.sql.
-- ============================================================
SET search_path TO extensions, auth, public;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Auth users  (triggers create profile + role stubs)
-- ─────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  -- Investors
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'sarah.chen@sequoia.com', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Sarah Chen","account_type":"investor"}',
   false, NOW()-INTERVAL '45 days', NOW(), '','','',''),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'michael.torres@a16z.com', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Michael Torres","account_type":"investor"}',
   false, NOW()-INTERVAL '38 days', NOW(), '','','',''),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'emma.nguyen@benchmark.com', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Emma Nguyen","account_type":"investor"}',
   false, NOW()-INTERVAL '30 days', NOW(), '','','',''),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'david.kim@foundersfund.com', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"David Kim","account_type":"investor"}',
   false, NOW()-INTERVAL '22 days', NOW(), '','','',''),
  ('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'marcus.johnson@yc.com', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Marcus Johnson","account_type":"investor"}',
   false, NOW()-INTERVAL '15 days', NOW(), '','','',''),
  -- Startup founders
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'alex.rivera@neuralsync.ai', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Alex Rivera","account_type":"startup"}',
   false, NOW()-INTERVAL '42 days', NOW(), '','','',''),
  ('b1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'maya.patel@payflow.io', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Maya Patel","account_type":"startup"}',
   false, NOW()-INTERVAL '35 days', NOW(), '','','',''),
  ('b1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'james.chen@healthai.co', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"James Chen","account_type":"startup"}',
   false, NOW()-INTERVAL '25 days', NOW(), '','','',''),
  ('b1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'sofia.martinez@greengrid.energy', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Sofia Martinez","account_type":"startup"}',
   false, NOW()-INTERVAL '18 days', NOW(), '','','',''),
  ('b1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'tyler.brooks@eduspace.io', crypt('Test1234!',gen_salt('bf')), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Tyler Brooks","account_type":"startup"}',
   false, NOW()-INTERVAL '12 days', NOW(), '','','','')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Ensure profiles exist (handles re-runs / trigger skip)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, account_type, is_onboarded)
VALUES
  ('a1000000-0000-0000-0000-000000000001','sarah.chen@sequoia.com','Sarah Chen','investor',true),
  ('a1000000-0000-0000-0000-000000000002','michael.torres@a16z.com','Michael Torres','investor',true),
  ('a1000000-0000-0000-0000-000000000003','emma.nguyen@benchmark.com','Emma Nguyen','investor',true),
  ('a1000000-0000-0000-0000-000000000004','david.kim@foundersfund.com','David Kim','investor',true),
  ('a1000000-0000-0000-0000-000000000005','marcus.johnson@yc.com','Marcus Johnson','investor',true),
  ('b1000000-0000-0000-0000-000000000001','alex.rivera@neuralsync.ai','Alex Rivera','startup',true),
  ('b1000000-0000-0000-0000-000000000002','maya.patel@payflow.io','Maya Patel','startup',true),
  ('b1000000-0000-0000-0000-000000000003','james.chen@healthai.co','James Chen','startup',true),
  ('b1000000-0000-0000-0000-000000000004','sofia.martinez@greengrid.energy','Sofia Martinez','startup',true),
  ('b1000000-0000-0000-0000-000000000005','tyler.brooks@eduspace.io','Tyler Brooks','startup',true)
ON CONFLICT (id) DO NOTHING;

-- Update profiles with rich data
UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=47',
  bio = 'Partner at Sequoia Capital. Previously founded two enterprise SaaS companies. Focus on AI/ML and fintech at seed to Series B.',
  location = 'Menlo Park, CA',
  website = 'https://sequoiacap.com',
  is_onboarded = true
WHERE id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=68',
  bio = 'General Partner at a16z. Led investments in Stripe, Coinbase, and dozens of category-defining companies. Passionate about fintech and marketplace businesses.',
  location = 'San Francisco, CA',
  website = 'https://a16z.com',
  is_onboarded = true
WHERE id = 'a1000000-0000-0000-0000-000000000002';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=49',
  bio = 'Principal at Benchmark. Former founder (acquired by Shopify). I invest in early-stage consumer, SaaS, and marketplace companies with exceptional founders.',
  location = 'San Francisco, CA',
  website = 'https://benchmark.com',
  is_onboarded = true
WHERE id = 'a1000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=53',
  bio = 'Partner at Founders Fund. Deep tech investor focused on companies that matter. Portfolio includes SpaceX, Palantir, and Affirm.',
  location = 'San Francisco, CA',
  website = 'https://foundersfund.com',
  is_onboarded = true
WHERE id = 'a1000000-0000-0000-0000-000000000004';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=8',
  bio = 'Group Partner at Y Combinator. Have worked with 300+ startups. I care most about the founder — everything else can be figured out.',
  location = 'Mountain View, CA',
  website = 'https://ycombinator.com',
  is_onboarded = true
WHERE id = 'a1000000-0000-0000-0000-000000000005';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=12',
  bio = 'CEO & Co-founder at NeuralSync AI. Ex-Google Brain, Stanford AI PhD. Building the AI layer that every enterprise team will run on.',
  location = 'San Francisco, CA',
  is_onboarded = true
WHERE id = 'b1000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=44',
  bio = 'CEO & Co-founder at PayFlow. Ex-Stripe, Wharton MBA. Rebuilding B2B payments infrastructure from the ground up.',
  location = 'New York, NY',
  is_onboarded = true
WHERE id = 'b1000000-0000-0000-0000-000000000002';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=65',
  bio = 'CEO at HealthAI. MD from Johns Hopkins, ex-McKinsey. Using AI to make accurate diagnostics accessible to every clinic in the world.',
  location = 'Boston, MA',
  is_onboarded = true
WHERE id = 'b1000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=57',
  bio = 'CEO & Co-founder at GreenGrid. Ex-Tesla energy division. Building the marketplace that connects renewable energy producers with commercial buyers.',
  location = 'Austin, TX',
  is_onboarded = true
WHERE id = 'b1000000-0000-0000-0000-000000000004';

UPDATE public.profiles SET
  avatar_url = 'https://i.pravatar.cc/300?img=33',
  bio = 'CEO at EduSpace. Former teacher turned tech founder. Our adaptive learning engine has helped 45,000 students improve scores by 40% on average.',
  location = 'Chicago, IL',
  is_onboarded = true
WHERE id = 'b1000000-0000-0000-0000-000000000005';

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Investor profiles
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.investor_profiles (profile_id)
VALUES
  ('a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000005')
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.investor_profiles SET
  firm_name = 'Sequoia Capital',
  title = 'Partner',
  bio = 'I focus on AI/ML infrastructure and fintech. Looking for founders who are obsessed with the problem, not the solution. Led Series A rounds at 3 unicorns last year.',
  industries = ARRAY['ai_ml','saas','fintech']::public.industry_type[],
  stages = ARRAY['seed','series_a']::public.startup_stage[],
  min_investment = 1000000,
  max_investment = 15000000,
  portfolio_count = 24,
  is_verified = true,
  is_accredited = true,
  linkedin_url = 'https://linkedin.com/in/sarah-chen-sequoia',
  connections_count = 3
WHERE profile_id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.investor_profiles SET
  firm_name = 'Andreessen Horowitz',
  title = 'General Partner',
  bio = 'At a16z I focus on fintech and marketplace businesses disrupting legacy industries. Thesis: software ate the world, AI will rebuild it.',
  industries = ARRAY['fintech','marketplace','ai_ml']::public.industry_type[],
  stages = ARRAY['seed','series_a','series_b_plus']::public.startup_stage[],
  min_investment = 2000000,
  max_investment = 30000000,
  portfolio_count = 41,
  is_verified = true,
  is_accredited = true,
  linkedin_url = 'https://linkedin.com/in/michaeltorres-a16z',
  connections_count = 2
WHERE profile_id = 'a1000000-0000-0000-0000-000000000002';

UPDATE public.investor_profiles SET
  firm_name = 'Benchmark',
  title = 'Principal',
  bio = 'Early-stage generalist with a love for consumer and marketplace. I am most excited when a founder can show me a retention curve that defies gravity.',
  industries = ARRAY['consumer','marketplace','saas']::public.industry_type[],
  stages = ARRAY['pre_seed','seed']::public.startup_stage[],
  min_investment = 500000,
  max_investment = 8000000,
  portfolio_count = 17,
  is_verified = true,
  is_accredited = true,
  linkedin_url = 'https://linkedin.com/in/emma-nguyen-benchmark',
  connections_count = 2
WHERE profile_id = 'a1000000-0000-0000-0000-000000000003';

UPDATE public.investor_profiles SET
  firm_name = 'Founders Fund',
  title = 'Partner',
  bio = 'We invest in companies building things that others think are impossible. Deep tech, climate, defense, and AI are my current focus areas.',
  industries = ARRAY['deeptech','climate','ai_ml']::public.industry_type[],
  stages = ARRAY['seed','series_a','series_b_plus']::public.startup_stage[],
  min_investment = 3000000,
  max_investment = 50000000,
  portfolio_count = 19,
  is_verified = true,
  is_accredited = true,
  linkedin_url = 'https://linkedin.com/in/david-kim-ff',
  connections_count = 2
WHERE profile_id = 'a1000000-0000-0000-0000-000000000004';

UPDATE public.investor_profiles SET
  firm_name = 'Y Combinator',
  title = 'Group Partner',
  bio = 'Batch after batch I see the same pattern: the best founders make something people want, and they do it faster than anyone thinks possible. That is what I look for.',
  industries = ARRAY['ai_ml','saas','fintech','healthtech','edtech','marketplace','consumer']::public.industry_type[],
  stages = ARRAY['idea','pre_seed','seed']::public.startup_stage[],
  min_investment = 125000,
  max_investment = 500000,
  portfolio_count = 312,
  is_verified = true,
  is_accredited = true,
  linkedin_url = 'https://linkedin.com/in/marcus-johnson-yc',
  connections_count = 1
WHERE profile_id = 'a1000000-0000-0000-0000-000000000005';

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Startup profiles
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.startup_profiles (profile_id, company_name, tagline, industry, stage)
VALUES
  ('b1000000-0000-0000-0000-000000000001','NeuralSync AI','The AI copilot that automates your entire back-office.','ai_ml','seed'),
  ('b1000000-0000-0000-0000-000000000002','PayFlow','B2B payments infrastructure for the modern enterprise.','fintech','series_a'),
  ('b1000000-0000-0000-0000-000000000003','HealthAI','AI diagnostics that give every clinic hospital-grade accuracy.','healthtech','seed'),
  ('b1000000-0000-0000-0000-000000000004','GreenGrid','The marketplace connecting renewable energy to commercial buyers.','climate','pre_seed'),
  ('b1000000-0000-0000-0000-000000000005','EduSpace','Adaptive learning that closes achievement gaps at scale.','edtech','seed')
ON CONFLICT (profile_id) DO NOTHING;

UPDATE public.startup_profiles SET
  company_name       = 'NeuralSync AI',
  tagline            = 'The AI copilot that automates your entire back-office.',
  description        = 'NeuralSync AI replaces the patchwork of SaaS tools teams use to run their operations. Our models read email, CRM data, and support tickets to automatically draft responses, route tasks, update records, and flag anomalies — all without human intervention. We went from 0 to $180K ARR in 8 months with zero sales motion. Every customer came through word of mouth.',
  industry           = 'ai_ml',
  stage              = 'seed',
  founded_year       = 2023,
  team_size          = 9,
  logo_url           = 'https://picsum.photos/seed/neuralsync-logo/200/200',
  cover_url          = 'https://picsum.photos/seed/neuralsync-cover/1200/400',
  pitch_video_url    = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  pitch_video_thumbnail = 'https://picsum.photos/seed/neuralsync-thumb/600/400',
  website            = 'https://neuralsync.ai',
  linkedin_url       = 'https://linkedin.com/company/neuralsync-ai',
  mrr                = 15000,
  arr                = 180000,
  users_count        = 340,
  growth_rate        = 28,
  raising_amount     = 3000000,
  valuation          = 18000000,
  is_raising         = true,
  is_active          = true,
  views_count        = 1847,
  connections_count  = 3
WHERE profile_id = 'b1000000-0000-0000-0000-000000000001';

UPDATE public.startup_profiles SET
  company_name       = 'PayFlow',
  tagline            = 'B2B payments infrastructure for the modern enterprise.',
  description        = 'PayFlow is the payments layer that every mid-market company needs but cannot build themselves. We handle multi-currency reconciliation, vendor payouts, and compliance in a single API. Current customers include logistics, manufacturing, and SaaS companies processing $2M in monthly volume. Net revenue retention is 124% — customers expand every quarter.',
  industry           = 'fintech',
  stage              = 'series_a',
  founded_year       = 2022,
  team_size          = 22,
  logo_url           = 'https://picsum.photos/seed/payflow-logo/200/200',
  cover_url          = 'https://picsum.photos/seed/payflow-cover/1200/400',
  pitch_video_url    = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  pitch_video_thumbnail = 'https://picsum.photos/seed/payflow-thumb/600/400',
  website            = 'https://payflow.io',
  linkedin_url       = 'https://linkedin.com/company/payflow-io',
  mrr                = 167000,
  arr                = 2000000,
  users_count        = 87,
  growth_rate        = 19,
  raising_amount     = 12000000,
  valuation          = 55000000,
  is_raising         = true,
  is_active          = true,
  views_count        = 3201,
  connections_count  = 2
WHERE profile_id = 'b1000000-0000-0000-0000-000000000002';

UPDATE public.startup_profiles SET
  company_name       = 'HealthAI',
  tagline            = 'AI diagnostics that give every clinic hospital-grade accuracy.',
  description        = 'HealthAI runs on the imaging and lab data that community clinics already collect. Our model flags early-stage cancer, diabetic retinopathy, and cardiac irregularities with 94% sensitivity — matching or beating specialist radiologists. We are HIPAA compliant and FDA 510(k) cleared. Deployed in 38 clinics across 6 states. Reducing misdiagnosis rates by 31%.',
  industry           = 'healthtech',
  stage              = 'seed',
  founded_year       = 2023,
  team_size          = 14,
  logo_url           = 'https://picsum.photos/seed/healthai-logo/200/200',
  cover_url          = 'https://picsum.photos/seed/healthai-cover/1200/400',
  pitch_video_url    = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  pitch_video_thumbnail = 'https://picsum.photos/seed/healthai-thumb/600/400',
  website            = 'https://healthai.co',
  linkedin_url       = 'https://linkedin.com/company/healthai-co',
  mrr                = 42000,
  arr                = 504000,
  users_count        = 38,
  growth_rate        = 35,
  raising_amount     = 5000000,
  valuation          = 28000000,
  is_raising         = true,
  is_active          = true,
  views_count        = 2104,
  connections_count  = 0
WHERE profile_id = 'b1000000-0000-0000-0000-000000000003';

UPDATE public.startup_profiles SET
  company_name       = 'GreenGrid',
  tagline            = 'The marketplace connecting renewable energy to commercial buyers.',
  description        = 'GreenGrid solves the last-mile problem in corporate sustainability: actually procuring verified renewable energy at scale. We aggregate supply from 200+ solar and wind producers and match them with commercial buyers through long-term Power Purchase Agreements. $8M GMV last quarter, growing 40% QoQ. Utility partnerships in Texas, California, and the Southeast.',
  industry           = 'climate',
  stage              = 'pre_seed',
  founded_year       = 2024,
  team_size          = 6,
  logo_url           = 'https://picsum.photos/seed/greengrid-logo/200/200',
  cover_url          = 'https://picsum.photos/seed/greengrid-cover/1200/400',
  pitch_video_url    = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  pitch_video_thumbnail = 'https://picsum.photos/seed/greengrid-thumb/600/400',
  website            = 'https://greengrid.energy',
  linkedin_url       = 'https://linkedin.com/company/greengrid-energy',
  mrr                = 8500,
  arr                = 102000,
  users_count        = 12,
  growth_rate        = 40,
  raising_amount     = 1500000,
  valuation          = 8000000,
  is_raising         = true,
  is_active          = true,
  views_count        = 982,
  connections_count  = 2
WHERE profile_id = 'b1000000-0000-0000-0000-000000000004';

UPDATE public.startup_profiles SET
  company_name       = 'EduSpace',
  tagline            = 'Adaptive learning that closes achievement gaps at scale.',
  description        = 'EduSpace builds a personalized learning path for every student based on their diagnostic gaps, learning speed, and engagement patterns. Teachers get a real-time dashboard. Students get video micro-lessons and practice problems that adapt every session. 45K MAU, up from 12K six months ago. CAC is $12, LTV is $180. Schools renew at 91%.',
  industry           = 'edtech',
  stage              = 'seed',
  founded_year       = 2023,
  team_size          = 11,
  logo_url           = 'https://picsum.photos/seed/eduspace-logo/200/200',
  cover_url          = 'https://picsum.photos/seed/eduspace-cover/1200/400',
  pitch_video_url    = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  pitch_video_thumbnail = 'https://picsum.photos/seed/eduspace-thumb/600/400',
  website            = 'https://eduspace.io',
  linkedin_url       = 'https://linkedin.com/company/eduspace-io',
  mrr                = 28000,
  arr                = 336000,
  users_count        = 45000,
  growth_rate        = 275,
  raising_amount     = 2500000,
  valuation          = 14000000,
  is_raising         = true,
  is_active          = true,
  views_count        = 1563,
  connections_count  = 2
WHERE profile_id = 'b1000000-0000-0000-0000-000000000005';

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Connections
-- ─────────────────────────────────────────────────────────────
-- Accepted (will get conversations + messages)
INSERT INTO public.connections (id, investor_id, startup_id, status, intro_message, created_at, updated_at) VALUES
  ('c1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'accepted', 'Watched your pitch — the market timing for enterprise AI automation is exactly right. Would love to connect.',
   NOW()-INTERVAL '30 days', NOW()-INTERVAL '29 days'),
  ('c1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'accepted', 'Those NRR numbers are exceptional for your stage. Let us talk.',
   NOW()-INTERVAL '22 days', NOW()-INTERVAL '21 days'),
  ('c1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005',
   'accepted', 'The retention curve you showed in the pitch is unlike anything I have seen in edtech. Really impressive.',
   NOW()-INTERVAL '14 days', NOW()-INTERVAL '13 days'),
  ('c1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004',
   'accepted', 'Renewable energy marketplaces are a massive opportunity. The utility partnerships are the real moat here.',
   NOW()-INTERVAL '10 days', NOW()-INTERVAL '9 days')
ON CONFLICT (investor_id, startup_id) DO NOTHING;

-- Pending connection requests
INSERT INTO public.connections (id, investor_id, startup_id, status, intro_message, created_at, updated_at) VALUES
  ('c1000000-0000-0000-0000-000000000005',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
   'pending', 'HealthAI is addressing a real crisis in diagnostic access. The FDA clearance is a huge milestone. Interested to learn more.',
   NOW()-INTERVAL '5 days', NOW()-INTERVAL '5 days'),
  ('c1000000-0000-0000-0000-000000000006',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'pending', 'Enterprise AI automation at this ARR growth rate is exactly what we look for at a16z. Your pitch was compelling.',
   NOW()-INTERVAL '3 days', NOW()-INTERVAL '3 days'),
  ('c1000000-0000-0000-0000-000000000007',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001',
   'pending', 'The back-office automation use case is underrated. I would love to understand your expansion strategy.',
   NOW()-INTERVAL '2 days', NOW()-INTERVAL '2 days'),
  ('c1000000-0000-0000-0000-000000000008',
   'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002',
   'pending', 'PayFlow is the kind of infrastructure play YC loves. Your go-to-market is very clean.',
   NOW()-INTERVAL '1 day', NOW()-INTERVAL '1 day'),
  ('c1000000-0000-0000-0000-000000000009',
   'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003',
   'pending', 'The FDA 510(k) clearance is a serious barrier to entry for competitors. Excited by your diagnostic accuracy numbers.',
   NOW()-INTERVAL '4 days', NOW()-INTERVAL '4 days'),
  ('c1000000-0000-0000-0000-000000000010',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'pending', 'Healthcare AI at this maturity is rare. I would like to understand your clinical partnership model.',
   NOW()-INTERVAL '6 hours', NOW()-INTERVAL '6 hours'),
  ('c1000000-0000-0000-0000-000000000011',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005',
   'pending', 'The 91% school renewal rate is the strongest signal I have seen in consumer edtech. Would love to connect.',
   NOW()-INTERVAL '8 hours', NOW()-INTERVAL '8 hours'),
  ('c1000000-0000-0000-0000-000000000012',
   'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004',
   'pending', 'Corporate sustainability procurement is a $400B market. GreenGrid has a real shot at owning a significant slice of it.',
   NOW()-INTERVAL '2 hours', NOW()-INTERVAL '2 hours')
ON CONFLICT (investor_id, startup_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Conversations (one per accepted connection)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.conversations (id, connection_id, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', NOW()-INTERVAL '29 days'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', NOW()-INTERVAL '21 days'),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', NOW()-INTERVAL '13 days'),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', NOW()-INTERVAL '9 days')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 7: Messages
-- ─────────────────────────────────────────────────────────────
-- Convo 1: Sarah Chen ↔ NeuralSync AI (Alex Rivera)
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Hi Alex — I just watched your pitch and I am genuinely impressed. The $180K ARR in 8 months with zero sales is exactly the kind of organic growth story we love at Sequoia. The market timing for enterprise AI automation feels right.',
   NOW()-INTERVAL '29 days'+INTERVAL '2 hours'),
  ('d1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',
   'Sarah, thank you so much — we are big fans of what Sequoia has built. Every customer we have came through referrals from happy users, so we know we have a real product. Would love to get on a call and walk you through our roadmap.',
   NOW()-INTERVAL '29 days'+INTERVAL '3 hours'),
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   'Absolutely. Can you share your latest deck in the meantime? I want our enterprise team to take a look before we meet.',
   NOW()-INTERVAL '28 days'),
  ('d1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001',
   'Sending it now. I also have updated metrics from last month — we signed 3 new enterprise accounts, which pushed MRR to $15K. Gross margin is 78%.',
   NOW()-INTERVAL '27 days'+INTERVAL '10 hours'),
  ('d1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001',
   '78% gross margin is exceptional for this stage. Our team is meeting next Tuesday. Aiming to get you an initial answer by end of week. Looking forward to the call.',
   NOW()-INTERVAL '25 days');

-- Convo 2: Michael Torres ↔ PayFlow (Maya Patel)
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002',
   'Michael, really excited to connect. a16z has been a huge inspiration for us. We are currently processing $2M in monthly volume and growing 19% month over month.',
   NOW()-INTERVAL '21 days'+INTERVAL '1 hour'),
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
   'Those numbers are impressive for your stage. What does net revenue retention look like? That is always my first question for infrastructure plays.',
   NOW()-INTERVAL '20 days'+INTERVAL '4 hours'),
  ('d1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002',
   'We are at 124% NRR. The expansion revenue started kicking in around month 4 as customers add more payment flows. Happy to walk you through the cohort analysis — it tells the full story.',
   NOW()-INTERVAL '20 days'+INTERVAL '6 hours'),
  ('d1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002',
   '124% is really strong. Let us set up a 30-minute intro call this week. My team will reach out to get something on the calendar.',
   NOW()-INTERVAL '19 days'),
  ('d1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000002',
   'Perfect. I will have our deck and data room ready. We also have a few design partner agreements we can share — including one with a $500M logistics company.',
   NOW()-INTERVAL '18 days'+INTERVAL '9 hours');

-- Convo 3: Emma Nguyen ↔ EduSpace (Tyler Brooks)
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
   'Tyler — the retention curve you showed in your pitch literally made me stop scrolling. 45K MAU with 91% school renewal is unlike anything I have seen in edtech. How many students do you have on paid plans?',
   NOW()-INTERVAL '13 days'+INTERVAL '2 hours'),
  ('d1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000005',
   'Emma, great question. About 8,200 students are on paid plans through their schools. The rest are in a free tier that teachers use to pilot the product. Conversion from free to paid at the school level is 34%.',
   NOW()-INTERVAL '12 days'+INTERVAL '5 hours'),
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
   '34% school conversion is really healthy. I would love to understand the unit economics. What is your CAC and LTV at the school level?',
   NOW()-INTERVAL '11 days'),
  ('d1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000005',
   'At the school level: CAC is around $380 (almost all inside sales), average contract is $2,800/year, and average school stays for 3+ years, so LTV is around $8,400. We will have a detailed breakdown ready for our call.',
   NOW()-INTERVAL '10 days'+INTERVAL '3 hours'),
  ('d1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',
   'LTV/CAC of 22x is exceptional. I am very interested in leading your round. Let us get together next week — I want to bring our consumer team partner.',
   NOW()-INTERVAL '8 days');

-- Convo 4: David Kim ↔ GreenGrid (Sofia Martinez)
INSERT INTO public.messages (conversation_id, sender_id, content, created_at) VALUES
  ('d1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000004',
   'David, I am a big fan of Founders Fund''s climate portfolio — especially the carbon capture work. GreenGrid is solving the corporate procurement side of the renewable transition, which I think is actually the bigger near-term opportunity.',
   NOW()-INTERVAL '9 days'+INTERVAL '1 hour'),
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004',
   'Sofia — your model is fascinating. The utility partnerships are the real moat here; they are extremely hard to replicate. What is your current GMV and how quickly is it growing?',
   NOW()-INTERVAL '8 days'+INTERVAL '3 hours'),
  ('d1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000004',
   'We hit $8M GMV last quarter, growing 40% QoQ. The Texas partnership with GridTX went live 6 weeks ago and has already accounted for 30% of new supply. We expect Q3 GMV to be above $11M.',
   NOW()-INTERVAL '7 days'+INTERVAL '11 hours'),
  ('d1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004',
   'That is impressive execution for a 6-person team. Are you attending ClimaTech Summit next month? Would love to meet in person and do a deeper dive.',
   NOW()-INTERVAL '6 days'),
  ('d1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000004',
   'Yes, we will be there! I am actually speaking on a panel about marketplace models in energy. Would be great to grab coffee on the sidelines and go deeper on the numbers.',
   NOW()-INTERVAL '5 days'+INTERVAL '4 hours');

-- ─────────────────────────────────────────────────────────────
-- STEP 8: Notifications for startups (connection requests)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.notifications (user_id, type, title, body, data, created_at) VALUES
  -- NeuralSync: accepted connections (already happened)
  ('b1000000-0000-0000-0000-000000000001','connection_accepted','Sarah Chen connected with you',
   'Sequoia Capital partner Sarah Chen accepted your connection. Start the conversation.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000001"}', NOW()-INTERVAL '29 days'),
  -- NeuralSync: pending requests
  ('b1000000-0000-0000-0000-000000000001','connection_request','New connection request from a16z',
   'Michael Torres from Andreessen Horowitz wants to connect with NeuralSync AI.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000006"}', NOW()-INTERVAL '3 days'),
  ('b1000000-0000-0000-0000-000000000001','connection_request','New connection request from Benchmark',
   'Emma Nguyen from Benchmark wants to connect with NeuralSync AI.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000007"}', NOW()-INTERVAL '2 days'),
  -- PayFlow notifications
  ('b1000000-0000-0000-0000-000000000002','connection_accepted','Michael Torres connected with you',
   'a16z General Partner Michael Torres accepted your connection. Say hello.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000002"}', NOW()-INTERVAL '21 days'),
  ('b1000000-0000-0000-0000-000000000002','connection_request','New connection request from YC',
   'Marcus Johnson from Y Combinator wants to connect with PayFlow.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000008"}', NOW()-INTERVAL '1 day'),
  -- HealthAI notifications
  ('b1000000-0000-0000-0000-000000000003','connection_request','New connection request from Sequoia',
   'Sarah Chen from Sequoia Capital wants to connect with HealthAI.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000005"}', NOW()-INTERVAL '5 days'),
  ('b1000000-0000-0000-0000-000000000003','connection_request','New connection request from Founders Fund',
   'David Kim from Founders Fund wants to connect with HealthAI.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000009"}', NOW()-INTERVAL '4 days'),
  ('b1000000-0000-0000-0000-000000000003','connection_request','New connection request from Benchmark',
   'Emma Nguyen from Benchmark wants to connect with HealthAI.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000010"}', NOW()-INTERVAL '6 hours'),
  -- GreenGrid notifications
  ('b1000000-0000-0000-0000-000000000004','connection_accepted','David Kim connected with you',
   'Founders Fund partner David Kim accepted your connection. Let us get to work.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000004"}', NOW()-INTERVAL '9 days'),
  ('b1000000-0000-0000-0000-000000000004','connection_request','New connection request from YC',
   'Marcus Johnson from Y Combinator wants to connect with GreenGrid.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000012"}', NOW()-INTERVAL '2 hours'),
  -- EduSpace notifications
  ('b1000000-0000-0000-0000-000000000005','connection_accepted','Emma Nguyen connected with you',
   'Benchmark Principal Emma Nguyen is very interested. Check your messages.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000003"}', NOW()-INTERVAL '13 days'),
  ('b1000000-0000-0000-0000-000000000005','connection_request','New connection request from Sequoia',
   'Sarah Chen from Sequoia Capital wants to connect with EduSpace.',
   '{"connection_id":"c1000000-0000-0000-0000-000000000011"}', NOW()-INTERVAL '8 hours'),
  -- pitch_viewed notifications for startups
  ('b1000000-0000-0000-0000-000000000001','pitch_viewed','Your pitch is getting attention',
   'An investor just watched your full pitch. Keep the momentum going.',
   '{}', NOW()-INTERVAL '12 hours'),
  ('b1000000-0000-0000-0000-000000000002','pitch_viewed','Your pitch is getting attention',
   'Multiple investors viewed your pitch today.',
   '{}', NOW()-INTERVAL '6 hours'),
  ('b1000000-0000-0000-0000-000000000003','pitch_viewed','Your pitch is trending',
   'HealthAI had 47 pitch views today — your highest day yet.',
   '{}', NOW()-INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 9: Pitch views (for realistic view counts)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.pitch_views (startup_id, viewer_id, watch_duration_s, created_at)
SELECT
  sp.id,
  inv.profile_id,
  45 + floor(random() * 30)::int,
  NOW() - (random() * INTERVAL '30 days')
FROM public.startup_profiles sp
CROSS JOIN public.investor_profiles inv
WHERE sp.profile_id IN (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005'
)
AND inv.profile_id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005'
)
ON CONFLICT DO NOTHING;
