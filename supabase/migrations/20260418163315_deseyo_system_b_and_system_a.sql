/*
  # Deseyo System B (Onboarding D1-D30) + System A support

  1. New Tables
     - `onboarding_content` - System B denni obsah D1-D30
       * day_index 1-30 (unique)
       * title, subtitle, body text
       * video_url / audio_url (volitelne)
       * duration, tags
     - `user_onboarding_progress` - audit splnenych/preskocenych dni
     - `user_daily_messages` - audit jednorazovych zprav (D3/D4 confirmation, sunday messages)
     - `lesson_primary_flag` column on courses for System A primary selection
     - `library_level_tag` column on courses for L1/L2/Universal

  2. Content
     - 30 placeholder rows pro onboarding_content (tym je doplni)

  3. Security
     - RLS enabled on all new tables
     - onboarding_content: authenticated read only
     - user_onboarding_progress: user can manage own
     - user_daily_messages: user can manage own
*/

-- =================================================================
-- 1) onboarding_content - System B denni obsah
-- =================================================================
CREATE TABLE IF NOT EXISTS onboarding_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_index integer NOT NULL UNIQUE CHECK (day_index BETWEEN 1 AND 30),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  body_text text DEFAULT '',
  video_url text DEFAULT '',
  audio_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  duration integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read active onboarding content" ON onboarding_content;
CREATE POLICY "Authenticated can read active onboarding content"
  ON onboarding_content FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =================================================================
-- 2) user_onboarding_progress - audit
-- =================================================================
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_index integer NOT NULL CHECK (day_index BETWEEN 1 AND 30),
  action text NOT NULL CHECK (action IN ('completed', 'skipped')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, day_index)
);

ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their onboarding progress" ON user_onboarding_progress;
CREATE POLICY "Users can read their onboarding progress"
  ON user_onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their onboarding progress" ON user_onboarding_progress;
CREATE POLICY "Users can insert their onboarding progress"
  ON user_onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their onboarding progress" ON user_onboarding_progress;
CREATE POLICY "Users can update their onboarding progress"
  ON user_onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 3) user_daily_messages - audit denich zprav (sunday, D3/D4 confirmation)
-- =================================================================
CREATE TABLE IF NOT EXISTS user_daily_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type text NOT NULL,
  message_variant integer DEFAULT 0,
  shown_at timestamptz DEFAULT now()
);

ALTER TABLE user_daily_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their daily messages" ON user_daily_messages;
CREATE POLICY "Users can read their daily messages"
  ON user_daily_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their daily messages" ON user_daily_messages;
CREATE POLICY "Users can insert their daily messages"
  ON user_daily_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_daily_messages ON user_daily_messages(user_id, message_type, shown_at DESC);

-- =================================================================
-- 4) Extensions to courses - primary flag + level tag for System A
-- =================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_primary_lesson') THEN
    ALTER TABLE courses ADD COLUMN is_primary_lesson boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'library_level_tag') THEN
    ALTER TABLE courses ADD COLUMN library_level_tag text DEFAULT 'Universal' CHECK (library_level_tag IN ('L1', 'L2', 'Universal'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'body_area_tags') THEN
    ALTER TABLE courses ADD COLUMN body_area_tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'face_zone_tags') THEN
    ALTER TABLE courses ADD COLUMN face_zone_tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_full_body') THEN
    ALTER TABLE courses ADD COLUMN is_full_body boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_full_face') THEN
    ALTER TABLE courses ADD COLUMN is_full_face boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'lesson_type') THEN
    ALTER TABLE courses ADD COLUMN lesson_type text DEFAULT 'general' CHECK (lesson_type IN ('fyzio_yoga', 'face_yoga', 'mind_life', 'time_office', 'general'));
  END IF;
END $$;

-- =================================================================
-- 5) user_last_used_videos - pro fallback pravidla
-- =================================================================
CREATE TABLE IF NOT EXISTS user_last_used_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL,
  last_used_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE user_last_used_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their last used videos" ON user_last_used_videos;
CREATE POLICY "Users can read their last used videos"
  ON user_last_used_videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their last used videos" ON user_last_used_videos;
CREATE POLICY "Users can insert their last used videos"
  ON user_last_used_videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their last used videos" ON user_last_used_videos;
CREATE POLICY "Users can update their last used videos"
  ON user_last_used_videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- 6) Seed 30 placeholder rows for onboarding content
-- =================================================================
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..30 LOOP
    INSERT INTO onboarding_content (day_index, title, subtitle, body_text)
    VALUES (
      i,
      'Den ' || i,
      CASE
        WHEN i = 1 THEN 'Zacinas'
        WHEN i = 2 THEN 'Tvuj cas'
        WHEN i = 3 THEN 'Prvni navrat'
        WHEN i = 7 THEN 'Prvni reflexe'
        WHEN i = 14 THEN 'Dva tydny'
        WHEN i = 21 THEN 'Tri tydny'
        WHEN i = 30 THEN 'Konec onboardingu'
        ELSE 'Pokracujes'
      END,
      'Obsah dne ' || i || ' — doplni tym.'
    )
    ON CONFLICT (day_index) DO NOTHING;
  END LOOP;
END $$;
