/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Indexes on Foreign Keys
    - Add index on `activities.author_id`
    - Add index on `activities.forum_post_id`
    - Add index on `forum_comments.author_id`
    - Add index on `forum_comments.post_id`
    - Add index on `forum_posts.author_id`

  ## 2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
    - Replace `auth.jwt()` with `(select auth.jwt())` where applicable
    - This prevents re-evaluation for each row, improving query performance

  ## 3. Remove Unused Indexes
    - Drop indexes that are not being used

  ## 4. Fix Function Search Path
    - Set immutable search_path for `update_updated_at_column` function
*/

-- ============================================
-- 1. Add Missing Indexes on Foreign Keys
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'activities' AND indexname = 'idx_activities_author_id'
  ) THEN
    CREATE INDEX idx_activities_author_id ON activities(author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'activities' AND indexname = 'idx_activities_forum_post_id'
  ) THEN
    CREATE INDEX idx_activities_forum_post_id ON activities(forum_post_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'forum_comments' AND indexname = 'idx_forum_comments_author_id'
  ) THEN
    CREATE INDEX idx_forum_comments_author_id ON forum_comments(author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'forum_comments' AND indexname = 'idx_forum_comments_post_id'
  ) THEN
    CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'forum_posts' AND indexname = 'idx_forum_posts_author_id'
  ) THEN
    CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
  END IF;
END $$;

-- ============================================
-- 2. Optimize RLS Policies - Replace auth.uid() with (select auth.uid())
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own record" ON users;
CREATE POLICY "Users can create own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (select auth.jwt())->>'email'
    )
  );

-- Forum posts policies
DROP POLICY IF EXISTS "Users can create forum posts" ON forum_posts;
CREATE POLICY "Users can create forum posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own forum posts" ON forum_posts;
CREATE POLICY "Users can update own forum posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own forum posts" ON forum_posts;
CREATE POLICY "Users can delete own forum posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- Forum comments policies
DROP POLICY IF EXISTS "Users can create forum comments" ON forum_comments;
CREATE POLICY "Users can create forum comments"
  ON forum_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own forum comments" ON forum_comments;
CREATE POLICY "Users can update own forum comments"
  ON forum_comments FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own forum comments" ON forum_comments;
CREATE POLICY "Users can delete own forum comments"
  ON forum_comments FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- Activities policies
DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

-- Lesson completions policies
DROP POLICY IF EXISTS "Users can read own completions" ON lesson_completions;
CREATE POLICY "Users can read own completions"
  ON lesson_completions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own completions" ON lesson_completions;
CREATE POLICY "Users can create own completions"
  ON lesson_completions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own completions" ON lesson_completions;
CREATE POLICY "Users can update own completions"
  ON lesson_completions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own completions" ON lesson_completions;
CREATE POLICY "Users can delete own completions"
  ON lesson_completions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- User events policies
DROP POLICY IF EXISTS "Users can read own events" ON user_events;
CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own events" ON user_events;
CREATE POLICY "Users can create own events"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- MED tracking policies
DROP POLICY IF EXISTS "Users can view own MED tracking" ON med_tracking;
CREATE POLICY "Users can view own MED tracking"
  ON med_tracking FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own MED tracking" ON med_tracking;
CREATE POLICY "Users can insert own MED tracking"
  ON med_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own MED tracking" ON med_tracking;
CREATE POLICY "Users can update own MED tracking"
  ON med_tracking FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Comments policies
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- Courses policies (admin)
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (select auth.jwt())->>'email'
    )
  );

DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (select auth.jwt())->>'email'
    )
  );

DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = (select auth.jwt())->>'email'
    )
  );

-- Video favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON video_favorites;
CREATE POLICY "Users can view their own favorites"
  ON video_favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can add favorites" ON video_favorites;
CREATE POLICY "Users can add favorites"
  ON video_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove their favorites" ON video_favorites;
CREATE POLICY "Users can remove their favorites"
  ON video_favorites FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================
-- 3. Remove Unused Indexes
-- ============================================

DROP INDEX IF EXISTS idx_user_events_user_date;
DROP INDEX IF EXISTS idx_user_events_type;
DROP INDEX IF EXISTS idx_med_tracking_user_week;
DROP INDEX IF EXISTS idx_video_tags_course;
DROP INDEX IF EXISTS idx_video_tags_type_value;
DROP INDEX IF EXISTS idx_user_preferences_user;
DROP INDEX IF EXISTS idx_comments_author_id;

-- ============================================
-- 4. Fix Function Search Path
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;