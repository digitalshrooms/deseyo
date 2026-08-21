/*
# Add billing address fields to users

## Purpose
BillingDetails.tsx already collects street/city/zip (and phone) as required
fields before payment, but the data was never persisted anywhere — it was
discarded on submit. These columns let that form actually save the data so
the Fakturoid invoice can include a full billing address.

## Changes
- users.street (text, nullable)
- users.city (text, nullable)
- users.zip (text, nullable)
- users.phone already exists, reused as-is.
*/

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip text;
