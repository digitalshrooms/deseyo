import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FAKTUROID_API = "https://app.fakturoid.cz/api/v3/accounts";
const FAKTUROID_TOKEN_URL = "https://app.fakturoid.cz/api/v3/oauth/token";

async function getFakturoidToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(FAKTUROID_TOKEN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fakturoid OAuth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

interface SubjectDetails {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
}

async function findOrCreateSubject(
  token: string,
  slug: string,
  email: string,
  details: SubjectDetails,
): Promise<number> {
  const subjectBody = {
    name: details.fullName,
    email,
    phone: details.phone || undefined,
    street: details.street || undefined,
    city: details.city || undefined,
    zip: details.zip || undefined,
    country: "CZ",
    type: "consumer",
  };

  // Search for existing subject by email — /subjects.json?email= silently ignores the
  // filter and returns every subject, so this must use the dedicated search endpoint.
  const searchRes = await fetch(
    `${FAKTUROID_API}/${slug}/subjects/search.json?query=${encodeURIComponent(email)}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    },
  );

  if (searchRes.ok) {
    const subjects = await searchRes.json();
    const exactMatch = Array.isArray(subjects)
      ? subjects.find((s: { email?: string }) => s.email?.toLowerCase() === email.toLowerCase())
      : null;
    if (exactMatch) {
      // Keep the subject's contact/address details current on repeat purchases.
      const updateRes = await fetch(`${FAKTUROID_API}/${slug}/subjects/${exactMatch.id}.json`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(subjectBody),
      });
      if (!updateRes.ok) {
        // Non-fatal: fall back to the existing subject record as-is.
        console.error(`Fakturoid subject update failed (${updateRes.status}): ${await updateRes.text()}`);
      }
      return exactMatch.id as number;
    }
  }

  // Create new subject
  const createRes = await fetch(`${FAKTUROID_API}/${slug}/subjects.json`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(subjectBody),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Fakturoid create subject failed (${createRes.status}): ${text}`);
  }

  const subject = await createRes.json();
  return subject.id as number;
}

function getInvoiceLineName(subscriptionType: string): string {
  if (subscriptionType === "L2") return "Deseyo členství — úroveň L2";
  if (subscriptionType === "L1") return "Deseyo členství — úroveň L1";
  return "Deseyo členství";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FAKTUROID_CLIENT_ID");
    const clientSecret = Deno.env.get("FAKTUROID_CLIENT_SECRET");
    const slug = Deno.env.get("FAKTUROID_SLUG");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clientId || !clientSecret || !slug) {
      return new Response(
        JSON.stringify({ error: "Fakturoid credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { userId, paymentId, orderNumber, amount, originalAmount, subscriptionType, discountCode } = await req.json();

    // Free (100%-discount) orders have no GoPay paymentId — they're identified by orderNumber instead.
    if (!userId || (!paymentId && !orderNumber)) {
      return new Response(
        JSON.stringify({ error: "Missing userId or paymentId/orderNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch user data (email + name + billing details) from Supabase
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=email,first_name,last_name,phone,street,city,zip`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Accept": "application/json",
        },
      },
    );

    const users = await userRes.json();
    const user = users?.[0];

    // Fallback to auth.users email if not in users table
    let email = user?.email ?? "";
    let fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Zákazník";

    if (!email) {
      const authRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${userId}`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Accept": "application/json",
          },
        },
      );
      if (authRes.ok) {
        const authUser = await authRes.json();
        email = authUser.email ?? "";
        if (!user?.first_name && authUser.user_metadata?.full_name) {
          fullName = authUser.user_metadata.full_name;
        }
      }
    }

    if (!email) {
      throw new Error(`No email found for user ${userId}`);
    }

    // Amount in Fakturoid is in CZK (not halers) — convert from halers
    const lineName = getInvoiceLineName(subscriptionType ?? "");

    // When a discount was applied, show the full price and the discount as two
    // separate lines (summing to the actual charged amount) instead of just the
    // already-discounted price with no explanation.
    const hasDiscount = typeof originalAmount === "number" && originalAmount > amount;
    const lines = hasDiscount
      ? [
          {
            name: lineName,
            quantity: "1",
            unit_name: "ks",
            unit_price: (originalAmount / 100).toFixed(2),
            vat_rate: "0",
          },
          {
            name: discountCode ? `Sleva (kód ${discountCode})` : "Sleva",
            quantity: "1",
            unit_name: "ks",
            unit_price: (-(originalAmount - amount) / 100).toFixed(2),
            vat_rate: "0",
          },
        ]
      : [
          {
            name: lineName,
            quantity: "1",
            unit_name: "ks",
            unit_price: (amount / 100).toFixed(2),
            vat_rate: "0",
          },
        ];

    const token = await getFakturoidToken(clientId, clientSecret);
    const subjectId = await findOrCreateSubject(token, slug, email, {
      fullName,
      phone: user?.phone ?? "",
      street: user?.street ?? "",
      city: user?.city ?? "",
      zip: user?.zip ?? "",
    });

    // Create invoice — the customer already paid (via GoPay card, or the order was
    // 100% free), so this is never a "please transfer within 14 days" bank invoice:
    // due date is today and payment_method reflects the card charge.
    const invoiceRes = await fetch(`${FAKTUROID_API}/${slug}/invoices.json`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        subject_id: subjectId,
        payment_method: "card",
        currency: "CZK",
        due: 0,
        lines,
        note: paymentId ? `GoPay platba #${paymentId}` : `Objednávka ${orderNumber}`,
      }),
    });

    if (!invoiceRes.ok) {
      const text = await invoiceRes.text();
      throw new Error(`Fakturoid create invoice failed (${invoiceRes.status}): ${text}`);
    }

    const invoice = await invoiceRes.json();
    const invoiceId: number = invoice.id;

    // Mark it paid immediately — matches reality, and keeps it out of Fakturoid's
    // "unpaid"/overdue lists since no payment is actually still owed.
    const paidOn = new Date().toISOString().slice(0, 10);
    const payRes = await fetch(`${FAKTUROID_API}/${slug}/invoices/${invoiceId}/payments.json`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ paid_on: paidOn, amount: (amount / 100).toFixed(2) }),
    });
    if (!payRes.ok) {
      // Non-fatal: invoice exists and is correct, just not marked paid — log and continue.
      console.error(`Fakturoid mark-as-paid failed (${payRes.status}): ${await payRes.text()}`);
    }

    // Send invoice by email via Fakturoid
    const emailRes = await fetch(
      `${FAKTUROID_API}/${slug}/invoices/${invoiceId}/message.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email: true }),
      },
    );

    if (!emailRes.ok) {
      // Non-fatal: invoice created, only email failed — log and continue
      const errText = await emailRes.text();
      console.error(`Fakturoid email send failed (${emailRes.status}): ${errText}`);
    }

    // Store fakturoid_invoice_id in payments table — free orders have no gopay_payment_id,
    // so fall back to matching on order_number (every payment row has one).
    const paymentsFilter = paymentId
      ? `gopay_payment_id=eq.${paymentId}`
      : `order_number=eq.${orderNumber}`;
    await fetch(
      `${supabaseUrl}/rest/v1/payments?${paymentsFilter}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          fakturoid_invoice_id: invoiceId,
          updated_at: new Date().toISOString(),
        }),
      },
    );

    console.log(`Fakturoid invoice ${invoiceId} created for ${paymentId ? `payment ${paymentId}` : `order ${orderNumber}`}, sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, invoice_id: invoiceId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("fakturoid-create-invoice error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
