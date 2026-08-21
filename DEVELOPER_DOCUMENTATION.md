# DESEYO — Kompletní vývojářská dokumentace

Tento dokument slouží jako referenční příručka pro vývojáře, kteří budou aplikaci převádět na mobilní aplikaci nebo ji dále rozvíjet. Popisuje architekturu, databázové schéma, edge funkce, služby, komponenty a všechny integrace.

---

## 1. Přehled aplikace

**Deseyo** je česká platforma pro jógu, face yogu, fyzio yogu a mindfulness. Je to web aplikace (React SPA) s backendem na Supabase (PostgreSQL + Auth + Edge Functions + Storage).

### Technický stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 3 + dark/light theme
- **Animace:** Framer Motion
- **Ikony:** Lucide React
- **Grafy:** Recharts (admin analytika)
- **Routing:** React Router DOM 7
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Platby:** GoPay (sandbox) — platební brána
- **Fakturace:** Fakturoid (česká fakturační služba)
- **Email:** EmailJS (ověřovací kódy) + Resend (potvrzení odstoupení)
- **Video:** Mux (přehrávač přes iframe)

### Struktura projektu
```
src/
├── App.tsx                    # Routing + route guards (ProtectedRoute, PublicRoute, OnboardingRoute)
├── main.tsx                   # Entry point
├── index.css                  # Globální styly + Tailwind
├── contexts/
│   ├── AuthContext.tsx        # Autentizace, session, user data, email change
│   └── ThemeContext.tsx       # Dark/light theme
├── lib/
│   └── supabase.ts            # Supabase client + typy (User, Course, WeeklyText, atd.)
├── components/                # UI komponenty (viz sekce 5)
├── pages/                     # Stránky (viz sekce 4)
└── services/                  # Business logika (viz sekce 3)
supabase/
├── migrations/                # 52 SQL migrací
└── functions/                 # 17 Edge Functions (Deno)
```

---

## 2. Autentizace a uživatelské stavy

### Auth flow
1. **Registrace (email):** Uživatel zadá email + heslo → pošle se 6místný ověřovací kód přes EmailJS → po ověření se zavolá `supabase.auth.signUp` + vytvoří se záznam v `users` tabulce.
2. **Registrace (OAuth):** Google/Apple → redirect na `/auth/callback` → vytvoří se záznam v `users` (pokud neexistuje).
3. **Přihlášení:** `supabase.auth.signInWithPassword` → načte se user data z `users` tabulky.

### Route guards (v App.tsx)
- **`ProtectedRoute`** — vyžaduje: authenticated + `subscription_status === 'active'` + `onboarding_completed === true`. Jinak přesměruje na `/auth`, `/vyber-planu`, nebo `/onboarding`.
- **`PublicRoute`** — pro nepřihlášené (login/registrace). Pokud je uživatel přihlášen, přesměruje na `/moje-cesta`.
- **`OnboardingRoute`** — vyžaduje auth, ale ne sub. Pro onboarding dotazník.

### Uživatelské stavy (v `users` tabulce)
| Pole | Hodnoty | Význam |
|------|---------|--------|
| `subscription_status` | `active`, `canceled`, `unpaid`, `pending` | Stav předplatného |
| `subscription_type` | `L1`, `L2`, `null` | Typ plánu (L1=299 Kč, L2=399 Kč) |
| `subscription_expires_at` | timestamp | Kdy vyprší předplatné |
| `onboarding_completed` | boolean | Dokončil onboarding dotazník |
| `current_plan` | `Restart`, `L1`, `L2` | Aktuální tréninkový plán |
| `current_week` / `current_day` | integer | Pozice v plánu |
| `level_tag` | `L1`, `L2` | Úroveň uživatele |
| `plan_tag` | `RESTART`, `DESEYO` | Typ plánu |
| `pause_active` | boolean | Je pozastaveno |
| `pause_start` / `pause_end` | timestamp | Začátek/konec pauzy |
| `pause_count_90d` | integer | Počet pauz za 90 dní (max 2) |
| `consultation_credits` | integer | Kredity na konzultace |

---

## 3. Služby (services)

### 3.1 creditService.ts
Správa kreditů za konzultace. Uživatel získává kredity za týdenní konzistenci, dokončení onboarding D30, postup na L2, nebo "speciální moment" (jednou za 60 dní).
- **Tabulky:** `users` (`consultation_credits`, `special_moment_last_used`, `credit_info_shown`), `user_credits_log`
- **Metody:** `getBalance`, `addCredit`, `addCredits`, `canUseSpecialMoment`, `claimSpecialMoment`, `hasSeenCreditInfo`, `markCreditInfoShown`

### 3.2 gamification.ts
Gamifikace — MED (Minimum Effective Dose = 3 dny pohybu/týden). Generuje motivační bannery a sleduje aktivitu.
- **Tabulky:** `user_events`
- **Metody:** `calculateMED`, `getBannerMessage`, `trackEvent`, `getRecentActivity`

