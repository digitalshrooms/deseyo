/*
# Create invoices table

## Purpose
Stores invoice records for each successful subscription payment. Users can
download a PDF copy of any invoice from their Profile page; admins can view
a client's invoices in the admin client card detail.

## New Tables
- `invoices`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to users, NOT NULL, DEFAULT auth.uid())
  - `invoice_number` (text, unique, NOT NULL) — e.g. "2026-0001"
  - `payment_id` (bigint, nullable — references payments.gopay_payment_id logically, no FK constraint since payments table lacks unique constraint)
  - `amount` (integer, NOT NULL) — in haléře (cents)
  - `currency` (text, default 'CZK')
  - `product_name` (text, NOT NULL)
  - `subscription_type` (text, nullable — 'L1' or 'L2')
  - `buyer_name` (text, nullable)
  - `buyer_email` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `issued_at` (timestamptz, default now()) — date of supply
  - `due_date` (date, nullable)

## Security
- RLS enabled
- SELECT: authenticated users can read their own invoices
- INSERT: authenticated users can insert their own invoices
- UPDATE/DELETE: not needed — invoices are immutable
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  payment_id bigint,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'CZK',
  product_name text NOT NULL,
  subscription_type text,
  buyer_name text,
  buyer_email text,
  created_at timestamptz DEFAULT now(),
  issued_at timestamptz DEFAULT now(),
  due_date date
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_invoices" ON invoices;
CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_invoices" ON invoices;
CREATE POLICY "insert_own_invoices" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
