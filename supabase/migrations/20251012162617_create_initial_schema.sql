/*
  # Initial Schema for Deseyo Platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User identifier
      - `name` (text) - User's full name
      - `email` (text, unique) - User's email address
      - `phone` (text, nullable) - Optional phone number
      - `subscription_plan` (text) - Current subscription: Basic, Premium, or Legend
      - `progress` (jsonb) - Stores user's course progress
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `courses`
      - `id` (uuid, primary key) - Course identifier
      - `title` (text) - Course title
      - `description` (text) - Course description
      - `category` (text) - Course category
      - `video_url` (text) - Video URL
      - `thumbnail_url` (text) - Thumbnail image URL
      - `duration` (integer) - Duration in minutes
      - `is_premium` (boolean) - Whether course requires Premium or Legend plan
      - `order_index` (integer) - Order within category
      - `created_at` (timestamptz) - Creation timestamp
    
    - `forum_posts`
      - `id` (uuid, primary key) - Post identifier
      - `author_id` (uuid, foreign key) - Reference to users table
      - `category` (text) - Post category
      - `content` (text) - Post content
      - `image_url` (text, nullable) - Optional image URL
      - `created_at` (timestamptz) - Creation timestamp
    
    - `forum_comments`
      - `id` (uuid, primary key) - Comment identifier
      - `post_id` (uuid, foreign key) - Reference to forum_posts
      - `author_id` (uuid, foreign key) - Reference to users
      - `content` (text) - Comment content
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for forum posts and comments visibility
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
  updated_at timestamptz DEFAULT now()
);

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

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Courses policies (all authenticated users can read all courses)
CREATE POLICY "Authenticated users can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Forum posts policies
CREATE POLICY "Authenticated users can view all forum posts"
  ON forum_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own forum posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own forum posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Forum comments policies
CREATE POLICY "Authenticated users can view all comments"
  ON forum_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON forum_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON forum_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON forum_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();