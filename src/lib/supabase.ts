import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  username_changed_at?: string | null;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  zip?: string;
  subscription_plan: 'Basic' | 'Premium' | 'Legend';
  progress: Record<string, any>;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean;
  learning_preference?: 'frequent' | 'flexible';
  preferred_schedule?: 'daily' | 'every_two_days';
  current_plan?: 'Restart' | 'L1' | 'L2';
  current_week?: number;
  current_day?: number;
  plan_start_date?: string;
  last_activity_date?: string;
  plan_tag?: 'RESTART' | 'DESEYO';
  level_tag?: 'L1' | 'L2';
  body_area_tag?: string;
  primary_priority_tag?: 'BODY' | 'FACE';
  face_zone_tag?: string | null;
  high_capacity_candidate?: boolean;
  onboarding_day_index?: number;
  weekly_session_counter?: number;
  library_session_counter?: number;
  l2_session_counter?: number;
  consultation_credits?: number;
  weekly_text_index?: number;
  special_moment_last_used?: string | null;
  credit_info_shown?: boolean;
  anchor_time?: string | null;
  q6_best_time?: string | null;
  q8_email_pref?: string | null;
  time_office_active?: boolean;
  pause_active?: boolean;
  pause_start?: string | null;
  pause_end?: string | null;
  pause_count_90d?: number;
  pause_count_reset_at?: string | null;
  weekly_counter_reset_at?: string | null;
  time_office_last_reset?: string | null;
  subscription_status?: 'active' | 'canceled' | 'unpaid' | 'pending';
  subscription_type?: 'L1' | 'L2' | null;
  subscription_expires_at?: string | null;
  email_verified_at?: string | null;
};

export type WeeklyText = {
  id: string;
  text_content: string;
  author: string;
  category: string;
  order_index: number;
  is_active: boolean;
};

export type SeasonalMessage = {
  id: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  message: string;
  display_start_month: number;
};

export type OnboardingContent = {
  id: string;
  day_index: number;
  title: string;
  subtitle: string;
  body_text: string;
  video_url: string;
  audio_url: string;
  thumbnail_url: string;
  duration: number;
  tags: string[];
  is_active: boolean;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  is_premium: boolean;
  order_index: number;
  created_at: string;
  tags?: string[];
  content_type?: 'yoga' | 'faceyoga' | 'physioyoga';
  stable_id?: string;
  plan_relevance?: string[];
};

export type ForumPost = {
  id: string;
  author_id: string;
  category: string;
  content: string;
  image_url?: string;
  created_at: string;
  author?: User;
};

export type ForumComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: User;
};
