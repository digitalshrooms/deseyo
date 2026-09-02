import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Target, RefreshCw, Loader2,
  AlertCircle, CreditCard, Tag, Clock, ChevronDown
} from 'lucide-react';
import { AdminLayout, StatCard, SectionCard, Badge } from '../components/AdminLayout';

const TEAL = '#198379';
const TEAL2 = '#1cbda0';

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type Period = 'day' | 'week' | 'month';

interface AnalyticsData {
  userGrowth: {
    total_users: number;
    active_7d: number;
    active_30d: number;
    active_90d: number;
    paid_users: number;
    conversion_rate: number;
    registrations: { label: string; value: number }[];
  };
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
  discountImpact: {
    code: string; discount_type: string; discount_value: number;
    used_count: number; max_uses: number | null; active: boolean;
    revenue: number; uses_in_payments: number;
  }[];
  onboardingDistribution: Record<string, { answer: string; count: number }[]>;
  funnel: {
    steps: { stage: string; value: number; pct: number }[];
    avg_completion_hours: number;
  };
}

const QUESTION_LABELS: Record<string, string> = {
  q1_body_state: 'Q1: Stav těla',
  q2_recent_state: 'Q2: Nedávný stav',
  q3_capacity: 'Q3: Kapacita',
  q4_main_need: 'Q4: Hlavní potřeba',
  q5_focus_area: 'Q5: Oblast zájmu',
  q6_best_time: 'Q6: Nejlepší čas',
  q7_start_style: 'Q7: Styl začátku',
  recommended_plan: 'Doporučený plán',
};

