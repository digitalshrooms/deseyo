/*
# Admin Analytics RPC Functions (Phase 2: Finance, Subscriptions, Retention)

## Functions Created
1. `admin_recent_payments(limit int)` — recent payments with user email, plan, amount, state, date.
2. `admin_subscriptions_list()` — all subscriptions with user email, plan, status, dates, amount.
3. `admin_retention_data()` — churn risk users (inactive >14 days with active sub),
   users without lesson completions, stuck onboarding users, and weekly retention curve.
4. `admin_revenue_by_plan()` — MRR contribution per plan type.

## Security
- All SECURITY DEFINER, read-only, called only by the edge function with service role key.
*/

-- ─── 1. RECENT PAYMENTS ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_recent_payments(p_limit int DEFAULT 20)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', p.id,
    'user_email', COALESCE(u.email, 'neznámý'),
    'user_name', COALESCE(u.first_name, u.username, split_part(u.email, '@', 1), 'Neznámý'),
    'product_name', p.product_name,
    'subscription_type', p.subscription_type,
    'amount', p.amount / 100,
    'state', p.state,
    'is_recurring', p.is_recurring,
    'discount_code', p.discount_code,
    'created_at', p.created_at
  ) ORDER BY p.created_at DESC)
  INTO v_result
  FROM payments p
  LEFT JOIN users u ON u.id = p.user_id
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ─── 2. SUBSCRIPTIONS LIST ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_subscriptions_list()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'id', s.id,
    'user_email', COALESCE(u.email, 'neznámý'),
    'user_name', COALESCE(u.first_name, u.username, split_part(u.email, '@', 1), 'Neznámý'),
    'subscription_type', s.subscription_type,
    'subscription_status', s.subscription_status,
    'payment_status', s.payment_status,
    'amount', s.amount / 100,
    'current_period_start', s.current_period_start,
    'current_period_end', s.current_period_end,
    'cancel_at_period_end', s.cancel_at_period_end,
    'created_at', s.created_at
  ) ORDER BY s.created_at DESC)
  INTO v_result
  FROM subscriptions s
  LEFT JOIN users u ON u.id = s.user_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ─── 3. RETENTION DATA ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_retention_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_churn_risk jsonb;
  v_no_lessons jsonb;
  v_stuck_onboarding jsonb;
  v_churn_count int;
  v_no_lesson_count int;
  v_stuck_count int;
  v_active_total int;
  v_retention_curve jsonb;
BEGIN
  -- Churn risk: users with active sub but no activity in 14+ days
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'name', COALESCE(u.first_name, u.username, split_part(u.email, '@', 1), 'Neznámý'),
    'plan', COALESCE(u.subscription_type, 'neznámý'),
    'days_inactive', EXTRACT(day FROM now() - COALESCE(u.last_activity_date, u.created_at))::int,
    'lessons_completed', COALESCE(lc.cnt, 0),
    'risk_level', CASE
      WHEN COALESCE(u.last_activity_date, u.created_at) < now() - interval '30 days' THEN 'high'
      WHEN COALESCE(u.last_activity_date, u.created_at) < now() - interval '21 days' THEN 'high'
      ELSE 'medium'
    END
  ) ORDER BY COALESCE(u.last_activity_date, u.created_at) ASC)
  INTO v_churn_risk
  FROM users u
  LEFT JOIN (SELECT user_id, count(*) as cnt FROM lesson_completions WHERE is_completed = true GROUP BY user_id) lc ON lc.user_id = u.id
  WHERE u.subscription_status = 'active'
    AND COALESCE(u.last_activity_date, u.created_at) < now() - interval '14 days';

  SELECT count(*) INTO v_churn_count FROM users
  WHERE subscription_status = 'active'
    AND COALESCE(last_activity_date, created_at) < now() - interval '14 days';

  -- Users without any lesson completions (active sub)
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'name', COALESCE(u.first_name, u.username, split_part(u.email, '@', 1), 'Neznámý'),
    'plan', COALESCE(u.subscription_type, 'neznámý'),
    'days_since_reg', EXTRACT(day FROM now() - u.created_at)::int
  ) ORDER BY u.created_at ASC)
  INTO v_no_lessons
  FROM users u
  WHERE u.subscription_status = 'active'
    AND NOT EXISTS (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = u.id AND lc.is_completed = true);

  SELECT count(*) INTO v_no_lesson_count FROM users u
  WHERE u.subscription_status = 'active'
    AND NOT EXISTS (SELECT 1 FROM lesson_completions lc WHERE lc.user_id = u.id AND lc.is_completed = true);

  -- Stuck onboarding: registered but onboarding not completed, >3 days
  SELECT jsonb_agg(jsonb_build_object(
    'user_id', u.id,
    'email', u.email,
    'name', COALESCE(u.first_name, u.username, split_part(u.email, '@', 1), 'Neznámý'),
    'days_stuck', EXTRACT(day FROM now() - u.created_at)::int,
    'onboarding_started', EXISTS (SELECT 1 FROM user_onboarding_progress p WHERE p.user_id = u.id)
  ) ORDER BY u.created_at ASC)
  INTO v_stuck_onboarding
  FROM users u
  WHERE u.onboarding_completed = false
    AND u.created_at < now() - interval '3 days';

  SELECT count(*) INTO v_stuck_count FROM users
  WHERE onboarding_completed = false
    AND created_at < now() - interval '3 days';

  -- Active subscribers total
  SELECT count(*) INTO v_active_total FROM users WHERE subscription_status = 'active';

  -- Weekly retention curve: % of users still active by week after registration
  -- Based on last_activity_date relative to created_at
  SELECT jsonb_agg(jsonb_build_object('week', week, 'retention', retention) ORDER BY week)
  INTO v_retention_curve
  FROM (
    WITH cohorts AS (
      SELECT
        width_bucket(
          EXTRACT(epoch FROM (COALESCE(last_activity_date, created_at) - created_at)) / 86400,
          0, 84, 7
        ) as week_bucket,
        count(*) as total
      FROM users
      WHERE created_at < now() - interval '7 days'
      GROUP BY week_bucket
    )
    SELECT
      'W' || (week_bucket - 1) as week,
      round(100.0 * total / (SELECT count(*) FROM users WHERE created_at < now() - interval '7 days'), 0) as retention
    FROM cohorts
    WHERE week_bucket > 0
  ) sub;

  RETURN jsonb_build_object(
    'churn_risk_users', COALESCE(v_churn_risk, '[]'::jsonb),
    'churn_risk_count', v_churn_count,
    'no_lesson_users', COALESCE(v_no_lessons, '[]'::jsonb),
    'no_lesson_count', v_no_lesson_count,
    'stuck_onboarding', COALESCE(v_stuck_onboarding, '[]'::jsonb),
    'stuck_count', v_stuck_count,
    'active_total', v_active_total,
    'retention_curve', COALESCE(v_retention_curve, '[]'::jsonb)
  );
END;
$$;

-- ─── 4. REVENUE BY PLAN ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_revenue_by_plan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'plan', plan,
    'users', users,
    'mrr', mrr,
    'pct', pct
  ))
  INTO v_result
  FROM (
    SELECT
      COALESCE(subscription_type, 'unknown') as plan,
      count(*) as users,
      sum(amount / 100) as mrr,
      round(100.0 * sum(amount / 100) / sum(sum(amount / 100)) OVER (), 0) as pct
    FROM subscriptions
    WHERE subscription_status = 'active'
    GROUP BY subscription_type
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
