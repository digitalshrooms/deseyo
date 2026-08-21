import { supabase, Course, User } from '../lib/supabase';

type LessonWithMeta = Course & {
  is_primary_lesson?: boolean;
  library_level_tag?: 'L1' | 'L2' | 'Universal';
  body_area_tags?: string[];
  face_zone_tags?: string[];
  is_full_body?: boolean;
  is_full_face?: boolean;
  lesson_type?: string;
};

export interface PrimaryPickResult {
  lesson: LessonWithMeta | null;
  supplementLessons: LessonWithMeta[];
  fallbackLevel: number;
  reason: string;
}

export class PrimaryLessonService {
  static decideVariant(user: User): 'full' | 'area' | 'zone' {
    const isL2 = user.level_tag === 'L2';
    const plan = user.plan_tag === 'DESEYO' ? 'DESEYO' : 'RESTART';
    const counter = user.library_session_counter ?? 0;
    const l2Counter = user.l2_session_counter ?? 0;

    if (isL2) {
      if (user.primary_priority_tag === 'FACE') {
        return l2Counter >= 3 ? 'zone' : 'full';
      }
      return l2Counter >= 2 ? 'area' : 'full';
    }

    if (plan === 'RESTART') {
      return counter === 1 ? 'area' : 'full';
    }
    return counter === 1 || counter === 3 ? 'area' : 'full';
  }

  static async getPrimaryLesson(user: User): Promise<PrimaryPickResult> {
    const priority = user.primary_priority_tag ?? 'BODY';
    const levelTag = user.level_tag ?? 'L1';
    const bodyArea = user.body_area_tag ?? 'AREA_FULL_BODY';
    const faceZone = user.face_zone_tag ?? null;

    const variant = this.decideVariant(user);
    const lessonType = priority === 'FACE' ? 'face_yoga' : 'fyzio_yoga';

    const levels = levelTag === 'L2' ? ['L1', 'L2', 'Universal'] : ['L1', 'Universal'];

    const lastUsed = await this.getRecentlyUsed(user.id, 14);

    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_primary_lesson', true)
      .eq('lesson_type', lessonType)
      .in('library_level_tag', levels);

    if (variant === 'full') {
      query = priority === 'FACE' ? query.eq('is_full_face', true) : query.eq('is_full_body', true);
    } else if (variant === 'area' && priority === 'BODY') {
      query = query.contains('body_area_tags', [bodyArea]);
    } else if (variant === 'zone' && priority === 'FACE' && faceZone) {
      query = query.contains('face_zone_tags', [faceZone]);
    }

    const { data } = await query.limit(50);
    const candidates = (data ?? []) as LessonWithMeta[];

    let picked = this.pickNotRecentlyUsed(candidates, lastUsed);
    let fallbackLevel = 1;
    let reason = `primary:${variant}`;

    if (!picked) {
      fallbackLevel = 2;
      reason = 'fallback_same_area';
      const { data: fb2 } = await supabase
        .from('courses')
        .select('*')
        .eq('lesson_type', lessonType)
        .in('library_level_tag', levels)
        .limit(50);
      picked = this.pickNotRecentlyUsed((fb2 ?? []) as LessonWithMeta[], lastUsed);
    }

    if (!picked) {
      fallbackLevel = 3;
      reason = 'fallback_primary_7d';
      const cutoff = this.getLastUsedMap(lastUsed, 7);
      const { data: fb3 } = await supabase
        .from('courses')
        .select('*')
        .eq('is_primary_lesson', true)
        .in('library_level_tag', levels)
        .limit(50);
      picked = this.pickNotRecentlyUsed((fb3 ?? []) as LessonWithMeta[], cutoff);
    }

    if (!picked) {
      fallbackLevel = 4;
      reason = 'fallback_universal';
      const { data: fb4 } = await supabase
        .from('courses')
        .select('*')
        .eq('library_level_tag', 'Universal')
        .limit(50);
      picked = this.pickNotRecentlyUsed((fb4 ?? []) as LessonWithMeta[], lastUsed);
    }

    if (!picked) {
      fallbackLevel = 5;
      reason = 'fallback_oldest_level';
      const { data: fb5 } = await supabase
        .from('courses')
        .select('*')
        .in('library_level_tag', levels)
        .limit(50);
      picked = (fb5 ?? [])[0] as LessonWithMeta ?? null;
    }

    const supplement = await this.getSupplementLessons(user);

    return {
      lesson: picked,
      supplementLessons: supplement,
      fallbackLevel,
      reason,
    };
  }

