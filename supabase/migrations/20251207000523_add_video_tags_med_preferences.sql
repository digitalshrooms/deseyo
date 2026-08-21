/*
  # Přidání video tagů, MED trackingu a user preferences

  1. Nové tabulky:
    - `video_tags` - tagy pro všechna videa
    - `med_tracking` - sledování týdenního MED
    - `user_preferences` - preference uživatele
  
  2. Bezpečnost:
    - RLS povoleno na všech tabulkách
    - Politiky pro autentizované uživatele
*/

-- Video tagy tabulka
CREATE TABLE IF NOT EXISTS video_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  tag_type text NOT NULL CHECK (tag_type IN ('TYPE', 'AREA', 'LENGTH', 'LEVEL', 'NEED')),
  tag_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, tag_type, tag_value)
);

ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Video tags viewable by authenticated users"
  ON video_tags FOR SELECT
  TO authenticated
  USING (true);

-- MED tracking tabulka
CREATE TABLE IF NOT EXISTS med_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  completed_sessions integer DEFAULT 0,
  target_sessions integer DEFAULT 3,
  last_session_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE med_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MED tracking"
  ON med_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MED tracking"
  ON med_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MED tracking"
  ON med_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User preferences tabulka
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notification_daily_lesson boolean DEFAULT true,
  notification_live_events boolean DEFAULT true,
  preferred_time text CHECK (preferred_time IN ('morning', 'after_work', 'evening', 'flexible')),
  communication_tone text CHECK (communication_tone IN ('calm', 'practical', 'mixed')) DEFAULT 'calm',
  energy_level text CHECK (energy_level IN ('exhausted', 'balanced', 'energetic')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_video_tags_course ON video_tags(course_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_type_value ON video_tags(tag_type, tag_value);
CREATE INDEX IF NOT EXISTS idx_med_tracking_user_week ON med_tracking(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
