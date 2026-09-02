/*
# RPC: increment_discount_usage

1. Nová funkce
   - `increment_discount_usage(code_input text)` — atomicky inkrementuje
     used_count u slevového kódu (case-insensitive). Voláno z gopay-notification
     edge funkce po úspěšné platbě (stav PAID).

2. Bezpečnost
   - SECURITY DEFINER — běží pod service rolí, takže funguje i když je RLS
     na discount_codes zapnutá bez politik pro anon/authenticated.
   - Vrací nový used_count nebo NULL pokud kód neexistuje.
*/

CREATE OR REPLACE FUNCTION increment_discount_usage(code_input text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE discount_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE lower(code) = lower(code_input)
  RETURNING used_count INTO new_count;

  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_discount_usage(text) TO anon, authenticated;
