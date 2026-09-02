import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Course } from '../lib/supabase';
import { Heart, ChevronRight, Flame } from 'lucide-react';
import { LessonModal } from '../components/LessonModal';
import { GamificationService } from '../services/gamification';
import { PlanService } from '../services/planService';
import { WeeklyTextService } from '../services/weeklyTextService';

const BG = 'var(--bg)';
const CARD = 'var(--bg-card)';
const TEAL = '#049FB3';

const WEEKDAY_LABELS = ['Ne', 'Po', 'Út', 'Stř', 'Čt', 'Pá', 'So'];

const PROGRAM_CIRCLES = [
  {
    key: 'face',
    label: 'Facejóga',
    color: '#049FB1', // Simona
    path: '/face-joga',
    match: (cat?: string) => !!cat?.toLowerCase().includes('face'),
  },
  {
    key: 'yoga',
    label: 'Jóga',
    color: '#00B095', // Aneta
    path: '/fyzio-joga',
    match: (cat?: string) =>
      !cat?.toLowerCase().includes('face') && !cat?.toLowerCase().includes('mind'),
  },
  {
    key: 'mind',
    label: 'Meditace',
    color: '#656AAC', // Pavlína
    path: '/mind-life',
    match: (cat?: string) => !!cat?.toLowerCase().includes('mind'),
  },
];

const SCRIPT: React.CSSProperties = {
  fontFamily: "'Dancing Script', cursive",
};