### 3.3 gopayService.ts
Komunikační vrstva pro GoPay platby přes edge funkce.
- **Funkce:** `createGoPayPayment(payload)` → volá edge function `gopay-create-payment`; `getPaymentStatus(paymentId)` → volá `gopay-get-status`
- **Typy:** `CreatePaymentRequest`, `CreatePaymentResponse`, `GoPayState`

### 3.4 invoiceService.ts
Správa faktur — načítání a vytváření s auto-inkrementálním číslem faktury.
- **Tabulky:** `invoices`
- **Funkce:** `fetchUserInvoices`, `fetchInvoicesByUser`, `createInvoiceRecord`

### 3.5 onboardingSystemBService.ts
30-denní onboarding systém — denní obsah, sledování dokončení/přeskočení, posun dne.
- **Tabulky:** `users` (`onboarding_day_index`, `onboarding_completed`), `onboarding_content`, `user_onboarding_progress`
- **Metody:** `isActive`, `getTodayContent`, `getTodayAction`, `complete`, `skip`

### 3.6 pauseService.ts
Pozastavení předplatného — max 14 dní, max 2 pauzy za 90 dní.
- **Tabulky:** `users` (`pause_active`, `pause_start`, `pause_end`, `pause_count_90d`, `pause_count_reset_at`)
- **Metody:** `getPauseStatus`, `startPause`, `endPauseNow`, `getMaxPauseDays`

### 3.7 planService.ts
Hlavní engine pro tréninkové plány — Restart (4 týdny) nebo Deseyo (8 týdnů). Načítá denní lekce, krátké lekce, office lekce, doporučené lekce.
- **Tabulky:** `users` (`current_plan`, `current_week`, `current_day`), `courses`, `rituals`, `user_events`
- **Metody:** `getPlanInfo`, `getTodaysLesson`, `getShortLessons`, `getOfficeLessons`, `updateUserProgress`, `getDailyRecommendedLessons`, `getDaysInactiveCount`

### 3.8 primaryLessonService.ts
Chytrý výběr primární lekce — na základě tagů uživatele (úroveň, priorita, oblast těla, zóna obličeje) a session counterů. Má 5 úrovní fallback.
- **Tabulky:** `courses`, `user_last_used_videos`, `users`
- **Metody:** `decideVariant`, `getPrimaryLesson`, `getSupplementLessons`, `getTimeOfficeLesson`, `markLessonUsed`, `advanceCounters`

### 3.9 questionnaireLogic.ts
Logika onboarding dotazníku — 8 povinných + 3 volitelné otázky. Algoritmus doporučí plán (Restart/L1/L2) a odvodí priority tagy.
- **Bez DB** — čistá logika
- **Exporty:** `evaluateQuestionnaire`, `QUESTIONNAIRE_QUESTIONS`, `OPTIONAL_QUESTIONS`

### 3.10 reflectionService.ts
Reflexe a check-in v dnech 7/14/21/30 — ukládá reflexe, mood check-in (tělo/mysl/energie), intence.
- **Tabulky:** `user_reflections`, `user_checkins`, `user_intentions`

### 3.11 seasonalService.ts
Sezónní motivační zprávy — zobrazí se jednou za sezónu, dismissable, 3-denní cooldown.
- **Tabulky:** `seasonal_messages`, `user_seen_messages`

### 3.12 weekendService.ts
Víkendové zprávy — rotující nedělní zprávy o odpočinku.
- **Tabulky:** `user_daily_messages`

### 3.13 weeklyTextService.ts
Týdenní rotující texty — deterministicky vybere jeden text na ISO týden.
- **Tabulky:** `weekly_texts`

### 3.14 withdrawalService.ts
Odstoupení od smlouvy — podání a potvrzení přes edge funkce. Klasifikuje do 4 typů.
- **Funkce:** `submitWithdrawal`, `confirmWithdrawal` (volá edge funkce)

---

## 4. Stránky (pages)

### Veřejné stránky
| Cesta | Stránka | Účel |
|-------|---------|------|
| `/` | Homepage | Landing page s hrdinským videem, ceníkem, funkcemi |
| `/auth` | AuthPage | Registrace/přihlášení (email + OAuth) |
| `/auth/callback` | AuthCallback | OAuth callback handler |
| `/cenik` | Pricing | Ceník plánů |
| `/vyber-planu` | ChoosePlan | Výběr plánu L1/L2 |
| `/fakturacni-udaje` | BillingDetails | Fakturační údaje + GoPay platba |
| `/stav-platby` | PaymentSuccess | Potvrzení úspěšné platby |
| `/platba-zrusena` | PaymentFailed | Neúspěšná platba |
| `/zasady-ochrany-osobnich-udaju` | PrivacyPolicy | GDPR |
| `/podminky-uzivani` | TermsOfUse | Podmínky užívání |
| `/obchodni-podminky` | ObchodniPodminky | Obchodní podmínky |
| `/odstoupeni-od-smlouvy` | OdstoupeniOdSmlouvy | Odstoupení od smlouvy |
| `/kontakt` | Contact | Kontakt |

