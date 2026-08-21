/*
  # Add admin access to users table

  1. Changes
    - Add RLS policy allowing admin users to read all users data
    - Admin users identified by admin_users table membership
*/

CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
    )
  );