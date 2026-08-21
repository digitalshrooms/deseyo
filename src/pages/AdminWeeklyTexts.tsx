import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { supabase, WeeklyText } from '../lib/supabase';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

type Form = {
  id?: string;
  text_content: string;
  author: string;
  category: string;
  order_index: number;
  is_active: boolean;
};

const emptyForm: Form = {
  text_content: '',
  author: '',
  category: 'philosophy',
  order_index: 0,
  is_active: true,
};

export const AdminWeeklyTexts = () => {
  const navigate = useNavigate();
  const [texts, setTexts] = useState<WeeklyText[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);

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
      .from('weekly_texts')
      .select('*')
      .order('order_index', { ascending: true });
    setTexts((data as WeeklyText[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.text_content.trim()) return;

    if (form.id) {
      await supabase
        .from('weekly_texts')
        .update({
          text_content: form.text_content,
          author: form.author,
          category: form.category,
          order_index: form.order_index,
          is_active: form.is_active,
        })
        .eq('id', form.id);
    } else {
      const nextIdx =
        texts.length > 0 ? Math.max(...texts.map((t) => t.order_index)) + 1 : 1;
      await supabase.from('weekly_texts').insert({
        text_content: form.text_content,
        author: form.author,
        category: form.category,
        order_index: form.order_index || nextIdx,
        is_active: form.is_active,
      });
    }
    setForm(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tento text?')) return;
    await supabase.from('weekly_texts').delete().eq('id', id);
    await load();
  };

  const toggleActive = async (t: WeeklyText) => {
    await supabase
      .from('weekly_texts')
      .update({ is_active: !t.is_active })
      .eq('id', t.id);
    await load();
  };

  return (
    <AdminLayout title="Týdenní texty" subtitle={`${texts.filter(t => t.is_active).length} aktivních textů`}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div />
          <button
            onClick={() => setForm(emptyForm)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Pridat text
          </button>
        </div>

        {form && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {form.id ? 'Upravit text' : 'Novy text'}
              </h2>
              <button
                onClick={() => setForm(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <textarea
                  value={form.text_content}
                  onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autor (volitelne)</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                  >
                    <option value="philosophy">Filozofie</option>
                    <option value="affirmation">Afirmace</option>
                    <option value="tarot">Tarot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poradi</label>
                  <input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-sm text-gray-700">Aktivni (zobrazovat v rotaci)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Save className="w-4 h-4" />
                  Ulozit
                </button>
                <button
                  onClick={() => setForm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Zrusit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Nacitani...</div>
          ) : texts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Zatim zadne texty. Pridej prvni.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Text</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {texts.map((t) => (
                  <tr key={t.id} className={t.is_active ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.order_index}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md">{t.text_content}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.author || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.category}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(t)}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        {t.is_active ? (
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
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() =>
                            setForm({
                              id: t.id,
                              text_content: t.text_content,
                              author: t.author,
                              category: t.category,
                              order_index: t.order_index,
                              is_active: t.is_active,
                            })
                          }
                          className="text-teal-600 hover:text-teal-800"
                          aria-label="Upravit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