const PLAN_LABELS: Record<string, string> = {
  '1': 'Jóga pro začátečníky',
  '2': 'Fyzio jóga',
  '3': 'Face yoga',
  '4': 'Mind & Life',
  '5': 'Rituály',
  '7': 'Konzultace',
};

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('day');
  const [periodOpen, setPeriodOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(
        `${API_URL}/functions/v1/admin-stats?section=analytics&period=${period}`,
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
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading && !data) {
    return (
      <AdminLayout title="Analytics" subtitle="Detailní statistiky a výkonnost">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Analytics" subtitle="Detailní statistiky a výkonnost">
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

  const { userGrowth, subscriptionMetrics, mrrTrend, discountImpact, onboardingDistribution, funnel } = data;
  const planColors: Record<string, string> = { L1: '#198379', L2: '#1cbda0', Restart: '#6b7280' };
  const totalPlanUsers = subscriptionMetrics.plan_distribution.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <AdminLayout title="Analytics" subtitle="Detailní statistiky a výkonnost">

      {/* Period switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Období: {period === 'day' ? 'Denně' : period === 'week' ? 'Týdně' : 'Měsíčně'}
            <ChevronDown className="w-4 h-4" />
          </button>
          {periodOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPeriodOpen(false)} />
              <div className="absolute top-full mt-1 left-0 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden min-w-[160px]">
                {([['day', 'Denně'], ['week', 'Týdně'], ['month', 'Měsíčně']] as [Period, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setPeriod(val); setPeriodOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${period === val ? 'font-semibold' : ''}`}
                    style={period === val ? { color: TEAL } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Obnovit
        </button>
      </div>

      {/* ── SECTION 1: USERS & GROWTH ── */}
      <div className="mb-2">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: TEAL }} />
          Uživatelé a růst
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Celkem uživatelů" value={userGrowth.total_users} icon={Users} color="teal" />
        <StatCard title="Aktivní (7 dní)" value={userGrowth.active_7d} icon={TrendingUp} color="blue" subtitle={`${userGrowth.active_30d} za 30 dní`} />
        <StatCard title="Placení uživatelé" value={userGrowth.paid_users} icon={CreditCard} color="emerald" />
        <StatCard title="Konverzní poměr" value={`${userGrowth.conversion_rate}%`} icon={Target} color="amber" subtitle="registrace → platba" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Nové registrace" subtitle={period === 'day' ? 'Posledních 90 dní' : period === 'week' ? 'Posledních 6 měsíců' : 'Posledních 12 měsíců'}>
          {userGrowth.registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth.registrations} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="regGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => period === 'month' ? v : v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2} fill="url(#regGrad2)" name="Registrace" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Žádná data</div>
          )}
        </SectionCard>

        <SectionCard title="Aktivní vs. neaktivní" subtitle="Podle poslední aktivity">
          <div className="space-y-4">
            {[
              { label: 'Aktivní za 7 dní', value: userGrowth.active_7d, total: userGrowth.total_users, color: TEAL },
              { label: 'Aktivní za 30 dní', value: userGrowth.active_30d, total: userGrowth.total_users, color: TEAL2 },
              { label: 'Aktivní za 90 dní', value: userGrowth.active_90d, total: userGrowth.total_users, color: '#6b7280' },
            ].map((item) => {
              const pct = item.total > 0 ? Math.round(item.value / item.total * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.value} ({pct}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Neaktivní (&gt;90 dní)</span>
                <span className="text-sm font-bold text-gray-700">{userGrowth.total_users - userGrowth.active_90d}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── SECTION 3: SUBSCRIPTIONS & PAYMENTS ── */}
      <div className="mb-2 mt-8">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" style={{ color: TEAL }} />
          Předplatné a platby
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="MRR" value={`${subscriptionMetrics.mrr.toLocaleString('cs-CZ')} Kč`} icon={DollarSign} color="emerald" subtitle="měsíčně" />
        <StatCard title="Aktivní předplatná" value={subscriptionMetrics.active_subs} icon={CreditCard} color="teal" />
        <StatCard title="Churn rate" value={`${subscriptionMetrics.churn_rate}%`} icon={TrendingUp} color="red" subtitle={`${subscriptionMetrics.cancelled_subs} neaktivních`} />
        <StatCard title="Neúspěšné platby" value={subscriptionMetrics.failed_payments} icon={AlertCircle} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SectionCard title="MRR vývoj v čase" subtitle="Měsíční tržby z úspěšných plateb" className="lg:col-span-2">
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

        <SectionCard title="Rozložení plánů" subtitle="Aktivní předplatná">
          {subscriptionMetrics.plan_distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={subscriptionMetrics.plan_distribution.map(p => ({ name: p.plan, value: p.count }))} cx="50%" cy="50%" outerRadius={55} innerRadius={30} dataKey="value" paddingAngle={3}>
                    {subscriptionMetrics.plan_distribution.map((entry, i) => (
                      <Cell key={i} fill={planColors[entry.plan] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} už.`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {subscriptionMetrics.plan_distribution.map((d) => (
                  <div key={d.plan} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planColors[d.plan] || '#6b7280' }} />
                    {d.plan} ({Math.round(d.count / totalPlanUsers * 100)}%)
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Žádná aktivní předplatná</div>
          )}
        </SectionCard>
      </div>

      {/* Discount impact */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <SectionCard title="Slevové kódy" subtitle="Využití a dopad na tržby">
          {discountImpact.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Kód</th>
                    <th className="py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Typ slevy</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Hodnota</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Použití</th>
                    <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Max</th>
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
                      <td className="py-2.5 text-center text-xs text-gray-400">{d.max_uses ?? '∞'}</td>
                      <td className="py-2.5 text-right text-xs font-semibold text-gray-900">{d.revenue.toLocaleString('cs-CZ')} Kč</td>
                      <td className="py-2.5 text-center">
                        <Badge variant={d.active ? 'success' : 'default'}>{d.active ? 'Aktivní' : 'Neaktivní'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">Žádné slevové kódy</div>
          )}
        </SectionCard>
      </div>

      {/* ── SECTION 2: ONBOARDING FUNNEL ── */}
      <div className="mb-2 mt-8">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: TEAL }} />
          Onboarding funnel
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Konverzní funnel" subtitle="Registrace → placené předplatné">
          <div className="space-y-3">
            {funnel.steps.map((item, i) => {
              const dropoff = i > 0 ? funnel.steps[i - 1].value - item.value : 0;
              const dropoffPct = i > 0 && funnel.steps[i - 1].value > 0 ? Math.round(dropoff / funnel.steps[i - 1].value * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-36 text-right flex-shrink-0">{item.stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-3 transition-all"
                        style={{ width: `${item.pct}%`, backgroundColor: TEAL, opacity: 0.85 + i * 0.03 }}
                      >
                        <span className="text-xs text-white font-semibold">{item.value}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-10 text-right flex-shrink-0">{item.pct}%</span>
                  </div>
                  {i > 0 && dropoff > 0 && (
                    <p className="text-[10px] text-red-400 ml-40 mt-0.5">↓ {dropoff} už. ({dropoffPct}% odchod)</p>
                  )}
                </div>
              );
            })}
          </div>
          {funnel.avg_completion_hours > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Průměrná doba dokončení: <strong className="text-gray-700">{funnel.avg_completion_hours} hodin</strong></span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Doporučené plány" subtitle="Z odpovědí v onboarding dotazníku">
          {onboardingDistribution.recommended_plan && onboardingDistribution.recommended_plan.length > 0 ? (
            <div className="space-y-3">
              {onboardingDistribution.recommended_plan.map((item, i) => {
                const total = onboardingDistribution.recommended_plan.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? Math.round(item.count / total * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700">{item.answer}</span>
                      <span className="text-xs text-gray-500">{item.count} ({pct}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: planColors[item.answer] || TEAL }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">Žádná data</div>
          )}
        </SectionCard>
      </div>

      {/* Onboarding response distribution */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <SectionCard title="Rozložení odpovědí v onboarding dotazníku" subtitle="Frekvence odpovědí pro jednotlivé otázky">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(onboardingDistribution).filter(([key]) => key !== 'recommended_plan').map(([key, answers]) => {
              const total = answers.reduce((s, a) => s + a.count, 0) || 1;
              return (
                <div key={key} className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">{QUESTION_LABELS[key] || key}</p>
                  {answers.map((a, i) => {
                    const pct = Math.round(a.count / total * 100);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-gray-500">{PLAN_LABELS[a.answer] || a.answer}</span>
                          <span className="text-[10px] text-gray-400">{a.count}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TEAL2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}
