import { useEffect, useState } from 'react';
import { WeekendService } from '../services/weekendService';
import { Coffee } from 'lucide-react';

interface Props {
  userId: string;
  onContinuePlan: () => void;
}

export const WeekendBanner = ({ userId, onContinuePlan }: Props) => {
  const [sundayMessage, setSundayMessage] = useState<string | null>(null);

  useEffect(() => {
    WeekendService.getSundayMessage(userId).then(setSundayMessage);
  }, [userId]);

  if (!WeekendService.isWeekend()) return null;

  return (
    <div className="mb-6 rounded-xl p-5 border" style={{ backgroundColor: '#2c2e33', borderColor: '#3c3e43' }}>
      <div className="flex items-start gap-3">
        <Coffee className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#A2B6B9' }} />
        <div className="flex-1">
          <p className="text-white font-medium mb-1">{WeekendService.getWeekendLabel()}</p>
          {sundayMessage && <p className="text-sm text-gray-400 mb-3">{sundayMessage}</p>}
          <button
            onClick={onContinuePlan}
            className="text-sm font-medium transition-colors"
            style={{ color: '#A2B6B9' }}
          >
            Chces dnes pokracovat v planu? →
          </button>
        </div>
      </div>
    </div>
  );
};
