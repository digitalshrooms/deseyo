/*
  # Remove phone column from users table

  Removes the phone field entirely — it is no longer collected during registration
  or displayed anywhere in the app.

  1. Changes
    - `users`: drops column `phone`
*/

ALTER TABLE users DROP COLUMN IF EXISTS phone;
