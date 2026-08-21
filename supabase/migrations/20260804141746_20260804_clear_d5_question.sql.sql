-- Clear question_text for D5 so it's treated as video-only (no questionnaire)
UPDATE onboarding_daily_content
SET question_text = ''
WHERE day_number = 5;
