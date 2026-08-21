/*
  # Gamification Foundation - Event Tracking & Content IDs
  
  1. Tables Modified
    - courses
      - Add stable_id (unique identifier like "YOGA_L1_CORE_01")
      - Add content_type (yoga, faceyoga, physioyoga, ritual, live, recording)
      - Add plan_relevance (array: ["Restart", "L1", "L2"])
      - Add tags (array: ["short", "evening", "energy_low", "office"])
  
  2. New Tables
    - rituals
      - For Mind & Life content (audio, video, PDF)
      - stable_id, title, description, content_type, ritual_type
      - url, thumbnail_url, duration, tags
    
    - live_events
      - For live sessions and their recordings
      - stable_id, title, description, event_type
      - scheduled_at, video_url, tags
    
    - user_events
      - Core event tracking table
      - Logs: lesson_started, lesson_completed, ritual_started, ritual_completed, live_joined, recording_played
      - user_id, event_type, content_id, content_type, metadata (jsonb)
  
  3. Security
    - Enable RLS on all new tables
    - Users can create own events
    - Everyone can read content (rituals, live_events)
  
  4. Important Notes
    - Event tracking is foundation for future gamification
    - Stable IDs allow content to be tracked consistently over time
    - Tags enable flexible content filtering and recommendations
    - MED calculation can be built on top of user_events
*/

-- 1. Extend courses table
DO $$
BEGIN
  -- Add stable_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'stable_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN stable_id text UNIQUE;
  END IF;
  
  -- Add content_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE courses ADD COLUMN content_type text DEFAULT 'yoga';
  END IF;
  
  -- Add plan_relevance column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'plan_relevance'
  ) THEN
    ALTER TABLE courses ADD COLUMN plan_relevance text[] DEFAULT '{}';
  END IF;
  
  -- Add tags column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'tags'
  ) THEN
    ALTER TABLE courses ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- 2. Create rituals table
CREATE TABLE IF NOT EXISTS rituals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Mind & Life',
  content_type text NOT NULL CHECK (content_type IN ('audio', 'video', 'pdf')),
  ritual_type text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  duration integer,
  tags text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rituals"
  ON rituals FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create live_events table
CREATE TABLE IF NOT EXISTS live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('live_session', 'recording')),
  scheduled_at timestamptz,
  recorded_at timestamptz,
  video_url text,
  thumbnail_url text,
  duration integer,
  tags text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live events"
  ON live_events FOR SELECT
  TO authenticated
  USING (true);

-- 4. Create user_events table (core event tracking)
CREATE TABLE IF NOT EXISTS user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'lesson_started', 
    'lesson_completed', 
    'ritual_started', 
    'ritual_completed',
    'live_joined',
    'recording_played'
  )),
  content_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN (
    'yoga', 
    'faceyoga', 
    'physioyoga', 
    'ritual', 
    'live', 
    'recording'
  )),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Create index for fast MED calculation
CREATE INDEX IF NOT EXISTS idx_user_events_user_date ON user_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type, content_type);

-- 6. Update existing courses with stable_ids (based on current pattern)
UPDATE courses SET 
  stable_id = CONCAT('YOGA_', UPPER(category), '_', LPAD(order_index::text, 2, '0')),
  content_type = 'yoga',
  plan_relevance = CASE 
    WHEN is_premium THEN ARRAY['L1', 'L2']
    ELSE ARRAY['Restart']
  END,
  tags = CASE
    WHEN category = 'Meditace' THEN ARRAY['meditation', 'mindfulness']
    WHEN category = 'Jóga & tělo' THEN ARRAY['movement', 'strength']
    WHEN category = 'Energie' THEN ARRAY['energy', 'chakra']
    WHEN category = 'Osobní růst' THEN ARRAY['personal_growth', 'motivation']
    ELSE ARRAY[]::text[]
  END
WHERE stable_id IS NULL;