### Chráněné stránky (vyžadují auth + aktivní sub + onboarding)
| Cesta | Stránka | Účel |
|-------|---------|------|
| `/moje-cesta` | MojeCesta | Hlavní hub — denní lekce, bannery, System B karta |
| `/kurz` | Dashboard | Katalog lekcí s kategoriemi |
| `/fyzio-joga` | FyzioYoga | Fyzio jóga kategorie |
| `/test-fyziojoga` | TestFyzioJoga | Test fyzio jógy |
| `/face-joga` | Faceyoga | Face yoga kategorie |
| `/ziva-setkani` | LiveEvents | Živá setkání |
| `/mind-life` | MindLife | Mind & Life kategorie |
| `/konzultace` | Konsultace | Konzultace (kredity) |
| `/oblibene` | Favorites | Oblíbené lekce |
| `/podpora` | Support | Podpora |
| `/profil` | Profile | Profil (5 záložek: osobní, plán, předplatné, faktury, zabezpečení) |
| `/onboarding` | OnboardingQuestionnaire | Onboarding dotazník (8+3 otázek) |
| `/onboarding-result` | OnboardingResult | Výsledek onboardingu |

### Admin stránky
| Cesta | Stránka | Účel |
|-------|---------|------|
| `/admin/login` | AdminLogin | Přihlášení admina |
| `/admin/sprava` | AdminDashboard | Dashboard přehled |
| `/admin/sprava/obsah` | AdminContent | Správa obsahu (kurzy) |
| `/admin/sprava/uzivatele` | AdminUsers | Správa uživatelů |
| `/admin/sprava/klientske-karty` | AdminClientCards | Klientské karty |
| `/admin/sprava/dotaznik` | AdminQuestionnaire | Správa dotazníku |
| `/admin/sprava/texty` | AdminWeeklyTexts | Týdenní texty |
| `/admin/sprava/slevy` | AdminDiscountCodes | Slevové kódy |
| `/admin/sprava/analytics` | AdminAnalytics | Analytika |
| `/admin/sprava/finance` | AdminFinance | Finance |
| `/admin/sprava/retention` | AdminRetention | Retence |
| `/admin/sprava/subscriptions` | AdminSubscriptions | Předplatná |
| `/admin/data` | AdminData | Data export |

---

## 5. Komponenty (components)

| Komponenta | Účel | Klíčové props |
|------------|------|---------------|
| `Navbar` | Horní navigace pro přihlášené | — |
| `Footer` | Patička | — |
| `AdminLayout` | Layout wrapper pro admin | — |
| `AdminNavigation` | Navigace v admin dashboardu | — |
| `ContentLayout` | Layout wrapper pro content | — |
| `LessonModal` | Modal přehrávač lekce s označením dokončení | `course`, `onClose`, `onLessonComplete` |
| `DailyOnboardingModal` | Denní onboarding modal (System B) — video, otázky, oblíbené | `userId`, `currentDay`, `onClose` |
| `DailyOnboardingProvider` | Context provider — řídí zobrazení denního modalu | — |
| `CreditsCard` | Zobrazení kreditů + speciální moment | — |
| `PauseModeCard` | Pauza mód — start/end | — |
| `SystemBCard` | Denní onboarding karta — dnešní obsah/progress | — |
| `InvoicePreviewModal` | Náhled faktury jako PDF | `invoice`, `onClose` |
| `ReflectionModal` | Modal pro reflexi v den 7/14/21/30 | — |
| `ReflectionTrigger` | Spouštěč reflexního modalu | — |
| `GamificationBanner` | Motivační banner (MED status) | — |
| `WeekendBanner` | Víkendový banner (nedělní odpočinek) | — |
| `WeeklyTextBanner` | Týdenní motivační text | — |
| `SeasonalMessageBanner` | Sezónní zpráva s dismiss | — |
| `UpgradeBanner` | Banner pro upgrade L1→L2 | — |
| `PriorityConfirmationBanner` | Potvrzení priority (body/face) | — |
| `ProgressRing` | Kruhový progress indikátor | `progress`, `size` |
| `ActivityFeed` | Nedávná aktivita uživatele | — |
| `PageTransition` | Framer Motion page transition | `children` |
| `ThemeToggle` | Přepínač dark/light theme | — |

---

## 6. Databázové schéma

### 6.1 Hlavní tabulky

#### `users` (zrcadlí auth.users)
Hlavní uživatelská tabulka. Obsahuje profil, předplatné, plán, onboarding stavy, pauzy, kredity, tagy.
- **PK:** `id` (uuid, odpovídá `auth.users.id`)
- **Klíčová pole:** `email`, `name`, `first_name`, `last_name`, `username`, `subscription_plan`, `subscription_status`, `subscription_type`, `subscription_expires_at`, `onboarding_completed`, `current_plan`, `current_week`, `current_day`, `level_tag`, `plan_tag`, `body_area_tag`, `primary_priority_tag`, `face_zone_tag`, `consultation_credits`, `pause_active`, `pause_start`, `pause_end`, `pause_count_90d`, `weekly_session_counter`, `library_session_counter`, `l2_session_counter`, `weekly_text_index`, `anchor_time`, `q6_best_time`, `q8_email_pref`
- **RLS:** Uživatel může číst/aktualizovat vlastní záznam. Admin může číst všechny (přes `admin_users` lookup).

