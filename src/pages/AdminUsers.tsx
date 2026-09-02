import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, SectionCard, Badge } from '../components/AdminLayout';
import { Search, Trash2, Mail, AtSign, ChevronLeft, ChevronRight, X, CreditCard as Edit2, Filter, Download, MessageSquare, Clock } from 'lucide-react';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  subscription_plan: string;
  current_plan?: string;
  current_week?: number;
  current_day?: number;
  created_at: string;
}

interface OnboardingResponse {
  id: string;
  day_number: number;
  question_text: string;
  selected_option: string | null;
  skipped: boolean;
  responded_at: string;
}

const PAGE_SIZE = 15;
const TEAL = '#198379';

const planBadgeVariant = (plan: string): 'success' | 'info' | 'default' => {
  if (plan === 'Legend') return 'success';
  if (plan === 'Premium') return 'info';
  return 'default';
};

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [onboardingResponses, setOnboardingResponses] = useState<OnboardingResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    loadUsers();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      const list: AdminUser[] = res.ok ? (Array.isArray(await res.json()) ? await res.clone().json() : []) : [];
      setUsers(list);
      setFilteredUsers(list);
    } catch {
      setUsers([]); setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = (search: string, plan: string, list = users) => {
    let f = list;
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(u =>
        u.first_name?.toLowerCase().includes(s) || u.last_name?.toLowerCase().includes(s) ||
        u.username?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
      );
    }
    if (plan !== 'all') f = f.filter(u => u.subscription_plan === plan);
    setFilteredUsers(f);
    setPage(0);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'x-admin-token': localStorage.getItem('adminToken') ?? '',
          },
          body: JSON.stringify({ userId: id }),
        }
      );
      if (res.ok) {
        const updated = users.filter(u => u.id !== id);
        setUsers(updated);
        filterUsers(searchTerm, selectedPlan, updated);
        if (showDetailModal && selectedUser?.id === id) setShowDetailModal(false);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`Nepodařilo se smazat: ${d?.error ?? res.statusText}`);
      }
    } catch (err) { alert(`Chyba: ${String(err)}`); }
    finally { setDeletingId(null); }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            userId: editingUser.id,
            subscription_plan: editingUser.subscription_plan,
            current_plan: editingUser.current_plan,
            current_week: editingUser.current_week,
            current_day: editingUser.current_day,
          }),
        }
      );
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(`Chyba: ${d?.error ?? res.statusText}`); return; }
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) { alert(`Chyba: ${String(err)}`); }
  };

  const fullName = (u: AdminUser) =>
    [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email?.split('@')[0] || '—';

  const fetchOnboardingResponses = async (userId: string) => {
    setLoadingResponses(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-onboarding-responses?userId=${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      if (!res.ok) { setOnboardingResponses([]); return; }
      const data = await res.json();
      setOnboardingResponses(Array.isArray(data) ? data : []);
    } catch {
      setOnboardingResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pageUsers = filteredUsers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <AdminLayout title="Správa uživatelů" subtitle={`Celkem ${filteredUsers.length} uživatelů`}>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Hledat jméno, username nebo email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); filterUsers(e.target.value, selectedPlan); }}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedPlan}
            onChange={(e) => { setSelectedPlan(e.target.value); filterUsers(searchTerm, e.target.value); }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
          >
            <option value="all">Všechny plány</option>
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
            <option value="Legend">Legend</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Načítám uživatele...</p>
        </div>
      ) : (
        <SectionCard>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Uživatel', 'Username', 'Email', 'Plán', 'Program', 'T/D', 'Registrován', 'Akce'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <button
                        onClick={() => { setSelectedUser(user); setShowDetailModal(true); fetchOnboardingResponses(user.id); }}
                        className="flex items-center gap-2.5 text-left group"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                          {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-teal-600 transition-colors whitespace-nowrap">
                          {fullName(user)}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {user.username
                        ? <span className="flex items-center gap-0.5"><AtSign className="w-3 h-3 text-gray-400" />{user.username}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 text-sm text-gray-500 max-w-[160px] truncate">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={planBadgeVariant(user.subscription_plan)}>{user.subscription_plan}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{user.current_plan || <span className="text-gray-300">—</span>}</td>
                    <td className="py-3 text-sm text-gray-500">
                      {user.current_week ? `T${user.current_week}/D${user.current_day}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Upravit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingId === user.id}
                          className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                          title="Smazat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">Žádní uživatelé nenalezeni</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pageUsers.map((user) => (
              <div key={user.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <button onClick={() => { setSelectedUser(user); setShowDetailModal(true); }} className="flex items-center gap-2.5 text-left">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                      {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{fullName(user)}</h3>
                      {user.username && <p className="text-xs text-gray-400 flex items-center gap-0.5"><AtSign className="w-3 h-3" />{user.username}</p>}
                    </div>
                  </button>
                  <Badge variant={planBadgeVariant(user.subscription_plan)}>{user.subscription_plan}</Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3 h-3" />{user.email}</p>
                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <button onClick={() => { setEditingUser(user); setShowEditModal(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" />Upravit
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} disabled={deletingId === user.id} className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40">
                    <Trash2 className="w-3 h-3" />Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
              <span className="text-xs text-gray-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredUsers.length)} z {filteredUsers.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${i === page ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`} style={i === page ? { backgroundColor: TEAL } : undefined}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Detail modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: TEAL }}>
                  {(selectedUser.first_name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{fullName(selectedUser)}</h2>
                  {selectedUser.username && <p className="text-xs text-gray-400 flex items-center gap-1"><AtSign className="w-3 h-3" />{selectedUser.username}</p>}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Jméno', val: selectedUser.first_name || '—' },
                { label: 'Příjmení', val: selectedUser.last_name || '—' },
                { label: 'Email', val: selectedUser.email, full: true },
                { label: 'Plán', val: selectedUser.subscription_plan },
                { label: 'Program', val: selectedUser.current_plan || '—' },
                { label: 'Týden / Den', val: selectedUser.current_week ? `T${selectedUser.current_week} / D${selectedUser.current_day}` : '—' },
                { label: 'Registrován', val: new Date(selectedUser.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }), full: true },
              ].map(({ label, val, full }) => (
                <div key={label} className={full ? 'col-span-2' : ''}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{val}</p>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); setEditingUser(selectedUser); setShowEditModal(true); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: TEAL }}
              >
                Upravit
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={deletingId === selectedUser.id}
                className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              >
                Smazat
              </button>
            </div>

            {/* Onboarding Responses Section */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-gray-900">Onboarding odpovědi</h3>
                {onboardingResponses.length > 0 && (
                  <span className="text-xs text-gray-400">({onboardingResponses.length})</span>
                )}
              </div>
              {loadingResponses ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : onboardingResponses.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {onboardingResponses.map((resp) => (
                    <div key={resp.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-teal-700">Den {resp.day_number}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(resp.responded_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1 italic">{resp.question_text}</p>
                      <p className="text-sm font-medium text-gray-800">
                        {resp.skipped ? (
                          <span className="text-gray-400 italic">Přeskočeno</span>
                        ) : (
                          resp.selected_option || '—'
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Zatím žádné odpovědi</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Upravit uživatele</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fullName(editingUser)}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Předplatné', key: 'subscription_plan', options: ['Basic', 'Premium', 'Legend'] },
                { label: 'Program', key: 'current_plan', options: ['Restart', 'L1', 'L2'] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <select
                    value={(editingUser as any)[key] || options[0]}
                    onChange={e => setEditingUser({ ...editingUser, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                  >
                    {options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Týden', key: 'current_week' }, { label: 'Den', key: 'current_day' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type="number" min={1}
                      value={(editingUser as any)[key] || 1}
                      onChange={e => setEditingUser({ ...editingUser, [key]: parseInt(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">Zrušit</button>
                <button onClick={handleSaveUser} className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: TEAL }}>Uložit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
