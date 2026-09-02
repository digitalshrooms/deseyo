/*
  # Restore video and thumbnail URL fields to courses table

  1. Changes
    - Add back video_url column for Mux video URLs
    - Add back thumbnail_url column for course thumbnails
    - Both fields support Mux player embeds and thumbnail URLs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN video_url text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN thumbnail_url text;
  END IF;
END $$;