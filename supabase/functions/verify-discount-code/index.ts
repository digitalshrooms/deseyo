import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyRequest {
  code?: string;
  plan_id?: string;
  base_amount?: number;
}

interface VerifyResponse {
  valid: boolean;
  error?: string;
  error_code?: "not_found" | "expired" | "inactive" | "exhausted" | "invalid_input";
  discount_type?: "percentage" | "fixed_amount";
  discount_value?: number;
  original_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  code?: string;
}

const PLAN_AMOUNTS: Record<string, number> = {
  L1: 29900,
  L2: 39900,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VerifyRequest = await req.json().catch(() => ({}));
    const rawCode = (body.code || "").trim();
    const planId = (body.plan_id || "").trim().toUpperCase();
    const explicitAmount = typeof body.base_amount === "number" ? body.base_amount : null;

    if (!rawCode) {
      return jsonError(400, {
        valid: false,
        error: "Zadejte slevový kód.",
        error_code: "invalid_input",
      });
    }

    const baseAmount = explicitAmount ?? PLAN_AMOUNTS[planId];
    if (!baseAmount || baseAmount <= 0) {
      return jsonError(400, {
        valid: false,
        error: "Nebyl vybrán platný plán.",
        error_code: "invalid_input",
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const lookupRes = await fetch(
      `${supabaseUrl}/rest/v1/discount_codes?code=ilike.${encodeURIComponent(rawCode)}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!lookupRes.ok) {
      console.error("verify-discount-code lookup failed:", await lookupRes.text());
      return jsonError(500, {
        valid: false,
        error: "Nepodařilo se ověřit kód. Zkuste to prosím znovu.",
      });
    }

    const rows = await lookupRes.json();
    const code = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!code) {
      return jsonError(404, {
        valid: false,
        error: "Tento slevový kód neexistuje.",
        error_code: "not_found",
      });
    }

    if (!code.active) {
      return jsonError(400, {
        valid: false,
        error: "Tento slevový kód již není aktivní.",
        error_code: "inactive",
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (code.valid_from && today < code.valid_from) {
      return jsonError(400, {
        valid: false,
        error: "Tento slevový kód ještě není platný.",
        error_code: "inactive",
      });
    }
    if (code.valid_until && today > code.valid_until) {
      return jsonError(400, {
        valid: false,
        error: "Tento slevový kód již expiroval.",
        error_code: "expired",
      });
    }

    if (code.max_uses !== null && code.used_count >= code.max_uses) {
      return jsonError(400, {
        valid: false,
        error: "Tento slevový kód byl již vyčerpán.",
        error_code: "exhausted",
      });
    }

    let discountAmount = 0;
    if (code.discount_type === "percentage") {
      discountAmount = Math.round((baseAmount * code.discount_value) / 100);
    } else {
      discountAmount = Math.min(code.discount_value, baseAmount);
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    const result: VerifyResponse = {
      valid: true,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      original_amount: baseAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      code: code.code,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-discount-code error:", error);
    return jsonError(500, {
      valid: false,
      error: "Něco se pokazilo. Zkuste to prosím znovu.",
    });
  }
});

function jsonError(status: number, body: VerifyResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
