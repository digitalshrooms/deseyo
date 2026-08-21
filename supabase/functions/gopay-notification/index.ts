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
  if (!response.ok) throw new Error(`OAuth failed: ${response.status}`);
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
      return new Response("GoPay credentials not configured", { status: 500 });
    }

    const url = new URL(req.url);
    const paymentId = url.searchParams.get("id");
    if (!paymentId) return new Response("Missing payment id", { status: 400 });

    // Verify state directly from GoPay — never trust notification alone
    const token = await getGoPayToken(clientId, clientSecret);
    const paymentResponse = await fetch(`${GOPAY_PAYMENT_BASE}/${paymentId}`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });

    if (!paymentResponse.ok) {
      throw new Error(`GoPay verification failed: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    const state: string = paymentData.state;

    // Update payments table
    await fetch(`${supabaseUrl}/rest/v1/payments?gopay_payment_id=eq.${paymentId}`, {
      method: "PATCH",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ state, updated_at: new Date().toISOString() }),
    });

    if (state === "PAID" || state === "AUTHORIZED") {
      // Fetch the payment record to get user_id and subscription_type
      const paymentRecordRes = await fetch(
        `${supabaseUrl}/rest/v1/payments?gopay_payment_id=eq.${paymentId}&select=user_id,subscription_type,amount,discount_code,original_amount`,
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

      if (payment?.user_id) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Increment discount code used_count after successful payment
        if (payment.discount_code) {
          await fetch(
            `${supabaseUrl}/rest/v1/rpc/increment_discount_usage`,
            {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code_input: payment.discount_code }),
            }
          ).catch((err) => console.error("increment_discount_usage failed:", err));
        }

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

        // Activate user — set subscription fields
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
              subscription_type: payment.subscription_type ?? null,
              subscription_expires_at: periodEnd.toISOString(),
              level_tag: payment.subscription_type ?? null,
            }),
          }
        );

        // Create Fakturoid invoice and send it by email (non-blocking — failure doesn't affect payment)
        fetch(`${supabaseUrl}/functions/v1/fakturoid-create-invoice`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: payment.user_id,
            paymentId,
            amount: payment.amount,
            originalAmount: payment.original_amount,
            subscriptionType: payment.subscription_type,
            discountCode: payment.discount_code,
          }),
        }).catch((err) => console.error("fakturoid-create-invoice call failed:", err));
      }
    }

    if (state === "CANCELED" || state === "TIMEOUTED") {
      // Mark subscription as unpaid
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
            subscription_status: "unpaid",
            payment_status: state,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    }

    console.log(`GoPay notification: payment ${paymentId} => ${state}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("gopay-notification error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
