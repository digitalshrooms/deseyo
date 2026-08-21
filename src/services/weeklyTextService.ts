import { supabase, WeeklyText } from '../lib/supabase';

export class WeeklyTextService {
  static getISOWeek(date: Date = new Date()): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  static async getCurrentWeeklyText(): Promise<WeeklyText | null> {
    const { data: texts } = await supabase
      .from('weekly_texts')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (!texts || texts.length === 0) return null;

    const year = new Date().getFullYear();
    const week = this.getISOWeek();
    const seed = year * 100 + week;
    const idx = seed % texts.length;

    return texts[idx] as WeeklyText;
  }
}
