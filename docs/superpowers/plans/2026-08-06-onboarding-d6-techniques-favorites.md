# Onboarding Day 6, Techniky System, Favorites Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a video+PDF (no question) content type for onboarding Day 6, let users save onboarding PDFs as reusable "techniques" to their profile, and split the Favorites page into Videa/Techniky tabs.

**Architecture:** Two new Supabase tables (`techniques`, `user_saved_techniques`) hold shared PDF assets and per-user save references. `DailyOnboardingModal.tsx` gains a save-technique control on its existing PDF card and a new `isVideoWithDownload` derived flag reusing the existing video-watch lock. `Favorites.tsx` gains a top-level tab switch; the current page content becomes the "Videa" tab, and a new "Techniky" tab queries the join table.

**Tech Stack:** React 18 + TypeScript, Supabase (Postgres + supabase-js), Tailwind, Vite dev server for manual verification (this project has no automated test runner — verification is via SQL queries against the live Supabase project and manual checks against the running dev server).

## Global Constraints

- No copying of the PDF file per user — `user_saved_techniques` stores only a `technique_id` reference (spec requirement).
- Day 6 must be added to the existing `requiresVideoWatch` day list so its PDF/continue button stays locked until the video finishes (spec requirement, confirmed by user).
- Day 2's existing behavior (PDF download, no video gate) must be unaffected except for gaining the new save-technique button.
- Reuse Mux video ID `EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg` (already used by Day 1/5) as Day 6's placeholder `video_id`.
- Day 6 PDF is already at `public/DESEYO_Tri_body_pro_pohyb_tekutin.pdf`, served at `/DESEYO_Tri_body_pro_pohyb_tekutin.pdf`.
- Supabase project id: `yhdrdgerqmhbwbmursqm` (project name "Deseyo databáze").
- Follow existing code style: Tailwind utility classes inline, no CSS modules, `supabase` client imported from `../lib/supabase`.

---

## File Structure

- **Create:** `supabase/migrations/20260806160000_create_techniques_system.sql` — new tables + RLS + seed rows (Day 2 backfill + Day 6 content/technique).
- **Modify:** `src/components/DailyOnboardingModal.tsx` — new `isVideoWithDownload` flag, technique load/save state + handler, PDF card gets a save button, continue-button logic accounts for the new type.
- **Modify:** `src/pages/Favorites.tsx` — split into `Videa`/`Techniky` tabs; existing logic becomes the Videa tab body, new query + list for Techniky.

---

### Task 1: Database — `techniques` + `user_saved_techniques` tables, Day 6 content

**Files:**
- Create: `supabase/migrations/20260806160000_create_techniques_system.sql`

**Interfaces:**
- Produces table `techniques(id uuid, title text, description text, pdf_url text, source_day_number int, is_active boolean, created_at timestamptz)`.
- Produces table `user_saved_techniques(id uuid, user_id uuid, technique_id uuid, created_at timestamptz)`, unique on `(user_id, technique_id)`.
- Produces two seed rows in `techniques`: one for Day 2 (`source_day_number = 2`), one for Day 6 (`source_day_number = 6`).
- Produces/updates the Day 6 row in `onboarding_daily_content` (`day_number = 6`) with `video_id`, `download_url`, empty `options`/`question_text`.
- Later tasks (2, 3) read `techniques` by `source_day_number` and read/write `user_saved_techniques` by `user_id` + `technique_id`.

- [ ] **Step 1: Write the migration file**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool with `project_id = "yhdrdgerqmhbwbmursqm"`,
`name = "create_techniques_system"`, and the SQL above as `query`.

- [ ] **Step 3: Verify the migration**

Run via the Supabase MCP `execute_sql` tool (`project_id = "yhdrdgerqmhbwbmursqm"`):

```sql
select day_number, video_id, download_url, options, question_text
from onboarding_daily_content where day_number = 6;

select title, source_day_number, pdf_url from techniques order by source_day_number;
```

Expected: Day 6 row has `video_id = 'EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg'`,
`download_url = '/DESEYO_Tri_body_pro_pohyb_tekutin.pdf'`, `options = []`, `question_text = ''`.
Two `techniques` rows exist, `source_day_number` 2 and 6.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260806160000_create_techniques_system.sql
git commit -m "Add techniques system tables and Day 6 onboarding content"
```

---

### Task 2: `DailyOnboardingModal.tsx` — Day 6 content type + save-to-techniques

**Files:**
- Modify: `src/components/DailyOnboardingModal.tsx`

**Interfaces:**
- Consumes: `techniques` table (columns `id, title, description, pdf_url, source_day_number`),
  `user_saved_techniques` table (columns `user_id, technique_id`) — both from Task 1.
- Produces: no new exports; internal behavior change only. `requiresVideoWatch` now also true for
  `viewingDayClamped === 6`. New derived flag `isVideoWithDownload`.

- [ ] **Step 1: Add the `isVideoWithDownload` flag and extend `requiresVideoWatch`**

In `src/components/DailyOnboardingModal.tsx`, replace lines 58-59 and line 68:

```tsx
  const isDownloadOnly = !!(content?.download_url && content.options.length === 0 && !content.video_id);
  const isVideoOnly = !!(content?.video_id && content.options.length === 0 && !content.download_url && !content.question_text);
  const isVideoWithDownload = !!(content?.video_id && content?.download_url && content.options.length === 0);
