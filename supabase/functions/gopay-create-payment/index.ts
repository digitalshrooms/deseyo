import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOPAY_OAUTH_URL = "https://gw.sandbox.gopay.com/api/oauth2/token";
const GOPAY_PAYMENT_URL = "https://gw.sandbox.gopay.com/api/payments/payment";

// Fetches a short-lived Bearer token from GoPay using OAuth2 client_credentials flow.
// The token is valid for ~30 minutes but we obtain a fresh one per request for simplicity.
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

// Generates a unique order number with timestamp + random suffix.
function generateOrderNumber(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORDER-${ts}-${rand}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("GOPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("GOPAY_CLIENT_SECRET");
    const goId = Deno.env.get("GOPAY_GOID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret || !goId) {
      return new Response(
        JSON.stringify({ error: "GoPay credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse optional request body — caller may pass amount, product_name, user_id
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // no body is fine — defaults apply
    }

    const subscriptionType = (body.subscription_type as string | undefined);
    // Derive canonical amount from subscription type if not explicitly provided
    const defaultAmount = subscriptionType === 'L2' ? 39900 : subscriptionType === 'L1' ? 29900 : 19900;
    const amount = (body.amount as number) ?? defaultAmount;
    const currency = (body.currency as string) ?? "CZK";
    const productName = (body.product_name as string) ?? "Deseyo členství";
    const userId = body.user_id as string | undefined;
    const discountCode = body.discount_code as string | undefined;
    const originalAmount = body.original_amount as number | undefined;

    const isRecurring = false;

    const orderNumber = generateOrderNumber();

    // Step 1 — obtain Bearer token from GoPay
    const token = await getGoPayToken(clientId, clientSecret);

    // Step 2 — build the payment payload
    // SUCCESS_URL / FAILED_URL should point to your production domain;
    // update these when going live.
    const paymentPayload = {
      payer: {
        allowed_payment_instruments: ["PAYMENT_CARD"],
        // TODO: for subscription, add default_payment_instrument: "PAYMENT_CARD" and allowed_swifts
      },
      target: {
        type: "ACCOUNT",
        goid: Number(goId),
      },
      amount,
      currency,
      order_number: orderNumber,
      order_description: productName,
      items: [
        {
          type: "ITEM",
          name: productName,
          product_url: "https://deseyo.cz",
          amount,
          count: 1,
          vat_rate: 0,
        },
      ],
      callback: {
        return_url: (body.return_url as string) ?? Deno.env.get("APP_URL") ?? "https://mojedomena.cz/payment-success",
        notification_url: `${supabaseUrl}/functions/v1/gopay-notification`,
      },
      lang: "CS",
      // TODO: for recurring payments, uncomment and configure:
      // recurrence: {
      //   recurrence_cycle: "MONTH",
      //   recurrence_period: 1,
      //   recurrence_date_to: "2099-12-31",
      //   recurrence_state: "REQUESTED",
      // },
    };

    // Step 3 — create the payment at GoPay
    const paymentResponse = await fetch(GOPAY_PAYMENT_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const errText = await paymentResponse.text();
      throw new Error(`GoPay payment creation failed (${paymentResponse.status}): ${errText}`);
    }

    const paymentData = await paymentResponse.json();

    // Step 4 — persist the payment record via service role (bypasses RLS)
    const insertPayload: Record<string, unknown> = {
      gopay_payment_id: paymentData.id,
      order_number: orderNumber,
      amount,
      currency,
      product_name: productName,
      state: paymentData.state ?? "CREATED",
      payment_url: paymentData.gw_url,
      is_recurring: isRecurring,
    };
    if (userId) insertPayload.user_id = userId;
    if (subscriptionType) insertPayload.subscription_type = subscriptionType;
    if (discountCode) insertPayload.discount_code = discountCode;
    if (originalAmount) insertPayload.original_amount = originalAmount;

    // Also create a pending subscription record
    if (userId && subscriptionType) {
      await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          user_id: userId,
          subscription_type: subscriptionType,
          subscription_status: "pending",
          payment_status: "CREATED",
          gopay_payment_id: paymentData.id,
          order_number: orderNumber,
          amount,
          currency,
        }),
      });
    }

    await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(insertPayload),
    });

    // Step 5 — return payment_url so the frontend can redirect the user
    return new Response(
      JSON.stringify({
        payment_id: paymentData.id,
        order_number: orderNumber,
        payment_url: paymentData.gw_url,
        state: paymentData.state,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gopay-create-payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
