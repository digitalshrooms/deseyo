import { useState, useEffect } from 'react';
import { Sparkles, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TEAL = '#049FB3';
const BORDER = 'var(--border-strong)';

type Category = 'vše' | 'ráno' | 'večer' | 'stres' | 'souznění' | 'reflexe';

const categories: { id: Category; label: string }[] = [
  { id: 'vše', label: 'Vše' },
  { id: 'ráno', label: 'Ráno' },
  { id: 'večer', label: 'Večer' },
  { id: 'stres', label: 'Stres' },
  { id: 'souznění', label: 'Souznění' },
  { id: 'reflexe', label: 'Reflexe' },
];

interface Ritual {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  content_type: string;
  order_index: number | null;
}

export const MindLife = () => {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category>('vše');

  useEffect(() => { loadRituals(); }, []);

  const loadRituals = async () => {
    const { data } = await supabase.from('rituals').select('*').order('order_index');
    if (data) setRituals(data as Ritual[]);
    setLoading(false);
  };

  const filtered =
    selectedCategory === 'vše'
      ? rituals
      : rituals.filter(r => r.content_type === `mindlife:${selectedCategory}`);

  const heading =
    selectedCategory === 'vše' ? 'Vše' : categories.find(c => c.id === selectedCategory)?.label;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <Sparkles className="w-6 h-6 flex-shrink-0" style={{ color: TEAL }} strokeWidth={1.5} />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Mind &amp; Life
          </h1>
        </div>

        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Rituály a reflexe pro každý den. Malé momenty, které tvoří velké změny.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Vyber si rituál, který tě v danou chvíli osloví. Neexistuje špatná volba.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Kategorie
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
              {filtered.map((ritual, idx) => (
                <li
                  key={ritual.id}
                  className="py-5 flex items-baseline gap-4 transition-all active:scale-[0.99] hover:opacity-80"
                >
                  <span
                    className="text-sm font-semibold flex-shrink-0 tabular-nums"
                    style={{ color: TEAL }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>
                    {ritual.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pro tuto kategorii zatím nemáme rituály</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
