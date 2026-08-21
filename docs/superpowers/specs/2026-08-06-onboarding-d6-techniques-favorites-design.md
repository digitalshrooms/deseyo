# Design: Onboarding Day 6 content type, shared PDF "Techniky" system, Favorites split

Date: 2026-08-06
Status: Approved by user, ready for implementation planning

## Context

The 30-day daily onboarding popup (`DailyOnboardingModal.tsx`, table `onboarding_daily_content` /
`onboarding_daily_response`) currently supports these content shapes per day, derived from which
fields are populated on the day's row:

- Question + options (default)
- Question, open-ended text answer
- Video only, no question (`isVideoOnly`)
- Download only, no question (`isDownloadOnly`) — used today for Day 2's "Habit Design Sheet" PDF
- Days 1, 3, 5 additionally require the video to be fully watched (`requiresVideoWatch` /
  `videoWatched`) before the user can interact with the question/continue button.

Day numbering (`onboarding_day_index` on `users`, incremented by one each time the user submits a
response) is **personal**, not calendar-locked: a user's Day 1 is whichever day they first open the
onboarding popup, regardless of the real weekday. This is existing, correct behavior and is **not**
changed by this design — confirmed with the user. The "Po/Út/St/Čt/Pá" labeling the user used while
describing the feature is just descriptive naming for content authored in the library (Day 1 =
"Monday's video" as a label), not a live calendar mapping.

There is currently no concept of a reusable "technique" asset (a PDF that a user can bookmark to
their profile) — Day 2's PDF is a one-off download link with no save/bookmark capability, and no
central place lists a user's saved PDFs.

`Favorites.tsx` (`/oblibene`) currently shows one flat, filterable list of favorited video courses
(`video_favorites` table, filter pills: Vše / Face jóga / Fyzio jóga).

## Goals

1. Support a new onboarding content shape for Day 6: video + PDF download, no question — and the
   PDF download only unlocks after the video is fully watched.
2. Let users save a PDF ("technique") from onboarding (Day 2 and Day 6, and any future day that
   carries a PDF) to their profile as a lightweight reference — the file itself lives once as a
   shared platform asset, never copied per-user.
3. Split `/oblibene` into two views: "Videa" (existing behavior, unchanged) and "Techniky" (newly
   saved PDFs), switched by a top-level tab control.

## Non-goals

- No change to the personal (non-calendar) day-numbering/advancement logic.
- No admin UI for managing techniques — they are seeded via SQL migration, following the existing
  pattern for onboarding day content (D1/D3/D5 content was added the same way).
- No versioning or replacement workflow for technique PDFs — out of scope until needed.

## Data model

### New table: `techniques`

Shared, platform-owned PDF assets. One row per distinct PDF.

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `title` | text | e.g. "Habit Design Sheet", "Tři body pro pohyb tekutin" |
| `description` | text, nullable | optional short blurb shown in the Techniky list |
| `pdf_url` | text | the shared asset URL (same one served from onboarding) |
| `source_day_number` | int, nullable | which `onboarding_daily_content.day_number` this PDF originates from, for traceability — not a hard FK since techniques may later be created outside onboarding |
| `is_active` | boolean, default true | |
| `created_at` | timestamptz | |

RLS: public read (anon + authenticated), same policy shape as `onboarding_daily_content` — it's
shared reference content, not per-user data.

### New table: `user_saved_techniques`

Reference-only join: saving a technique never copies the file.

| column | type | notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK auth.users, default auth.uid() | |
| `technique_id` | uuid, FK techniques | |
| `created_at` | timestamptz | |

Unique constraint on `(user_id, technique_id)` so saving twice is a no-op/upsert, mirroring how
`video_favorites` already works. RLS: owner-scoped CRUD (authenticated, `auth.uid() = user_id`),
same shape as `onboarding_daily_response`.

### Seed data

- One `techniques` row for Day 2's existing PDF (`source_day_number = 2`), backfilled from whatever
  `download_url` Day 2's `onboarding_daily_content` row currently has.
- One `techniques` row for the new Day 6 PDF (the "Tři body pro pohyb tekutin" acupressure-points
  PDF supplied by the user), `source_day_number = 6`.
