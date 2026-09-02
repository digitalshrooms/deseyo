/*
# Create daily onboarding system (30-day check-in popup)

## Purpose
Implements a 30-day daily onboarding flow where clients see a popup once per calendar day
after login. Each day has a video + question with selectable options. Responses are stored
per-user and visible to admins.

## New Tables

### onboarding_daily_content
Stores the content for each of the 30 days of the onboarding journey.
- `id` (uuid, PK)
- `day_number` (int 1-30, unique) — which day this content is for
- `phase` (text) — derived from day_number: Orientace (D1-7), Prohloubení (D8-14), Volba (D15-21), Integrace (D22-30)
- `video_id` (text) — Mux playback ID for the day's video
- `question_text` (text) — the question shown to the client
- `options` (jsonb) — array of string options, e.g. ["Jsem v souladu.", "Raději se vůbec nekoukám.", "Vím, že potřebuji na sobě pracovat."]
- `is_active` (boolean, default true) — whether this day's content is live
- `created_at` (timestamptz)

### onboarding_daily_responses
Stores each client's response to the daily onboarding popup.
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL, DEFAULT auth.uid()) — references auth.users
- `day_number` (int 1-30) — which day was answered
- `question_text` (text) — snapshot of the question at time of response
- `selected_option` (text) — the option the client selected
- `skipped` (boolean, default false) — true if client used "skip" (testing only)
- `responded_at` (timestamptz, default now()) — when the response was submitted

## Security
- RLS enabled on both tables.
- onboarding_daily_content: public read (anon + authenticated) since content is shared.
- onboarding_daily_response: owner-scoped CRUD (authenticated, auth.uid() = user_id).
- Admin access to responses is handled via the admin-users edge function (service role key bypasses RLS).

## Seed Data
- Day 1 content with the specified question and 3 options.
- Placeholder Mux video ID for testing.
*/

-- ── onboarding_daily_content ──
CREATE TABLE IF NOT EXISTS onboarding_daily_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number integer NOT NULL UNIQUE CHECK (day_number >= 1 AND day_number <= 30),
  phase text NOT NULL DEFAULT 'Orientace',
  video_id text NOT NULL DEFAULT '',
  question_text text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_daily_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_onboarding_content" ON onboarding_daily_content;
CREATE POLICY "anon_read_onboarding_content" ON onboarding_daily_content
  FOR SELECT TO anon, authenticated USING (true);

-- ── onboarding_daily_response ──
CREATE TABLE IF NOT EXISTS onboarding_daily_response (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number integer NOT NULL CHECK (day_number >= 1 AND day_number <= 30),
  question_text text NOT NULL DEFAULT '',
  selected_option text,
  skipped boolean NOT NULL DEFAULT false,
  responded_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_daily_response ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_onboarding_responses" ON onboarding_daily_response;
CREATE POLICY "select_own_onboarding_responses" ON onboarding_daily_response
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_onboarding_responses" ON onboarding_daily_response;
CREATE POLICY "insert_own_onboarding_responses" ON onboarding_daily_response
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_onboarding_responses" ON onboarding_daily_response;
CREATE POLICY "update_own_onboarding_responses" ON onboarding_daily_response
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_onboarding_responses" ON onboarding_daily_response;
CREATE POLICY "delete_own_onboarding_responses" ON onboarding_daily_response
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for quick lookup of a user's latest response
CREATE INDEX IF NOT EXISTS idx_onboarding_response_user_day
  ON onboarding_daily_response (user_id, day_number);

-- ── Seed Day 1 ──
INSERT INTO onboarding_daily_content (day_number, phase, video_id, question_text, options)
VALUES (
  1,
  'Orientace',
  'DS02KqLh1g00w00bFyvbP9t01yYp008sR02n',
  'Jak se vnímáš, když na sebe pohlédneš do zrcadla?',
  '["Jsem v souladu.", "Raději se vůbec nekoukám.", "Vím, že potřebuji na sobě pracovat."]'::jsonb
)
ON CONFLICT (day_number) DO NOTHING;
