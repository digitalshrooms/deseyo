import { useState, useEffect } from 'react';
import { MessageCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEAL = '#049FB3';
const BORDER = 'var(--border-strong)';

type Category = 'vše' | 'pohyb' | 'životospráva' | 'duše' | 'plán';

const categories: { id: Category; label: string }[] = [
  { id: 'vše', label: 'Vše' },
  { id: 'pohyb', label: 'Pohyb' },
  { id: 'životospráva', label: 'Životospráva' },
  { id: 'duše', label: 'Duše' },
  { id: 'plán', label: 'Plán' },
];

interface Consultation {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  content_type: string;
  order_index: number | null;
}

export const Konsultace = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('vše');

  useEffect(() => { loadConsultations(); }, []);

  const loadConsultations = async () => {
    const { data } = await supabase.from('consultations').select('*').order('order_index');
    if (data) setConsultations(data as Consultation[]);
    setLoading(false);
  };

  const filtered =
    selectedCategory === 'vše'
      ? consultations
      : consultations.filter(c => c.content_type === `consultation:${selectedCategory}`);

  const heading =
    selectedCategory === 'vše' ? 'Vše' : categories.find(c => c.id === selectedCategory)?.label;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <MessageCircle className="w-6 h-6 flex-shrink-0" style={{ color: TEAL }} strokeWidth={1.5} />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Konzultace
          </h1>
        </div>

        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Individuální prostor pro tvé otázky. Vyber si téma a domluv si čas.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Odezva obvykle do 48 hodin. Při akutních potížích se obrať na lékaře.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Téma
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: isSelected ? TEAL : 'transparent',
                    color: isSelected ? '#FFFFFF' : TEAL,
                    border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            {heading}
          </h2>

          {loading ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {[1, 2, 3].map(i => (
                <li key={i} className="py-5 animate-pulse">
                  <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </li>
              ))}
            </ul>
          ) : filtered.length > 0 ? (
            <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
              {filtered.map((item, idx) => (
                <li
                  key={item.id}
                  className="py-5 flex items-baseline gap-4 transition-all active:scale-[0.99] hover:opacity-80"
                >
                  <span
                    className="text-sm font-semibold flex-shrink-0 tabular-nums"
                    style={{ color: TEAL }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pro toto téma zatím nejsou k dispozici konzultace</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
