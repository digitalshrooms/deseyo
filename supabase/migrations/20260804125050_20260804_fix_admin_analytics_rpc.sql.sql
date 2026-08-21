/*
# Fix admin analytics RPC functions

Fixes:
1. Nested aggregate calls — moved count(*)/sum() into subqueries so jsonb_agg wraps plain columns.
2. Removed reference to non-existent column `onboarding_completed_at_or_now` —
   avg completion time now computed from first to last action in user_onboarding_progress.
*/

-- ─── 1. USER GROWTH (fixed) ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_user_growth(p_period text DEFAULT 'day')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_active_7d int;
  v_active_30d int;
  v_active_90d int;
  v_paid_users int;
  v_registrations jsonb;
BEGIN
  SELECT count(*) INTO v_total_users FROM users;
  SELECT count(*) INTO v_active_7d FROM users WHERE last_activity_date >= now() - interval '7 days';
  SELECT count(*) INTO v_active_30d FROM users WHERE last_activity_date >= now() - interval '30 days';
  SELECT count(*) INTO v_active_90d FROM users WHERE last_activity_date >= now() - interval '90 days';
  SELECT count(*) INTO v_paid_users FROM users WHERE subscription_status = 'active';

  IF p_period = 'week' THEN
    SELECT jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY label)
    INTO v_registrations
    FROM (
      SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as label, count(*) as value
      FROM users WHERE created_at >= now() - interval '6 months'
      GROUP BY date_trunc('week', created_at)
    ) sub;
  ELSIF p_period = 'month' THEN
    SELECT jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY label)
    INTO v_registrations
    FROM (
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as label, count(*) as value
      FROM users WHERE created_at >= now() - interval '12 months'
      GROUP BY date_trunc('month', created_at)
    ) sub;
  ELSE
    SELECT jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY label)
    INTO v_registrations
    FROM (
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as label, count(*) as value
      FROM users WHERE created_at >= now() - interval '90 days'
      GROUP BY date_trunc('day', created_at)
    ) sub;
  END IF;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_7d', v_active_7d,
    'active_30d', v_active_30d,
    'active_90d', v_active_90d,
    'paid_users', v_paid_users,
    'conversion_rate', CASE WHEN v_total_users > 0 THEN round(v_paid_users::numeric / v_total_users * 100, 1) ELSE 0 END,
    'registrations', COALESCE(v_registrations, '[]'::jsonb)
  );
END;
$$;

-- ─── 2. SUBSCRIPTION METRICS (fixed) ────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_subscription_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr int;
  v_active_subs int;
  v_cancelled_subs int;
  v_failed_payments int;
  v_total_subs int;
  v_plan_dist jsonb;
BEGIN
  SELECT COALESCE(sum(amount), 0) INTO v_mrr
  FROM subscriptions WHERE subscription_status = 'active';

  SELECT count(*) INTO v_active_subs FROM subscriptions WHERE subscription_status = 'active';
  SELECT count(*) INTO v_cancelled_subs FROM subscriptions WHERE subscription_status IN ('unpaid', 'pending');
  SELECT count(*) INTO v_total_subs FROM subscriptions;
  SELECT count(*) INTO v_failed_payments FROM payments WHERE state IN ('TIMEOUTED', 'CANCELED');

  SELECT jsonb_agg(jsonb_build_object('plan', plan, 'count', cnt))
  INTO v_plan_dist
  FROM (
    SELECT COALESCE(subscription_type, 'unknown') as plan, count(*) as cnt
    FROM subscriptions WHERE subscription_status = 'active'
    GROUP BY subscription_type
  ) sub;

  RETURN jsonb_build_object(
    'mrr', v_mrr,
    'active_subs', v_active_subs,
    'cancelled_subs', v_cancelled_subs,
    'total_subs', v_total_subs,
    'churn_rate', CASE WHEN v_total_subs > 0 THEN round(v_cancelled_subs::numeric / v_total_subs * 100, 1) ELSE 0 END,
    'failed_payments', v_failed_payments,
    'plan_distribution', COALESCE(v_plan_dist, '[]'::jsonb)
  );
END;
$$;

-- ─── 3. MRR TREND (fixed) ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_mrr_trend(p_months_back int DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trend jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('month', month, 'revenue', revenue) ORDER BY month)
  INTO v_trend
  FROM (
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, sum(amount) as revenue
    FROM payments
    WHERE state = 'PAID'
      AND created_at >= now() - (p_months_back || ' months')::interval
    GROUP BY date_trunc('month', created_at)
  ) sub;

  RETURN COALESCE(v_trend, '[]'::jsonb);
END;
$$;

-- ─── 4. ONBOARDING FUNNEL (fixed) ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_onboarding_funnel()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_registered int;
  v_email_verified int;
  v_onboarding_started int;
  v_onboarding_completed int;
  v_paid int;
  v_avg_completion_hours numeric;
BEGIN
  SELECT count(*) INTO v_registered FROM users;
  SELECT count(*) INTO v_email_verified FROM users WHERE email_verified_at IS NOT NULL;
  SELECT count(DISTINCT user_id) INTO v_onboarding_started FROM user_onboarding_progress;
  SELECT count(*) INTO v_onboarding_completed FROM users WHERE onboarding_completed = true;
  SELECT count(*) INTO v_paid FROM users WHERE subscription_status = 'active';

  -- Avg completion time: first to last action in user_onboarding_progress for users who completed
  SELECT round(avg(extract(epoch from (last_action - first_action)) / 3600)::numeric, 1)
  INTO v_avg_completion_hours
  FROM (
    SELECT user_id, min(created_at) as first_action, max(created_at) as last_action
    FROM user_onboarding_progress
    GROUP BY user_id
  ) t
  JOIN users u ON u.id = t.user_id
  WHERE u.onboarding_completed = true;

  RETURN jsonb_build_object(
    'steps', jsonb_build_array(
      jsonb_build_object('stage', 'Registrace', 'value', v_registered, 'pct', 100),
      jsonb_build_object('stage', 'Email ověřen', 'value', v_email_verified, 'pct', CASE WHEN v_registered > 0 THEN round(v_email_verified::numeric / v_registered * 100, 0) ELSE 0 END),
      jsonb_build_object('stage', 'Onboarding začalo', 'value', v_onboarding_started, 'pct', CASE WHEN v_registered > 0 THEN round(v_onboarding_started::numeric / v_registered * 100, 0) ELSE 0 END),
      jsonb_build_object('stage', 'Onboarding dokončeno', 'value', v_onboarding_completed, 'pct', CASE WHEN v_registered > 0 THEN round(v_onboarding_completed::numeric / v_registered * 100, 0) ELSE 0 END),
      jsonb_build_object('stage', 'Placené předplatné', 'value', v_paid, 'pct', CASE WHEN v_registered > 0 THEN round(v_paid::numeric / v_registered * 100, 0) ELSE 0 END)
    ),
    'avg_completion_hours', COALESCE(v_avg_completion_hours, 0)
  );
END;
$$;
