/*
# Pridani sloupce discount_code do payments

1. Zmeny
   - Prvjde sloupec `discount_code` (text, volitelny) do tabulky `payments`.
     Uklada se sem kod slevy, ktery byl uplatnen na strance fakturacnich udaju,
     aby se po uspesne platbe mohl used_count v tabulce discount_codes navysit.
   - Pridan sloupec `original_amount` (integer, volitelny) — puvodni cena pred slevou,
     amount zustaiva finalni castka po slevle.

2. Bezpecnost
   - Zadne nove RLS politiky nezavazne.
*/

ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount integer;