#### `courses`
Katalog lekcí/videí.
- **PK:** `id` (uuid)
- **Klíčová pole:** `title`, `description`, `category`, `video_url` (Mux iframe URL), `thumbnail_url`, `duration`, `is_premium`, `order_index`, `content_type` (`yoga`/`faceyoga`/`physioyoga`), `stable_id`, `plan_relevance` (text[]), `tags` (text[]), `category_tags` (text[]), `is_primary_lesson`, `library_level_tag` (`L1`/`L2`/`Universal`), `body_area_tags` (text[]), `face_zone_tags` (text[]), `is_full_body`, `is_full_face`, `lesson_type` (`fyzio_yoga`/`face_yoga`/`mind_life`/`time_office`/`general`)
- **RLS:** Kdokoliv může číst (anon + authenticated). Jen admin může insert/update/delete.

### 6.2 Gamifikace a sledování

#### `user_events`
Sleduje uživatelské akce (lesson_started, lesson_completed, ritual_started, ritual_completed, live_joined, recording_played).
- **FK:** `user_id` → `auth.users(id)` ON DELETE CASCADE
- **RLS:** Uživatel čte/vkládá vlastní eventy.

#### `lesson_completions`
Sleduje dokončení lekcí. UNIQUE(user_id, lesson_id).
- **FK:** `user_id` → `auth.users(id)` ON DELETE CASCADE
- **RLS:** Uživatel CRUD vlastní completions.

#### `video_favorites`
Oblíbená videa. UNIQUE(user_id, course_id).
- **FK:** `user_id` → `auth.users(id)`, `course_id` → `courses(id)` ON DELETE CASCADE
- **RLS:** Uživatel čte/vkládá/maže vlastní oblíbené. Anon může číst počty (pro zobrazení počtu oblíbených u lekcí).

#### `video_tags`
Tagy lekcí (TYPE, AREA, LENGTH, LEVEL, NEED). UNIQUE(course_id, tag_type, tag_value).
- **FK:** `course_id` → `courses(id)` ON DELETE CASCADE

#### `med_tracking`
Týdenní MED tracking. UNIQUE(user_id, week_start_date).

#### `user_preferences`
Uživatelská nastavení (notifikace, preferovaný čas, tón komunikace, energie).

### 6.3 Onboarding

#### `onboarding_responses`
Odpovědi z onboarding dotazníku. 8 povinných (q1–q8) + 3 volitelné (q9–q11) otázky. UNIQUE(user_id).
- **Odvozená pole:** `recommended_plan`, `main_need`, `focus_area`, `preferred_time`, `start_style`, `email_preference`, `high_capacity_candidate`, `restart_candidate`, `face_priority`, `mindlife_priority`, `fyzio_priority`

#### `onboarding_content` (System B)
30-denní onboarding obsah. `day_index` 1–30. Pole: `title`, `subtitle`, `body_text`, `video_url`, `audio_url`, `thumbnail_url`, `duration`, `tags`.

#### `onboarding_daily_content` (denní popup systém)
30-denní check-in popup. `day_number` 1–30.
- **Klíčová pole:** `phase`, `video_id` (Mux playback ID), `question_text`, `options` (jsonb), `download_url` (PDF), `linked_course_id` (FK→courses), `post_video_message` (text po videu), `button_label` (vlastní text tlačítka)
- **Speciální dny:**
  - **D1:** Video + otázka se 3 možnostmi
  - **D2:** PDF download (workbook)
  - **D3:** Video + oblíbené (heart tlačítko, bez otázky)
  - **D5:** Video + citát po videu + tlačítko "Absolvováno"

#### `onboarding_daily_response`
Odpovědi z denního popupu. UNIQUE(user_id, day_number).

#### `user_onboarding_progress`
Progress onboarding dní. UNIQUE(user_id, day_index). Action: `completed` nebo `skipped`.

#### `user_daily_messages`
Záznamy zobrazených zpráv (pro deduplikaci).

### 6.4 Deseyo architektura

#### `weekly_texts`
52 rotujících textů na celý rok. Pole: `text_content`, `author`, `category`, `order_index`, `is_active`.

#### `seasonal_messages`
4 sezónní zprávy (jaro/léto/podzim/zima). `display_start_month` určuje kdy se začne zobrazovat.

#### `user_credits_log`
Audit log kreditů. `reason`, `delta`, `balance_after`, `note`.

#### `user_reflections`
Reflexe v dnech 7/14/21/30. UNIQUE(user_id, reflection_day). `answers` (jsonb).

#### `user_checkins`
Mood check-in v dnech 7/14/21/30. `body_feeling`, `mind_feeling`, `energy_feeling` (1–5). UNIQUE(user_id, checkin_day).

#### `user_intentions`
Intence uživatele. `kind`: `d1_intention`, `d1_success`, `d30_goal`. UNIQUE(user_id, kind).

