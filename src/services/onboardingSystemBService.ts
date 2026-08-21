import { supabase, OnboardingContent } from '../lib/supabase';

export class OnboardingSystemBService {
  static async isActive(userId: string): Promise<{ active: boolean; dayIndex: number }> {
    const { data } = await supabase
      .from('users')
      .select('onboarding_day_index, onboarding_completed, pause_active')
      .eq('id', userId)
      .maybeSingle();

    if (!data) return { active: false, dayIndex: 1 };
    if (data.pause_active) return { active: false, dayIndex: data.onboarding_day_index ?? 1 };

    const day = data.onboarding_day_index ?? 1;
    const completed = data.onboarding_completed === true && day > 30;
    return { active: !completed && day <= 30, dayIndex: day };
  }

  static async getTodayContent(dayIndex: number): Promise<OnboardingContent | null> {
    const { data } = await supabase
      .from('onboarding_content')
      .select('*')
      .eq('day_index', dayIndex)
      .eq('is_active', true)
      .maybeSingle();
    return data as OnboardingContent | null;
  }

  static async getTodayAction(userId: string, dayIndex: number): Promise<'completed' | 'skipped' | null> {
    const { data } = await supabase
      .from('user_onboarding_progress')
      .select('action')
      .eq('user_id', userId)
      .eq('day_index', dayIndex)
      .maybeSingle();
    return (data?.action as 'completed' | 'skipped') ?? null;
  }

  static async complete(userId: string, dayIndex: number): Promise<void> {
    await supabase.from('user_onboarding_progress').upsert(
      { user_id: userId, day_index: dayIndex, action: 'completed' },
      { onConflict: 'user_id,day_index' }
    );
    await this.advanceDayIfDue(userId, dayIndex);
  }

  static async skip(userId: string, dayIndex: number): Promise<void> {
    await supabase.from('user_onboarding_progress').upsert(
      { user_id: userId, day_index: dayIndex, action: 'skipped' },
      { onConflict: 'user_id,day_index' }
    );
    await this.advanceDayIfDue(userId, dayIndex);
  }

  private static async advanceDayIfDue(userId: string, currentDay: number): Promise<void> {
    const nextDay = currentDay + 1;
    const updates: Record<string, unknown> = { onboarding_day_index: nextDay };
    if (nextDay > 30) {
      updates.onboarding_completed = true;
    }
    await supabase.from('users').update(updates).eq('id', userId);
  }
}
