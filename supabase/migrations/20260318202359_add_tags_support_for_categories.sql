/*
  # Add tags support for Fyzio Yoga and Face Yoga categories

  1. New Table
    - `category_tags` - Store available tags for each category
      - `id` (uuid, primary key)
      - `category` (text) - Category name (fyzio, faceyoga)
      - `tag_value` (text) - Tag value (e.g., "záda", "čelo")
      - `created_at` (timestamp)

  2. Modify Table
    - `courses` - Add `category_tags` column to store selected tags as array

  3. Data
    - Add predefined tags for Fyzio Yoga: záda, ramena, krčel, kolena, krk, biohy, celé tělo
    - Add predefined tags for Face Yoga: fullface, čelo, oči, tvář, dolní část, krk

  4. Security
    - Enable RLS on category_tags
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS category_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  tag_value text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category, tag_value)
);

ALTER TABLE category_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category tags"
  ON category_tags FOR SELECT
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'category_tags'
  ) THEN
    ALTER TABLE courses ADD COLUMN category_tags text[] DEFAULT '{}';
  END IF;
END $$;

INSERT INTO category_tags (category, tag_value, display_order) VALUES
  ('fyzio', 'záda', 1),
  ('fyzio', 'ramena', 2),
  ('fyzio', 'krčel', 3),
  ('fyzio', 'kolena', 4),
  ('fyzio', 'krk', 5),
  ('fyzio', 'biohy', 6),
  ('fyzio', 'celé tělo', 7),
  ('faceyoga', 'fullface', 1),
  ('faceyoga', 'čelo', 2),
  ('faceyoga', 'oči', 3),
  ('faceyoga', 'tvář', 4),
  ('faceyoga', 'dolní část', 5),
  ('faceyoga', 'krk', 6)
ON CONFLICT (category, tag_value) DO NOTHING;