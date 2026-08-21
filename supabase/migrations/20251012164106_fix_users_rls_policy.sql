/*
  # Fix Users RLS Policy for Registration

  1. Changes
    - Add INSERT policy for users table to allow registration
    - Allow users to create their own user record during sign-up
    
  2. Security
    - Users can only insert their own record (matching auth.uid())
*/

-- Drop existing policies if any conflicts
DROP POLICY IF EXISTS "Users can create own account" ON users;

-- Add policy to allow users to insert their own record during registration
CREATE POLICY "Users can create own account"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
