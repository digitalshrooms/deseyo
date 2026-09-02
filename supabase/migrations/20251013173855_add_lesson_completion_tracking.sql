/*
  # Add Lesson Completion Tracking Table

  1. New Tables
    - `lesson_completions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `lesson_id` (uuid, foreign key to courses)
      - `completed_at` (timestamptz) - timestamp when lesson was marked complete
      - `uncompleted_at` (timestamptz) - timestamp when lesson was unmarked (nullable)
      - `is_completed` (boolean) - current completion status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `lesson_completions` table
    - Add policies for authenticated users to manage their own completion records

  3. Important Notes
    - Tracks both completion and un-completion events with timestamps
    - Allows querying completion history
    - `is_completed` field tracks current state for easy filtering
*/

CREATE TABLE IF NOT EXISTS lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL,
  completed_at timestamptz,
  uncompleted_at timestamptz,
  is_completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completion records"
  ON lesson_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completion records"
  ON lesson_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completion records"
  ON lesson_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completion records"
  ON lesson_completions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_is_completed ON lesson_completions(is_completed);
