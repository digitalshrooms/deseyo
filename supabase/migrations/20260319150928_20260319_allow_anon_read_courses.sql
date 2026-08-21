/*
  # Allow Anonymous Read Access to Courses

  1. Changes
    - Add policy for ANON role to read courses for admin dashboard
    - This allows admin panel to fetch course data without authentication
  
  2. Security
    - Admin can only read, not modify courses via anon key
    - Write operations still require authentication
    - RLS prevents unauthorized access
*/

CREATE POLICY "Anon can read courses"
  ON courses FOR SELECT
  TO anon
  USING (true);
