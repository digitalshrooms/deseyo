/*
# Admin Analytics RPC Functions (Phase 1)

## Purpose
Creates PostgreSQL SECURITY DEFINER functions that aggregate analytics data
for the Deseyo admin dashboard. These are called by the `admin-stats` edge
function which already holds the service role key.

## Functions Created
1. `admin_user_growth(period text)` — registration counts grouped by day/week/month,
   active user counts (7/30/90 days), and conversion ratio.
2. `admin_subscription_metrics()` — MRR, active/cancelled counts, churn rate,
   failed payments, plan distribution.
3. `admin_mrr_trend(months_back int)` — monthly revenue from successful payments.
4. `admin_discount_impact()` — per-discount-code usage and revenue impact.
5. `admin_onboarding_funnel()` — step-by-step funnel from registration to first lesson.
6. `admin_onboarding_response_distribution()` — frequency of each answer in onboarding_responses.

## Security
- All functions are SECURITY DEFINER so the edge function (service role) can call them.
- They are read-only (SELECT only), no mutations.
- No RLS policies needed — these are functions, not tables.
- The edge function already validates admin access before calling these.

## Notes
- `payments.state = 'PAID'` indicates a successful payment.
- `subscriptions.subscription_status = 'active'` indicates an active subscription.
- `users.subscription_status = 'active'` mirrors the subscription state on the user record.
- MRR is computed from active recurring subscriptions' monthly amounts.
- Churn rate = cancelled subscriptions / total subscriptions that were active in the period.
*/

-- ─── 1. USER GROWTH ────────────────────────────────────────────────────────

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
  -- Total users (from public.users table which mirrors auth.users)
  SELECT count(*) INTO v_total_users FROM users;

  -- Active users by last_activity_date
  SELECT count(*) INTO v_active_7d FROM users WHERE last_activity_date >= now() - interval '7 days';
  SELECT count(*) INTO v_active_30d FROM users WHERE last_activity_date >= now() - interval '30 days';
  SELECT count(*) INTO v_active_90d FROM users WHERE last_activity_date >= now() - interval '90 days';

  -- Paid users (subscription_status active on users table)
  SELECT count(*) INTO v_paid_users FROM users WHERE subscription_status = 'active';

  -- Registration counts grouped by period
  IF p_period = 'week' THEN
    SELECT jsonb_agg(jsonb_build_object(
      'label', to_char(date_trunc('week', created_at), 'YYYY-MM-DD'),
      'value', count(*)
    ) ORDER BY date_trunc('week', created_at))
    INTO v_registrations
    FROM users
    WHERE created_at >= now() - interval '6 months'
    GROUP BY date_trunc('week', created_at);
  ELSIF p_period = 'month' THEN
    SELECT jsonb_agg(jsonb_build_object(
      'label', to_char(date_trunc('month', created_at), 'YYYY-MM'),
      'value', count(*)
    ) ORDER BY date_trunc('month', created_at))
    INTO v_registrations
    FROM users
    WHERE created_at >= now() - interval '12 months'
    GROUP BY date_trunc('month', created_at);
  ELSE
    SELECT jsonb_agg(jsonb_build_object(
      'label', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
      'value', count(*)
    ) ORDER BY date_trunc('day', created_at))
    INTO v_registrations
    FROM users
    WHERE created_at >= now() - interval '90 days'
    GROUP BY date_trunc('day', created_at);
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

-- ─── 2. SUBSCRIPTION METRICS ────────────────────────────────────────────────

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
  v_plan_dist jsonb;
  v_total_subs int;
BEGIN
  -- MRR: sum of monthly amounts from active recurring subscriptions
  -- For L1 (monthly) use amount directly; for L2 (also monthly) use amount
  SELECT COALESCE(sum(amount), 0) INTO v_mrr
  FROM subscriptions
  WHERE subscription_status = 'active';

  -- Active vs cancelled subscriptions
  SELECT count(*) INTO v_active_subs FROM subscriptions WHERE subscription_status = 'active';
  SELECT count(*) INTO v_cancelled_subs FROM subscriptions WHERE subscription_status = 'unpaid' OR subscription_status = 'pending';

  -- Total subs ever
  SELECT count(*) INTO v_total_subs FROM subscriptions;

  -- Failed payments (TIMEOUTED, CANCELED)
  SELECT count(*) INTO v_failed_payments FROM payments WHERE state IN ('TIMEOUTED', 'CANCELED');

  -- Plan distribution from subscriptions
  SELECT jsonb_agg(jsonb_build_object(
    'plan', COALESCE(subscription_type, 'unknown'),
    'count', count(*)
  )) INTO v_plan_dist
  FROM subscriptions
  WHERE subscription_status = 'active'
  GROUP BY subscription_type;

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

