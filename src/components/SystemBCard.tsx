import { useEffect, useState } from 'react';
import { OnboardingContent } from '../lib/supabase';
import { OnboardingSystemBService } from '../services/onboardingSystemBService';
import { Play, SkipForward, Check } from 'lucide-react';

interface Props {
  userId: string;
  dayIndex: number;
  onFinished: () => void;
}

export const SystemBCard = ({ userId, dayIndex, onFinished }: Props) => {
  const [content, setContent] = useState<OnboardingContent | null>(null);
  const [action, setAction] = useState<'completed' | 'skipped' | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [c, a] = await Promise.all([
        OnboardingSystemBService.getTodayContent(dayIndex),
        OnboardingSystemBService.getTodayAction(userId, dayIndex),
      ]);
      setContent(c);
      setAction(a);
      setLoading(false);
    })();
  }, [userId, dayIndex]);

  const handleStart = async () => {
    setSaving(true);
    await OnboardingSystemBService.complete(userId, dayIndex);
    setAction('completed');
    setSaving(false);
    onFinished();
  };

  const handleSkip = async () => {
    setSaving(true);
    await OnboardingSystemBService.skip(userId, dayIndex);
    setAction('skipped');
    setSaving(false);
    onFinished();
  };

  if (loading || !content) return null;

  return (
    <div className="rounded-xl overflow-hidden mb-6 border" style={{ backgroundColor: '#2c2e33', borderColor: '#3c3e43' }}>
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#A2B6B9' }}>
              Onboarding — Den {dayIndex} / 30
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{content.title}</h2>
          {content.subtitle && (
            <p className="text-sm mt-1" style={{ color: '#A2B6B9' }}>
              {content.subtitle}
            </p>
          )}
        </div>
      </div>

      {content.body_text && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{content.body_text}</p>
        </div>
      )}

      {content.thumbnail_url && (
        <div className="px-6 pb-4">
          <img src={content.thumbnail_url} alt={content.title} className="w-full rounded-lg" />
        </div>
      )}

      <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
        {action === 'completed' || action === 'skipped' ? (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400" />
            {action === 'completed' ? 'Dnesni onboarding je hotovy.' : 'Dnesni onboarding preskocen.'}
          </div>
        ) : (
          <>
            <button
              onClick={handleStart}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
            >
              <Play className="w-4 h-4" />
              Spustit
            </button>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 border"
              style={{ borderColor: '#3c3e43', color: '#d1d5db' }}
            >
              <SkipForward className="w-4 h-4" />
              Preskocit a jit na cviceni
            </button>
          </>
        )}
      </div>
    </div>
  );
};
