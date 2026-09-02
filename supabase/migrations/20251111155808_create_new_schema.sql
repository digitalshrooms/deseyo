/*
  # Create New Database Schema
  
  1. New Tables
    - users
      - id (uuid, primary key)
      - name (text)
      - email (text, unique)
      - phone (text, nullable)
      - subscription_plan (text, default 'Basic')
      - progress (jsonb, default '{}')
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - last_lesson_id (uuid, nullable)
    
    - courses
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - category (text)
      - video_url (text)
      - thumbnail_url (text)
      - duration (integer)
      - is_premium (boolean, default false)
      - order_index (integer, default 0)
      - created_at (timestamptz)
    
    - forum_posts
      - id (uuid, primary key)
      - author_id (uuid, references users)
      - title (text)
      - category (text)
      - content (text)
      - image_url (text, nullable)
      - created_at (timestamptz)
    
    - forum_comments
      - id (uuid, primary key)
      - post_id (uuid, references forum_posts)
      - author_id (uuid, references users)
      - content (text)
      - created_at (timestamptz)
    
    - activities
      - id (uuid, primary key)
      - author_id (uuid, references users)
      - activity_type (text, 'lesson_completed' | 'forum_post')
      - lesson_id (uuid, nullable)
      - lesson_title (text, nullable)
      - forum_post_id (uuid, nullable, references forum_posts)
      - category (text, nullable)
      - created_at (timestamptz)
    
    - lesson_completions
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - lesson_id (uuid)
      - completed_at (timestamptz, nullable)
      - uncompleted_at (timestamptz, nullable)
      - is_completed (boolean, default true)
      - created_at (timestamptz)
      - updated_at (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  subscription_plan text NOT NULL DEFAULT 'Basic',
  progress jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_lesson_id uuid
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text NOT NULL,
  duration integer NOT NULL,
  is_premium boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Bez názvu',
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum posts"
  ON forum_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update own forum posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own forum posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum comments"
  ON forum_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create forum comments"
  ON forum_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update own forum comments"
  ON forum_comments FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = author_id::text)
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own forum comments"
  ON forum_comments FOR DELETE
  TO authenticated
  USING (auth.uid()::text = author_id::text);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('lesson_completed', 'forum_post')),
  lesson_id uuid,
  lesson_title text,
  forum_post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = author_id::text);

-- Create lesson_completions table
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

CREATE POLICY "Users can read own completions"
  ON lesson_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions"
  ON lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON lesson_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON lesson_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);