#### `user_seen_messages`
Zobrazené zprávy (pro deduplikaci). UNIQUE(user_id, message_key).

#### `user_last_used_videos`
Poslední použité videa (pro deduplikaci v primary lesson pickeru). UNIQUE(user_id, course_id).

### 6.5 Admin

#### `admin_users`
Admin účty. `email`, `password_hash`, `role` (`admin`/`moderator`).

#### `content_categories`
Kategorie obsahu. `name`, `slug`, `description`, `icon`, `color`, `order_index`.

#### `category_tags`
Tagy pro kategorie. UNIQUE(category, tag_value).

### 6.6 Platby a fakturace

#### `payments`
Záznamy plateb. Pole: `user_id`, `product_name`, `subscription_type`, `amount` (v haléřích), `state` (`PAID`/`TIMEOUTED`/`CANCELED`), `is_recurring`, `gopay_payment_id`, `fakturoid_invoice_id`, `discount_code`, `original_amount`.

#### `subscriptions`
Předplatná. Pole: `user_id`, `subscription_type`, `subscription_status` (`active`/`unpaid`/`pending`), `payment_status`, `amount` (haléře), `current_period_start`, `current_period_end`, `cancel_at_period_end`.

#### `discount_codes`
Slevové kódy. `code` (case-insensitive unique), `discount_type` (`percentage`/`fixed_amount`), `discount_value`, `valid_from`, `valid_until`, `max_uses`, `used_count`, `active`.
- **RLS:** Povoleno, ale bez polic — přístup jen přes service_role (edge funkce).

#### `invoices`
Faktury. `invoice_number` (unique), `payment_id`, `amount` (haléře), `currency`, `product_name`, `subscription_type`, `buyer_name`, `buyer_email`, `due_date`.

### 6.7 Ostatní

#### `verification_codes`
Ověřovací kódy pro změnu emailu. `email`, `code`, `expires_at`.

#### `forum_posts` / `forum_comments` / `activities`
Fórum a aktivita (starší funkce, pravděpodobně nepoužívané v aktuální verzi).

---

## 7. Edge Functions (Deno)

Všechny edge funkce běží na Supabase Edge Runtime (Deno). Mají CORS hlavičky (`Access-Control-Allow-Origin: *`).

### 7.1 Platební flow

#### `gopay-create-payment`
- **Účel:** Vytvoří GoPay platbu. Získá OAuth2 token, vytvoří payment v GoPay sandboxu, uloží `payments` a `subscriptions` záznam.
- **Ceny:** L1=299 Kč (29900 haléřů), L2=399 Kč (39900 haléřů), default=199 Kč.
- **Vstup:** `user_id`, `subscription_type`, `discount_code` (volitelné), billing info.
- **Výstup:** GoPay gateway URL pro redirect.
- **Secrets:** `GOPAY_CLIENT_ID`, `GOPAY_CLIENT_SECRET`, `GOPAY_GOID`

#### `gopay-get-status`
- **Účel:** Zkontroluje stav GoPay platby. Pokud PAID/AUTHORIZED, aktivuje předplatné (`subscription_status=active`, `subscription_expires_at` = +1 měsíc, `level_tag`).
- **Vstup:** `payment_id`
- **Bezpečnost:** Plan se čte z DB, ne z URL parametrů.

#### `gopay-notification`
- **Účel:** GoPay webhook callback. Ověří stav platby přímo z GoPay, aktualizuje `payments.state`. Při PAID: inkrementuje discount code usage (RPC `increment_discount_usage`), aktivuje sub, volá `fakturoid-create-invoice`.

### 7.2 Fakturace

#### `fakturoid-create-invoice`
- **Účel:** Vytvoří fakturu v Fakturoidu. Najde/vytvoří kontakt (subject), vytvoří fakturu (CZK, 0% DPH), odešle emailem, uloží `fakturoid_invoice_id` do `payments`.
- **Secrets:** `FAKTUROID_CLIENT_ID`, `FAKTUROID_CLIENT_SECRET`, `FAKTUROID_SLUG`
- **API:** `app.fakturoid.cz/api/v3`

### 7.3 Admin funkce

| Funkce | Účel | Metody |
|--------|------|-------|
| `admin-login` | Přihlášení admina (email + heslo) | POST |
| `admin-users` | Seznam všech uživatelů (merge auth.users + public.users) | GET |
| `admin-update-user` | Update uživatele (plán, týden, den) | POST |
| `admin-delete-user` | Smazání uživatele (RPC `admin_delete_user_complete`) | POST |
| `admin-courses` | CRUD pro kurzy | GET/POST/PUT/DELETE |
| `admin-stats` | Dashboard analytika (overview, analytics, finance, subscriptions, retention) | GET |
| `admin-discount-codes` | CRUD pro slevové kódy | GET/POST/PUT/DELETE |
| `admin-onboarding-responses` | Načtení onboarding odpovědí uživatele | GET |

### 7.4 Uživatelské funkce

