import { supabase } from '../lib/supabase';

export interface BannerMessage {
  type: 'praise' | 'reminder' | 'suggestion' | 'info';
  message: string;
  actionText?: string;
  actionLink?: string;
}

export interface MEDStatus {
  completedDays: number;
  isMEDMet: boolean;
  lastSevenDaysActivity: { date: string; hasMovement: boolean }[];
}

export class GamificationService {
  static getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async calculateMED(userId: string): Promise<MEDStatus> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = this.getLocalDateString(sevenDaysAgo);

    const { data: events, error } = await supabase
      .from('user_events')
      .select('created_at, content_type')
      .eq('user_id', userId)
      .eq('event_type', 'lesson_completed')
      .in('content_type', ['yoga', 'faceyoga', 'physioyoga'])
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error || !events) {
      return {
        completedDays: 0,
        isMEDMet: false,
        lastSevenDaysActivity: [],
      };
    }

    const activityByDay = new Map<string, boolean>();

    events.forEach((event) => {
      const eventDate = new Date(event.created_at);
      const date = this.getLocalDateString(eventDate);
      activityByDay.set(date, true);
    });

    const lastSevenDaysActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = this.getLocalDateString(date);
      lastSevenDaysActivity.push({
        date: dateStr,
        hasMovement: activityByDay.has(dateStr),
      });
    }

    const completedDays = activityByDay.size;
    const isMEDMet = completedDays >= 3;

    return {
      completedDays,
      isMEDMet,
      lastSevenDaysActivity,
    };
  }

  static async getBannerMessage(userId: string): Promise<BannerMessage | null> {
    const medStatus = await this.calculateMED(userId);

    if (medStatus.isMEDMet && medStatus.completedDays >= 5) {
      return {
        type: 'praise',
        message: `Úžasné! Tento týden máš ${medStatus.completedDays} dní pohybu. Tohle je to, co dělá rozdíl.`,
      };
    }

    if (medStatus.isMEDMet) {
      return {
        type: 'praise',
        message: `Skvěle! MED splněn s ${medStatus.completedDays} dny pohybu tento týden.`,
      };
    }

    if (medStatus.completedDays === 2) {
      return {
        type: 'reminder',
        message: 'Máš za sebou 2 dny pohybu. Jeden den tě dělí od splnění MED!',
      };
    }

    if (medStatus.completedDays === 1) {
      return {
        type: 'reminder',
        message: 'Začátek je tu! Ještě 2 dny pohybu a máš MED splněný.',
      };
    }

    const daysLeft = 7 - medStatus.lastSevenDaysActivity.length;
    if (daysLeft <= 2 && medStatus.completedDays === 0) {
      return {
        type: 'suggestion',
        message: 'Tento týden ještě neproběhl žádný pohyb. Chceš zjemnit plán?',
        actionText: 'Upravit plán',
        actionLink: '/profil',
      };
    }

    return null;
  }

  static async trackEvent(
    userId: string,
    eventType: 'lesson_started' | 'lesson_completed' | 'ritual_started' | 'ritual_completed' | 'live_joined' | 'recording_played',
    contentId: string,
    contentType: 'yoga' | 'faceyoga' | 'physioyoga' | 'ritual' | 'live' | 'recording',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await supabase.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      content_id: contentId,
      content_type: contentType,
      metadata,
    });
  }

  static async getRecentActivity(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  }
}
