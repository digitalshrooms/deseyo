import { useEffect, useState } from 'react';
import { SeasonalMessage } from '../lib/supabase';
import { SeasonalService } from '../services/seasonalService';
import { X, Leaf } from 'lucide-react';

interface Props {
  userId: string;
}

export const SeasonalMessageBanner = ({ userId }: Props) => {
  const [message, setMessage] = useState<SeasonalMessage | null>(null);

  useEffect(() => {
    SeasonalService.getCurrentMessage(userId).then(setMessage);
  }, [userId]);

  if (!message) return null;

  const handleDismiss = async () => {
    await SeasonalService.dismiss(userId);
    setMessage(null);
  };

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/40 flex items-start gap-3">
      <Leaf className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-700" />
      <p className="flex-1 text-sm leading-relaxed text-gray-800">{message.message}</p>
      <button
        onClick={handleDismiss}
        className="text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Zavrit"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