| Funkce | Účel | Metody | Auth |
|--------|------|-------|------|
| `self-delete-user` | Smazání vlastního účtu | POST | JWT + ownership check |
| `update-user-email` | Změna emailu (s ověřovacím kódem) | POST | JWT + verification code |
| `verify-discount-code` | Validace slevového kódu | POST | Veřejné |
| `withdrawal-submit` | Podání odstoupení od smlouvy | POST | Veřejné |
| `withdrawal-confirm` | Potvrzení odstoupení (preview_token) | POST | Token-based |
| `keep-alive` | Health check | GET/POST | Veřejné |

### 7.5 Secrets — přehled

| Secret | Používá |
|--------|---------|
| `SUPABASE_URL` | Všechny funkce |
| `SUPABASE_SERVICE_ROLE_KEY` | Všechny funkce |
| `SUPABASE_ANON_KEY` | admin-courses, self-delete-user, update-user-email |
| `GOPAY_CLIENT_ID` | gopay-create-payment, gopay-get-status, gopay-notification |
| `GOPAY_CLIENT_SECRET` | gopay-create-payment, gopay-get-status, gopay-notification |
| `GOPAY_GOID` | gopay-create-payment |
| `FAKTUROID_CLIENT_ID` | fakturoid-create-invoice |
| `FAKTUROID_CLIENT_SECRET` | fakturoid-create-invoice |
| `FAKTUROID_SLUG` | fakturoid-create-invoice |
| `RESEND_API_KEY` | withdrawal-confirm |

---

## 8. RPC funkce (PostgreSQL)

### `admin_delete_user_complete(target_user_id uuid)`
- Atomicky smaže uživatele z `public.users`, `verification_codes` a `auth.users`.
- SECURITY DEFINER, přístup jen pro service_role.

### `increment_discount_usage(code_input text)`
- Atomicky inkrementuje `used_count` pro slevový kód (case-insensitive).
- Voláno z `gopay-notification` po úspěšné platbě.

### Admin analytické RPC (všechny SECURITY DEFINER, vracejí jsonb)
| Funkce | Účel |
|--------|------|
| `admin_user_growth` | Růst uživatelů (den/týden/měsíc), konverze |
| `admin_subscription_metrics` | MRR, aktivní/zrušené, churn rate |
| `admin_mrr_trend` | Měsíční revenue z PAID plateb |
| `admin_discount_impact` | Vliv slevových kódů na revenue |
| `admin_onboarding_funnel` | Funnel: registrace → email verify → onboarding → platba |
| `admin_onboarding_response_distribution` | Distribuce odpovědí z dotazníku |
| `admin_recent_payments` | Poslední platby s uživatelskými daty |
| `admin_subscriptions_list` | Seznam předplatných |
| `admin_retention_data` | Churn risk, retence |
| `admin_revenue_by_plan` | MRR per plán |

---

## 9. Klíčové uživatelské flow

### 9.1 Registrace a platba
1. Uživatel přijde na Homepage → klikne registrace → `/auth`
2. Zadá email + heslo → ověřovací kód (EmailJS) → `signUp` → vytvoří se `users` záznam
3. Přesměrování na `/vyber-planu` → vybere L1 (299 Kč) nebo L2 (399 Kč)
4. `/fakturacni-udaje` → vyplní fakturační údaje → volitelně slevový kód → GoPay platba
5. GoPay redirect → `/stav-platby` → `gopay-get-status` ověří platbu → aktivuje sub
6. Pokud PAID → `subscription_status=active`, `subscription_expires_at` = +1 měsíc
7. GoPay webhook (`gopay-notification`) → vytvoří fakturu v Fakturoidu

### 9.2 Onboarding
1. Po platbě → přesměrování na `/onboarding`
2. Uživatel odpoví na 8 povinných + 3 volitelné otázky
3. `evaluateQuestionnaire` doporučí plán (Restart/L1/L2) a nastaví tagy
4. Uloží se do `onboarding_responses` + updatne `users` (`onboarding_completed=true`, tagy)
5. Přesměrování na `/onboarding-result` → pak `/moje-cesta`

### 9.3 Denní používání (System B — 30-denní onboarding)
1. Na `/moje-cesta` se zobrazí `DailyOnboardingProvider` který detekuje dnešní den
2. Otevře se `DailyOnboardingModal` s obsahem pro aktuální den
3. **D1:** Video → po přehrání se ukáže otázka se 3 možnostmi → uloží se odpověď
4. **D2:** PDF download (workbook) → tlačítko "Stáhnout" → pokračovat
5. **D3:** Video → po přehrání se ukáže info o oblíbených + heart tlačítko → uložení do `video_favorites`
6. **D5:** Video → po přehrání se ukáže citát → tlačítko "Absolvováno"
7. **D7/D14/D21/D30:** Reflexní modal — mood check-in (tělo/mysl/energie) + intence
8. Progress se ukládá do `onboarding_daily_response` a `user_onboarding_progress`

