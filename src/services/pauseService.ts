import { supabase } from '../lib/supabase';

const MAX_PAUSE_DAYS = 14;
const MAX_PAUSES_PER_90D = 2;

export class PauseService {
  static async getPauseStatus(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('pause_active, pause_start, pause_end, pause_count_90d, pause_count_reset_at')
      .eq('id', userId)
      .maybeSingle();

    if (!data) return null;

    let count = data.pause_count_90d ?? 0;
    if (data.pause_count_reset_at) {
      const reset = new Date(data.pause_count_reset_at);
      const diffDays = Math.floor((Date.now() - reset.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 90) {
        count = 0;
        await supabase
          .from('users')
          .update({ pause_count_90d: 0, pause_count_reset_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }

    let active = data.pause_active ?? false;
    if (active && data.pause_end) {
      const end = new Date(data.pause_end);
      if (end.getTime() < Date.now()) {
        active = false;
        await supabase
          .from('users')
          .update({ pause_active: false })
          .eq('id', userId);
      }
    }

    return {
      active,
      start: data.pause_start as string | null,
      end: data.pause_end as string | null,
      count90d: count,
      remaining: Math.max(0, MAX_PAUSES_PER_90D - count),
    };
  }

  static async startPause(userId: string, endDate: Date): Promise<{ ok: boolean; error?: string }> {
    const status = await this.getPauseStatus(userId);
    if (!status) return { ok: false, error: 'User not found' };

    if (status.active) return { ok: false, error: 'Pauza je jiz aktivni' };
    if (status.count90d >= MAX_PAUSES_PER_90D) {
      return { ok: false, error: 'Prekrocen limit 2 pauz za 90 dni' };
    }

    const start = new Date();
    const maxEnd = new Date(start.getTime() + MAX_PAUSE_DAYS * 24 * 60 * 60 * 1000);
    const effectiveEnd = endDate > maxEnd ? maxEnd : endDate;

    await supabase
      .from('users')
      .update({
        pause_active: true,
        pause_start: start.toISOString(),
        pause_end: effectiveEnd.toISOString(),
        pause_count_90d: status.count90d + 1,
      })
      .eq('id', userId);

    return { ok: true };
  }

  static async endPauseNow(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({
        pause_active: false,
        pause_end: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  static getMaxPauseDays() {
    return MAX_PAUSE_DAYS;
  }
}
