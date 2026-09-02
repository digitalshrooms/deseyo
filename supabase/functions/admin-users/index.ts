import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: dbUsers } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, username, subscription_plan, current_plan, current_week, current_day, created_at");

    // Build auth map for email lookup
    const authMap = new Map(authUsers.users.map((u) => [u.id, u]));

    // Only show users that exist in public.users — filters out ghost auth entries
    const users = (dbUsers ?? []).map((dbUser: any) => {
      const authUser = authMap.get(dbUser.id);
      return {
        id: dbUser.id,
        email: authUser?.email || dbUser.email || '',
        first_name: dbUser.first_name || '',
        last_name: dbUser.last_name || '',
        username: dbUser.username || '',
        created_at: dbUser.created_at,
        subscription_plan: dbUser.subscription_plan || "Basic",
        current_plan: dbUser.current_plan || null,
        current_week: dbUser.current_week || null,
        current_day: dbUser.current_day || null,
      };
    });

    return new Response(JSON.stringify(users), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
