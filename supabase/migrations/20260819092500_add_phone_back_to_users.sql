/*
# Re-add phone column to users

## Purpose
An earlier migration (20260420214446_drop_phone_column) removed `phone` from
public.users. The billing details form and Fakturoid invoicing need it
again to store the customer's phone number for invoices.
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
