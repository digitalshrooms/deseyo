/*
# Create techniques system (shared PDF assets + per-user save references)

## Purpose
Lets users bookmark a PDF handed out during onboarding (or elsewhere) to their profile without
copying the file. The PDF is a single shared platform asset; saving it just inserts a reference
row pointing at it.

## New Tables

### techniques
Shared, platform-owned PDF assets.
- `id` (uuid, PK)
- `title` (text) — display name, e.g. "Habit Design Sheet"
- `description` (text, nullable) — short blurb shown in the Techniky list
- `pdf_url` (text) — public URL of the PDF (served from /public today)
- `source_day_number` (int, nullable) — which onboarding_daily_content.day_number this
  originated from, for traceability only (not a hard FK — techniques may exist independent
  of onboarding later)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### user_saved_techniques
Per-user save reference — never copies the file.
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, default auth.uid())
- `technique_id` (uuid, references techniques)
- `created_at` (timestamptz)
- unique (user_id, technique_id)

## Security
- RLS enabled on both tables.
- techniques: public read (anon + authenticated), same shape as onboarding_daily_content.
- user_saved_techniques: owner-scoped CRUD (authenticated, auth.uid() = user_id), same shape
  as onboarding_daily_response.

## Seed Data
- Backfills a techniques row for Day 2's existing workbook PDF.
- Adds a techniques row for the new Day 6 acupressure-points PDF.
- Inserts/updates the Day 6 onboarding_daily_content row: video (reusing Day 1/5's Mux id as
  placeholder) + PDF download, no question — content-only day gated by video-watch same as
  D1/D3/D5.
*/

-- ── techniques ──
CREATE TABLE IF NOT EXISTS techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  pdf_url text NOT NULL DEFAULT '',
  source_day_number integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_techniques" ON techniques;
CREATE POLICY "anon_read_techniques" ON techniques
  FOR SELECT TO anon, authenticated USING (true);

-- ── user_saved_techniques ──
CREATE TABLE IF NOT EXISTS user_saved_techniques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  technique_id uuid NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, technique_id)
);

ALTER TABLE user_saved_techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_techniques" ON user_saved_techniques;
CREATE POLICY "select_own_saved_techniques" ON user_saved_techniques
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_techniques" ON user_saved_techniques;
CREATE POLICY "insert_own_saved_techniques" ON user_saved_techniques
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_techniques" ON user_saved_techniques;
CREATE POLICY "delete_own_saved_techniques" ON user_saved_techniques
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_saved_techniques_user
  ON user_saved_techniques (user_id);

-- ── Seed: Day 2 technique (backfills existing workbook PDF) ──
INSERT INTO techniques (title, description, pdf_url, source_day_number)
SELECT
  'Habit Design Sheet',
  odc.question_text,
  odc.download_url,
  2
FROM onboarding_daily_content odc
WHERE odc.day_number = 2
  AND NOT EXISTS (SELECT 1 FROM techniques WHERE source_day_number = 2);

-- ── Seed: Day 6 technique (new PDF) ──
INSERT INTO techniques (title, description, pdf_url, source_day_number)
SELECT
  'Tři body pro pohyb tekutin',
  'Akupresurní body, které podpoří pohyb tekutin v těle.',
  '/DESEYO_Tri_body_pro_pohyb_tekutin.pdf',
  6
WHERE NOT EXISTS (SELECT 1 FROM techniques WHERE source_day_number = 6);

-- ── Seed/update Day 6 onboarding content: video + PDF, no question ──
INSERT INTO onboarding_daily_content (day_number, phase, video_id, question_text, options, download_url)
VALUES (
  6,
  'Orientace',
  'EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg',
  '',
  '[]'::jsonb,
  '/DESEYO_Tri_body_pro_pohyb_tekutin.pdf'
)
ON CONFLICT (day_number) DO UPDATE SET
  video_id = EXCLUDED.video_id,
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  download_url = EXCLUDED.download_url;