```

```tsx
  // D1, D3, D5, D6 require full video watch before proceeding
  const requiresVideoWatch = [1, 3, 5, 6].includes(viewingDayClamped);
```

- [ ] **Step 2: Add technique state and the load effect**

Immediately after the existing favorite state (line 70-71, `const [isFavorite, ...]` /
`const [updatingFavorite, ...]`), add:

```tsx
  const [technique, setTechnique] = useState<{ id: string; title: string; description: string | null; pdf_url: string } | null>(null);
  const [isTechniqueSaved, setIsTechniqueSaved] = useState(false);
  const [updatingTechnique, setUpdatingTechnique] = useState(false);
```

Then, after the existing "Check if D3 video is already favorited" effect (after line 90, before
`const handleToggleFavorite = ...`), add a matching effect that loads the technique row for the
current day and whether the user already saved it:

```tsx
  // Load the technique (if any) attached to this day's PDF, and whether it's already saved
  useEffect(() => {
    setTechnique(null);
    setIsTechniqueSaved(false);
    if (!content?.download_url) return;
    const loadTechnique = async () => {
      const { data: t } = await supabase
        .from('techniques')
        .select('id, title, description, pdf_url')
        .eq('source_day_number', viewingDayClamped)
        .eq('is_active', true)
        .maybeSingle();
      if (!t) return;
      setTechnique(t);
      const { data: saved } = await supabase
        .from('user_saved_techniques')
        .select('id')
        .eq('user_id', userId)
        .eq('technique_id', t.id)
        .maybeSingle();
      setIsTechniqueSaved(!!saved);
    };
    loadTechnique();
  }, [content?.download_url, viewingDayClamped, userId]);
```

- [ ] **Step 3: Add the save/unsave handler**

Directly after `handleToggleFavorite` (after line 105), add:

```tsx
  const handleToggleTechnique = async () => {
    if (!technique || updatingTechnique) return;
    setUpdatingTechnique(true);
    try {
      if (isTechniqueSaved) {
        await supabase.from('user_saved_techniques').delete().eq('user_id', userId).eq('technique_id', technique.id);
      } else {
        await supabase.from('user_saved_techniques').insert({ user_id: userId, technique_id: technique.id });
      }
      setIsTechniqueSaved(!isTechniqueSaved);
    } finally {
      setUpdatingTechnique(false);
    }
  };
```

- [ ] **Step 4: Handle `isVideoWithDownload` in `handleContinue` and `handleReanswer`**

In `handleContinue` (lines 209-226), add a branch after the `isVideoOnly` check:

```tsx
  const handleContinue = () => {
    if (!content || !canAnswer) return;
    if (isDownloadOnly) {
      submitResponse('Stáhl jsem si workbook', false, false);
      return;
    }
    if (isVideoOnly) {
      submitResponse('Video zhlédnuto', false, false);
      return;
    }
    if (isVideoWithDownload) {
      submitResponse('Video zhlédnuto a PDF staženo', false, false);
      return;
    }
    if (isOpenEnded) {
      if (!textAnswer.trim()) return;
      submitResponse(textAnswer.trim(), false, false);
    } else {
      if (selectedOption === null) return;
      submitResponse(content.options[selectedOption], false, false);
    }
  };
```

In `handleReanswer` (lines 228-241), extend the first condition:

```tsx
  const handleReanswer = () => {
    if (!content) return;
    if (isDownloadOnly || isVideoOnly || isVideoWithDownload) {
      submitResponse(
        isDownloadOnly ? 'Stáhl jsem si workbook' : isVideoOnly ? 'Video zhlédnuto' : 'Video zhlédnuto a PDF staženo',
        false,
        true
      );
      return;
    }
    if (isOpenEnded) {
      if (!textAnswer.trim()) return;
      submitResponse(textAnswer.trim(), false, true);
    } else {
      if (selectedOption === null) return;
      submitResponse(content.options[selectedOption], false, true);
    }
  };