  static async getSupplementLessons(user: User): Promise<LessonWithMeta[]> {
    const priority = user.primary_priority_tag ?? 'BODY';
    const levelTag = user.level_tag ?? 'L1';
    const levels = levelTag === 'L2' ? ['L1', 'L2', 'Universal'] : ['L1', 'Universal'];
    const supplementType = priority === 'BODY' ? 'face_yoga' : 'fyzio_yoga';

    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('lesson_type', supplementType)
      .in('library_level_tag', levels)
      .limit(6);

    return (data ?? []) as LessonWithMeta[];
  }

  static async getTimeOfficeLesson(user: User): Promise<LessonWithMeta | null> {
    const levelTag = user.level_tag ?? 'L1';
    const levels = levelTag === 'L2' ? ['L1', 'L2', 'Universal'] : ['L1', 'Universal'];

    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('lesson_type', 'time_office')
      .in('library_level_tag', levels)
      .order('duration', { ascending: true })
      .limit(5);

    const rows = (data ?? []) as LessonWithMeta[];
    return rows[0] ?? null;
  }

  static async markLessonUsed(userId: string, courseId: string): Promise<void> {
    await supabase
      .from('user_last_used_videos')
      .upsert(
        { user_id: userId, course_id: courseId, last_used_at: new Date().toISOString() },
        { onConflict: 'user_id,course_id' }
      );
  }

  static async advanceCounters(user: User, wasFullLesson: boolean, isTimeOffice: boolean): Promise<void> {
    const plan = user.plan_tag === 'DESEYO' ? 'DESEYO' : 'RESTART';
    const isL2 = user.level_tag === 'L2';

    const updates: Record<string, unknown> = {};

    if (!isTimeOffice) {
      const cycleLength = plan === 'DESEYO' ? 5 : 3;
      const nextLib = ((user.library_session_counter ?? 0) + 1) % cycleLength;
      updates.library_session_counter = nextLib;
    }

    if (isL2 && wasFullLesson && !isTimeOffice) {
      const limit = user.primary_priority_tag === 'FACE' ? 4 : 3;
      const nextL2 = ((user.l2_session_counter ?? 0) + 1) % limit;
      updates.l2_session_counter = nextL2;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('users').update(updates).eq('id', user.id);
    }
  }

  private static async getRecentlyUsed(userId: string, days: number): Promise<Record<string, number>> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('user_last_used_videos')
      .select('course_id, last_used_at')
      .eq('user_id', userId)
      .gt('last_used_at', cutoff);

    const map: Record<string, number> = {};
    (data ?? []).forEach((r: { course_id: string; last_used_at: string }) => {
      map[r.course_id] = new Date(r.last_used_at).getTime();
    });
    return map;
  }

  private static getLastUsedMap(source: Record<string, number>, maxDays: number): Record<string, number> {
    const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
    const out: Record<string, number> = {};
    Object.entries(source).forEach(([k, v]) => {
      if (v > cutoff) out[k] = v;
    });
    return out;
  }

  private static pickNotRecentlyUsed(
    candidates: LessonWithMeta[],
    lastUsed: Record<string, number>
  ): LessonWithMeta | null {
    if (candidates.length === 0) return null;
    const fresh = candidates.filter((c) => !lastUsed[c.id]);
    if (fresh.length > 0) {
      return fresh[Math.floor(Math.random() * fresh.length)];
    }
    return candidates.sort(
      (a, b) => (lastUsed[a.id] ?? 0) - (lastUsed[b.id] ?? 0)
    )[0];
  }
}
