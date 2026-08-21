-- Add post-video message and custom button label columns
ALTER TABLE onboarding_daily_content
  ADD COLUMN IF NOT EXISTS post_video_message text,
  ADD COLUMN IF NOT EXISTS button_label text;

-- Update Day 5: add video, post-video quote, and "Absolvováno" button
UPDATE onboarding_daily_content
SET
  video_id = 'EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg',
  question_text = 'Jak se máš?',
  options = '[]'::jsonb,
  post_video_message = 'Tělo se mění opováním. Ne intenzitou jednoho tréninku. Co opakuješ, to si pamatuješ!',
  button_label = 'Absolvováno'
WHERE day_number = 5;