```

- [ ] **Step 5: Gate the PDF card on video-watch and add the save-technique button**

Replace the "PDF Download Section" block (lines 525-554) with:

```tsx
              {/* PDF Download Section (e.g. Day 2 — Habit design sheet, Day 6 — video + PDF) */}
              {content.download_url && (
                <div className="mb-5">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-0">
                        <h3 className="text-base font-bold text-gray-900 mb-1">{technique?.title || 'Workbook'}</h3>
                        {content.question_text && (
                          <p className="text-sm text-gray-600 leading-relaxed">{content.question_text}</p>
                        )}
                      </div>
                    </div>

                    {canAnswer ? (
                      <a
                        href={content.download_url}
                        download
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Stáhnout PDF
                      </a>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                        Nejdřív dokoukejte video
                      </div>
                    )}

                    {technique && (
                      <button
                        onClick={handleToggleTechnique}
                        disabled={!canAnswer || updatingTechnique}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm mt-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          isTechniqueSaved
                            ? 'bg-teal-100 text-teal-800 border-2 border-teal-300'
                            : 'bg-white border-2 border-teal-300 text-teal-700 hover:bg-teal-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isTechniqueSaved ? 'fill-teal-700' : ''}`} />
                        {isTechniqueSaved ? 'V mých technikách' : 'Uložit do Moje techniky'}
                      </button>
                    )}

                    <div className="flex items-center gap-2 mt-3 px-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">
                        {isDownloadOnly ? 'Workbook si můžeš stáhnout jenom dnes.' : 'PDF zůstane uložené v Mých technikách i po dnešku.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
```

- [ ] **Step 6: Exclude `isVideoWithDownload` from the question block and update the continue-button ternary**

Change line 557 from:

```tsx
              {!isDownloadOnly && !isVideoOnly && (
```

to:

```tsx
              {!isDownloadOnly && !isVideoOnly && !isVideoWithDownload && (
```

Change line 623's disabled expression from:

```tsx
                  disabled={submitting || !canAnswer || (!isDownloadOnly && !isVideoOnly && (isOpenEnded ? !textAnswer.trim() : selectedOption === null))}
```

to:

```tsx
                  disabled={submitting || !canAnswer || (!isDownloadOnly && !isVideoOnly && !isVideoWithDownload && (isOpenEnded ? !textAnswer.trim() : selectedOption === null))}
```

Change line 639's condition from:

```tsx
              ) : (isDownloadOnly || isVideoOnly) ? (
```

to:

```tsx
              ) : (isDownloadOnly || isVideoOnly || isVideoWithDownload) ? (
```

- [ ] **Step 7: Manual verification against the live dev server**

Start the dev server (`npm run dev`, or via the `deseyo-dev` preview config already set up in
`.claude/launch.json`). In the browser:

1. Use the "Přeskočit" testing button (or directly set `onboarding_day_index = 6` for a test user
   via `execute_sql`: `update users set onboarding_day_index = 6 where email = '<test-user-email>';`)
   so the modal opens on Day 6.
2. Confirm: video shows, PDF download button is greyed out with "Nejdřív dokoukejte video", no
   question/options render, "Uložit do Moje techniky" button is also disabled.
3. Simulate the video finishing (Player.js `ended`/`timeupdate` isn't easy to trigger manually in a
   headless check — acceptable to verify this step by temporarily setting `setVideoWatched(true)` via
   React DevTools, or by checking Day 5's existing identical lock behavior still works, since Day 6
   reuses the same `canAnswer`/`requiresVideoWatch` mechanism verified there already).
4. Once unlocked: PDF download button and "Uložit do Moje techniky" become clickable. Click save —
   button flips to "V mých technikách". Click again — flips back.
5. Click "Pokračovat" — modal closes, `onboarding_day_index` advances to 7. Verify via
   `execute_sql`: `select onboarding_day_index from users where id = '<test-user-id>';`.
6. Navigate to Day 2 (via the week-day pips or "Předchozí") and confirm the "Uložit do Moje
   techniky" button now also appears there and works, with no video-lock (Day 2 has no video).

- [ ] **Step 8: Commit**

```bash
git add src/components/DailyOnboardingModal.tsx
git commit -m "Add Day 6 video+PDF content type and save-to-techniques button"
```

---

### Task 3: `Favorites.tsx` — split into Videa / Techniky tabs

**Files:**
- Modify: `src/pages/Favorites.tsx`

**Interfaces:**
- Consumes: `user_saved_techniques` joined to `techniques` (columns `id, title, description, pdf_url`)
  from Task 1.
- Produces: no exports change (`Favorites` component signature unchanged).

- [ ] **Step 1: Add a `Technique` type and tab state**

At the top of `src/pages/Favorites.tsx`, after the existing `ContentType`/`contentTypes` block
(after line 16), add:

```tsx
type Tab = 'videa' | 'techniky';

interface Technique {
  id: string;
  title: string;
  description: string | null;
  pdf_url: string;
}
```

Inside the `Favorites` component, after the existing `selectedType` state (line 22), add:

```tsx
  const [tab, setTab] = useState<Tab>('videa');
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [techniquesLoading, setTechniquesLoading] = useState(true);
```

- [ ] **Step 2: Load techniques alongside favorites**

Replace the existing effect (line 24, `useEffect(() => { loadFavorites(); }, [user]);`) with:

```tsx
  useEffect(() => { loadFavorites(); loadTechniques(); }, [user]);
```

After the existing `loadFavorites` function (after line 42), add:

```tsx
  const loadTechniques = async () => {
    if (!user) { setTechniquesLoading(false); return; }
    setTechniquesLoading(true);
    const { data } = await supabase
      .from('user_saved_techniques')
      .select('technique_id, techniques(id, title, description, pdf_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (data || [])
      .map((row: any) => row.techniques as Technique | null)
      .filter((t: Technique | null): t is Technique => !!t);
    setTechniques(rows);
    setTechniquesLoading(false);
  };

  const handleRemoveTechnique = async (techniqueId: string) => {
    if (!user) return;
    setTechniques(prev => prev.filter(t => t.id !== techniqueId));
    await supabase.from('user_saved_techniques').delete().eq('user_id', user.id).eq('technique_id', techniqueId);
  };
```

- [ ] **Step 3: Add the top-level tab switcher and wrap the existing body as the Videa tab**

Replace the block starting at the "Filtrovat" heading (line 73, `<div className="mb-8">`) through
the end of the outer content div (line 135, the closing of the favorites list `</div>`) — i.e.
everything between the intro paragraph/info block (ends line 71) and the final closing `</div>`
pair (lines 136-137) — with:

```tsx
        <div className="flex gap-2.5 mb-8">
          {(['videa', 'techniky'] as Tab[]).map((t) => {
            const isSelected = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: isSelected ? TEAL : 'transparent',
                  color: isSelected ? '#FFFFFF' : TEAL,
                  border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                }}
              >
                {t === 'videa' ? 'Videa' : 'Techniky'}
              </button>
            );
          })}
        </div>

        {tab === 'videa' ? (
          <>
            <div className="mb-8">
              <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Filtrovat
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {contentTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
                      style={{
                        backgroundColor: isSelected ? TEAL : 'transparent',
                        color: isSelected ? '#FFFFFF' : TEAL,
                        border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                {selectedType === 'vše' ? 'Vše' : contentTypes.find(t => t.id === selectedType)?.label}
              </h2>

              {loading ? (
                <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                  {[1, 2, 3].map(i => (
                    <li key={i} className="py-5 animate-pulse">
                      <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                    </li>
                  ))}
                </ul>
              ) : filtered.length > 0 ? (
                <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                  {filtered.map((course, idx) => (
                    <li
                      key={course.id}
                      className="py-5 flex items-baseline gap-4 transition-all active:scale-[0.99] hover:opacity-80"
                    >
                      <span
                        className="text-sm font-semibold flex-shrink-0 tabular-nums"
                        style={{ color: TEAL }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                        {course.title}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-16">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Zatím nemáš žádné uložené lekce</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Techniky
            </h2>

            {techniquesLoading ? (
              <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {[1, 2].map(i => (
                  <li key={i} className="py-5 animate-pulse">
                    <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  </li>
                ))}
              </ul>
            ) : techniques.length > 0 ? (
              <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {techniques.map((t) => (
                  <li key={t.id} className="py-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>{t.title}</p>
                      {t.description && (
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <a
                        href={t.pdf_url}
                        download
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ color: '#FFFFFF', backgroundColor: TEAL }}
                      >
                        Stáhnout
                      </a>
                      <button
                        onClick={() => handleRemoveTechnique(t.id)}
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Odebrat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Zatím nemáš uložené žádné techniky</p>
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 4: Manual verification against the live dev server**

1. Navigate to `/oblibene` as the test user who saved the Day 6 (and/or Day 2) technique in Task 2.
2. Confirm the "Videa" tab shows unchanged behavior (existing favorited courses, filter pills work).
3. Click "Techniky" — confirm the saved technique(s) appear with title, download link (opens the
   PDF), and an "Odebrat" button.
4. Click "Odebrat" — row disappears immediately; reload the page and confirm it stays gone (check
   via `execute_sql`: `select * from user_saved_techniques where user_id = '<test-user-id>';`
   returns no row for that technique).
5. Confirm going back to the onboarding modal for that day now shows the "Uložit do Moje techniky"
   button in its unsaved state again.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Favorites.tsx
git commit -m "Split Favorites page into Videa and Techniky tabs"
```
