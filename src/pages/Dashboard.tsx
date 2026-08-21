import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Course, User } from '../lib/supabase';
import { Clock, Lock, X, ChevronRight, Search } from 'lucide-react';
import { LessonModal } from '../components/LessonModal';

const BG = 'var(--bg)';
const CARD = '#1c1e22';
const CARD2 = '#242629';
const TEAL = '#198379';

const categories = [
  'Úvodní cesta',
  'Jóga a tělo',
  'Meditace a mindfulness',
  'Energie a čakry',
  'Osobní růst',
  'Spánek a sny',
  'Tajemství duše',
];

export const Dashboard = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  useEffect(() => { setUser(authUser); }, [authUser]);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    loadCourses();
    loadCompletionPercentage();
  }, [selectedCategory, user]);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from('courses').select('*').eq('category', selectedCategory).order('order_index');
    if (data) setCourses(data as Course[]);
    setLoading(false);
  };

  const loadCompletionPercentage = async () => {
    if (!user) return;
    const { data: coursesInCategory } = await supabase.from('courses').select('id').eq('category', selectedCategory);
    if (!coursesInCategory || coursesInCategory.length === 0) { setCompletionPercentage(0); return; }
    const lessonIds = coursesInCategory.map(c => c.id);
    const { data: completions } = await supabase.from('lesson_completions').select('lesson_id, is_completed').eq('user_id', user.id).in('lesson_id', lessonIds).eq('is_completed', true);
    setCompletionPercentage(Math.round(((completions?.length || 0) / coursesInCategory.length) * 100));
  };

  const getCategoryAccessLimit = () => {
    switch (user?.subscription_plan) {
      case 'Basic': return 2;
      case 'Premium': return 4;
      case 'Legend': return categories.length;
      default: return 2;
    }
  };

  const canAccessCategory = (categoryIndex: number) => categoryIndex < getCategoryAccessLimit();

  const handleCategoryClick = (category: string, index: number) => {
    if (canAccessCategory(index)) { setSelectedCategory(category); setIsSidebarOpen(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Mobile category sheet */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto"
            style={{ backgroundColor: '#1c1e22' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Kategorie</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: CARD2 }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-1.5">
              {categories.map((category, index) => {
                const hasAccess = canAccessCategory(index);
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category, index)}
                    disabled={!hasAccess}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-sm font-medium text-left"
                    style={{
                      backgroundColor: isSelected && hasAccess ? 'rgba(25,131,121,0.12)' : 'transparent',
                      color: isSelected && hasAccess ? TEAL : hasAccess ? '#d1d5db' : '#4b5563',
                    }}
                  >
                    <span>{category}</span>
                    {!hasAccess ? <Lock className="w-4 h-4 flex-shrink-0" /> : isSelected ? <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: TEAL }} /> : null}
                  </button>
                );
              })}
            </div>
            {user?.subscription_plan !== 'Legend' && (
              <div className="mt-5 p-4 rounded-2xl" style={{ backgroundColor: CARD2 }}>
                <p className="text-xs text-gray-400">Plán: <span className="text-white font-semibold">{user?.subscription_plan}</span></p>
                <p className="text-xs text-gray-500 mt-1">Upgradujte pro přístup ke všem kategoriím</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 min-h-screen flex-shrink-0 border-r sticky top-0 h-screen overflow-y-auto" style={{ backgroundColor: CARD, borderColor: '#1a1c20' }}>
          <div className="p-5 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Kategorie</p>
            <nav className="space-y-0.5">
              {categories.map((category, index) => {
                const hasAccess = canAccessCategory(index);
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category, index)}
                    disabled={!hasAccess}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm text-left"
                    style={{
                      backgroundColor: isSelected && hasAccess ? 'rgba(25,131,121,0.12)' : 'transparent',
                      color: isSelected && hasAccess ? TEAL : hasAccess ? '#d1d5db' : '#4b5563',
                    }}
                  >
                    <span className="font-medium truncate">{category}</span>
                    {!hasAccess && <Lock className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: CARD2 }}>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Váš plán</p>
              <p className="text-base font-bold text-white">{user?.subscription_plan}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-5 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: CARD, color: '#d1d5db' }}
            >
              <Search className="w-4 h-4" />
              Kategorie
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-white truncate">{selectedCategory}</span>
          </div>

          {/* Desktop title */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-bold text-white">{selectedCategory}</h1>
            <p className="text-sm text-gray-500 mt-1">Lekce v této kategorii</p>
          </div>

          {/* Progress */}
          <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: CARD }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Pokrok v kategorii</span>
              <span className="text-xs font-bold" style={{ color: TEAL }}>{completionPercentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: CARD2 }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%`, backgroundColor: TEAL, minWidth: completionPercentage > 0 ? '6px' : '0' }} />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: CARD }}>
                  <div className="aspect-video" style={{ backgroundColor: CARD2 }} />
                  <div className="p-4 space-y-2">
                    <div className="h-5 rounded-lg w-3/4" style={{ backgroundColor: CARD2 }} />
                    <div className="h-4 rounded-lg w-1/2" style={{ backgroundColor: CARD2 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="rounded-2xl overflow-hidden transition-all active:scale-[0.98] hover:opacity-90 text-left group"
                  style={{ backgroundColor: CARD }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs">
                      <Clock className="w-3.5 h-3.5 opacity-80" />
                      <span className="opacity-90 font-medium">{course.duration} min</span>
                    </div>
                    {course.is_premium && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(25,131,121,0.9)', color: 'white' }}>
                        Premium
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{course.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">V této kategorii zatím nejsou žádné kurzy</p>
            </div>
          )}
        </main>
      </div>

      {selectedCourse && (
        <LessonModal course={selectedCourse} onClose={() => setSelectedCourse(null)} onLessonComplete={loadCompletionPercentage} />
      )}
    </div>
  );
};
