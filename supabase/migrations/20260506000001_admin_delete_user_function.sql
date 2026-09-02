/*
  # Admin: atomic user deletion function

  ## Purpose
  Creates a SECURITY DEFINER function callable only by service_role that atomically
  removes a user from every table in the system, freeing the email for immediate re-use.

  ## What gets deleted
  1. public.users — primary user record
     CASCADE automatically removes all child rows:
       activities, comments, forum_comments, forum_posts,
       lesson_completions, med_tracking, onboarding_responses, subscriptions,
       user_checkins, user_credits_log, user_daily_messages, user_events,
       user_intentions, user_last_used_videos, user_onboarding_progress,
       user_preferences, user_reflections, user_seen_messages, video_favorites
  2. public.verification_codes — by email (no FK, must be deleted explicitly)
  3. auth.users — frees the email; Supabase cascades to:
       auth.identities, auth.sessions, auth.mfa_factors,
       auth.refresh_tokens, auth.one_time_tokens

  ## Security
  - REVOKED from PUBLIC, anon, authenticated
  - GRANTED only to service_role (used by admin-delete-user edge function)
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM public.users WHERE id = target_user_id;

  DELETE FROM public.users WHERE id = target_user_id;

  IF user_email IS NOT NULL THEN
    DELETE FROM public.verification_codes WHERE email = lower(user_email);
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user_complete(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user_complete(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_delete_user_complete(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user_complete(uuid) TO service_role;
