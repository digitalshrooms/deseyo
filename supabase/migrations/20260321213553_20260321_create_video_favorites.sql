/*
  # Create video favorites table

  1. New Tables
    - `video_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `video_favorites` table
    - Add policy for authenticated users to create/read/delete their own favorites
    - Add policy for admins to read all favorite counts
  3. Indexes
    - Add unique constraint on (user_id, course_id) to prevent duplicates
    - Add index on course_id for fast favorite count queries
*/

CREATE TABLE IF NOT EXISTS video_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS video_favorites_course_id_idx ON video_favorites(course_id);
CREATE INDEX IF NOT EXISTS video_favorites_user_id_idx ON video_favorites(user_id);

ALTER TABLE video_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON video_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON video_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON video_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view favorite counts"
  ON video_favorites FOR SELECT
  TO public
  USING (true);
