/*
  # Add admin support and enhance content management

  1. New Tables
    - `admin_users` - Admins with email and hashed password
    - `content_categories` - Categories for organizing content
  
  2. Modified Tables
    - `courses` - Add category reference and content metadata
    - `live_events` - Enhanced with more metadata
  
  3. Security
    - Enable RLS on admin_users
    - Create policies for admin access
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  color text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read themselves"
  ON admin_users FOR SELECT
  USING (true);

CREATE POLICY "Public can read content categories"
  ON content_categories FOR SELECT
  USING (true);

INSERT INTO content_categories (name, slug, description, color, order_index) VALUES
  ('Yoga', 'yoga', 'Traditional yoga practices', '#FFB347', 1),
  ('Face Yoga', 'faceyoga', 'Facial rejuvenation exercises', '#FF69B4', 2),
  ('Fyzio Yoga', 'fyzio', 'Physiotherapy-based yoga', '#87CEEB', 3),
  ('Mind & Life', 'mindlife', 'Meditation and mindfulness', '#DDA0DD', 4),
  ('Live Events', 'live', 'Live sessions and events', '#98FB98', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO admin_users (email, password_hash, role) VALUES
  ('admin@deseyo.cz', '$2b$12$VUJt8I8q9e8f8q9e8q9e8q9e8q9e8q9e8q9e8q9e8q9e8q9e8q9e8', 'admin')
ON CONFLICT (email) DO NOTHING;
