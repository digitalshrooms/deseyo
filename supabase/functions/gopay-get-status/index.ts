import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOPAY_OAUTH_URL = "https://gw.sandbox.gopay.com/api/oauth2/token";
const GOPAY_PAYMENT_BASE = "https://gw.sandbox.gopay.com/api/payments/payment";

async function getGoPayToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(GOPAY_OAUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: "grant_type=client_credentials&scope=payment-all",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GoPay OAuth failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("GOPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("GOPAY_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "GoPay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    let paymentId = url.searchParams.get("payment_id");

    if (!paymentId && req.method === "POST") {
      const body = await req.json();
      paymentId = body.payment_id;
    }

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "payment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await getGoPayToken(clientId, clientSecret);

    const paymentResponse = await fetch(`${GOPAY_PAYMENT_BASE}/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (!paymentResponse.ok) {
      const text = await paymentResponse.text();
      throw new Error(`GoPay status check failed (${paymentResponse.status}): ${text}`);
    }

    const paymentData = await paymentResponse.json();
    const state: string = paymentData.state;

    console.log(`[gopay-get-status] payment ${paymentId} => ${state}`);

    // Sync state back to payments table
    await fetch(
      `${supabaseUrl}/rest/v1/payments?gopay_payment_id=eq.${paymentId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ state, updated_at: new Date().toISOString() }),
      }
    );

    // If PAID or AUTHORIZED: activate the user using the plan stored in the DB payment record.
    // The plan comes strictly from the DB — never from URL params — to prevent plan mismatch bugs.
    if (state === "PAID" || state === "AUTHORIZED") {
      const paymentRecordRes = await fetch(
        `${supabaseUrl}/rest/v1/payments?gopay_payment_id=eq.${paymentId}&select=user_id,subscription_type,amount`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Accept": "application/json",
          },
        }
      );

      const paymentRecords = await paymentRecordRes.json();
      const payment = paymentRecords?.[0];

      console.log(`[gopay-get-status] payment record:`, JSON.stringify(payment));

      if (payment?.user_id && payment?.subscription_type) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Activate subscription record
        await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?gopay_payment_id=eq.${paymentId}`,
          {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              subscription_status: "active",
              payment_status: state,
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString(),
            }),
          }
        );

        // Activate user — plan derived strictly from DB payment record
        await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${payment.user_id}`,
          {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              subscription_status: "active",
              subscription_type: payment.subscription_type,
              subscription_expires_at: periodEnd.toISOString(),
              level_tag: payment.subscription_type,
            }),
          }
        );

        console.log(`[gopay-get-status] Activated user ${payment.user_id}, plan ${payment.subscription_type}`);
      } else if (payment?.user_id && !payment?.subscription_type) {
        console.error(`[gopay-get-status] Missing subscription_type for payment ${paymentId} — not activating user`);
      }
    }

    return new Response(
      JSON.stringify({ payment_id: paymentId, state }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[gopay-get-status] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
