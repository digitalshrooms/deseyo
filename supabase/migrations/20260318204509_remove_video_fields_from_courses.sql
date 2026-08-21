/*
  # Remove video and thumbnail URL fields from courses table
  
  1. Changes
    - Remove video_url column
    - Remove thumbnail_url column
    - Keep only title, description, category, duration, is_premium, category_tags
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE courses DROP COLUMN video_url;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE courses DROP COLUMN thumbnail_url;
  END IF;
END $$;