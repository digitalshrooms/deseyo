/*
# Fix onboarding response distribution + MRR amount units

1. admin_onboarding_response_distribution: each question is now aggregated
   independently with its own GROUP BY so we get true per-answer counts.
2. admin_subscription_metrics + admin_mrr_trend: amounts in payments/subscriptions
   are in haléře (cents) — divide by 100 to get Kč.
*/

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
    'q1_body_state', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q1_body_state as answer, count(*) as cnt FROM onboarding_responses WHERE q1_body_state IS NOT NULL GROUP BY q1_body_state) s),
    'q2_recent_state', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q2_recent_state as answer, count(*) as cnt FROM onboarding_responses WHERE q2_recent_state IS NOT NULL GROUP BY q2_recent_state) s),
    'q3_capacity', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q3_capacity as answer, count(*) as cnt FROM onboarding_responses WHERE q3_capacity IS NOT NULL GROUP BY q3_capacity) s),
    'q4_main_need', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q4_main_need as answer, count(*) as cnt FROM onboarding_responses WHERE q4_main_need IS NOT NULL GROUP BY q4_main_need) s),
    'q5_focus_area', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q5_focus_area as answer, count(*) as cnt FROM onboarding_responses WHERE q5_focus_area IS NOT NULL GROUP BY q5_focus_area) s),
    'q6_best_time', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q6_best_time as answer, count(*) as cnt FROM onboarding_responses WHERE q6_best_time IS NOT NULL GROUP BY q6_best_time) s),
    'q7_start_style', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT q7_start_style as answer, count(*) as cnt FROM onboarding_responses WHERE q7_start_style IS NOT NULL GROUP BY q7_start_style) s),
    'recommended_plan', (SELECT jsonb_agg(jsonb_build_object('answer', answer, 'count', cnt) ORDER BY cnt DESC) FROM (SELECT recommended_plan as answer, count(*) as cnt FROM onboarding_responses WHERE recommended_plan IS NOT NULL GROUP BY recommended_plan) s)
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Fix subscription metrics: divide amounts by 100 (haléře → Kč)
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
  SELECT COALESCE(sum(amount / 100), 0) INTO v_mrr
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

-- Fix MRR trend: divide amounts by 100
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
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month, sum(amount / 100) as revenue
    FROM payments
    WHERE state = 'PAID'
      AND created_at >= now() - (p_months_back || ' months')::interval
    GROUP BY date_trunc('month', created_at)
  ) sub;

  RETURN COALESCE(v_trend, '[]'::jsonb);
END;
$$;

-- Fix discount impact: divide amounts by 100
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
           sum(amount / 100) as revenue,
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