### 9.4 Tréninkový plán (System A)
1. Na `/moje-cesta` se zobrazí dnešní primární lekce (z `primaryLessonService`)
2. Uživatel klikne → otevře se `LessonModal` s Mux přehrávačem
3. Po dokončení se označí v `lesson_completions` a updatne se `users.current_day`
4. Doporučené lekce se generují přes `planService.getDailyRecommendedLessons` (seeded shuffle)
5. Uživatel může procházet kategorie na `/kurz`, `/fyzio-joga`, `/face-joga`, `/mind-life`

### 9.5 Gamifikace
- **MED (Minimum Effective Dose):** 3 dny pohybu/týden → `GamificationBanner` ukáže praise/reminder
- **Kredity:** Za týdenní konzistenci, D30 dokončení, L2 postup, speciální moment (60d cooldown)
- **Bannery:** Víkendový (nedělní odpočinek), týdenní text, sezónní zpráva

### 9.6 Pauza
- Uživatel může pozastavit předplatné na max 14 dní, max 2 pauzy za 90 dní
- Spravuje `pauseService` → ukládá do `users.pause_active`, `pause_start`, `pause_end`

### 9.7 Odstoupení od smlouvy
1. Uživatel vyplní formulář na `/odstoupeni-od-smlouvy`
2. `withdrawal-submit` edge function klasifikuje typ (LEGAL_WITHDRAWAL, OUT_OF_LEGAL_RIGHT, OUT_OF_PERIOD, EDGE_CASE)
3. Vygeneruje se `preview_token` → uživatel potvrdí
4. `withdrawal-confirm` → odešle potvrzovací email přes Resend + případně escalation na `clenstvi@deseyo.cz`

---

## 10. Externí integrace

### GoPay (platební brána)
- **Prostředí:** Sandbox (`gw.sandbox.gopay.com`)
- **Flow:** OAuth2 token → create payment → redirect → webhook notification → status check
- **Měna:** CZK, částky v haléřích (1 Kč = 100 haléřů)
- **Secrets:** `GOPAY_CLIENT_ID`, `GOPAY_CLIENT_SECRET`, `GOPAY_GOID`

### Fakturoid (fakturace)
- **API:** `app.fakturoid.cz/api/v3`
- **Flow:** OAuth2 token → find/create subject → create invoice → send by email → store invoice ID
- **Secrets:** `FAKTUROID_CLIENT_ID`, `FAKTUROID_CLIENT_SECRET`, `FAKTUROID_SLUG`

### Mux (video hosting)
- **Přehrávač:** iframe `https://player.mux.com/{playback_id}`
- **Metadata:** `metadata-video-title` a `video-title` parametry v URL
- **Použití:** `courses.video_url`, `onboarding_daily_content.video_id`

### EmailJS (ověřovací kódy)
- **Service:** `service_h264krr`
- **Template:** `template_a577xkm`
- **Public key:** `saGOmdFFdZT_Ravmd`
- **Použití:** Ověřovací kódy pro registraci a změnu emailu

### Resend (email)
- **API:** `api.resend.com/emails`
- **Secret:** `RESEND_API_KEY`
- **Použití:** Potvrzení odstoupení od smlouvy + escalation emaily

---

## 11. Bezpečnostní poznámky

### Co je správně
- `self-delete-user` a `update-user-email` mají správnou JWT autentizaci + ownership check
- `discount_codes` má RLS bez polic — přístup jen přes service_role
- Všechny tabulky mají RLS povoleno
- `auth.uid()` se používá pro ownership check (ne `current_user`)

### Co je třeba řešit při přechodu na aplikaci
1. **Admin edge funkce nemají autentizaci** — 8 admin funkcí používá service_role key bez ověření volajícího. Kdokoliv s URL může mazat uživatele, číst všechna data, modifikovat předplatná.
2. **`admin-login` porovnává hesla v plaintextu** a má hardcoded bypass `"auth_managed"`.
3. **`users` tabulka má anon SELECT policy (`USING (true)`)** — neautentizovaní mohou číst všechny uživatele.
4. **`verification_codes` má plně otevřené RLS** — kdokoliv může číst/mazat všechny kódy.
5. **GoPay je na sandboxu** — pro produkci přepnout na `gw.gopay.com`.
6. **`gopay-create-payment` důvěřuje `subscription_type` z request body** — bez ověření, že částka odpovídá plánu.
7. **CORS je `*` všude** — pro aplikaci by mělo být omezeno na konkrétní origin.
8. **`update_updated_at_column()` trigger funkce existuje, ale není nikde připojena** — `updated_at` se neupdatuje automaticky.

---

## 12. RLS politika — přehled

