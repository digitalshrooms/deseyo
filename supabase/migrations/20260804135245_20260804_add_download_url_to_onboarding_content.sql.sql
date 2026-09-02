-- Add download_url column for PDF download days (e.g. Day 2 habit design sheet)
ALTER TABLE onboarding_daily_content
  ADD COLUMN IF NOT EXISTS download_url text DEFAULT '';

-- Seed Day 2: Habit design sheet PDF download
INSERT INTO onboarding_daily_content (day_number, phase, video_id, question_text, options, download_url)
VALUES (
  2,
  'Orientace',
  '',
  'Zde si stáhni workbook a implementuj si svůj cvičební návyk. Říká se: „Zvyk je železná košile."',
  '[]'::jsonb,
  '/DESEYO_Workbook_D2.pdf'
)
ON CONFLICT (day_number) DO UPDATE SET
  phase = EXCLUDED.phase,
  video_id = EXCLUDED.video_id,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  download_url = EXCLUDED.download_url;
