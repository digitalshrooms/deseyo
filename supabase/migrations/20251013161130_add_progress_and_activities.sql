/*
  # Add progress tracking and activities functionality

  1. Changes to Tables
    - Add `last_lesson_id` UUID column to `users` table
    - Update `progress` JSONB structure in `users` table
    - Add `title` column to `forum_posts` table
    - Create `activities` table for live feed

  2. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `author_id` (uuid, references users)
      - `activity_type` (text) - 'lesson_completed' or 'forum_post'
      - `lesson_id` (uuid, nullable)
      - `lesson_title` (text, nullable)
      - `forum_post_id` (uuid, nullable)
      - `category` (text, nullable)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on activities table
    - Add policies for authenticated users
*/

-- Add last_lesson_id to users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_lesson_id'
  ) THEN
    ALTER TABLE users ADD COLUMN last_lesson_id UUID;
  END IF;
END $$;

-- Update progress structure for existing users
UPDATE users 
SET progress = '{"completedLessons": [], "lastLessonId": "", "totalCompleted": 0}'::jsonb
WHERE progress = '{}'::jsonb OR progress IS NULL;

-- Add title column to forum_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'forum_posts' AND column_name = 'title'
  ) THEN
    ALTER TABLE forum_posts ADD COLUMN title TEXT NOT NULL DEFAULT 'Bez názvu';
  END IF;
END $$;

-- Create activities table for live feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson_completed', 'forum_post')),
  lesson_id UUID,
  lesson_title TEXT,
  forum_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_author_id ON activities(author_id);