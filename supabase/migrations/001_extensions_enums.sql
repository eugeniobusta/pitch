-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE account_type AS ENUM ('startup', 'investor');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE startup_stage AS ENUM ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus');
CREATE TYPE industry_type AS ENUM (
  'ai_ml', 'fintech', 'healthtech', 'edtech', 'saas',
  'marketplace', 'consumer', 'deeptech', 'climate', 'other'
);
CREATE TYPE notification_type AS ENUM (
  'connection_request', 'connection_accepted', 'message', 'pitch_viewed', 'system'
);
