import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiscountCode {
  id?: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  max_uses?: number | null;
  used_count?: number;
  active?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const restBase = `${supabaseUrl}/rest/v1/discount_codes`;
  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    const method = req.method;

    // GET — list all codes
    if (method === "GET") {
      const res = await fetch(`${restBase}?order=created_at.desc`, {
        headers: baseHeaders,
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — create new code
    if (method === "POST") {
      const body: DiscountCode = await req.json();
      if (!body.code?.trim()) return jsonError(400, "Kód je povinný.");
      if (!body.discount_type) return jsonError(400, "Typ slevy je povinný.");
      if (!body.discount_value || body.discount_value <= 0)
        return jsonError(400, "Hodnota slevy mus být větší než 0.");
      if (body.discount_type === "percentage" && body.discount_value > 100)
        return jsonError(400, "Procentuální sleva nesmí přesáhnout 100.");

      const payload = {
        code: body.code.trim().toUpperCase(),
        discount_type: body.discount_type,
        discount_value: Math.round(body.discount_value),
        valid_from: body.valid_from || null,
        valid_until: body.valid_until || null,
        max_uses: body.max_uses ?? null,
        active: body.active ?? true,
      };

      const res = await fetch(restBase, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err.message || "";
        if (msg.includes("duplicate") || msg.includes("unique")) {
          return jsonError(409, "Tento kód již existuje.");
        }
        return jsonError(400, msg || "Nepodařilo se vytvořit kód.");
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT — update code
    if (method === "PUT") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return jsonError(400, "Chybí ID kódu.");

      const body: Partial<DiscountCode> = await req.json();
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.code !== undefined) payload.code = body.code.trim().toUpperCase();
      if (body.discount_type !== undefined) payload.discount_type = body.discount_type;
      if (body.discount_value !== undefined) payload.discount_value = Math.round(body.discount_value);
      if (body.valid_from !== undefined) payload.valid_from = body.valid_from || null;
      if (body.valid_until !== undefined) payload.valid_until = body.valid_until || null;
      if (body.max_uses !== undefined) payload.max_uses = body.max_uses ?? null;
      if (body.active !== undefined) payload.active = body.active;

      const res = await fetch(`${restBase}?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...baseHeaders, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        return jsonError(400, err.message || "Nepodařilo se upravit kód.");
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE — remove code
    if (method === "DELETE") {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      if (!id) return jsonError(400, "Chybí ID kódu.");

      const res = await fetch(`${restBase}?id=eq.${id}`, {
        method: "DELETE",
        headers: baseHeaders,
      });

      if (!res.ok) {
        return jsonError(400, "Nepodařilo se smazat kód.");
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return jsonError(405, "Metoda není podporována.");
  } catch (error) {
    console.error("admin-discount-codes error:", error);
    return jsonError(500, "Interní chyba serveru.");
  }
});

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
