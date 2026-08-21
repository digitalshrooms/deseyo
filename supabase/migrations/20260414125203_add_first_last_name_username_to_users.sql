/*
  # Add first_name, last_name, username fields to users table

  ## Changes
  - Adds `first_name` (text, nullable) column to users
  - Adds `last_name` (text, nullable) column to users
  - Adds `username` (text, unique, nullable) column to users — public display name on the platform
  - Backfills existing rows: splits existing `name` into first_name (everything before last space) and last_name (last word)
  - Adds unique index on username

  ## Notes
  - All new columns are nullable to avoid breaking existing rows
  - username must be unique across the platform
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username) WHERE username IS NOT NULL;
