import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, TrendingUp, AlertCircle, RefreshCw, Award, CreditCard, Loader2, Tag
} from 'lucide-react';
import { AdminLayout, StatCard, SectionCard, Badge } from '../components/AdminLayout';

const TEAL = '#198379';

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface FinanceData {
  subscriptionMetrics: {
    mrr: number;
    active_subs: number;
    cancelled_subs: number;
    total_subs: number;
    churn_rate: number;
    failed_payments: number;
    plan_distribution: { plan: string; count: number }[];
  };
  mrrTrend: { month: string; revenue: number }[];
  recentPayments: {
    id: string; user_email: string; user_name: string; product_name: string;
    subscription_type: string; amount: number; state: string; is_recurring: boolean;
    discount_code: string | null; created_at: string;
  }[];
  revenueByPlan: { plan: string; users: number; mrr: number; pct: number }[];
  discountImpact: {
    code: string; discount_type: string; discount_value: number;
    used_count: number; max_uses: number | null; active: boolean;
    revenue: number; uses_in_payments: number;
  }[];
}

const statusVariant = (s: string) => {
  if (s === 'PAID') return 'success' as const;
  if (s === 'TIMEOUTED' || s === 'CANCELED') return 'error' as const;
  if (s === 'CREATED') return 'info' as const;
  return 'default' as const;
};

const statusLabel = (s: string) => {
  if (s === 'PAID') return 'Zaplaceno';
  if (s === 'TIMEOUTED') return 'Vypršelo';
  if (s === 'CANCELED') return 'Zrušeno';
  if (s === 'CREATED') return 'Vytvořeno';
  if (s === 'PAYMENT_METHOD_CHOSEN') return 'Platební metoda';
  return s;
};

export function AdminFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(
        `${API_URL}/functions/v1/admin-stats?section=finance`,
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
      <AdminLayout title="Finance & Platby" subtitle="Revenue, billing a platební přehledy">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Finance & Platby" subtitle="Revenue, billing a platební přehledy">
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

  const { subscriptionMetrics, mrrTrend, recentPayments, revenueByPlan, discountImpact } = data;
  const mrr = subscriptionMetrics.mrr;
  const arr = mrr * 12;
  const arpu = subscriptionMetrics.active_subs > 0 ? Math.round(mrr / subscriptionMetrics.active_subs) : 0;

  return (
    <AdminLayout title="Finance & Platby" subtitle="Revenue, billing a platební přehledy">

      <div className="flex justify-end mb-4">
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Obnovit
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="MRR" value={`${mrr.toLocaleString('cs-CZ')} Kč`} icon={DollarSign} color="teal" subtitle="měsíční recurring revenue" />
        <StatCard title="ARR" value={`${(arr / 1000).toFixed(1)}K Kč`} icon={TrendingUp} color="emerald" subtitle="annual recurring revenue" />
        <StatCard title="ARPU" value={`${arpu} Kč`} icon={Award} color="blue" subtitle="průměr na aktivní předplatné" />
        <StatCard title="Neúspěšné platby" value={subscriptionMetrics.failed_payments} icon={AlertCircle} color="red" subtitle="TIMEOUTED + CANCELED" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Měsíční tržby" subtitle="Tržby z úspěšných plateb">
          {mrrTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mrrTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `${Number(v).toLocaleString('cs-CZ')} Kč`} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="revenue" fill={TEAL} radius={[4, 4, 0, 0]} name="Tržba (Kč)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Žádná data</div>
          )}
        </SectionCard>

        <SectionCard title="Revenue podle plánu" subtitle="Příspěvek plánů k MRR">
          <div className="space-y-4">
            {revenueByPlan.map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{p.plan}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{p.users} už.</span>
                    <span className="font-bold text-gray-900">{p.mrr.toLocaleString('cs-CZ')} Kč</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${p.pct}%`, backgroundColor: TEAL }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{p.pct}% z MRR</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Discount codes */}
      {discountImpact.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          <SectionCard title="Slevové kódy" subtitle="Využití a dopad na tržby">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kód</th>
                    <th className="py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Typ</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Hodnota</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Použití</th>
                    <th className="py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Tržba</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {discountImpact.map((d) => (
                    <tr key={d.code} className="hover:bg-gray-50">
                      <td className="py-2.5 font-mono text-xs font-medium text-gray-900">{d.code}</td>
                      <td className="py-2.5 text-xs text-gray-600">{d.discount_type === 'percentage' ? 'Procento' : 'Částka'}</td>
                      <td className="py-2.5 text-center text-xs text-gray-600">{d.discount_value}{d.discount_type === 'percentage' ? '%' : ' Kč'}</td>
                      <td className="py-2.5 text-center text-xs font-semibold text-gray-900">{d.uses_in_payments}</td>
                      <td className="py-2.5 text-right text-xs font-semibold text-gray-900">{d.revenue.toLocaleString('cs-CZ')} Kč</td>
                      <td className="py-2.5 text-center">
                        <Badge variant={d.active ? 'success' : 'default'}>{d.active ? 'Aktivní' : 'Neaktivní'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Payments table */}
      <div className="grid grid-cols-1 gap-4">
        <SectionCard title="Přehled plateb" subtitle="Posledních 20 transakcí">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Uživatel', 'Produkt', 'Částka', 'Status', 'Datum'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <p className="text-sm font-medium text-gray-900">{p.user_name}</p>
                      <p className="text-xs text-gray-400">{p.user_email}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant={p.subscription_type === 'L2' ? 'success' : 'default'}>{p.subscription_type}</Badge>
                      {p.discount_code && <span className="ml-2 text-xs text-gray-400">{p.discount_code}</span>}
                    </td>
                    <td className="py-3">
                      <span className="text-sm font-semibold text-gray-900">{p.amount.toLocaleString('cs-CZ')} Kč</span>
                    </td>
                    <td className="py-3">
                      <Badge variant={statusVariant(p.state)}>{statusLabel(p.state)}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
