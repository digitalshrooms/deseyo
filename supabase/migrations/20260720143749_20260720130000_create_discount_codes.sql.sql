/*
# Slevove kody (discount_codes)

1. Nová tabulka `discount_codes`
   - `id` (uuid, PK)
   - `code` (text, NOT NULL) — kód slevy, case-insensitive kontrola přes unikátní index na lower(code)
   - `discount_type` ('percentage' | 'fixed_amount') — typ slevy
   - `discount_value` (integer, NOT NULL) — hodnota slevy (procenta nebo haléře)
   - `valid_from` (date, volitelné) — začátek platnosti
   - `valid_until` (date, volitelné) — konec platnosti
   - `max_uses` (integer, volitelné, null = neomezeno)
   - `used_count` (integer, default 0) — počet skutečných použití (inkrementuje se až po úspěšné platbě)
   - `active` (boolean, default true)
   - `created_at`, `updated_at` (timestamptz)

2. Indexy
   - Unikátní index na `lower(code)` pro case-insensitive vyhledávání a unikátnost
   - Index na `active` pro rychlé filtrování

3. Bezpečnost (RLS)
   - RLS povolena.
   - Žádné politiky pro anon/authenticated — tabulka je přístupná POUZE přes edge funkce
     používající service role key (verify-discount-code, admin-* funkce).
     Frontend nikdy nepřistupuje k tabulce přímo.
*/

CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  valid_from date,
  valid_until date,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive unique constraint na code
CREATE UNIQUE INDEX IF NOT EXISTS discount_codes_code_lower_unique
  ON discount_codes (lower(code));

-- Index na active pro rychlé filtrování
CREATE INDEX IF NOT EXISTS discount_codes_active_idx
  ON discount_codes (active);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Žádné RLS politiky: tabulka je uzamčená pro přímý frontend přístup.
-- Veškerý přístup jde přes edge funkce s service role key.
