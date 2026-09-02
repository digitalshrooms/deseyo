import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SubmitPayload {
  jmeno_prijmeni: string;
  email_z_objednavky: string;
  email_pro_potvrzeni?: string;
  cislo_objednavky?: string;
  duvod_odstoupeni?: string;
  user_id?: string;
}

function evaluateType(snapshot: {
  consent_to_immediate_performance?: boolean;
  contract_date?: string;
  first_access_date?: string;
}): "LEGAL_WITHDRAWAL" | "OUT_OF_LEGAL_RIGHT" | "OUT_OF_PERIOD" | "EDGE_CASE" {
  const now = Date.now();
  const { consent_to_immediate_performance, contract_date, first_access_date } = snapshot;

  if (!contract_date) return "EDGE_CASE";

  const contractMs = new Date(contract_date).getTime();
  const daysSinceContract = (now - contractMs) / 86400000;

  if (consent_to_immediate_performance === false && daysSinceContract <= 14) {
    return "LEGAL_WITHDRAWAL";
  }

  if (first_access_date) {
    const accessMs = new Date(first_access_date).getTime();
    const daysSinceAccess = (now - accessMs) / 86400000;
    if (consent_to_immediate_performance === true && daysSinceAccess <= 14) {
      return "OUT_OF_LEGAL_RIGHT";
    }
    if (daysSinceAccess > 14) {
      return "OUT_OF_PERIOD";
    }
  }

  return "EDGE_CASE";
}

function randomHex(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    const body: SubmitPayload = await req.json();

    if (!body.jmeno_prijmeni || body.jmeno_prijmeni.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Jméno a příjmení je povinné (min. 2 znaky)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.email_z_objednavky || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email_z_objednavky)) {
      return new Response(JSON.stringify({ error: "Neplatný formát emailu z objednávky." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: block duplicate within 10 minutes for same email+order
    if (body.cislo_objednavky) {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: dup } = await supabase
        .from("withdrawal")
        .select("id")
        .eq("email_z_objednavky", body.email_z_objednavky.toLowerCase().trim())
        .eq("cislo_objednavky", body.cislo_objednavky.trim())
        .gte("submitted_at", since)
        .maybeSingle();

      if (dup) {
        return new Response(
          JSON.stringify({ error: "Žádost pro tuto objednávku již byla podána. Zkuste to prosím za chvíli." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build content snapshot — look up user if provided
    let snapshot: Record<string, unknown> = { submitted_at: new Date().toISOString() };

    if (body.user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("id,email,subscription_status,subscription_type,subscription_plan,created_at")
        .eq("id", body.user_id)
        .maybeSingle();

      if (u) {
        snapshot.user = {
          id: u.id,
          email: u.email,
          subscription_status: u.subscription_status,
          subscription_type: u.subscription_type,
          subscription_plan: u.subscription_plan,
          // contract_date / first_access_date — use created_at as fallback
          contract_date: u.created_at,
          first_access_date: u.created_at,
          // consent defaults to true if not stored (safest for legal evaluation)
          consent_to_immediate_performance: true,
        };
      }
    }

    const user = snapshot.user as any;
    const withdrawalType = evaluateType({
      consent_to_immediate_performance: user?.consent_to_immediate_performance,
      contract_date: user?.contract_date,
      first_access_date: user?.first_access_date,
    });
    snapshot.evaluated_type = withdrawalType;

    const previewToken = randomHex(32);

    const { data: row, error: insertErr } = await supabase
      .from("withdrawal")
      .insert({
        user_id: body.user_id || null,
        jmeno_prijmeni: body.jmeno_prijmeni.trim(),
        email_z_objednavky: body.email_z_objednavky.toLowerCase().trim(),
        email_pro_potvrzeni: (body.email_pro_potvrzeni || body.email_z_objednavky).toLowerCase().trim(),
        cislo_objednavky: body.cislo_objednavky?.trim() || null,
        duvod_odstoupeni: body.duvod_odstoupeni?.trim() || null,
        ip_address: ip,
        user_agent: ua,
        content_snapshot: snapshot,
        type: withdrawalType,
        status: "submitted",
        preview_token: previewToken,
      })
      .select("id,preview_token,type,content_snapshot")
      .single();

    if (insertErr) {
      console.error("withdrawal-submit insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Nepodařilo se uložit žádost. Zkuste to prosím znovu." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      id: row.id,
      preview_token: row.preview_token,
      type: row.type,
      content_snapshot: row.content_snapshot,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("withdrawal-submit error:", err);
    return new Response(JSON.stringify({ error: "Interní chyba serveru." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
