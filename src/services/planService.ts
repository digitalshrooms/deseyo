import { supabase } from '../lib/supabase';

export interface PlanInfo {
  planName: string;
  planLevel: string;
  currentWeek: number;
  currentDay: number;
  totalWeeks: number;
  daysCompletedThisWeek: number;
}

export interface TodaysLesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  type: 'lesson' | 'ritual';
  stable_id: string;
  content_type: string;
}

export class PlanService {
  static getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getWeekStartDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  static async getPlanInfo(userId: string): Promise<PlanInfo | null> {
    const { data: user } = await supabase
      .from('users')
      .select('current_plan, current_week, current_day')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return null;

    const totalWeeks = user.current_plan === 'Restart' ? 4 : 8;

    const weekStart = this.getWeekStartDate();

    const { data: events } = await supabase
      .from('user_events')
      .select('created_at')
      .eq('user_id', userId)
      .eq('event_type', 'lesson_completed')
      .gte('created_at', weekStart.toISOString());

    const uniqueDays = new Set(
      events?.map(e => this.getLocalDateString(new Date(e.created_at))) || []
    );

    return {
      planName: user.current_plan === 'Restart' ? 'Full Body & Face Restart' : `Deseyo systém – Level ${user.current_plan}`,
      planLevel: user.current_plan,
      currentWeek: user.current_week || 1,
      currentDay: user.current_day || 1,
      totalWeeks,
      daysCompletedThisWeek: uniqueDays.size,
    };
  }

  static async getTodaysLesson(userId: string): Promise<TodaysLesson | null> {
    const { data: user } = await supabase
      .from('users')
      .select('current_plan, current_week, current_day')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return null;

    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .contains('plan_relevance', [user.current_plan])
      .order('order_index')
      .limit(1)
      .maybeSingle();

    if (!course) {
      const { data: ritual } = await supabase
        .from('rituals')
        .select('*')
        .order('order_index')
        .limit(1)
        .maybeSingle();

      if (ritual) {
        return {
          id: ritual.id,
          title: ritual.title,
          description: ritual.description,
          duration: ritual.duration || 10,
          video_url: ritual.url,
          thumbnail_url: ritual.thumbnail_url || '',
          type: 'ritual',
          stable_id: ritual.stable_id,
          content_type: ritual.content_type,
        };
      }
      return null;
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      duration: course.duration,
      video_url: course.video_url,
      thumbnail_url: course.thumbnail_url,
      type: 'lesson',
      stable_id: course.stable_id || course.id,
      content_type: course.content_type || 'yoga',
    };
  }

  static async getShortLessons(planLevel: string) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .lte('duration', 15)
      .contains('plan_relevance', [planLevel])
      .order('duration')
      .limit(5);

    return data || [];
  }

  static async getOfficeLessons(planLevel: string) {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .contains('tags', ['office'])
      .contains('plan_relevance', [planLevel])
      .order('duration')
      .limit(5);

    return data || [];
  }

  static async updateUserProgress(userId: string, nextDay: number) {
    const { data: user } = await supabase
      .from('users')
      .select('current_week, current_plan')
      .eq('id', userId)
      .maybeSingle();

    if (!user) return;

    const totalDaysPerWeek = 7;
    let newWeek = user.current_week;
    let newDay = nextDay;

    if (nextDay > totalDaysPerWeek) {
      newWeek = user.current_week + 1;
      newDay = 1;
    }

    await supabase
      .from('users')
      .update({
        current_week: newWeek,
        current_day: newDay,
        last_activity_date: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  static getDailySeed(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  static seededShuffle<T>(arr: T[], seed: string): T[] {
    const copy = [...arr];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    for (let i = copy.length - 1; i > 0; i--) {
      hash = ((hash << 5) - hash) + i;
      hash |= 0;
      const j = Math.abs(hash) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  static async getDailyRecommendedLessons(userId: string): Promise<import('../lib/supabase').Course[]> {
    const { data: user } = await supabase
      .from('users')
      .select('current_plan')
      .eq('id', userId)
      .maybeSingle();

    const plan = user?.current_plan || 'L1';

    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .contains('plan_relevance', [plan])
      .order('order_index');

    if (!courses || courses.length === 0) {
      const { data: allCourses } = await supabase
        .from('courses')
        .select('*')
        .order('order_index');
      const pool = allCourses || [];
      const seed = this.getDailySeed();
      return this.seededShuffle(pool, seed).slice(0, 3);
    }

    const seed = this.getDailySeed();
    return this.seededShuffle(courses, seed).slice(0, 3);
  }

  static async getDaysInactiveCount(userId: string): Promise<number> {
    const { data: user } = await supabase
      .from('users')
      .select('last_activity_date')
      .eq('id', userId)
      .maybeSingle();

    if (!user?.last_activity_date) return 0;

    const lastActivity = new Date(user.last_activity_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
