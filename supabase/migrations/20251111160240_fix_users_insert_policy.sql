/*
  # Fix Users Table Insert Policy
  
  1. Changes
    - Add INSERT policy for users table to allow new user registration
    - Users can create their own record during registration
  
  2. Security
    - Policy ensures users can only create records with their own auth.uid()
*/

-- Add INSERT policy for user registration
CREATE POLICY "Users can create own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);