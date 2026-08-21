/*
# Add username_changed_at to users

## Purpose
Tracks when a user last changed their username, so the profile edit page
can enforce a once-per-week cooldown on username changes.
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;
