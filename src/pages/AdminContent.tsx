import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Pencil, Trash2, X, Check, Heart, Search, Image as ImageIcon, Film, Clock, Tag, Eye, EyeOff } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type?: string;
  is_premium: boolean;
  duration: number;
  category_tags?: string[];
  video_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  plan_relevance?: string[];
  order_index?: number;
  favorite_count?: number;
  stable_id?: string;
}

interface CategoryTag {
  id: string;
  category: string;
  tag_value: string;
  display_order: number;
}

const CONTENT_TYPES = [
  { value: 'physioyoga', label: 'Fyzio jóga', tagCategory: 'fyzio' },
  { value: 'faceyoga', label: 'Face jóga', tagCategory: 'faceyoga' },
  { value: 'yoga', label: 'Joga', tagCategory: null },
  { value: 'mindlife', label: 'Mind & Life', tagCategory: null },
];

const CATEGORIES = ['Části těla', 'Fyzio jóga', 'Face jóga', 'Moje cesta', 'Mind & Life'];

const PLAN_OPTIONS = ['Restart', 'L1', 'L2'];

const emptyForm = {
  title: '',
  description: '',
  category: 'Fyzio jóga',
  content_type: 'physioyoga',
  is_premium: false,
  duration: 0,
  category_tags: [] as string[],
  video_url: '',
  thumbnail_url: '',
  tags: [] as string[],
  plan_relevance: ['L1', 'L2', 'Restart'] as string[],
  order_index: 0,
  stable_id: '',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export function AdminContent() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryTags, setCategoryTags] = useState<CategoryTag[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [navigate]);

  const checkAdminAccess = async () => {
    const adminToken = localStorage.getItem('adminToken');
    const adminEmail = localStorage.getItem('adminEmail');

    if (!adminToken || !adminEmail) {
      navigate('/admin/login');
      return;
    }

    loadCourses();
    loadCategoryTags();
  };

  const loadCategoryTags = async () => {
    try {
      const { data } = await supabase
        .from('category_tags')
        .select('*')
        .order('display_order', { ascending: true });
      setCategoryTags(data || []);
    } catch (error) {
      console.error('Error loading category tags:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-courses`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        setCourses([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      const courses = Array.isArray(data) ? data : [];

      const coursesWithFavoriteCounts = await Promise.all(
        courses.map(async (course: Course) => {
          const { count } = await supabase
            .from('video_favorites')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          return {
            ...course,
            favorite_count: count || 0
          };
        })
      );

      setCourses(coursesWithFavoriteCounts);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const tagsForContentType = useMemo(() => {
    const ct = CONTENT_TYPES.find(t => t.value === formData.content_type);
    if (!ct?.tagCategory) return [];
    return categoryTags.filter(t => t.category === ct.tagCategory);
  }, [formData.content_type, categoryTags]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || c.content_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [courses, searchQuery, filterType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Název videa je povinný');
      return;
    }
    if (!formData.description.trim()) {
      alert('Popisek videa je povinný');
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Session vypršela – přihlaste se znovu');
        setSaving(false);
        return;
      }

      const dataToSave = {
        ...formData,
        stable_id: slugify(formData.stable_id) || slugify(formData.title),
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-courses?id=${editingId}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-courses`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const error = await response.json();
        alert('Chyba při ukládání: ' + error.error);
        setSaving(false);
        return;
      }

      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Chyba při ukládání videa');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'Fyzio jóga',
      content_type: course.content_type || 'physioyoga',
      is_premium: course.is_premium || false,
      duration: course.duration || 0,
      category_tags: course.category_tags || [],
      video_url: course.video_url || '',
      thumbnail_url: course.thumbnail_url || '',
      tags: course.tags || [],
      plan_relevance: course.plan_relevance || ['L1', 'L2', 'Restart'],
      order_index: course.order_index || 0,
      stable_id: course.stable_id || '',
    });
    setEditingId(course.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat toto video? Tato akce je nevratná.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Session vypršela');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-courses?id=${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert('Chyba při mazání: ' + error.error);
        return;
      }

      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Chyba při mazání videa');
    }
  };

  const toggleTag = (tagValue: string) => {
    const isSelected = formData.tags?.includes(tagValue);
    setFormData({
      ...formData,
      tags: isSelected
        ? formData.tags?.filter(t => t !== tagValue) || []
        : [...(formData.tags || []), tagValue]
    });
  };

  const togglePlan = (plan: string) => {
    const isSelected = formData.plan_relevance?.includes(plan);
    setFormData({
      ...formData,
      plan_relevance: isSelected
        ? formData.plan_relevance?.filter(p => p !== plan) || []
        : [...(formData.plan_relevance || []), plan]
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Kurzy & Lekce" subtitle="Správa obsahu platformy">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kurzy & Lekce" subtitle={`${courses.length} videí celkem`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Hledat video..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
        >
          <option value="all">Všechny typy</option>
          <option value="physioyoga">Fyzio jóga</option>
          <option value="faceyoga">Face jóga</option>
          <option value="yoga">Joga</option>
          <option value="mindlife">Mind & Life</option>
        </select>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition font-medium text-sm whitespace-nowrap"
          style={{ backgroundColor: '#198379' }}
        >
          <Plus className="w-4 h-4" />
          Přidat video
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const ct = CONTENT_TYPES.find(t => t.value === course.content_type);
          return (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              {/* Thumbnail */}
              <div className="w-full h-40 bg-gray-100 relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600">
                    <Film className="w-10 h-10 text-white/60" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5">
                  {course.is_premium && (
                    <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full font-semibold">Premium</span>
                  )}
                  <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {ct?.label || course.content_type}
                  </span>
                </div>
                {course.duration > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration} min
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                        {tag.replace('body_part:', '').replace('face_area:', '').replace(/_/g, ' ')}
                      </span>
                    ))}
                    {course.tags.length > 4 && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        +{course.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                    {course.favorite_count || 0}
                  </span>
                  {course.plan_relevance && course.plan_relevance.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {course.plan_relevance.join(', ')}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />Upravit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />Smazat
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-20">
          <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {searchQuery || filterType !== 'all' ? 'Žádná videa neodpovídají filtru' : 'Zatím nebyla přidána žádná videa'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Upravit video' : 'Přidat nové video'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Název videa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="např. Uvolnění šíje a ramen"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Popisek <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Krátký popis videa pro uživatele..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition resize-none"
                />
              </div>

              {/* Content Type + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sekce (zobrazí se v)
                  </label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => {
                      const ct = e.target.value;
                      const ctInfo = CONTENT_TYPES.find(t => t.value === ct);
                      setFormData({
                        ...formData,
                        content_type: ct,
                        category: ctInfo?.label || formData.category,
                        tags: [],
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white transition"
                  >
                    {CONTENT_TYPES.map(ct => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Kategorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white transition"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags based on content type */}
              {tagsForContentType.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2.5">
                    Tagy ({tagsForContentType[0]?.category === 'fyzio' ? 'části těla' : 'oblasti obličeje'})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tagsForContentType.map((tag) => {
                      const isSelected = formData.tags?.includes(tag.tag_value);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.tag_value)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 transition text-sm font-medium ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="capitalize">{tag.tag_value}</span>
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration + Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Délka (minut)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pořadí (order_index)
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4" /> Mux Video URL
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://player.mux.com/..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Vlož URL z Mux playeru (https://player.mux.com/PLAYBACK_ID)</p>
              </div>

              {/* Page URL (slug) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL adresa lekce
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-400 whitespace-nowrap">/lekce/</span>
                  <input
                    type="text"
                    value={formData.stable_id}
                    onChange={(e) => setFormData({ ...formData, stable_id: e.target.value })}
                    placeholder={formData.title ? slugify(formData.title) : 'videli-jste-tohle'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Na téhle adrese bude lekce dostupná. Necháš-li prázdné, vygeneruje se z názvu.
                </p>
              </div>

              {/* Thumbnail URL with preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Thumbnail URL
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 transition"
                />
                {formData.thumbnail_url && (
                  <div className="mt-2 relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={formData.thumbnail_url}
                      alt="Náhled thumbnailu"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">Obrázek nelze načíst – zkontrolujte URL</div>';
                        }
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">URL obrázku, který se zobrazí jako náhled videa</p>
              </div>

              {/* Plan Relevance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  Relevantní plány
                </label>
                <div className="flex gap-2">
                  {PLAN_OPTIONS.map(plan => {
                    const isSelected = formData.plan_relevance?.includes(plan);
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => togglePlan(plan)}
                        className={`px-4 py-2 rounded-xl border-2 transition text-sm font-medium ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Premium toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="premium"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="w-4 h-4 accent-teal-600"
                />
                <label htmlFor="premium" className="text-sm text-gray-700 flex items-center gap-1.5">
                  {formData.is_premium ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Premium obsah (pouze pro platící uživatele)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium text-sm"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: '#198379' }}
                >
                  {saving ? 'Ukládání...' : (editingId ? 'Uložit změny' : 'Přidat video')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
