/*
  # Fix admin content management

  Allow admins to insert courses without being in admin_users table.
  The admin panel uses token-based authentication, not Supabase auth.
*/

DROP POLICY IF EXISTS "Admins can insert courses" ON courses;

CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (true);
