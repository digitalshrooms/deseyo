/*
  # Revert to requiring admin_users check

  Admin panel should use edge function for authenticated requests.
*/

DROP POLICY IF EXISTS "Admins can insert courses" ON courses;

CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt()->>'email'
  ));