- Day 6's `onboarding_daily_content` row updated/inserted with `video_id` set, `download_url` set to
  the Day 6 PDF, `options = []`, `question_text = ''` (so it's treated as content-only, no
  question), following the same migration pattern used for D1/D3/D5 seeding.
- **Resolved:** Day 2's PDF is served as a static file from Vite's `public/` folder
  (`download_url = '/DESEYO_Workbook_D2.pdf'`), not Supabase Storage. Day 6's PDF follows the same
  pattern: copied into `public/DESEYO_Tri_body_pro_pohyb_tekutin.pdf`, referenced as
  `download_url = '/DESEYO_Tri_body_pro_pohyb_tekutin.pdf'`. (Already done — file is in place.)
- **Resolved:** Day 6's `video_id` reuses Day 1/Day 5's existing Mux ID
  (`EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg`) as a placeholder, per the user's instruction to
  reuse a video already on the platform rather than block on a new upload.

## `DailyOnboardingModal.tsx` changes

1. Add a new derived flag: `isVideoWithDownload = !!(content?.video_id && content?.download_url &&
   content.options.length === 0)`. This covers Day 6's shape (video + PDF, no question) and is
   checked before the existing `isDownloadOnly` / `isVideoOnly` checks (those remain for Day 2's
   PDF-only shape and any pure-video day).
2. Add day 6 to `requiresVideoWatch` (currently `day === 1 || day === 3 || day === 5`) so the
   existing "video must finish before you can proceed" lock (overlay, amber banner, `canAnswer`
   gating) applies to Day 6 unchanged — no new locking mechanism needed, just extend the day list.
3. Render branch for `isVideoWithDownload`: show the video (existing video block, unchanged), then
   below it the same PDF-download card style currently used for Day 2, but:
   - Download button and the new "Uložit do Moje techniky" button are both disabled until
     `canAnswer` is true (video watched) — reuses the existing lock pattern, no new state needed.
   - Continue button behaves like the current `isDownloadOnly`/`isVideoOnly` continue branch
     (`disabled={submitting || !canAnswer}`), advancing the day on click.
4. Extend the existing PDF-download card (used by both Day 2's `isDownloadOnly` and the new Day 6
   `isVideoWithDownload`) with a second button: "Uložit do Moje techniky" / "V technikách" (toggle,
   same visual pattern as the existing Day 3 favorite-heart toggle `handleToggleFavorite`). Clicking
   it inserts/deletes a row in `user_saved_techniques` for the technique row matching this day's
   `source_day_number`. If no matching `techniques` row exists for the day (shouldn't happen once
   seeded, but defensively), the button is hidden.
5. Day 2's existing `isDownloadOnly` branch gets the same "Uložit do Moje techniky" button added
   (no video-watch gating needed there since Day 2 has no video).

## Favorites (`/oblibene`) changes

- Add a top-level tab control above the current content ("Videa" / "Techniky"), visually consistent
  with the existing filter-pill style already on the page (and with `FyzioYoga.tsx`'s tab layout).
- **Videa tab**: exactly today's `Favorites.tsx` content — the existing content-type filter
  (Vše/Face jóga/Fyzio jóga) and video list move under this tab, unchanged otherwise.
- **Techniky tab**: new list sourced from `user_saved_techniques` joined to `techniques`, showing
  title + description (if any) + a download link + a remove button (unsaves, same interaction
  pattern as removing a video favorite). Empty state: "Zatím nemáš uložené žádné techniky."

## Error handling

- Saving/unsaving a technique follows the same fire-and-forget-with-local-state-update pattern as
  `handleToggleFavorite` already in `DailyOnboardingModal.tsx` — on failure, the toggle simply
  doesn't flip (no destructive local state change before the request resolves).
- Missing `techniques` row for a day with a PDF: log a console warning and hide the save button
  rather than throwing — consistent with the app's general approach of degrading gracefully on
  missing content (see `loadContent`'s existing `if (!data)` handling).

## Testing

- Manual verification via the local dev server (per project convention — no automated test suite
  exists for this app): walk Day 6 as a test user (video lock → PDF unlocks after watch → save to
  Techniky → shows up in `/oblibene` → Techniky tab), and confirm Day 2's PDF is now also saveable
  and that existing Day 2 behavior (no video gate) is unaffected.
