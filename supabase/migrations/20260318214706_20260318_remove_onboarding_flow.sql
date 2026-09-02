/*
  # Remove onboarding flow

  1. Changes
    - Add onboarding_completed column to users table for future use
    - Register now skips onboarding and redirects to main dashboard
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;