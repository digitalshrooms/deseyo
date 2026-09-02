import { useState, useEffect } from 'react';
import { supabase, Course } from '../lib/supabase';
import { Heart, Info, Play } from 'lucide-react';
import { LessonModal } from '../components/LessonModal';

const TEAL = '#049FB3';
const CARD = 'var(--bg-card)';
const ELEVATED = 'var(--bg-elevated)';

type FaceArea = 'všechny' | 'čelo' | 'oči' | 'tváře' | 'dolní_část' | 'krk';

const faceAreas: { id: FaceArea; label: string }[] = [
  { id: 'všechny', label: 'Vše' },
  { id: 'čelo', label: 'Čelo' },
  { id: 'oči', label: 'Oči' },
  { id: 'tváře', label: 'Tváře' },
  { id: 'dolní_část', label: 'Dolní část' },
  { id: 'krk', label: 'Krk' },
];

export const Faceyoga = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedArea, setSelectedArea] = useState<FaceArea>('všechny');

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { filterCourses(); }, [courses, selectedArea]);

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('*').eq('content_type', 'faceyoga').order('order_index');
    if (data) setCourses(data as Course[]);
    setLoading(false);
  };

  const filterCourses = () => {
    setFilteredCourses(
      selectedArea === 'všechny'
        ? courses
        : courses.filter(c => c.tags?.some(t => t === `face_area:${selectedArea}`))
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'transparent' }}>
      <div className="mx-auto px-4 pt-6 md:pt-10 pb-12" style={{ maxWidth: 820 }}>

        {/* ── GREETING ROW (same as MojeCesta / FyzioJoga) ── */}
        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <Heart
            className="w-6 h-6 flex-shrink-0"
            style={{ color: TEAL }}
            strokeWidth={1.5}
          />
          <h1
            className="font-bold leading-none"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: TEAL }}
          >
            Face jóga
          </h1>
        </div>

        {/* Description */}
        <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>
          Cílené cviky pro uvolnění a posílení obličejových svalů. Jemná péče o tvář každý den.
        </p>
        <div className="flex items-start gap-2 mb-8">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Cviky prováděj vždy s uvolněnou čelistí. Jemnost je klíčem – nepřepínej svaly.
          </p>
        </div>

        {/* Knihovna videí — pill tags */}
        <div className="mb-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Knihovna videí
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {faceAreas.map((area) => {
              const isSelected = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: isSelected ? TEAL : 'transparent',
                    color: isSelected ? '#FFFFFF' : TEAL,
                    border: `1.5px solid ${isSelected ? TEAL : 'var(--border-strong)'}`,
                  }}
                >
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vše — video cards grid */}
        <div>
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            {selectedArea === 'všechny' ? 'Vše' : faceAreas.find(a => a.id === selectedArea)?.label}
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
                  onClick={() => setSelectedCourse(course)}
                  className="text-left transition-all active:scale-[0.98] hover:opacity-90"
                >
                  <div
                    className="relative aspect-video rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: CARD }}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ border: `2px solid ${TEAL}` }}
                    >
                      <Play className="w-6 h-6 ml-0.5" style={{ color: TEAL }} fill={TEAL} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {course.order_index ? `${course.order_index}. ` : ''}{course.title}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pro tuto oblast zatím nemáme lekce</p>
            </div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <LessonModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onLessonComplete={loadCourses}
        />
      )}
    </div>
  );
};
