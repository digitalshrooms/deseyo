/*
  # Deseyo Platform Architecture - Core Extensions

  This migration extends the `users` table with all fields required by the
  Deseyo two-system architecture (Onboarding B + Training Plan A) and creates
  supporting tables for weekly rotating texts, seasonal messages, credits log,
  reflections, check-ins and pause mode.

  1. Users Table Extensions
     - plan_tag (RESTART/DESEYO) - determines session frequency (3x vs 5x weekly)
     - level_tag (L1/L2) - determines content difficulty; L1 auto for new users
     - body_area_tag (AREA_*) - body focus area (back, neck, core, hip, etc.)
     - primary_priority_tag (BODY/FACE) - main lesson track
     - face_zone_tag (ZONE_*) - facial zone focus for L2 face users
     - high_capacity_candidate (boolean)
     - onboarding_day_index (1-30) - current day in System B
     - weekly_session_counter / library_session_counter / l2_session_counter
     - consultation_credits (sbira se v L1, vyuziti v L2)
     - weekly_text_index (rotating pointer)
     - special_moment_last_used, credit_info_shown
     - anchor_time, q6_best_time, q8_email_pref
     - time_office_active (denni reset)
     - pause_active, pause_start, pause_end, pause_count_90d
     - reflections/checkins/intentions stored in child tables

  2. New Tables
     - `weekly_texts` - filozoficky zasobnik (citaty, afirmace)
     - `seasonal_messages` - sezonni zpravy (4x rocne)
     - `user_credits_log` - audit kreditu (duvod, datum)
     - `user_reflections` - D7/D14/D21/D30 reflexe
     - `user_checkins` - tribodovy check-in
     - `user_intentions` - predsevzeti D1, D30 goals
     - `user_seen_messages` - tracking jednorazovych zprav (sezonni, credit_info)

  3. Security
     - RLS enabled on all new tables
     - Strict policies: users can only read/write their own data
     - `weekly_texts` and `seasonal_messages` - anyone authenticated can read
*/

-- =================================================================
-- 1) USERS TABLE - nova pole
-- =================================================================
DO $$
BEGIN
  -- plan_tag (RESTART / DESEYO)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan_tag') THEN
    ALTER TABLE users ADD COLUMN plan_tag text DEFAULT 'RESTART';
  END IF;

  -- level_tag (L1 / L2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level_tag') THEN
    ALTER TABLE users ADD COLUMN level_tag text DEFAULT 'L1';
  END IF;

  -- body_area_tag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'body_area_tag') THEN
    ALTER TABLE users ADD COLUMN body_area_tag text DEFAULT 'AREA_FULL_BODY';
  END IF;

  -- primary_priority_tag (BODY / FACE)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primary_priority_tag') THEN
    ALTER TABLE users ADD COLUMN primary_priority_tag text DEFAULT 'BODY';
  END IF;

  -- face_zone_tag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_zone_tag') THEN
    ALTER TABLE users ADD COLUMN face_zone_tag text;
  END IF;

  -- high_capacity_candidate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'high_capacity_candidate') THEN
    ALTER TABLE users ADD COLUMN high_capacity_candidate boolean DEFAULT false;
  END IF;

  -- onboarding_day_index (1 - 30)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_day_index') THEN
    ALTER TABLE users ADD COLUMN onboarding_day_index integer DEFAULT 1;
  END IF;

  -- weekly_session_counter (rolling 7 day window, primary sessions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'weekly_session_counter') THEN
    ALTER TABLE users ADD COLUMN weekly_session_counter integer DEFAULT 0;
  END IF;

  -- library_session_counter (cyklicke pocitadlo pro body_area rytmus)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'library_session_counter') THEN
    ALTER TABLE users ADD COLUMN library_session_counter integer DEFAULT 0;
  END IF;

  -- l2_session_counter
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'l2_session_counter') THEN
    ALTER TABLE users ADD COLUMN l2_session_counter integer DEFAULT 0;
  END IF;

  -- consultation_credits (sbira se v L1, vyuziti v L2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'consultation_credits') THEN
    ALTER TABLE users ADD COLUMN consultation_credits integer DEFAULT 0;
  END IF;

  -- weekly_text_index
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'weekly_text_index') THEN
    ALTER TABLE users ADD COLUMN weekly_text_index integer DEFAULT 0;
  END IF;

  -- special_moment_last_used (datum)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'special_moment_last_used') THEN
    ALTER TABLE users ADD COLUMN special_moment_last_used timestamptz;
  END IF;

  -- credit_info_shown
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credit_info_shown') THEN
    ALTER TABLE users ADD COLUMN credit_info_shown boolean DEFAULT false;
  END IF;

  -- anchor_time (cas cviceni)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'anchor_time') THEN
    ALTER TABLE users ADD COLUMN anchor_time text;
  END IF;

  -- q6_best_time (pro notifikace)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'q6_best_time') THEN
    ALTER TABLE users ADD COLUMN q6_best_time text;
  END IF;

  -- q8_email_pref
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'q8_email_pref') THEN
    ALTER TABLE users ADD COLUMN q8_email_pref text;
  END IF;

  -- time_office_active (denni reset)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_office_active') THEN
    ALTER TABLE users ADD COLUMN time_office_active boolean DEFAULT false;
  END IF;

  -- Pauza mod
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pause_active') THEN
    ALTER TABLE users ADD COLUMN pause_active boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pause_start') THEN
    ALTER TABLE users ADD COLUMN pause_start timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pause_end') THEN
    ALTER TABLE users ADD COLUMN pause_end timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pause_count_90d') THEN
    ALTER TABLE users ADD COLUMN pause_count_90d integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pause_count_reset_at') THEN
    ALTER TABLE users ADD COLUMN pause_count_reset_at timestamptz DEFAULT now();
  END IF;

  -- weekly_session_counter reset tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'weekly_counter_reset_at') THEN
    ALTER TABLE users ADD COLUMN weekly_counter_reset_at timestamptz DEFAULT now();
  END IF;

  -- time_office_last_reset (denni reset)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'time_office_last_reset') THEN
    ALTER TABLE users ADD COLUMN time_office_last_reset timestamptz DEFAULT now();
  END IF;
