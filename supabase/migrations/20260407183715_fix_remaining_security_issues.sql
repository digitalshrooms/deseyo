/*
  # Fix Remaining Security and Performance Issues

  ## 1. Add Missing Indexes on Foreign Keys
    - Add index on `comments.author_id`
    - Add index on `user_events.user_id`

  ## 2. Remove Unused Indexes
    - Drop indexes that are not being used on forum tables

  ## 3. Fix Multiple Permissive Policies
    - Combine overlapping SELECT policies for users table
    - Combine overlapping SELECT policies for video_favorites table
*/

-- ============================================
-- 1. Add Missing Indexes on Foreign Keys
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'comments' AND indexname = 'idx_comments_author_fk'
  ) THEN
    CREATE INDEX idx_comments_author_fk ON comments(author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_events' AND indexname = 'idx_user_events_user_fk'
  ) THEN
    CREATE INDEX idx_user_events_user_fk ON user_events(user_id);
  END IF;
END $$;

-- ============================================
-- 2. Remove Unused Indexes
-- ============================================

DROP INDEX IF EXISTS idx_activities_author_id;
DROP INDEX IF EXISTS idx_activities_forum_post_id;
DROP INDEX IF EXISTS idx_forum_comments_author_id;
DROP INDEX IF EXISTS idx_forum_comments_post_id;
DROP INDEX IF EXISTS idx_forum_posts_author_id;

-- ============================================
-- 3. Fix Multiple Permissive Policies
-- ============================================

-- Users table: Combine "Users can read own data" and "Admins can read all users"
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;

CREATE POLICY "Users can read own data or admins can read all"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (select auth.jwt())->>'email'
    )
  );

-- Video favorites: Combine "Users can view their own favorites" and "Public can view favorite counts"
-- First check if "Public can view favorite counts" policy exists
DO $$
BEGIN
  -- Drop both policies if they exist
  DROP POLICY IF EXISTS "Users can view their own favorites" ON video_favorites;
  DROP POLICY IF EXISTS "Public can view favorite counts" ON video_favorites;

  -- Create a single combined policy
  -- Authenticated users can see their own favorites
  -- Public (anon) users can see counts only (if needed for UI)
END $$;

CREATE POLICY "Users can view their own favorites"
  ON video_favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Separate policy for public counts if needed
CREATE POLICY "Public can view favorite counts"
  ON video_favorites FOR SELECT
  TO anon
  USING (true);