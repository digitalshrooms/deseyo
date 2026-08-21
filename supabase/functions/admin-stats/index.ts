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

    const url = new URL(req.url);
    const section = url.searchParams.get("section") || "overview";
    const period = url.searchParams.get("period") || "day";

    // ── Overview (dashboard) ──────────────────────────────────────────────
    if (section === "overview") {
      const today = new Date().toISOString().split("T")[0];

      const [coursesRes, completionsRes, userGrowthRes, subMetricsRes, funnelRes, recentUsersRes] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("lesson_completions").select("*", { count: "exact", head: true }),
        supabase.rpc("admin_user_growth", { p_period: "day" }),
        supabase.rpc("admin_subscription_metrics"),
        supabase.rpc("admin_onboarding_funnel"),
        supabase.from("users")
          .select("id, email, first_name, username, created_at, subscription_status, subscription_type, onboarding_completed")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const totalUsers = userGrowthRes.data?.total_users || 0;
      const totalCourses = coursesRes.count || 0;
      const totalCompletions = completionsRes.count || 0;
      const registeredToday = recentUsersRes.data?.filter((u: any) =>
        u.created_at?.startsWith(today)
      ).length || 0;

      const recentUsersData = (recentUsersRes.data || []).map((u: any) => ({
        id: u.id,
        email: u.email || "",
        name: u.first_name || u.username || (u.email ? u.email.split("@")[0] : "Neznámý"),
        created_at: u.created_at,
        subscription_status: u.subscription_status || "none",
        subscription_type: u.subscription_type || null,
        onboarding_completed: u.onboarding_completed || false,
      }));

      return new Response(
        JSON.stringify({
          stats: {
            totalUsers,
            totalCourses,
            totalCompletions,
            registeredToday,
          },
          userGrowth: userGrowthRes.data,
          subscriptionMetrics: subMetricsRes.data,
          funnel: funnelRes.data,
          recentUsers: recentUsersData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Analytics ─────────────────────────────────────────────────────────
    if (section === "analytics") {
      const [userGrowthRes, subMetricsRes, mrrTrendRes, discountRes, distributionRes, funnelRes] = await Promise.all([
        supabase.rpc("admin_user_growth", { p_period: period }),
        supabase.rpc("admin_subscription_metrics"),
        supabase.rpc("admin_mrr_trend", { p_months_back: 12 }),
        supabase.rpc("admin_discount_impact"),
        supabase.rpc("admin_onboarding_response_distribution"),
        supabase.rpc("admin_onboarding_funnel"),
      ]);

      return new Response(
        JSON.stringify({
          userGrowth: userGrowthRes.data,
          subscriptionMetrics: subMetricsRes.data,
          mrrTrend: mrrTrendRes.data,
          discountImpact: discountRes.data,
          onboardingDistribution: distributionRes.data,
          funnel: funnelRes.data,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Finance ────────────────────────────────────────────────────────────
    if (section === "finance") {
      const [subMetricsRes, mrrTrendRes, paymentsRes, revenueByPlanRes, discountRes] = await Promise.all([
        supabase.rpc("admin_subscription_metrics"),
        supabase.rpc("admin_mrr_trend", { p_months_back: 12 }),
        supabase.rpc("admin_recent_payments", { p_limit: 20 }),
        supabase.rpc("admin_revenue_by_plan"),
        supabase.rpc("admin_discount_impact"),
      ]);

      return new Response(
        JSON.stringify({
          subscriptionMetrics: subMetricsRes.data,
          mrrTrend: mrrTrendRes.data,
          recentPayments: paymentsRes.data,
          revenueByPlan: revenueByPlanRes.data,
          discountImpact: discountRes.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Subscriptions ──────────────────────────────────────────────────────
    if (section === "subscriptions") {
      const [subMetricsRes, subsRes] = await Promise.all([
        supabase.rpc("admin_subscription_metrics"),
        supabase.rpc("admin_subscriptions_list"),
      ]);

      return new Response(
        JSON.stringify({
          subscriptionMetrics: subMetricsRes.data,
          subscriptions: subsRes.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Retention ──────────────────────────────────────────────────────────
    if (section === "retention") {
      const [retentionRes, subMetricsRes] = await Promise.all([
        supabase.rpc("admin_retention_data"),
        supabase.rpc("admin_subscription_metrics"),
      ]);

      return new Response(
        JSON.stringify({
          retention: retentionRes.data,
          subscriptionMetrics: subMetricsRes.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown section" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
