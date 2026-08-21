import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Check, ChevronRight, ChevronLeft, SkipForward, Lock, PlayCircle, Download, FileText, AlertCircle, Heart } from 'lucide-react';

const TEAL_DARK = '#198379';

interface DailyContent {
  id: string;
  day_number: number;
  phase: string;
  video_id: string;
  question_text: string;
  options: string[];
  is_open_ended: boolean;
  download_url: string;
  linked_course_id: string | null;
  post_video_message: string | null;
  button_label: string | null;
}

interface DailyOnboardingModalProps {
  userId: string;
  currentDay: number;
  onClose: () => void;
}

const PHASES = [
  { name: 'Orientace', start: 1, end: 7, color: '#049FB3' },
  { name: 'Prohloubení', start: 8, end: 14, color: '#0d9488' },
  { name: 'Volba', start: 15, end: 21, color: '#0891b2' },
  { name: 'Integrace', start: 22, end: 30, color: '#0e7490' },
];

const MILESTONES = [1, 7, 14, 21, 30];

function getPhaseForDay(day: number) {
  return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[0];
}

function getWeekStart(day: number) {
  return Math.floor((day - 1) / 7) * 7 + 1;
}

export function DailyOnboardingModal({ userId, currentDay, onClose }: DailyOnboardingModalProps) {
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [viewingDay, setViewingDay] = useState(currentDay);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);

  const day = Math.min(Math.max(currentDay, 1), 30);
  const isOpenEnded = content?.is_open_ended ?? false;
  const isDownloadOnly = !!(content?.download_url && content.options.length === 0 && !content.video_id);
  const isVideoOnly = !!(content?.video_id && content.options.length === 0 && !content.download_url && !content.question_text);
  const isVideoWithDownload = !!(content?.video_id && content?.download_url && content.options.length === 0);
  const buttonLabel = content?.button_label || 'Pokračovat';
  const viewingDayClamped = Math.min(Math.max(viewingDay, 1), 30);
  const isCurrentDay = viewingDayClamped === day;
  const phase = getPhaseForDay(viewingDayClamped);
  const weekStart = getWeekStart(viewingDayClamped);
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i).filter(d => d <= 30);

  // D1, D3, D5, D6 require full video watch before proceeding
  const requiresVideoWatch = [1, 3, 5, 6].includes(viewingDayClamped);
  const canAnswer = (!requiresVideoWatch || videoWatched);
  const [isFavorite, setIsFavorite] = useState(false);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [technique, setTechnique] = useState<{ id: string; title: string; description: string | null; pdf_url: string } | null>(null);
  const [isTechniqueSaved, setIsTechniqueSaved] = useState(false);
  const [updatingTechnique, setUpdatingTechnique] = useState(false);

  useEffect(() => {
    setViewingDay(currentDay);
  }, [currentDay]);

  // Check if D3 video is already favorited
  useEffect(() => {
    if (!content?.linked_course_id) return;
    const checkFavorite = async () => {
      const { data } = await supabase
        .from('video_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', content.linked_course_id)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    checkFavorite();
  }, [content?.linked_course_id, userId]);

  // Load the technique (if any) attached to this day's PDF, and whether it's already saved
  useEffect(() => {
    setTechnique(null);
    setIsTechniqueSaved(false);
    if (!content?.download_url) return;
    let cancelled = false;
    const loadTechnique = async () => {
      const { data: t } = await supabase
        .from('techniques')
        .select('id, title, description, pdf_url')
        .eq('source_day_number', viewingDayClamped)
        .eq('is_active', true)
        .maybeSingle();
      if (!t || cancelled) return;
      setTechnique(t);
      const { data: saved } = await supabase
        .from('user_saved_techniques')
        .select('id')
        .eq('user_id', userId)
        .eq('technique_id', t.id)
        .maybeSingle();
      if (!cancelled) setIsTechniqueSaved(!!saved);
    };
    loadTechnique();
    return () => { cancelled = true; };
  }, [content?.download_url, viewingDayClamped, userId]);

  const handleToggleFavorite = async () => {
    if (!content?.linked_course_id || updatingFavorite) return;
    setUpdatingFavorite(true);
    try {
      if (isFavorite) {
        await supabase.from('video_favorites').delete().eq('user_id', userId).eq('course_id', content.linked_course_id);
      } else {
        await supabase.from('video_favorites').insert({ user_id: userId, course_id: content.linked_course_id });
      }
      setIsFavorite(!isFavorite);
    } finally {
      setUpdatingFavorite(false);
    }
  };

  const handleToggleTechnique = async () => {
    if (!technique || updatingTechnique) return;
    setUpdatingTechnique(true);
    try {
      if (isTechniqueSaved) {
        await supabase.from('user_saved_techniques').delete().eq('user_id', userId).eq('technique_id', technique.id);
      } else {
        await supabase.from('user_saved_techniques').insert({ user_id: userId, technique_id: technique.id });
      }
      setIsTechniqueSaved(!isTechniqueSaved);
    } finally {
      setUpdatingTechnique(false);
    }
  };

  useEffect(() => {
    loadContent(viewingDayClamped);
    setSelectedOption(null);
    setTextAnswer('');
  }, [viewingDayClamped]);

  const loadContent = async (dayNum: number) => {
    setLoading(true);
    setError(null);
    setVideoWatched(false);
    try {
      const { data, error: fetchError } = await supabase
        .from('onboarding_daily_content')
        .select('*')
        .eq('day_number', dayNum)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setError(`Pro den ${dayNum} zatím není připravený obsah.`);
        return;
      }
      const opts = Array.isArray(data.options) ? data.options : [];
      setContent({
        id: data.id,
        day_number: data.day_number,
        phase: data.phase,
        video_id: data.video_id,
        question_text: data.question_text,
        options: opts,
        is_open_ended: opts.length === 0,
        download_url: data.download_url || '',
        linked_course_id: data.linked_course_id || null,
        post_video_message: data.post_video_message || null,
        button_label: data.button_label || null,
      });
    } catch (err) {
      console.error('Error loading onboarding content:', err);
      setError('Nepodařilo se načíst obsah. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = useCallback(async (option: string | null, skipped: boolean, isReanswer: boolean = false) => {
    setSubmitting(true);
    try {
      if (isReanswer) {
        // Update existing response for this day — don't advance day index
        const { error: updateError } = await supabase
          .from('onboarding_daily_response')
          .update({
            selected_option: option,
            skipped,
            responded_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('day_number', day);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('onboarding_daily_response')
          .insert({
            user_id: userId,
            day_number: day,
            question_text: content?.question_text || '',
            selected_option: option,
            skipped,
          });

        if (insertError) throw insertError;

        const nextDay = Math.min(day + 1, 30);
        await supabase
          .from('users')
          .update({
            onboarding_day_index: nextDay,
            last_activity_date: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      onClose();
    } catch (err) {
      console.error('Error submitting onboarding response:', err);
      setError('Nepodařilo se uložit odpověď. Zkuste to prosím znovu.');
      setSubmitting(false);
    }
  }, [userId, day, content, onClose]);

  const goToDay = (d: number) => {
    const clamped = Math.min(Math.max(d, 1), 30);
    setViewingDay(clamped);
  };

  const handleSelectOption = (index: number) => {
    if (!canAnswer) return;
    setSelectedOption(index);
  };

  const handleContinue = () => {
    if (!content || !canAnswer) return;
    if (isDownloadOnly) {
      submitResponse('Stáhl jsem si workbook', false, false);
      return;
    }
    if (isVideoOnly) {
      submitResponse('Video zhlédnuto', false, false);
      return;
    }
    if (isVideoWithDownload) {
      submitResponse('Video zhlédnuto a PDF staženo', false, false);
      return;
    }
    if (isOpenEnded) {
      if (!textAnswer.trim()) return;
      submitResponse(textAnswer.trim(), false, false);
    } else {
      if (selectedOption === null) return;
      submitResponse(content.options[selectedOption], false, false);
    }
  };

  const handleReanswer = () => {
    if (!content) return;
    if (isDownloadOnly || isVideoOnly || isVideoWithDownload) {
      submitResponse(
        isDownloadOnly ? 'Stáhl jsem si workbook' : isVideoOnly ? 'Video zhlédnuto' : 'Video zhlédnuto a PDF staženo',
        false,
        true
      );
      return;
    }
    if (isOpenEnded) {
      if (!textAnswer.trim()) return;
      submitResponse(textAnswer.trim(), false, true);
    } else {
      if (selectedOption === null) return;
      submitResponse(content.options[selectedOption], false, true);
    }
  };

  // TESTING ONLY: Skip button — remove or hide behind feature flag before production
  const handleSkip = () => {
    submitResponse(null, true);
  };

  // Use Player.js to detect video completion via the Mux iframe
  // Use timeupdate + duration comparison instead of 'ended' event which fires too early
  useEffect(() => {
    if (!content?.video_id || !requiresVideoWatch) return;
    if (!iframeRef.current) return;

    const PlayerJS = (window as any).playerjs;
    if (!PlayerJS) return;

    const player = new PlayerJS.Player(iframeRef.current);
    playerRef.current = player;

    let duration = 0;

    player.on('ready', () => {
      player.getDuration((d: number) => { duration = d || 0; });
    });

    player.on('timeupdate', (t: number) => {
      if (duration > 0 && t >= duration - 0.5) {
        setVideoWatched(true);
      }
    });

    player.on('ended', () => setVideoWatched(true));

    return () => {
      // The iframe may already be removed from the DOM by the time this cleanup
      // runs (e.g. modal closed right after submitting), which makes player.js
      // throw when it tries to postMessage to the gone iframe. Swallow that so
      // it can't crash the whole app (there's no error boundary above this tree).
      try {
        player.off('ready');
        player.off('timeupdate');
        player.off('ended');
      } catch (err) {
        console.warn('[DailyOnboardingModal] player cleanup failed (iframe likely already removed):', err);
      }
      playerRef.current = null;
    };
  }, [content?.video_id, requiresVideoWatch, content]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Progress Map ── */}
        <div className="px-6 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${phase.color}08, ${phase.color}03)` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: phase.color }}>
                {phase.name}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
                Den {viewingDayClamped} z 30
              </h2>
            </div>
            {/* TESTING ONLY — remove before production */}
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Testing only — přeskočí dnešní den"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Přeskočit
            </button>
          </div>

          {/* Horizontal progress track with milestones */}
          <div className="relative mt-5 mb-2">
            <div className="flex items-center h-2 rounded-full overflow-hidden bg-gray-100">
              {PHASES.map((p, i) => {
                const width = ((p.end - p.start + 1) / 30) * 100;
                const isComplete = day > p.end;
                const isCurrent = viewingDayClamped >= p.start && viewingDayClamped <= p.end;
                return (
                  <div
                    key={i}
                    style={{
                      width: `${width}%`,
                      backgroundColor: isComplete
                        ? p.color
                        : isCurrent
                          ? p.color
                          : '#f3f4f6',
                      opacity: isComplete ? 1 : isCurrent ? 0.6 : 1,
                    }}
                  />
                );
              })}
            </div>
            {/* Milestone dots */}
            <div className="absolute inset-0 flex items-center justify-between px-0">
              {MILESTONES.map((m) => {
                const isPassed = day >= m;
                const isCurrent = viewingDayClamped === m;
                return (
                  <div
                    key={m}
                    className="flex flex-col items-center"
                    style={{ position: 'absolute', left: `${((m - 1) / 29) * 100}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: isCurrent ? phase.color : isPassed ? phase.color : '#d1d5db',
                        width: isCurrent ? '16px' : '12px',
                        height: isCurrent ? '16px' : '12px',
                        transition: 'all 0.3s',
                      }}
                    />
                    <span
                      className="text-[10px] font-medium mt-1"
                      style={{ color: isCurrent || isPassed ? phase.color : '#9ca3af' }}
                    >
                      D{m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly MED tracker */}
          <div className="flex items-center gap-2 mt-5">
            <span className="text-xs text-gray-400 font-medium">Tento týden:</span>
            <div className="flex gap-1.5">
              {weekDays.map((d) => {
                const isPast = d < day;
                const isToday = d === day;
                const isViewing = d === viewingDayClamped;
                return (
                  <div
                    key={d}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <button
                      onClick={() => goToDay(d)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all hover:scale-110"
                      style={{
                        backgroundColor: isViewing ? phase.color : isPast ? phase.color : isToday ? phase.color : 'transparent',
                        color: isViewing ? '#fff' : isPast ? '#fff' : isToday ? '#fff' : '#9ca3af',
                        border: isViewing ? `2px solid ${phase.color}` : isToday ? `2px solid ${phase.color}` : d > day ? '1.5px solid #e5e7eb' : 'none',
                      }}
                    >
                      {isPast && <Check className="w-3 h-3" />}
                      {isToday && d}
                      {d > day && d}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Day navigation ── */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
          <button
            onClick={() => goToDay(viewingDayClamped - 1)}
            disabled={viewingDayClamped <= 1}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Předchozí
          </button>
          <span className="text-xs text-gray-400">
            {isCurrentDay ? 'Dnešní den' : `Prohlížíte den ${viewingDayClamped}`}
          </span>
          <button
            onClick={() => goToDay(viewingDayClamped + 1)}
            disabled={viewingDayClamped >= 30 || viewingDayClamped >= day}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Další
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content of the Day ── */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${phase.color}30`, borderTopColor: phase.color }} />
              <p className="text-sm text-gray-400 mt-3">Načítám obsah...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: TEAL_DARK }}
              >
                Zavřít
              </button>
            </div>
          ) : content ? (
            <>
              {/* Video player */}
              {content.video_id && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-3">
                  <iframe
                    ref={iframeRef}
                    src={`https://player.mux.com/${content.video_id}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    title={`Den ${day} video`}
                  />
                  {/* D1 overlay lock until video is watched */}
                  {requiresVideoWatch && !videoWatched && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 pointer-events-none">
                      <p className="text-xs text-white/90 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Dosledujte video pro odemknutí otázky
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* D1 video completion banner */}
              {requiresVideoWatch && !videoWatched && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
                  <PlayCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Nejdřív si pusťte celé video, pak budete moci odpovědět na otázku.
                  </p>
                </div>
              )}
              {requiresVideoWatch && videoWatched && !content.post_video_message && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">Video dokončeno — můžete odpovědět.</p>
                </div>
              )}

              {/* Post-video inspirational message (e.g. D5) */}
              {content.post_video_message && videoWatched && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4 mb-4">
                  <p className="text-base font-medium text-teal-900 leading-relaxed text-center">
                    {content.post_video_message}
                  </p>
                </div>
              )}

              {/* Day 3 — Favorites hint with heart button (shown once after first lesson video) */}
              {viewingDayClamped === 3 && videoWatched && content.linked_course_id && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-4 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-900 mb-0.5">Sedla ti lekce?</p>
                      <p className="text-sm text-rose-700 leading-relaxed">
                        Ulož si ji do oblíbených ♡ — najdeš je vždy ve svém profilu.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={updatingFavorite}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isFavorite
                        ? 'bg-rose-500 text-white'
                        : 'bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'fill-white' : ''}`} />
                    {isFavorite ? 'V oblíbených' : 'Přidat do oblíbených'}
                  </button>
                </div>
              )}

              {/* PDF Download Section (e.g. Day 2 — Habit design sheet, Day 6 — video + PDF) */}
              {content.download_url && (
                <div className="mb-5">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-0">
                        <h3 className="text-base font-bold text-gray-900 mb-1">{technique?.title || 'Workbook'}</h3>
                        {content.question_text && (
                          <p className="text-sm text-gray-600 leading-relaxed">{content.question_text}</p>
                        )}
                      </div>
                    </div>

                    {canAnswer ? (
                      <div className="flex gap-2">
                        <a
                          href={content.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-teal-600 text-teal-700 font-semibold text-sm hover:bg-teal-50 transition-colors"
                        >
                          Náhled
                        </a>
                        <a
                          href={content.download_url}
                          download
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Stáhnout PDF
                        </a>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-200 text-gray-400 font-semibold text-sm cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                        Nejdřív dokoukejte video
                      </div>
                    )}

                    {technique && (
                      <button
                        onClick={handleToggleTechnique}
                        disabled={!canAnswer || updatingTechnique}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm mt-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          isTechniqueSaved
                            ? 'bg-teal-100 text-teal-800 border-2 border-teal-300'
                            : 'bg-white border-2 border-teal-300 text-teal-700 hover:bg-teal-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isTechniqueSaved ? 'fill-teal-700' : ''}`} />
                        {isTechniqueSaved ? 'V mých technikách' : 'Uložit do Moje techniky'}
                      </button>
                    )}

                    <div className="flex items-center gap-2 mt-3 px-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">
                        {isDownloadOnly ? 'Workbook si můžeš stáhnout jenom dnes.' : 'PDF zůstane uložené v Mých technikách i po dnešku.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Question + options (hidden for download-only and video-only days) */}
              {!isDownloadOnly && !isVideoOnly && !isVideoWithDownload && (
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold mb-3 transition-colors ${!canAnswer ? 'text-gray-300' : 'text-gray-900'}`}>
                    {content.question_text}
                  </h3>
                  {!isCurrentDay && (
                    <p className="text-xs text-gray-400 mb-3 italic">
                      Tento den jste již dokončili — můžete si odpověď změnit.
                    </p>
                  )}
                  {isOpenEnded ? (
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      disabled={submitting || !canAnswer}
                      placeholder="Napište svou odpověď..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-2xl border-2 transition-all outline-none text-sm font-medium resize-none ${
                        canAnswer
                          ? 'border-gray-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed text-gray-300'
                      } ${submitting ? 'opacity-50' : ''}`}
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {content.options.map((option, index) => {
                        const isSelected = selectedOption === index;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectOption(index)}
                            disabled={submitting || !canAnswer}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'border-teal-500 bg-teal-50'
                                : canAnswer
                                  ? 'border-gray-200 bg-white hover:border-gray-300'
                                  : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                              } ${submitting ? 'opacity-50' : ''}`}
                          >
                            <span className={`text-sm font-medium ${isSelected ? 'text-teal-700' : canAnswer ? 'text-gray-700' : 'text-gray-300'}`}>
                              {option}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-500'
                                  : canAnswer
                                    ? 'border-gray-300 group-hover:border-gray-400'
                                    : 'border-gray-200'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Continue button */}
              {isCurrentDay ? (
                <button
                  onClick={handleContinue}
                  disabled={submitting || !canAnswer || (!isDownloadOnly && !isVideoOnly && !isVideoWithDownload && (isOpenEnded ? !textAnswer.trim() : selectedOption === null))}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: TEAL_DARK }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Ukládám...
                    </>
                  ) : (
                    <>
                      {buttonLabel}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (isDownloadOnly || isVideoOnly || isVideoWithDownload) ? (
                <button
                  onClick={() => goToDay(day)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: TEAL_DARK }}
                >
                  {buttonLabel}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleReanswer}
                    disabled={submitting || (!isDownloadOnly && (isOpenEnded ? !textAnswer.trim() : selectedOption === null))}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: TEAL_DARK }}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Ukládám...
                      </>
                    ) : (
                      <>
                        Změnit odpověď
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => goToDay(day)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-gray-500 font-medium text-sm transition-all hover:bg-gray-100"
                  >
                    Zpět na dnešní den
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}