import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Tag, Copy, Check } from 'lucide-react';

type DiscountType = 'percentage' | 'fixed_amount';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
}

type Form = {
  id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_uses: string;
  active: boolean;
};

const emptyForm: Form = {
  code: '',
  discount_type: 'percentage',
  discount_value: 10,
  valid_from: '',
  valid_until: '',
  max_uses: '',
  active: true,
};

const API = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-discount-codes`;

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const AdminDiscountCodes = () => {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    setError('');
    try {
      const res = await fetch(API, { headers: authHeaders() });
      if (!res.ok) throw new Error('Nepodařilo se načíst kódy.');
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.code.trim()) {
      setError('Kód nesmí být prázdný.');
      return;
    }
    if (form.discount_value <= 0) {
      setError('Hodnota slevy mus být větší než 0.');
      return;
    }
    if (form.discount_type === 'percentage' && form.discount_value > 100) {
      setError('Procentuální sleva nesmí přesáhnout 100.');
      return;
    }

    const payload: any = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Math.round(form.discount_value),
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      active: form.active,
    };

    setError('');
    try {
      const url = form.id ? `${API}?id=${form.id}` : API;
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Nepodařilo se uložit kód.');
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tento slevový kód?')) return;
    try {
      const res = await fetch(`${API}?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Nepodařilo se smazat.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání.');
    }
  };

  const toggleActive = async (c: DiscountCode) => {
    try {
      const res = await fetch(`${API}?id=${c.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ active: !c.active }),
      });
      if (!res.ok) throw new Error('Nepodařilo se přepnout stav.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba.');
    }
  };

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('cs-CZ');
  };

  const formatDiscount = (c: DiscountCode) =>
    c.discount_type === 'percentage' ? `-${c.discount_value}%` : `-${c.discount_value} Kč`;

  const isExpired = (c: DiscountCode) =>
    c.valid_until ? new Date(c.valid_until) < new Date() : false;

  const isExhausted = (c: DiscountCode) =>
    c.max_uses !== null && c.used_count >= c.max_uses;

  const editFromCode = (c: DiscountCode) => {
    setForm({
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      valid_from: c.valid_from || '',
      valid_until: c.valid_until || '',
      max_uses: c.max_uses !== null ? String(c.max_uses) : '',
      active: c.active,
    });
  };

  return (
    <AdminLayout title="Slevové kódy" subtitle={`${codes.filter(c => c.active).length} aktivních kódů`}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Tag className="w-4 h-4" />
            <span>Správa slevových kódů pro objednávkové flow</span>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setError(''); }}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#198379' }}
          >
            <Plus className="w-4 h-4" />
            Přidat kód
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {form && (
          <div className="bg-white rounded-xl p-6 mb-6 border-2" style={{ borderColor: '#198379' + '40' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {form.id ? 'Upravit kód' : 'Nový kód'}
              </h2>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kód</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase tracking-wider font-mono"
                  placeholder="LETO20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ slevy</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value as DiscountType, discount_value: e.target.value === 'percentage' ? 10 : 500 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="percentage">Procenta (%)</option>
                  <option value="fixed_amount">Fixní částka (Kč)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.discount_type === 'percentage' ? 'Sleva (%)' : 'Sleva (Kč)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.discount_type === 'percentage'
                    ? 'Např. 20 = 20% sleva z ceny plánu.'
                    : 'Např. 500 = 500 Kč sleva. Částka v haléřích se zaokrouhlí.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max. použití <span className="text-gray-400 font-normal">(prázdné = neomezeně)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="neomezeno"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platnost od <span className="text-gray-400 font-normal">(volitelné)</span>
                </label>
                <input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platnost do <span className="text-gray-400 font-normal">(volitelné)</span>
                </label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-sm text-gray-700">Aktivní (lze uplatnit v objednávce)</span>
            </label>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#198379' }}
              >
                <Save className="w-4 h-4" />
                Uložit
              </button>
              <button
                onClick={() => setForm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Načítání...</div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Zatím žádné kódy. Přidej první.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kód</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sleva</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platnost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Využití</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {codes.map((c) => {
                    const expired = isExpired(c);
                    const exhausted = isExhausted(c);
                    return (
                      <tr key={c.id} className={!c.active ? 'opacity-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-gray-900 text-sm">{c.code}</span>
                            <button
                              onClick={() => copyCode(c.code, c.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label="Kopírovat"
                            >
                              {copiedId === c.id ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {formatDiscount(c)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(c.valid_from)} — {formatDate(c.valid_until)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                          {exhausted && <span className="ml-2 text-xs text-red-500">vyčerpán</span>}
                          {expired && <span className="ml-2 text-xs text-red-500">expirován</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(c)}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                          >
                            {c.active ? (
                              <><Eye className="w-3.5 h-3.5" /> Aktivní</>
                            ) : (
                              <><EyeOff className="w-3.5 h-3.5" /> Skrytý</>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => editFromCode(c)}
                              className="text-teal-600 hover:text-teal-800"
                              aria-label="Upravit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-red-600 hover:text-red-800"
                              aria-label="Smazat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
