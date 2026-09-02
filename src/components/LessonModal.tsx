import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, Heart, Clock, MessageCircle } from 'lucide-react';
import { Course } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GamificationService } from '../services/gamification';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface LessonModalProps {
  course: Course;
  onClose: () => void;
  onLessonComplete?: () => void;
}

const TEAL = '#198379';
const CARD = '#1c1e22';
const CARD2 = '#242629';

export const LessonModal = ({ course, onClose, onLessonComplete }: LessonModalProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    loadComments();
    checkIfCompleted();
    checkIfFavorite();
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const checkIfCompleted = async () => {
    if (!user) return;
    const { data } = await supabase.from('lesson_completions').select('is_completed').eq('user_id', user.id).eq('lesson_id', course.id).maybeSingle();
    if (data) setIsCompleted(data.is_completed);
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    const { data } = await supabase.from('video_favorites').select('id').eq('user_id', user.id).eq('course_id', course.id).maybeSingle();
    setIsFavorite(!!data);
  };

  const handleToggleFavorite = async () => {
    if (!user || updatingFavorite) return;
    setUpdatingFavorite(true);
    try {
      if (isFavorite) {
        await supabase.from('video_favorites').delete().eq('user_id', user.id).eq('course_id', course.id);
      } else {
        await supabase.from('video_favorites').insert({ user_id: user.id, course_id: course.id });
      }
      setIsFavorite(!isFavorite);
    } finally { setUpdatingFavorite(false); }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase.from('comments').select('*').eq('lesson_id', course.id).order('created_at', { ascending: false });
    if (data) setComments(data);
    setLoadingComments(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    const { error } = await supabase.from('comments').insert({ lesson_id: course.id, author_id: user.id, author_name: user.name || user.email || 'Anonymní', content: newComment.trim() });
    if (!error) { setNewComment(''); await loadComments(); }
  };

  const handleCompleteLesson = async () => {
    if (!user || completingLesson) return;
    setCompletingLesson(true);
    const { data: existing } = await supabase.from('lesson_completions').select('id, is_completed').eq('user_id', user.id).eq('lesson_id', course.id).maybeSingle();
    if (existing) {
      const newState = !existing.is_completed;
      await supabase.from('lesson_completions').update({ is_completed: newState, completed_at: newState ? new Date().toISOString() : null, uncompleted_at: newState ? null : new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', existing.id);
      setIsCompleted(newState);
      if (newState && course.stable_id) await GamificationService.trackEvent(user.id, 'lesson_completed', course.stable_id, (course.content_type as 'yoga' | 'faceyoga' | 'physioyoga') || 'yoga', { lesson_title: course.title, category: course.category, duration: course.duration });
    } else {
      await supabase.from('lesson_completions').insert({ user_id: user.id, lesson_id: course.id, is_completed: true, completed_at: new Date().toISOString() });
      setIsCompleted(true);
      if (course.stable_id) await GamificationService.trackEvent(user.id, 'lesson_completed', course.stable_id, (course.content_type as 'yoga' | 'faceyoga' | 'physioyoga') || 'yoga', { lesson_title: course.title, category: course.category, duration: course.duration });
    }
    setCompletingLesson(false);
    if (onLessonComplete) onLessonComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95dvh] sm:max-h-[90vh] flex flex-col"
        style={{ backgroundColor: '#13151a' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              {course.order_index ? `Lekce ${course.order_index}` : 'Lekce'}
            </p>
            <h2 className="text-base font-bold text-white leading-snug line-clamp-2">{course.title}</h2>
            {course.duration && (
              <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                <Clock className="w-3 h-3" />
                <span>{course.duration} min</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70" style={{ backgroundColor: CARD2 }}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Video */}
          <div className="aspect-video bg-black">
            <iframe
              src={course.video_url}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              style={{ width: '100%', border: 'none', aspectRatio: '16/9' }}
              title={course.title}
            />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={handleCompleteLesson}
              disabled={completingLesson}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 active:scale-[0.98]"
              style={
                isCompleted
                  ? { backgroundColor: 'rgba(52,211,153,0.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.2)' }
                  : { backgroundColor: TEAL, color: 'white' }
              }
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted ? 'Dokončeno' : 'Dokončit lekci'}
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={updatingFavorite}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 active:scale-[0.96] flex-shrink-0"
              style={
                isFavorite
                  ? { backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }
                  : { backgroundColor: CARD2, border: '1px solid #2e3035' }
              }
            >
              <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-red-400 text-red-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Description */}
          {course.description && (
            <div className="px-5 pb-4">
              <p className="text-sm text-gray-400 leading-relaxed">{course.description}</p>
            </div>
          )}

          {/* Comments toggle */}
          <div className="px-5 pb-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ color: TEAL }}
            >
              <MessageCircle className="w-4 h-4" />
              {showComments ? 'Skrýt diskuzi' : `Diskuze (${comments.length})`}
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="px-5 pb-6">
              <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Napište komentář…"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none placeholder-gray-600"
                  style={{ backgroundColor: CARD2, border: '1px solid #2e3035' }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ backgroundColor: TEAL }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>

              <div className="space-y-2">
                {loadingComments ? (
                  <p className="text-center py-4 text-sm text-gray-600">Načítám komentáře…</p>
                ) : comments.length === 0 ? (
                  <p className="text-center py-6 text-sm text-gray-600">Zatím žádné komentáře. Buďte první!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3.5 rounded-xl" style={{ backgroundColor: CARD2 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-white">{comment.author_name}</span>
                        <span className="text-[10px] text-gray-600">{new Date(comment.created_at).toLocaleDateString('cs-CZ')}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Safe area bottom */}
          <div className="h-4 sm:h-2" />
        </div>
      </div>
    </div>
  );
};
