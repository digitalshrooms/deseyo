import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLAN_AMOUNTS: Record<string, number> = {
  L1: 29900,
  L2: 39900,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const userId = body.user_id as string | undefined;
    const subscriptionType = (body.subscription_type as string | undefined)?.toUpperCase();
    const discountCodeRaw = ((body.discount_code as string | undefined) || "").trim();

    if (!userId) return json(400, { ok: false, error: "Chybí identifikace uživatele." });
    if (!subscriptionType || !PLAN_AMOUNTS[subscriptionType]) {
      return json(400, { ok: false, error: "Neplatný plán." });
    }
    if (!discountCodeRaw) return json(400, { ok: false, error: "Chybí slevový kód." });

    // Verify the discount code server-side (never trust the client amount).
    const lookupRes = await fetch(
      `${supabaseUrl}/rest/v1/discount_codes?code=ilike.${encodeURIComponent(discountCodeRaw)}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!lookupRes.ok) {
      console.error("activate-free: lookup failed:", await lookupRes.text());
      return json(500, { ok: false, error: "Nepodařilo se ověřit kód." });
    }

    const rows = await lookupRes.json();
    const code = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!code || !code.active) {
      return json(400, { ok: false, error: "Slevový kód není platný." });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (code.valid_from && today < code.valid_from) {
      return json(400, { ok: false, error: "Slevový kód ještě není platný." });
    }
    if (code.valid_until && today > code.valid_until) {
      return json(400, { ok: false, error: "Slevový kód expiroval." });
    }
    if (code.max_uses !== null && code.used_count >= code.max_uses) {
      return json(400, { ok: false, error: "Slevový kód byl vyčerpán." });
    }

    const baseAmount = PLAN_AMOUNTS[subscriptionType];
    let discountAmount = 0;
    if (code.discount_type === "percentage") {
      discountAmount = Math.round((baseAmount * code.discount_value) / 100);
    } else {
      discountAmount = Math.min(code.discount_value, baseAmount);
    }
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    // Only this function handles free activations — anything above 0 must go through GoPay.
    if (finalAmount > 0) {
      return json(400, { ok: false, error: "Tento kód neposkytuje 100% slevu." });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const orderNumber = `FREE-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    };

    // Record the payment as free + paid (no GoPay involved).
    await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        order_number: orderNumber,
        amount: 0,
        currency: "CZK",
        product_name: `Deseyo ${subscriptionType} – 100% sleva (${code.code})`,
        state: "PAID",
        is_recurring: false,
        subscription_type: subscriptionType,
        discount_code: code.code,
        original_amount: baseAmount,
      }),
    });

    // Create / activate subscription record.
    await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        subscription_type: subscriptionType,
        subscription_status: "active",
        payment_status: "PAID",
        amount: 0,
        currency: "CZK",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        order_number: orderNumber,
      }),
    });

    // Activate the user.
    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        subscription_status: "active",
        subscription_type: subscriptionType,
        subscription_plan: subscriptionType,
        subscription_expires_at: periodEnd.toISOString(),
        level_tag: subscriptionType,
      }),
    });

    // Atomically increment discount usage.
    await fetch(`${supabaseUrl}/rest/v1/rpc/increment_discount_usage`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code_input: code.code }),
    }).catch((err) => console.error("increment_discount_usage failed:", err));

    // Create a 0,- Fakturoid invoice showing the full price and the 100% discount,
    // for bookkeeping — same as paid orders, just with no amount due. Non-blocking.
    fetch(`${supabaseUrl}/functions/v1/fakturoid-create-invoice`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        orderNumber,
        amount: 0,
        originalAmount: baseAmount,
        subscriptionType,
        discountCode: code.code,
      }),
    }).catch((err) => console.error("fakturoid-create-invoice call failed:", err));

    return new Response(
      JSON.stringify({ ok: true, subscription_type: subscriptionType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("activate-free-subscription error:", error);
    return json(500, { ok: false, error: "Něco se pokazilo. Zkuste to prosím znovu." });
  }
});

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
