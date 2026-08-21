import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const REASON_LABELS: Record<string, string> = {
  finance: "Nemám na to finance",
  time: "Nemám na to čas",
  other: "Jiné",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("exit_feedback")
      .select("reason, context, other_text, user_email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rows = data ?? [];

    const counts: Record<string, number> = { finance: 0, time: 0, other: 0 };
    for (const row of rows) {
      if (row.reason in counts) counts[row.reason]++;
    }

    const distribution = Object.entries(counts).map(([reason, count]) => ({
      reason,
      label: REASON_LABELS[reason] || reason,
      count,
    }));

    return new Response(
      JSON.stringify({
        total: rows.length,
        distribution,
        accountDeletions: rows.filter((r) => r.context === "account_deletion").length,
        subscriptionCancels: rows.filter((r) => r.context === "subscription_cancel").length,
        recent: rows.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