### Vlastnické tabulky (user může CRUD vlastní data)
- `users` — SELECT/INSERT/UPDATE vlastní záznam (admin může číst všechny)
- `lesson_completions` — CRUD vlastní completions
- `video_favorites` — CRUD vlastní oblíbené (anon může číst počty)
- `user_events` — SELECT/INSERT vlastní eventy
- `med_tracking` — CRUD vlastní tracking
- `user_preferences` — CRUD vlastní preferences
- `onboarding_responses` — CRUD vlastní odpovědi
- `onboarding_daily_response` — CRUD vlastní odpovědi
- `user_onboarding_progress` — CRUD vlastní progress
- `user_daily_messages` — SELECT/INSERT vlastní zprávy
- `user_credits_log` — SELECT/INSERT vlastní log
- `user_reflections` — CRUD vlastní reflexe
- `user_checkins` — CRUD vlastní check-ins
- `user_intentions` — CRUD vlastní intence
- `user_seen_messages` — CRUD vlastní zprávy
- `user_last_used_videos` — CRUD vlastní záznamy
- `invoices` — SELECT/INSERT vlastní faktury

### Veřejně čitelné tabulky
- `courses` — anon + authenticated SELECT
- `onboarding_daily_content` — anon + authenticated SELECT
- `weekly_texts` — anon + authenticated SELECT (active)
- `seasonal_messages` — authenticated SELECT (active)
- `content_categories` — public SELECT
- `category_tags` — public SELECT
- `video_tags` — authenticated SELECT
- `rituals` — authenticated SELECT
- `live_events` — authenticated SELECT

### Admin-only (přes service_role)
- `discount_codes` — RLS povoleno, žádné policy → jen service_role
- `admin_users` — public SELECT (⚠️ bez omezení role)

### Fórum (starší)
- `forum_posts` / `forum_comments` — authenticated SELECT, vlastník INSERT/UPDATE/DELETE
- `activities` — authenticated SELECT, vlastník INSERT

---

## 13. Environment proměnné

### Frontend (.env)
| Proměnná | Účel |
|----------|------|
| `VITE_SUPABASE_URL` | URL Supabase projektu |
| `VITE_SUPABASE_ANON_KEY` | Anon klíč pro client-side Supabase client |

### Edge Functions (Supabase secrets)
| Proměnná | Účel |
|----------|------|
| `SUPABASE_URL` | URL Supabase (pro edge funkce) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypass RLS) |
| `SUPABASE_ANON_KEY` | Anon key (pro auth verifikaci) |
| `GOPAY_CLIENT_ID` | GoPay OAuth client ID |
| `GOPAY_CLIENT_SECRET` | GoPay OAuth client secret |
| `GOPAY_GOID` | GoPay GoID |
| `FAKTUROID_CLIENT_ID` | Fakturoid OAuth client ID |
| `FAKTUROID_CLIENT_SECRET` | Fakturoid OAuth client secret |
| `FAKTUROID_SLUG` | Fakturoid account slug |
| `RESEND_API_KEY` | Resend email API key |

### EmailJS (hardcoded v AuthContext.tsx)
| Proměnná | Hodnota |
|----------|---------|
| `EMAILJS_SERVICE_ID` | `service_h264krr` |
| `EMAILJS_TEMPLATE_ID` | `template_a577xkm` |
| `EMAILJS_PUBLIC_KEY` | `saGOmdFFdZT_Ravmd` |

---

## 14. Dvou-systémová architektura

Deseyo funguje na principe dvou systémů:

### System B — 30-denní onboarding
- Denní obsah (D1–D30) přes `onboarding_content` a `onboarding_daily_content`
- Denní popup modal (`DailyOnboardingModal`) s videem, otázkami, downloady
- Reflexe v dnech 7/14/21/30
- Sledování přes `user_onboarding_progress` a `onboarding_daily_response`
- Spravuje `onboardingSystemBService.ts`

### System A — tréninkový plán
- Plány: Restart (4 týdny) nebo Deseyo (8 týdnů)
- Denní primární lekce přes `primaryLessonService.ts` s 5 úrovněmi fallback
- Doporučené lekce přes `planService.ts` (seeded shuffle pro determinismus)
- Progress tracking přes `users.current_week`, `users.current_day`, `lesson_completions`
- Kategorizace: fyzio jóga, face yoga, mind life, time office

### Spojení
- Po dokončení onboarding dotazníku se nastaví `onboarding_completed=true` a tagy (úroveň, priorita, oblast)
- Na `/moje-cesta` se zobrazuje System B karta + System A primární lekce
- Gamifikace (MED, kredity, bannery) doplňuje oba systémy

---

## 15. Seed data

### Kurzy (21 lekcí)
- Meditace a mindfulness (3), Jóga a tělo (3), Energie a čakry (3), Osobní růst (3)
- Úvodní cesta (3, free/Basic), Spánek a sny (3, premium), Tajemství duše (3, premium)

### Týdenní texty (52)
- Rotující filozofické texty na celý rok (James Clear, Aristoteles, Lao-c, Konfucius, atd.)

### Sezónní zprávy (4)
- Jaro (březen), Léto (červen), Podzim (září), Zima (prosinec)

### Kategorie (5)
- Yoga, Face Yoga, Fyzio Yoga, Mind & Life, Live Events

### Admin uživatel
- `admin@deseyo.cz` / `admin123`

---

Tento dokument poskytuje úplný přehled aplikace pro vývojáře. Pro detailní implementaci jednotlivých částí je třeba nahlédnout do konkrétních souborů v `src/` a `supabase/`.
