import { supabase } from '../lib/supabase';

const SUNDAY_MESSAGES = [
  'Nedele je tvoje. Tvuj plan te ceka v pondeli — nebo dnes, pokud chces.',
  'Cas pro sebe, rodinu, klid. Zitra pokracujes tam, kde jsi skoncila.',
  'Odpocinek je soucast planu. Tvoje telo to vi.',
];

export class WeekendService {
  static isWeekend(date: Date = new Date()): boolean {
    const d = date.getDay();
    return d === 0 || d === 6;
  }

  static isSunday(date: Date = new Date()): boolean {
    return date.getDay() === 0;
  }

  static getWeekendLabel(): string {
    return 'Dnes mas volno.';
  }

  static async getSundayMessage(userId: string): Promise<string | null> {
    if (!this.isSunday()) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: recent } = await supabase
      .from('user_daily_messages')
      .select('message_variant, shown_at')
      .eq('user_id', userId)
      .eq('message_type', 'sunday_rest')
      .order('shown_at', { ascending: false })
      .limit(3);

    const lastShownToday = (recent ?? []).find((r: { shown_at: string }) => {
      const d = new Date(r.shown_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    if (lastShownToday) {
      return SUNDAY_MESSAGES[lastShownToday.message_variant ?? 0];
    }

    const usedVariants = new Set((recent ?? []).map((r: { message_variant: number }) => r.message_variant ?? 0));
    let pickedVariant = 0;
    for (let i = 0; i < SUNDAY_MESSAGES.length; i++) {
      if (!usedVariants.has(i)) {
        pickedVariant = i;
        break;
      }
    }

    await supabase.from('user_daily_messages').insert({
      user_id: userId,
      message_type: 'sunday_rest',
      message_variant: pickedVariant,
    });

    return SUNDAY_MESSAGES[pickedVariant];
  }
}
