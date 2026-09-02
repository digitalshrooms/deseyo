import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Course } from '../lib/supabase';

const TEAL = '#049FB3';
const BORDER = 'var(--border-strong)';

type ContentType = 'vše' | 'faceyoga' | 'physioyoga';

const contentTypes: { id: ContentType; label: string }[] = [
  { id: 'vše', label: 'Vše' },
  { id: 'faceyoga', label: 'Face jóga' },
  { id: 'physioyoga', label: 'Fyzio jóga' },
];

type Tab = 'videa' | 'techniky';

interface Technique {
  id: string;
  title: string;
  description: string | null;
  pdf_url: string;
}

export function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType>('vše');
  const [tab, setTab] = useState<Tab>('videa');
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [techniquesLoading, setTechniquesLoading] = useState(true);

  useEffect(() => { loadFavorites(); loadTechniques(); }, [user]);

  const loadFavorites = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('video_favorites')
      .select('course_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const courseIds = data.map(fav => fav.course_id);
      const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
      setFavorites((courses as Course[]) || []);
    } else {
      setFavorites([]);
    }
    setLoading(false);
  };

  const loadTechniques = async () => {
    if (!user) { setTechniquesLoading(false); return; }
    setTechniquesLoading(true);
    const { data } = await supabase
      .from('user_saved_techniques')
      .select('technique_id, techniques(id, title, description, pdf_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const rows = (data || [])
      .map((row: any) => row.techniques as Technique | null)
      .filter((t: Technique | null): t is Technique => !!t);
    setTechniques(rows);
    setTechniquesLoading(false);
  };

  const handleRemoveTechnique = async (techniqueId: string) => {
    if (!user) return;
    setTechniques(prev => prev.filter(t => t.id !== techniqueId));
    await supabase.from('user_saved_techniques').delete().eq('user_id', user.id).eq('technique_id', techniqueId);
  };

  const filtered =
    selectedType === 'vše'
      ? favorites
      : favorites.filter(c => c.content_type === selectedType);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <Heart className="w-6 h-6 flex-shrink-0" style={{ color: TEAL }} strokeWidth={1.5} />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Moje oblíbené
          </h1>
        </div>

        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Lekce, které sis uložil(a). Vrať se k nim kdykoli — vše na jednom místě.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Klikni na srdíčko u lekce a přidáš ji sem.
          </p>
        </div>

        <div className="flex gap-2.5 mb-8">
          {(['videa', 'techniky'] as Tab[]).map((t) => {
            const isSelected = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: isSelected ? TEAL : 'transparent',
                  color: isSelected ? '#FFFFFF' : TEAL,
                  border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                }}
              >
                {t === 'videa' ? 'Videa' : 'Techniky'}
              </button>
            );
          })}
        </div>

        {tab === 'videa' ? (
          <>
            <div className="mb-8">
              <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Filtrovat
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {contentTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
                      style={{
                        backgroundColor: isSelected ? TEAL : 'transparent',
                        color: isSelected ? '#FFFFFF' : TEAL,
                        border: `1.5px solid ${isSelected ? TEAL : BORDER}`,
                      }}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                {selectedType === 'vše' ? 'Vše' : contentTypes.find(t => t.id === selectedType)?.label}
              </h2>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="w-full aspect-video rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-2/3 rounded mt-2" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filtered.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => navigate(course.stable_id ? `/lekce/${course.stable_id}` : '/test-fyziojoga')}
                      className="cursor-pointer transition-all active:scale-[0.98] hover:opacity-90"
                    >
                      <div
                        className="w-full aspect-video rounded-xl overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-elevated)' }}
                      >
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug mt-2 line-clamp-2 min-h-[2.5em]" style={{ color: 'var(--text)' }}>
                        {course.title}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Zatím nemáš žádné uložené lekce</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div>
            <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              Techniky
            </h2>

            {techniquesLoading ? (
              <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {[1, 2].map(i => (
                  <li key={i} className="py-5 animate-pulse">
                    <div className="h-4 w-2/3 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  </li>
                ))}
              </ul>
            ) : techniques.length > 0 ? (
              <ul className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {techniques.map((t) => (
                  <li key={t.id} className="py-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)' }}>{t.title}</p>
                      {t.description && (
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <a
                        href={t.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ color: TEAL, border: `1.5px solid ${TEAL}` }}
                      >
                        Náhled
                      </a>
                      <a
                        href={t.pdf_url}
                        download
                        className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ color: '#FFFFFF', backgroundColor: TEAL }}
                      >
                        Stáhnout
                      </a>
                      <button
                        onClick={() => handleRemoveTechnique(t.id)}
                        className="text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Odebrat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Zatím nemáš uložené žádné techniky</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