export const MojeCesta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dailyLessons, setDailyLessons] = useState<Course[]>([]);
  const [medStatus, setMedStatus] = useState<any>(null);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [weeklyMotto, setWeeklyMotto] = useState('');

  useEffect(() => {
    if (user) {
      if (!user.onboarding_completed) {
        navigate('/onboarding');
        return;
      }
      loadData();
    }
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [status, plan, lessons, motto] = await Promise.all([
        GamificationService.calculateMED(user.id),
        PlanService.getPlanInfo(user.id),
        PlanService.getDailyRecommendedLessons(user.id),
        WeeklyTextService.getCurrentWeeklyText(),
      ]);
      setMedStatus(status);
      setPlanInfo(plan);
      setDailyLessons(lessons);
      if (motto?.text) setWeeklyMotto(motto.text);

      const { data: events } = await supabase
        .from('user_events')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('event_type', 'lesson_completed')
        .order('created_at', { ascending: false })
        .limit(30);

      if (events && events.length > 0) {
        let s = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daySet = new Set(
          events.map((e) => {
            const d = new Date(e.created_at);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
          }),
        );
        for (let i = 0; i < 30; i++) {
          const check = new Date(today);
          check.setDate(check.getDate() - i);
          if (daySet.has(check.getTime())) s++;
          else break;
        }
        setStreak(s);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Dobré ráno';
    if (h < 18) return 'Dobrý den';
    return 'Dobrý večer';
  };

  // Scheduled day indices (Mon=0 … Sun=6) based on plan frequency
  const is3xWeek = user?.current_plan === 'Restart';
  const scheduledDays = is3xWeek ? [0, 2, 4] : [0, 1, 2, 3, 4];

  // Build current week Mon→Sun with activity + schedule overlay
  const buildWeekRow = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    const activityMap = new Map<number, boolean>();
    if (medStatus?.lastSevenDaysActivity) {
      for (const d of medStatus.lastSevenDaysActivity) {
        const key = new Date(d.date).setHours(0, 0, 0, 0);
        activityMap.set(key, d.hasMovement);
      }
    }

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const key = day.setHours(0, 0, 0, 0);
      return {
        label: WEEKDAY_LABELS[new Date(key).getDay()],
        active: activityMap.get(key) ?? false,
        isToday: key === new Date().setHours(0, 0, 0, 0),
        scheduled: scheduledDays.includes(i),
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: TEAL }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Načítám tvůj den…
          </p>
        </div>
      </div>
    );
  }

  const weekRow = buildWeekRow();

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10" style={{ maxWidth: 820 }}>

        {/* ── GREETING ROW ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8 md:mb-10">
          {/* Left: heart + greeting */}
          <div className="flex items-center gap-3">
            <Heart
              className="w-6 h-6 flex-shrink-0"
              style={{ color: TEAL }}
              strokeWidth={1.5}
            />
            <h1
              className="font-normal leading-none"
              style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
            >
              {getGreeting()}
            </h1>
          </div>

          {/* Right: plan badge + change plan button */}
          {planInfo && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="btn-outline-primary inline-flex items-center px-5 py-2 rounded-full text-sm font-normal whitespace-nowrap"
              >
                {planInfo.planName}
              </span>
              <button
                onClick={() => navigate('/profil')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF', fontWeight: 300 }}
              >
                Změnit plán <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── MOTTO ── */}
        <div className="text-center mb-8 md:mb-10 px-2">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text)' }}>
            Tvé týdenní motto:
          </p>
          <p
            className="leading-snug"
            style={{
              ...SCRIPT,
              color: 'var(--primary-light)',
              fontSize: 'clamp(20px, 4.5vw, 28px)',
            }}
          >
            „{weeklyMotto || 'Každá lekce je konverzací se sebou samým'}"
          </p>
        </div>

        {/* ── MAIN CARD ── */}
        <div
          className="rounded-2xl md:rounded-3xl mb-5 py-8 px-4 md:py-10 md:px-10"
          style={{ backgroundColor: CARD }}
        >
          {/* Card heading */}
          <h2 className="text-center font-normal text-base md:text-lg mb-8 md:mb-10" style={{ color: 'var(--text)' }}>
            Tvůj dnešní program
          </h2>

          {/* ── THREE CIRCLES ── */}
          <div className="mc-program-circles mb-10 md:mb-12">
            {PROGRAM_CIRCLES.map((circle, idx) => {
              const lesson = dailyLessons.find((l) => circle.match(l.category));
              const isMiddle = idx === 1;
              const displayTitle = lesson?.title || circle.label;

              return (
                <button
                  key={circle.key}
                  onClick={() =>
                    lesson ? setSelectedCourse(lesson) : navigate(circle.path)
                  }
                  className={`mc-circle${isMiddle ? ' mc-circle-middle' : ''}`}
                  style={{ backgroundColor: circle.color }}
                >
                  {/* Lesson/category title */}
                  <span
                    className="leading-tight"
                    style={{
                      ...SCRIPT,
                      color: '#fff',
                      fontSize: 'clamp(13px, 3.6vw, 26px)',
                      fontWeight: 600,
                    }}
                  >
                    {displayTitle}
                  </span>

                  {/* CTA */}
                  <span
                    className="font-medium"
                    style={{ fontSize: 'clamp(9px, 2.4vw, 13px)', color: 'rgba(255,255,255,0.85)' }}
                  >
                    ▷ Začínáme
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="mb-6 md:mb-7"
            style={{ height: 1, backgroundColor: 'var(--border)' }}
          />

          {/* ── WEEK ROW ── */}
          <h2 className="text-center font-normal text-base md:text-lg mb-5 md:mb-6" style={{ color: 'var(--text)' }}>
            Tvůj týden
          </h2>

          <div className="mc-week-row px-1 md:px-0">
            {weekRow.map((day, idx) => {
              const isNonScheduledToday = !day.scheduled && day.isToday;
              const isScheduledActive = day.scheduled && (day.active || (day.isToday && !day.active));

              let bg: string;
              let border: string;
              let color: string;

              if (isScheduledActive && day.active) {
                bg = 'var(--primary)';
                border = '1.5px solid var(--primary)';
                color = '#fff';
              } else if (day.scheduled && day.isToday) {
                bg = 'var(--primary)';
                border = '1.5px solid var(--primary)';
                color = '#fff';
              } else if (isNonScheduledToday) {
                bg = 'var(--bg-elevated)';
                border = '1.5px solid var(--primary)';
                color = 'var(--text-muted)';
              } else if (!day.scheduled) {
                bg = 'var(--bg-elevated)';
                border = '1.5px solid var(--border-strong)';
                color = 'var(--text-subtle)';
              } else {
                bg = 'transparent';
                border = '1.5px solid var(--text-subtle)';
                color = 'var(--text-muted)';
              }

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div
                    className="mc-day-circle"
                    style={{
                      backgroundColor: bg,
                      border,
                      color,
                      fontWeight: day.isToday ? 500 : 400,
                    }}
                  >
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STREAK ── */}
        {streak > 1 && (
          <div
            className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-4"
            style={{ backgroundColor: CARD }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(251,146,60,0.12)' }}
            >
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-normal text-sm" style={{ color: 'var(--text)' }}>{streak} dní v řadě</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Serie běží – pokračuj dnes
              </p>
            </div>
          </div>
        )}

      </div>

      {selectedCourse && (
        <LessonModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onLessonComplete={loadData}
        />
      )}
    </div>
  );
};
