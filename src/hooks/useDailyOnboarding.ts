import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseDailyOnboardingResult {
  showOnboarding: boolean;
  currentDay: number;
  closeOnboarding: () => void;
  forceShowOnboarding: () => void;
}

/**
 * Hook that checks whether the daily onboarding popup should be shown.
 * Shows the popup if the user has NOT submitted a response today (calendar day).
 * Also determines which day number the user is on based on onboarding_day_index.
 *
 * `forceShowOnboarding` bypasses the "already done today" check — TESTING ONLY.
 */
export function useDailyOnboarding(userId: string | undefined): UseDailyOnboardingResult {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    if (!userId) {
      setShowOnboarding(false);
      return;
    }
    checkAndTrigger();
  }, [userId]);

  const checkAndTrigger = async () => {
    if (!userId) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const { data: todayResponse } = await supabase
        .from('onboarding_daily_response')
        .select('id, responded_at')
        .eq('user_id', userId)
        .gte('responded_at', `${todayStr}T00:00:00.000Z`)
        .lte('responded_at', `${todayStr}T23:59:59.999Z`)
        .order('responded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (todayResponse) {
        setShowOnboarding(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_day_index')
        .eq('id', userId)
        .maybeSingle();

      const dayIndex = userData?.onboarding_day_index ?? 1;
      const dayNum = Math.min(Math.max(dayIndex, 1), 30);
      setCurrentDay(dayNum);

      const { data: content } = await supabase
        .from('onboarding_daily_content')
        .select('id')
        .eq('day_number', dayNum)
        .eq('is_active', true)
        .maybeSingle();

      if (content) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('[useDailyOnboarding] Error checking onboarding status:', err);
    }
  };

  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // TESTING ONLY: forces the popup to show regardless of today's response status.
  // Reads the user's current onboarding_day_index to show the correct day.
  const forceShowOnboarding = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_day_index')
        .eq('id', userId)
        .maybeSingle();
      const dayIndex = userData?.onboarding_day_index ?? 1;
      const dayNum = Math.min(Math.max(dayIndex, 1), 30);
      setCurrentDay(dayNum);
      setShowOnboarding(true);
    } catch {
      setCurrentDay(1);
      setShowOnboarding(true);
    }
  }, [userId]);

  return { showOnboarding, currentDay, closeOnboarding, forceShowOnboarding };
}
