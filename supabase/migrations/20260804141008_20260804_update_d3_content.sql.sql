-- Update Day 3: new video, no question (favorites-only flow)
ALTER TABLE onboarding_daily_content
  ADD COLUMN IF NOT EXISTS linked_course_id uuid REFERENCES courses(id) ON DELETE SET NULL;

UPDATE onboarding_daily_content
SET
  video_id = '2PxyFMlFwMPL013aSelFB9SAazV7dfZWkhrqCu100fma8',
  question_text = '',
  options = '[]'::jsonb,
  linked_course_id = '619d19e4-17df-40d0-ad9b-333025d44668'
WHERE day_number = 3;
