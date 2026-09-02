-- Seed Day 3: First lesson video + favorites hint
INSERT INTO onboarding_daily_content (day_number, phase, video_id, question_text, options, download_url)
VALUES (
  3,
  'Orientace',
  'dvn6dIF54FxSkk5S00ZyH7JMl6DDYbxrIWD51SFhOQAI',
  'Jak ses cítil/a po první lekcii?',
  '["Skvěle, těším se na další.", "Bylo to v pohodě, ale musím si zvyknout.", "Bylo to náročnější, než jsem čekal/a."]'::jsonb,
  ''
)
ON CONFLICT (day_number) DO UPDATE SET
  phase = EXCLUDED.phase,
  video_id = EXCLUDED.video_id,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  download_url = EXCLUDED.download_url;