-- ─── 3. MRR TREND ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_mrr_trend(p_months_back int DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trend jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'month', to_char(date_trunc('month', created_at), 'YYYY-MM'),
    'revenue', sum(amount)
  ) ORDER BY date_trunc('month', created_at))
  INTO v_trend
  FROM payments
  WHERE state = 'PAID'
    AND created_at >= now() - (p_months_back || ' months')::interval
  GROUP BY date_trunc('month', created_at);

  RETURN COALESCE(v_trend, '[]'::jsonb);
END;
$$;

-- ─── 4. DISCOUNT IMPACT ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_discount_impact()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'code', dc.code,
    'discount_type', dc.discount_type,
    'discount_value', dc.discount_value,
    'used_count', dc.used_count,
    'max_uses', dc.max_uses,
    'active', dc.active,
    'revenue', COALESCE(pay.revenue, 0),
    'uses_in_payments', COALESCE(pay.uses, 0)
  ))
  INTO v_result
  FROM discount_codes dc
  LEFT JOIN (
    SELECT discount_code,
           sum(amount) as revenue,
           count(*) as uses
    FROM payments
    WHERE state = 'PAID'
      AND discount_code IS NOT NULL
      AND discount_code != ''
    GROUP BY discount_code
  ) pay ON pay.discount_code = dc.code;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ─── 5. ONBOARDING FUNNEL ──────────────────────────────────────────────────

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

  -- Average onboarding completion time (hours) from first progress action to completion
  SELECT round(avg(extract(epoch from (u.onboarding_completed_at_or_now - p.first_action)) / 3600)::numeric, 1)
  INTO v_avg_completion_hours
  FROM (
    SELECT user_id, min(created_at) as first_action
    FROM user_onboarding_progress
    GROUP BY user_id
  ) p
  JOIN users u ON u.id = p.user_id
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

-- ─── 6. ONBOARDING RESPONSE DISTRIBUTION ───────────────────────────────────

CREATE OR REPLACE FUNCTION admin_onboarding_response_distribution()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'q1_body_state', jsonb_agg(jsonb_build_object('answer', q1_body_state, 'count', cnt)) FILTER (WHERE q1_body_state IS NOT NULL),
    'q2_recent_state', jsonb_agg(jsonb_build_object('answer', q2_recent_state, 'count', cnt)) FILTER (WHERE q2_recent_state IS NOT NULL),
    'q3_capacity', jsonb_agg(jsonb_build_object('answer', q3_capacity, 'count', cnt)) FILTER (WHERE q3_capacity IS NOT NULL),
    'q4_main_need', jsonb_agg(jsonb_build_object('answer', q4_main_need, 'count', cnt)) FILTER (WHERE q4_main_need IS NOT NULL),
    'q5_focus_area', jsonb_agg(jsonb_build_object('answer', q5_focus_area, 'count', cnt)) FILTER (WHERE q5_focus_area IS NOT NULL),
    'q6_best_time', jsonb_agg(jsonb_build_object('answer', q6_best_time, 'count', cnt)) FILTER (WHERE q6_best_time IS NOT NULL),
    'q7_start_style', jsonb_agg(jsonb_build_object('answer', q7_start_style, 'count', cnt)) FILTER (WHERE q7_start_style IS NOT NULL),
    'recommended_plan', jsonb_agg(jsonb_build_object('answer', recommended_plan, 'count', cnt)) FILTER (WHERE recommended_plan IS NOT NULL)
  )
  INTO v_result
  FROM (
    SELECT q1_body_state, q2_recent_state, q3_capacity, q4_main_need,
           q5_focus_area, q6_best_time, q7_start_style, recommended_plan,
           count(*) as cnt
    FROM onboarding_responses
    GROUP BY q1_body_state, q2_recent_state, q3_capacity, q4_main_need,
             q5_focus_area, q6_best_time, q7_start_style, recommended_plan
  ) t;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
