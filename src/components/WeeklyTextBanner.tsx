import { useEffect, useState } from 'react';
import { WeeklyText } from '../lib/supabase';
import { WeeklyTextService } from '../services/weeklyTextService';
import { Sparkles } from 'lucide-react';

export const WeeklyTextBanner = () => {
  const [text, setText] = useState<WeeklyText | null>(null);

  useEffect(() => {
    WeeklyTextService.getCurrentWeeklyText().then(setText);
  }, []);

  if (!text) return null;

  return (
    <div className="mb-6 px-4 py-3 rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50/60 to-transparent flex items-start gap-3">
      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-600" />
      <div className="text-sm leading-relaxed text-gray-700">
        <p className="italic">{text.text_content}</p>
        {text.author && (
          <p className="text-xs text-gray-500 mt-1">— {text.author}</p>
        )}
      </div>
    </div>
  );
};
