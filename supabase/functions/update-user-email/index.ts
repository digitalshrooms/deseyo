import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the JWT belongs to a real user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: callerUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { new_email, code } = await req.json();

    if (!new_email || !code) {
      return new Response(JSON.stringify({ error: "new_email and code are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalised = new_email.toLowerCase().trim();

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey);

    // Validate verification code
    const { data: record } = await admin
      .from("verification_codes")
      .select("id, expires_at")
      .eq("email", normalised)
      .eq("code", code.trim())
      .maybeSingle();

    if (!record) {
      return new Response(JSON.stringify({ error: "Neplatný kód. Zkontrolujte email a zadejte kód znovu." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(record.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Kód vypršel. Pošlete si nový kód." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check email not taken
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("email", normalised)
      .neq("id", callerUser.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: "Tento email je již používán jiným účtem." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update auth.users via Admin API — does NOT send any Supabase confirmation email
    const { error: adminUpdateErr } = await admin.auth.admin.updateUserById(callerUser.id, {
      email: normalised,
      email_confirm: true,
    });
    if (adminUpdateErr) {
      return new Response(JSON.stringify({ error: adminUpdateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update public users table
    await admin.from("users").update({ email: normalised }).eq("id", callerUser.id);

    // Delete used code
    await admin.from("verification_codes").delete().eq("id", record.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("update-user-email error:", err);
    return new Response(JSON.stringify({ error: "Interní chyba serveru." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
