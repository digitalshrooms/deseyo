import { supabase, SeasonalMessage } from '../lib/supabase';

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function getSeasonKey(): string {
  const year = new Date().getFullYear();
  return `seasonal_${year}_${getCurrentSeason()}`;
}

export class SeasonalService {
  static async getCurrentMessage(userId: string): Promise<SeasonalMessage | null> {
    const season = getCurrentSeason();
    const key = getSeasonKey();

    const { data: seen } = await supabase
      .from('user_seen_messages')
      .select('seen_at')
      .eq('user_id', userId)
      .eq('message_key', key)
      .maybeSingle();

    if (seen?.seen_at) {
      const diffDays = Math.floor((Date.now() - new Date(seen.seen_at).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) return null;
    }

    const { data } = await supabase
      .from('seasonal_messages')
      .select('*')
      .eq('season', season)
      .eq('is_active', true)
      .maybeSingle();

    return (data as SeasonalMessage) ?? null;
  }

  static async dismiss(userId: string): Promise<void> {
    const key = getSeasonKey();
    await supabase
      .from('user_seen_messages')
      .upsert(
        { user_id: userId, message_key: key, seen_at: new Date().toISOString() },
        { onConflict: 'user_id,message_key' }
      );
  }
}
