import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-admin-token",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Service role client — bypasses RLS and can touch auth schema
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let body: { userId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Neplatný JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = body;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId je povinný" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user exists before attempting deletion
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();

    if (!existingUser) {
      // Check auth directly — user might exist in auth but not public.users
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (!authUser.user) {
        return new Response(
          JSON.stringify({ error: "Uživatel nenalezen" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 1: Call atomic SQL function that deletes:
    //   - public.users (CASCADE removes all child rows: activities, comments, forum_posts,
    //     forum_comments, lesson_completions, med_tracking, onboarding_responses,
    //     subscriptions, user_checkins, user_credits_log, user_daily_messages,
    //     user_events, user_intentions, user_last_used_videos, user_onboarding_progress,
    //     user_preferences, user_reflections, user_seen_messages, video_favorites)
    //   - public.verification_codes (by email, not FK-linked)
    //   - auth.users (cascades to auth.identities, auth.sessions, auth.mfa_factors,
    //     auth.refresh_tokens, auth.one_time_tokens — email becomes free immediately)
    const { error: rpcError } = await supabase.rpc("admin_delete_user_complete", {
      target_user_id: userId,
    });

    if (rpcError) {
      console.error("RPC delete error:", rpcError);
      // Fallback: try auth.admin.deleteUser directly (handles users with no public record)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId, false);
      if (authError) {
        return new Response(
          JSON.stringify({ error: `Smazání selhalo: ${authError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, deleted_user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-delete-user error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
