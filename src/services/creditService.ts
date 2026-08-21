import { supabase } from '../lib/supabase';

export type CreditReason =
  | 'weekly_consistency'
  | 'onboarding_d30_complete'
  | 'level_up_to_l2'
  | 'special_moment';

export class CreditService {
  static async getBalance(userId: string): Promise<number> {
    const { data } = await supabase
      .from('users')
      .select('consultation_credits')
      .eq('id', userId)
      .maybeSingle();
    return data?.consultation_credits ?? 0;
  }

  static async addCredit(
    userId: string,
    reason: CreditReason,
    note: string = ''
  ): Promise<number> {
    return this.addCredits(userId, 1, reason, note);
  }

  static async addCredits(
    userId: string,
    count: number,
    reason: CreditReason,
    note: string = ''
  ): Promise<number> {
    const { data: current } = await supabase
      .from('users')
      .select('consultation_credits')
      .eq('id', userId)
      .maybeSingle();

    const before = current?.consultation_credits ?? 0;
    const after = before + count;

    await supabase
      .from('users')
      .update({ consultation_credits: after })
      .eq('id', userId);

    await supabase.from('user_credits_log').insert({
      user_id: userId,
      reason,
      delta: count,
      balance_after: after,
      note,
    });

    return after;
  }

  static async canUseSpecialMoment(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('special_moment_last_used')
      .eq('id', userId)
      .maybeSingle();

    if (!data?.special_moment_last_used) return true;

    const last = new Date(data.special_moment_last_used);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 60;
  }

  static async claimSpecialMoment(userId: string): Promise<{ ok: boolean; balance?: number; daysRemaining?: number }> {
    const ok = await this.canUseSpecialMoment(userId);
    if (!ok) {
      const { data } = await supabase
        .from('users')
        .select('special_moment_last_used')
        .eq('id', userId)
        .maybeSingle();
      if (data?.special_moment_last_used) {
        const last = new Date(data.special_moment_last_used);
        const diffDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
        return { ok: false, daysRemaining: Math.max(0, 60 - diffDays) };
      }
      return { ok: false };
    }

    const balance = await this.addCredit(userId, 'special_moment', 'Zvlastni moment');
    await supabase
      .from('users')
      .update({ special_moment_last_used: new Date().toISOString() })
      .eq('id', userId);

    return { ok: true, balance };
  }

  static async hasSeenCreditInfo(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('credit_info_shown')
      .eq('id', userId)
      .maybeSingle();
    return data?.credit_info_shown === true;
  }

  static async markCreditInfoShown(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ credit_info_shown: true })
      .eq('id', userId);
  }
}
