import { useEffect, useState } from 'react';
import { User } from '../lib/supabase';
import { ReflectionService, ReflectionDay } from '../services/reflectionService';
import { ReflectionModal } from './ReflectionModal';
import { Sparkle } from 'lucide-react';

interface Props {
  user: User;
}

const REFLECTION_DAYS: ReflectionDay[] = [7, 14, 21, 30];

export const ReflectionTrigger = ({ user }: Props) => {
  const [activeDay, setActiveDay] = useState<ReflectionDay | null>(null);
  const [pendingDay, setPendingDay] = useState<ReflectionDay | null>(null);

  const dayIndex = user.onboarding_day_index ?? 1;

  useEffect(() => {
    const matchingDay = REFLECTION_DAYS.find((d) => d === dayIndex);
    if (!matchingDay) return;

    (async () => {
      const existing = await ReflectionService.getReflection(user.id, matchingDay);
      if (!existing) setPendingDay(matchingDay);
    })();
  }, [user.id, dayIndex]);

  if (!pendingDay) return null;

  return (
    <>
      <div className="mb-6 rounded-xl p-5 border" style={{ backgroundColor: 'rgba(162, 182, 185, 0.08)', borderColor: 'rgba(162, 182, 185, 0.3)' }}>
        <div className="flex items-start gap-3">
          <Sparkle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A2B6B9' }} />
          <div className="flex-1">
            <p className="text-white font-medium mb-1">Reflexe D{pendingDay}</p>
            <p className="text-sm text-gray-400 mb-3">
              Jsi na {pendingDay}. dni. Muzes se na chvili zastavit a zachytit, co vnimas.
            </p>
            <button
              onClick={() => setActiveDay(pendingDay)}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
            >
              Otevrit reflexi
            </button>
          </div>
        </div>
      </div>

      {activeDay && (
        <ReflectionModal
          userId={user.id}
          day={activeDay}
          onClose={() => {
            setActiveDay(null);
            setPendingDay(null);
          }}
        />
      )}
    </>
  );
};
