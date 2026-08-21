import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Play, Bookmark, CheckCircle, Heart } from 'lucide-react';
import { supabase, Course } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const TEAL = '#049FB3';

export const LessonPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { loadCourse(); }, [slug]);

  const loadCourse = async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('stable_id', slug)
      .maybeSingle();
    if (data) {
      const c = data as Course;
      setCourse(c);
      setIsPlaying(true);
      if (user) {
        checkIfCompleted(c.id);
        checkIfBookmarked(c.id);
      }
    } else {
      setCourse(null);
      setNotFound(true);
    }
    setLoading(false);
  };

  const checkIfCompleted = async (courseId: string) => {
    const { data } = await supabase
      .from('lesson_completions')
      .select('is_completed')
      .eq('user_id', user!.id)
      .eq('lesson_id', courseId)
      .maybeSingle();
    setIsCompleted(!!data?.is_completed);
  };

  const checkIfBookmarked = async (courseId: string) => {
    const { data } = await supabase
      .from('video_favorites')
      .select('id')
      .eq('user_id', user!.id)
      .eq('course_id', courseId)
      .maybeSingle();
    setIsBookmarked(!!data);
  };

  const handleToggleBookmark = async () => {
    if (!user || !course) return;
    if (isBookmarked) {
      await supabase.from('video_favorites').delete().eq('user_id', user.id).eq('course_id', course.id);
    } else {
      await supabase.from('video_favorites').insert({ user_id: user.id, course_id: course.id });
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleComplete = async () => {
    if (!user || !course) return;
    const { data: existing } = await supabase
      .from('lesson_completions')
      .select('id, is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', course.id)
      .maybeSingle();
    if (existing) {
      const newState = !existing.is_completed;
      await supabase
        .from('lesson_completions')
        .update({ is_completed: newState, completed_at: newState ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      setIsCompleted(newState);
    } else {
      await supabase
        .from('lesson_completions')
        .insert({ user_id: user.id, lesson_id: course.id, is_completed: true, completed_at: new Date().toISOString() });
      setIsCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: TEAL }} />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tahle lekce neexistuje.</p>
      </div>
    );
  }

  const videoUrl = course.video_url || '';
  const autoplayUrl = videoUrl
    ? `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1`
    : '';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        {/* ── TITLE ROW (same as MojeCesta greeting) ── */}
        <div className="flex items-center gap-3 mb-2">
          <Heart
            className="w-6 h-6 flex-shrink-0"
            style={{ color: TEAL }}
            strokeWidth={1.5}
          />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            {course.title}
          </h1>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 mb-6">
          <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {course.duration || 6} min
          </span>
        </div>

        {/* Video player */}
        <div
          className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Bookmark tag */}
          <button
            onClick={handleToggleBookmark}
            className="absolute top-0 right-0 z-20 flex items-center justify-center transition-all active:scale-95"
            style={{ width: 44, height: 44, backgroundColor: TEAL, borderBottomLeftRadius: 12 }}
          >
            <Bookmark className="w-5 h-5 text-white" fill={isBookmarked ? 'white' : 'none'} />
          </button>

          {/* Video or play overlay */}
          {isPlaying && videoUrl ? (
            <iframe
              src={autoplayUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              style={{ border: 'none' }}
              title={course.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 hover:scale-105"
                style={{ border: '2px solid rgba(255,255,255,0.9)' }}
              >
                <Play className="w-7 h-7 text-white ml-1" fill="white" />
              </button>
            </div>
          )}
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-semibold transition-all active:scale-[0.98]"
          style={
            isCompleted
              ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)' }
              : { backgroundColor: TEAL, color: '#FFFFFF' }
          }
        >
          <CheckCircle className="w-5 h-5" />
          {isCompleted ? 'Dokončeno' : 'Dokončit lekci'}
        </button>
      </div>
    </div>
  );
};
