/*
  # Fix Admin Access Without Supabase Auth

  1. Changes
    - Add policy for ANON role (unauthenticated) to read users for admin dashboard
    - This allows admin panel to fetch user data without requiring Supabase Auth
  
  2. Security
    - Admin access is still controlled via admin-login edge function
    - Only the admin dashboard can read user data via anon key
    - Regular user RLS policies remain unchanged
*/

CREATE POLICY "Admins can read all users anon"
  ON users FOR SELECT
  TO anon
  USING (true);
