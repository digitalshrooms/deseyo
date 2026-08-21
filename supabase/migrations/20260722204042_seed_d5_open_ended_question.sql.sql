/*
# Seed D5 onboarding content with open-ended test question

## Purpose
Adds Day 5 content to the daily onboarding system with an open-ended question
"Jak se máš?" — no predefined options (empty options array signals open-ended text input).

## Changes
- INSERT into onboarding_daily_content for day_number = 5
- options = '[]' (empty array) — the modal interprets this as "open-ended text input"
- Uses same placeholder Mux video as D1 for testing

## Notes
- ON CONFLICT DO NOTHING — safe to re-run
- No schema changes, no RLS changes
*/

INSERT INTO onboarding_daily_content (day_number, phase, video_id, question_text, options)
VALUES (
  5,
  'Orientace',
  'DS02KqLh1g00w00bFyvbP9t01yYp008sR02n',
  'Jak se máš?',
  '[]'::jsonb
)
ON CONFLICT (day_number) DO NOTHING;
