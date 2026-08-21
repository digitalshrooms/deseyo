import { useAuth } from '../contexts/AuthContext';
import { useDailyOnboarding } from '../hooks/useDailyOnboarding';
import { DailyOnboardingModal } from './DailyOnboardingModal';
import { Sparkles } from 'lucide-react';

export function DailyOnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showOnboarding, currentDay, closeOnboarding, forceShowOnboarding } = useDailyOnboarding(user?.id);

  return (
    <>
      {children}
      {showOnboarding && user && (
        <DailyOnboardingModal
          userId={user.id}
          currentDay={currentDay}
          onClose={closeOnboarding}
        />
      )}
      {user && !showOnboarding && (
        <button
          onClick={forceShowOnboarding}
          className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 bg-rose-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all text-sm font-semibold"
          title="Zobrazit onboarding"
        >
          <Sparkles className="w-4 h-4" />
          Onboarding
        </button>
      )}
    </>
  );
}
