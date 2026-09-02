import { supabase } from '../lib/supabase';

export type ReflectionDay = 7 | 14 | 21 | 30;

export interface ReflectionRecord {
  id: string;
  user_id: string;
  reflection_day: ReflectionDay;
  answers: Record<string, string>;
  created_at: string;
}

export class ReflectionService {
  static async getReflection(userId: string, day: ReflectionDay): Promise<ReflectionRecord | null> {
    const { data } = await supabase
      .from('user_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('reflection_day', day)
      .maybeSingle();
    return data as ReflectionRecord | null;
  }

  static async getAllReflections(userId: string): Promise<ReflectionRecord[]> {
    const { data } = await supabase
      .from('user_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('reflection_day', { ascending: true });
    return (data as ReflectionRecord[]) ?? [];
  }

  static async saveReflection(
    userId: string,
    day: ReflectionDay,
    answers: Record<string, string>
  ): Promise<void> {
    await supabase.from('user_reflections').upsert(
      {
        user_id: userId,
        reflection_day: day,
        answers,
      },
      { onConflict: 'user_id,reflection_day' }
    );
  }

  static async saveCheckin(
    userId: string,
    day: ReflectionDay,
    body: number,
    mind: number,
    energy: number,
    note: string = ''
  ): Promise<void> {
    await supabase.from('user_checkins').upsert(
      {
        user_id: userId,
        checkin_day: day,
        body_feeling: body,
        mind_feeling: mind,
        energy_feeling: energy,
        note,
      },
      { onConflict: 'user_id,checkin_day' }
    );
  }

  static async saveIntention(
    userId: string,
    kind: 'd1_intention' | 'd1_success' | 'd30_goal',
    content: string
  ): Promise<void> {
    await supabase.from('user_intentions').upsert(
      {
        user_id: userId,
        kind,
        text_content: content,
      },
      { onConflict: 'user_id,kind' }
    );
  }

  static async getIntention(userId: string, kind: string): Promise<string | null> {
    const { data } = await supabase
      .from('user_intentions')
      .select('text_content')
      .eq('user_id', userId)
      .eq('kind', kind)
      .maybeSingle();
    return data?.text_content ?? null;
  }
}