END $$;

-- =================================================================
-- 2) weekly_texts - zasobnik rotujicich textu
-- =================================================================
CREATE TABLE IF NOT EXISTS weekly_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_content text NOT NULL,
  author text DEFAULT '',
  category text DEFAULT 'philosophy',
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read active weekly texts" ON weekly_texts;
CREATE POLICY "Anyone authenticated can read active weekly texts"
  ON weekly_texts FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Anon can read active weekly texts" ON weekly_texts;
CREATE POLICY "Anon can read active weekly texts"
  ON weekly_texts FOR SELECT
  TO anon
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_weekly_texts_order ON weekly_texts(order_index) WHERE is_active = true;

-- =================================================================
-- 3) seasonal_messages
-- =================================================================
CREATE TABLE IF NOT EXISTS seasonal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text NOT NULL CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  message text NOT NULL,
  display_start_month integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seasonal_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read seasonal messages" ON seasonal_messages;
CREATE POLICY "Anyone authenticated can read seasonal messages"
  ON seasonal_messages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =================================================================
-- 4) user_credits_log - audit prideleni kreditu
-- =================================================================
CREATE TABLE IF NOT EXISTS user_credits_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  delta integer NOT NULL DEFAULT 1,
  balance_after integer NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_credits_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their credit log" ON user_credits_log;
CREATE POLICY "Users can read their credit log"
  ON user_credits_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their credit log" ON user_credits_log;
CREATE POLICY "Users can insert their credit log"
  ON user_credits_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_credits_log_user ON user_credits_log(user_id, created_at DESC);

-- =================================================================
-- 5) user_reflections - D7/D14/D21/D30
-- =================================================================
CREATE TABLE IF NOT EXISTS user_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_day integer NOT NULL CHECK (reflection_day IN (7, 14, 21, 30)),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, reflection_day)
);

ALTER TABLE user_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their reflections" ON user_reflections;
CREATE POLICY "Users can read their reflections"
  ON user_reflections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their reflections" ON user_reflections;
CREATE POLICY "Users can insert their reflections"
  ON user_reflections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reflections" ON user_reflections;
CREATE POLICY "Users can update their reflections"
  ON user_reflections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 6) user_checkins - tribodovy check-in
-- =================================================================
CREATE TABLE IF NOT EXISTS user_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_day integer NOT NULL CHECK (checkin_day IN (7, 14, 21, 30)),
  body_feeling integer CHECK (body_feeling BETWEEN 1 AND 5),
  mind_feeling integer CHECK (mind_feeling BETWEEN 1 AND 5),
  energy_feeling integer CHECK (energy_feeling BETWEEN 1 AND 5),
  note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, checkin_day)
);

ALTER TABLE user_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their checkins" ON user_checkins;
CREATE POLICY "Users can read their checkins"
  ON user_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their checkins" ON user_checkins;
CREATE POLICY "Users can insert their checkins"
  ON user_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their checkins" ON user_checkins;
CREATE POLICY "Users can update their checkins"
  ON user_checkins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 7) user_intentions - predsevzeti D1 + D30 goals
-- =================================================================
CREATE TABLE IF NOT EXISTS user_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('d1_intention', 'd1_success', 'd30_goal')),
  text_content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, kind)
);

ALTER TABLE user_intentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their intentions" ON user_intentions;
CREATE POLICY "Users can read their intentions"
  ON user_intentions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their intentions" ON user_intentions;
CREATE POLICY "Users can insert their intentions"
  ON user_intentions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their intentions" ON user_intentions;
CREATE POLICY "Users can update their intentions"
  ON user_intentions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 8) user_seen_messages - tracking jednorazovych zprav
-- =================================================================
CREATE TABLE IF NOT EXISTS user_seen_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_key text NOT NULL,
  seen_at timestamptz DEFAULT now(),
  UNIQUE (user_id, message_key)
);

ALTER TABLE user_seen_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their seen messages" ON user_seen_messages;
CREATE POLICY "Users can read their seen messages"
  ON user_seen_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their seen messages" ON user_seen_messages;
CREATE POLICY "Users can insert their seen messages"
  ON user_seen_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their seen messages" ON user_seen_messages;
CREATE POLICY "Users can update their seen messages"
  ON user_seen_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
