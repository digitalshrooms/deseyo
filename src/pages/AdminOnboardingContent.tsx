import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNavigation } from '../components/AdminNavigation';
import { supabase, OnboardingContent } from '../lib/supabase';
import { Save, Pencil, X, Eye, EyeOff } from 'lucide-react';

export const AdminOnboardingContent = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OnboardingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OnboardingContent | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('onboarding_content')
      .select('*')
      .order('day_index', { ascending: true });
    setRows((data as OnboardingContent[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    await supabase
      .from('onboarding_content')
      .update({
        title: editing.title,
        subtitle: editing.subtitle,
        body_text: editing.body_text,
        video_url: editing.video_url,
        audio_url: editing.audio_url,
        thumbnail_url: editing.thumbnail_url,
        duration: editing.duration,
        tags: editing.tags,
        is_active: editing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id);
    setEditing(null);
    await load();
  };

  const toggleActive = async (r: OnboardingContent) => {
    await supabase
      .from('onboarding_content')
      .update({ is_active: !r.is_active })
      .eq('id', r.id);
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding obsah (System B)</h1>
          <p className="text-sm text-gray-600 mt-1">
            30 dni obsahu — zobrazuje se klientce D1–D30 sekvencne. Klient prichazi k dalsimu dni az kdyz otevre aplikaci.
          </p>
        </div>

        {editing && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Upravit Den {editing.day_index}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Titulek"
                  value={editing.title}
                  onChange={(v) => setEditing({ ...editing, title: v })}
                />
                <Field
                  label="Podtitul"
                  value={editing.subtitle}
                  onChange={(v) => setEditing({ ...editing, subtitle: v })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <textarea
                  rows={4}
                  value={editing.body_text}
                  onChange={(e) => setEditing({ ...editing, body_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Video URL"
                  value={editing.video_url}
                  onChange={(v) => setEditing({ ...editing, video_url: v })}
                />
                <Field
                  label="Audio URL"
                  value={editing.audio_url}
                  onChange={(v) => setEditing({ ...editing, audio_url: v })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Thumbnail URL"
                  value={editing.thumbnail_url}
                  onChange={(v) => setEditing({ ...editing, thumbnail_url: v })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trvani (min)</label>
                  <input
                    type="number"
                    value={editing.duration}
                    onChange={(e) => setEditing({ ...editing, duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm text-gray-700">Aktivni</span>
              </label>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Save className="w-4 h-4" />
                Ulozit
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Nacitani...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Den</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulek</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Podtitul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obsah</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id} className={r.is_active ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">D{r.day_index}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.subtitle || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.video_url && 'video '}
                      {r.audio_url && 'audio '}
                      {r.body_text ? 'text' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(r)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        {r.is_active ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Aktivni
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Skryty
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(r)}
                        className="text-teal-600 hover:text-teal-800"
                        aria-label="Upravit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
      />
    </div>
  );
}
