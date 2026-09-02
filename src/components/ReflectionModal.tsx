import { useState } from 'react';
import { X, Heart, Brain, Zap } from 'lucide-react';
import { ReflectionService, ReflectionDay } from '../services/reflectionService';

interface Props {
  userId: string;
  day: ReflectionDay;
  onClose: () => void;
}

const QUESTIONS: Record<ReflectionDay, { key: string; label: string }[]> = {
  7: [
    { key: 'what_noticed', label: 'Co sis tento tyden o sobe vsimla?' },
    { key: 'body_signals', label: 'Ktery signal tela te nejvic prekvapil?' },
  ],
  14: [
    { key: 'what_easier', label: 'Co se ti ted deje lehce, co pred dvema tydny ne?' },
    { key: 'what_resists', label: 'Co jeste vzdoruje — a je v poradku ze vzdoruje?' },
  ],
  21: [
    { key: 'new_habit', label: 'Jaky novy mini-navyk se ti uchytil?' },
    { key: 'support_self', label: 'Jak ted rozumis tomu, co te podporuje?' },
  ],
  30: [
    { key: 'reflection_arc', label: 'Kdyz se ohlednes zpatky — co je jine?' },
    { key: 'next_intention', label: 'Co si prejes pro dalsi mesic?' },
  ],
};

export const ReflectionModal = ({ userId, day, onClose }: Props) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [body, setBody] = useState(3);
  const [mind, setMind] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'reflection' | 'checkin' | 'done'>('reflection');

  const questions = QUESTIONS[day];

  const handleSaveReflection = async () => {
    setSaving(true);
    await ReflectionService.saveReflection(userId, day, answers);
    setSaving(false);
    setStep('checkin');
  };

  const handleSaveCheckin = async () => {
    setSaving(true);
    await ReflectionService.saveCheckin(userId, day, body, mind, energy);
    setSaving(false);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reflexe D{day}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'reflection'
                ? 'Tvoje odpovedi jsou jen tvoje — vratime ti je v D30.'
                : step === 'checkin'
                ? 'Jak to ted citis? Tri zakladni body.'
                : 'Dekujeme.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'reflection' && (
          <div className="p-6 space-y-5">
            {questions.map((q) => (
              <div key={q.key}>
                <label className="block text-sm font-medium text-gray-800 mb-2">{q.label}</label>
                <textarea
                  rows={3}
                  value={answers[q.key] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                  placeholder="Muzes napsat cokoli..."
                />
              </div>
            ))}
            <button
              onClick={handleSaveReflection}
              disabled={saving}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Ukladam...' : 'Pokracovat'}
            </button>
          </div>
        )}

        {step === 'checkin' && (
          <div className="p-6 space-y-5">
            <CheckinSlider icon={<Heart className="w-4 h-4" />} label="Telo" value={body} onChange={setBody} />
            <CheckinSlider icon={<Brain className="w-4 h-4" />} label="Mysl" value={mind} onChange={setMind} />
            <CheckinSlider icon={<Zap className="w-4 h-4" />} label="Energie" value={energy} onChange={setEnergy} />
            <button
              onClick={handleSaveCheckin}
              disabled={saving}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Ukladam...' : 'Ulozit'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center">
            <p className="text-gray-800 mb-4">Ulozeno. Uvidis to znovu v D30.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Zavrit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function CheckinSlider({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-800">
        {icon}
        {label}
        <span className="ml-auto text-teal-700">{value} / 5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === n ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
