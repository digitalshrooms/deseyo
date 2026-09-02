import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Course } from '../lib/supabase';
import { Heart, Info, Play } from 'lucide-react';

const TEAL = '#049FB3';
const CARD = 'var(--bg-card)';
const ELEVATED = 'var(--bg-elevated)';

type BodyPart = 'všechny' | 'záda' | 'ramena' | 'kolena' | 'kyčle' | 'krk' | 'nohy';

const bodyParts: { id: BodyPart; label: string }[] = [
  { id: 'všechny', label: 'Vše' },
  { id: 'záda', label: 'Záda' },
  { id: 'ramena', label: 'Ramena' },
  { id: 'kyčle', label: 'Kyčle' },
  { id: 'kolena', label: 'Kolena' },
  { id: 'krk', label: 'Krk' },
  { id: 'nohy', label: 'Nohy' },
];

export const FyzioYoga = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>('všechny');

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { filterCourses(); }, [courses, selectedBodyPart]);

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').eq('content_type', 'physioyoga').order('order_index');
    if (data) setCourses(data as Course[]);
    setLoading(false);
  };

  const filterCourses = () => {
    setFilteredCourses(
      selectedBodyPart === 'všechny'
        ? courses
        : courses.filter(c => c.tags?.some(t => t === `body_part:${selectedBodyPart}`))
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        {/* ── GREETING ROW (same as MojeCesta) ── */}
        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <Heart
            className="w-6 h-6 flex-shrink-0"
            style={{ color: TEAL }}
            strokeWidth={1.5}
          />
          <h1
            className="font-normal leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Fyzio jóga
          </h1>
        </div>

        {/* Description */}
        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Fyzio přístup k pohybu. Cílené lekce pro konkrétní oblast nebo šetrný pohyb.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Při akutních obtížích se poraď s lékařem. Obsah slouží pro prevenci a péči o zdravé tělo.
          </p>
        </div>

        {/* Knihovna videí — pill tags */}
        <div className="mb-8">
          <h2 className="text-center text-xs font-normal uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Knihovna videí
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {bodyParts.map((part) => {
              const isSelected = selectedBodyPart === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => setSelectedBodyPart(part.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-normal transition-colors duration-200 active:scale-[0.97] ${isSelected ? '' : 'btn-outline-primary'}`}
                  style={isSelected ? { backgroundColor: TEAL, color: '#FFFFFF', border: `1.5px solid ${TEAL}` } : undefined}
                >
                  {part.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vše — video cards grid */}
        <div>
          <h2 className="text-center text-xs font-normal uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            {selectedBodyPart === 'všechny' ? 'Vše' : bodyParts.find(p => p.id === selectedBodyPart)?.label}
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="aspect-video rounded-xl animate-pulse" style={{ backgroundColor: ELEVATED, opacity: 0.5 }} />
                  <div className="h-4 w-3/4 rounded mt-2 animate-pulse" style={{ backgroundColor: ELEVATED }} />
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(course.stable_id ? `/lekce/${course.stable_id}` : '/test-fyziojoga')}
                  className="group text-left transition-all active:scale-[0.98]"
                >
                  <div
                    className="relative aspect-video rounded-xl flex items-center justify-center overflow-hidden transition-shadow duration-200 shadow-[0_0_0_1px_var(--border)] group-hover:shadow-[0_0_0_2px_var(--primary)]"
                    style={{ backgroundColor: CARD }}
                  >
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                        style={{ border: `2px solid ${TEAL}` }}
                      >
                        <Play className="w-6 h-6 ml-0.5" style={{ color: TEAL }} fill={TEAL} />
                      </div>
                    )}
                  </div>
                  <p
                    className="mt-2 text-sm font-normal line-clamp-2 min-h-[2.5em]"
                    style={{ color: 'var(--text)' }}
                  >
                    {course.order_index ? `${course.order_index}. ` : ''}{course.title}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pro tuto část těla zatím nemáme lekce</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
