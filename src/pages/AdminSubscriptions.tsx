import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Loader2, CreditCard
} from 'lucide-react';
import { AdminLayout, StatCard, SectionCard, Badge } from '../components/AdminLayout';

const TEAL = '#198379';

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SubData {
  subscriptionMetrics: {
    mrr: number;
    active_subs: number;
    cancelled_subs: number;
    total_subs: number;
    churn_rate: number;
    failed_payments: number;
    plan_distribution: { plan: string; count: number }[];
  };
  subscriptions: {
    id: string; user_email: string; user_name: string;
    subscription_type: string; subscription_status: string; payment_status: string;
    amount: number; current_period_start: string; current_period_end: string;
    cancel_at_period_end: boolean; created_at: string;
  }[];
}

const statusConfig = (s: string) => {
  if (s === 'active') return { variant: 'success' as const, label: 'Aktivní', Icon: CheckCircle, color: 'text-emerald-500' };
  if (s === 'unpaid') return { variant: 'error' as const, label: 'Nezaplaceno', Icon: AlertCircle, color: 'text-red-500' };
  if (s === 'pending') return { variant: 'warning' as const, label: 'Čeká', Icon: Clock, color: 'text-amber-500' };
  return { variant: 'default' as const, label: s, Icon: XCircle, color: 'text-gray-400' };
};

export function AdminSubscriptions() {
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(
        `${API_URL}/functions/v1/admin-stats?section=subscriptions`,
        { headers: { 'Content-Type': 'application/json', Apikey: API_KEY } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading && !data) {
    return (
      <AdminLayout title="Předplatné" subtitle="Přehled všech předplatných">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Předplatné" subtitle="Přehled všech předplatných">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">Nepodařilo se načíst data.</p>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <RefreshCw className="w-4 h-4" /> Zkusit znovu
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { subscriptionMetrics, subscriptions } = data;
  const active = subscriptions.filter(s => s.subscription_status === 'active').length;
  const unpaid = subscriptions.filter(s => s.subscription_status === 'unpaid').length;
  const pending = subscriptions.filter(s => s.subscription_status === 'pending').length;

  const filtered = filter === 'all' ? subscriptions : subscriptions.filter(s => s.subscription_status === filter);

  const filters = [
    { label: 'Vše', value: 'all', count: subscriptions.length },
    { label: 'Aktivní', value: 'active', count: active },
    { label: 'Nezaplaceno', value: 'unpaid', count: unpaid },
    { label: 'Čeká', value: 'pending', count: pending },
  ];

  return (
    <AdminLayout title="Předplatné" subtitle="Přehled všech předplatných">

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.value ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={filter === f.value ? { backgroundColor: TEAL } : undefined}
            >
              {f.label} <span className="ml-1 opacity-60">({f.count})</span>
            </button>
          ))}
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Obnovit
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Aktivní" value={active} icon={CheckCircle} color="emerald" />
        <StatCard title="Nezaplaceno" value={unpaid} icon={AlertCircle} color="red" />
        <StatCard title="Čeká na platbu" value={pending} icon={Clock} color="amber" />
        <StatCard title="MRR" value={`${subscriptionMetrics.mrr.toLocaleString('cs-CZ')} Kč`} icon={CreditCard} color="teal" />
      </div>

      <SectionCard title="Všechna předplatná" subtitle={`${filtered.length} záznamů`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Uživatel', 'Plán', 'Status', 'Od', 'Konec období', 'Částka', 'Zrušit na konci'].map(h => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => {
                const { variant, label, Icon, color } = statusConfig(s.subscription_status);
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                          {(s.user_name || s.user_email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{s.user_name || s.user_email?.split('@')[0]}</p>
                          <p className="text-xs text-gray-400 truncate">{s.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><Badge variant={s.subscription_type === 'L2' ? 'success' : 'default'}>{s.subscription_type}</Badge></td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <Badge variant={variant}>{label}</Badge>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString('cs-CZ')}</td>
                    <td className="py-3 text-sm text-gray-500">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('cs-CZ') : '—'}
                    </td>
                    <td className="py-3 text-sm font-semibold text-gray-900">{s.amount.toLocaleString('cs-CZ')} Kč</td>
                    <td className="py-3">
                      {s.cancel_at_period_end ? (
                        <Badge variant="warning">Ano</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">Ne</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AdminLayout>
  );
}
