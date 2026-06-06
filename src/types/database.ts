export type AccountType = 'startup' | 'investor';
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';
export type StartupStage = 'idea' | 'pre_seed' | 'seed' | 'series_a' | 'series_b_plus';
export type IndustryType =
  | 'ai_ml'
  | 'fintech'
  | 'healthtech'
  | 'edtech'
  | 'saas'
  | 'marketplace'
  | 'consumer'
  | 'deeptech'
  | 'climate'
  | 'other';

export interface Profile {
  id: string;
  account_type: AccountType;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  push_token: string | null;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface StartupProfile {
  id: string;
  profile_id: string;
  company_name: string;
  tagline: string;
  description: string | null;
  industry: IndustryType;
  stage: StartupStage;
  founded_year: number | null;
  team_size: number | null;
  logo_url: string | null;
  cover_url: string | null;
  pitch_video_url: string | null;
  pitch_video_thumbnail: string | null;
  pitch_deck_url: string | null;
  allow_direct_messages: boolean;
  website: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  mrr: number | null;
  arr: number | null;
  users_count: number | null;
  growth_rate: number | null;
  raising_amount: number | null;
  valuation: number | null;
  is_raising: boolean;
  is_active: boolean;
  views_count: number;
  connections_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface InvestorProfile {
  id: string;
  profile_id: string;
  firm_name: string | null;
  title: string | null;
  bio: string | null;
  industries: IndustryType[];
  stages: StartupStage[];
  min_investment: number | null;
  max_investment: number | null;
  portfolio_count: number | null;
  is_verified: boolean;
  is_accredited: boolean;
  linkedin_url: string | null;
  twitter_url: string | null;
  connections_count: number;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  investor_id: string;
  startup_id: string;
  status: ConnectionStatus;
  intro_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  connection_id: string | null;
  investor_id: string | null;
  startup_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface FeedItem extends StartupProfile {
  profile: Profile;
  is_connected: boolean;
  connection_status: ConnectionStatus | null;
  is_liked: boolean;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      startup_profiles: {
        Row: StartupProfile;
        Insert: Partial<StartupProfile>;
        Update: Partial<StartupProfile>;
      };
      investor_profiles: {
        Row: InvestorProfile;
        Insert: Partial<InvestorProfile>;
        Update: Partial<InvestorProfile>;
      };
      connections: {
        Row: Connection;
        Insert: Partial<Connection>;
        Update: Partial<Connection>;
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation>;
        Update: Partial<Conversation>;
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
      };
    };
    Functions: {
      get_personalized_feed: {
        Args: { p_investor_id: string; p_limit: number; p_offset: number };
        Returns: FeedItem[];
      };
    };
  };
};
