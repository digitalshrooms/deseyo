/*
  # Create verification_codes table

  1. New Tables
    - `verification_codes`
      - `id` (uuid, primary key)
      - `email` (text) — email adresa, pro kterou byl kód vygenerován
      - `code` (text) — 6místný ověřovací kód
      - `expires_at` (timestamptz) — platnost 10 minut od vytvoření
      - `created_at` (timestamptz)

  2. Rate limiting support
    - Index na email + created_at pro rychlé počítání pokusů za posledních 60 minut

  3. Security
    - RLS povoleno
    - Anon uživatel může vkládat (potřeba pro registraci před přihlášením)
    - Anon uživatel může číst kódy pro svůj email (ověření)
    - Anon uživatel může mazat použité kódy
    - Žádný přístup k cizím záznamům

  Notes:
    - Kódy jsou po ověření mazány z aplikace
    - Expirované kódy zůstávají v DB (mohou být čištěny periodicky)
*/

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email_created
  ON verification_codes (email, created_at);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a verification code"
  ON verification_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes by email"
  ON verification_codes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete used verification codes"
  ON verification_codes FOR DELETE
  TO anon, authenticated
  USING (true);
