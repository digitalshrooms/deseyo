/*
  # Create comments table for lesson discussions

  1. New Tables
    - `comments` - Store comments on lessons/videos
      - `id` (uuid, primary key)
      - `lesson_id` (uuid) - References the course/lesson being commented on
      - `author_id` (uuid) - References auth.users
      - `author_name` (text) - Display name of the comment author
      - `content` (text) - The comment text content
      - `created_at` (timestamptz) - When the comment was created

  2. Security
    - Enable RLS on `comments` table
    - Add policy for authenticated users to read all comments
    - Add policy for authenticated users to insert their own comments
    - Add policy for users to update/delete only their own comments

  3. Indexes
    - Add index on `lesson_id` for faster comment queries by lesson
    - Add index on `author_id` for faster queries by author
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);