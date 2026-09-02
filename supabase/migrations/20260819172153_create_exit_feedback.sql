/*
# Create exit_feedback table

## Purpose
Captures why a client is leaving — either deleting their account or
cancelling their subscription — via a short optional survey shown right
before the action is confirmed. Not tied by foreign key to auth.users,
since account-deletion feedback must survive the user being deleted.

## Columns
- id (uuid, PK)
- context ('account_deletion' | 'subscription_cancel')
- reason ('finance' | 'time' | 'other')
- other_text (text, nullable) — free text when reason = 'other'
- user_email (text, nullable) — snapshot of the user's email at submission time
- created_at (timestamptz)

## Security
RLS enabled. Authenticated users may only insert (never read/update/delete
other people's feedback); reading is reserved for admin tooling via the
service role key, which bypasses RLS.
*/

CREATE TABLE IF NOT EXISTS exit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context text NOT NULL CHECK (context IN ('account_deletion', 'subscription_cancel')),
  reason text NOT NULL CHECK (reason IN ('finance', 'time', 'other')),
  other_text text,
  user_email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exit_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_exit_feedback" ON exit_feedback;
CREATE POLICY "insert_exit_feedback" ON exit_feedback
  FOR INSERT TO authenticated WITH CHECK (true);
