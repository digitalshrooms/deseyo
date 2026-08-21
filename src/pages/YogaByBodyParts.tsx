import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Course } from '../lib/supabase';
import { Clock, Play, Activity } from 'lucide-react';
import { LessonModal } from '../components/LessonModal';

type BodyPart = 'bedra' | 'krk_ramena' | 'kycle' | 'core' | 'nohy' | 'cele_telo';

interface BodyPartOption {
  id: BodyPart;
  label: string;
  description: string;
}

const bodyParts: BodyPartOption[] = [
  { id: 'bedra', label: 'Bedra & dolni zada', description: 'Procviceni a protazeni bederni patere' },
  { id: 'krk_ramena', label: 'Krcni pater & ramena', description: 'Uvolneni napeti v siji a ramenou' },
  { id: 'kycle', label: 'Kycle & panev', description: 'Mobilita a sila kycelnich kloubu' },
  { id: 'core', label: 'Stred tela (Core)', description: 'Posileni hlubokeho stabilizacniho systemu' },
  { id: 'nohy', label: 'Dolni koncetiny', description: 'Nohy, kotniky a stabilita' },
  { id: 'cele_telo', label: 'Cele telo', description: 'Komplexni prace s celym telem' },
];

export const YogaByBodyParts = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState<BodyPart>('bedra');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('content_type', 'yoga')
      .order('order_index');

    if (data) {
      setCourses(data as Course[]);
    }
    setLoading(false);
  };

  const getUserLevel = () => {
    if (!user) return 'L1';
    return user.current_plan || 'L1';
  };

  const getCoursesByBodyPart = (part: BodyPart) => {
    return courses.filter((course) =>
      course.tags?.includes(`body_part:${part}`) &&
      (course.plan_relevance?.includes(getUserLevel()) ||
       course.plan_relevance?.includes('Restart') ||
       course.tags?.includes('all_levels'))
    );
  };

  const renderCourseCard = (course: Course) => (
    <div
      key={course.id}
      onClick={() => setSelectedCourse(course)}
      className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all cursor-pointer group"
      style={{ backgroundColor: '#2c2e33' }}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-full object-cover group-hover:brightness-110 transition-all"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-16 h-16 text-white" />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2">
          {course.title}
        </h3>
        <p className="text-gray-300 mb-4 line-clamp-2 text-sm">
          {course.description}
        </p>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-5 h-5" style={{ color: '#A2B6B9' }} />
          <span>{course.duration} min</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#191b1f' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-8 h-8" style={{ color: '#A2B6B9' }} />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Joga podle casti tela
            </h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg mb-2 max-w-3xl">
            Potrebujes si projit jednu oblast vic do hloubky? Vyber si cast tela, ktera si dnes rika o pozornost.
          </p>
          <p className="text-sm text-gray-400 max-w-3xl">
            Lekce z Joga podle casti tela jsou plnohodnotne jogove lekce. Kdyz si jednu z nich das misto standardni lekce v planu, pocita se ti do tydenniho cile.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {bodyParts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedPart(part.id)}
              className={`w-full p-4 rounded-lg transition-all text-left ${
                selectedPart === part.id ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: selectedPart === part.id ? '#A2B6B9' : '#2c2e33',
                color: selectedPart === part.id ? '#191b1f' : '#fff',
                ringColor: '#A2B6B9',
              }}
            >
              <div className="font-semibold text-lg mb-1">{part.label}</div>
              <div className={`text-sm ${selectedPart === part.id ? 'opacity-80' : 'text-gray-400'}`}>
                {part.description}
              </div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden animate-pulse"
                style={{ backgroundColor: '#2c2e33' }}
              >
                <div className="aspect-video" style={{ backgroundColor: '#191b1f' }} />
                <div className="p-5">
                  <div className="h-6 rounded mb-2" style={{ backgroundColor: '#191b1f' }} />
                  <div className="h-4 rounded w-2/3" style={{ backgroundColor: '#191b1f' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCoursesByBodyPart(selectedPart).length > 0 ? (
              getCoursesByBodyPart(selectedPart).map(renderCourseCard)
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">Brzy pridame lekce pro tuto oblast</p>
              </div>
            )}
          </div>
        )}
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
