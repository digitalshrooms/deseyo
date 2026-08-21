import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, BookOpen, TrendingUp, TrendingDown, DollarSign,
  UserPlus, Activity, CheckCircle, AlertCircle,
  ArrowRight, Target, RefreshCw, CreditCard, Loader2
} from 'lucide-react';
import { AdminLayout, StatCard, SectionCard, Badge } from '../components/AdminLayout';

const TEAL = '#198379';
const TEAL2 = '#1cbda0';

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface OverviewData {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalCompletions: number;
    registeredToday: number;
  };
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
  funnel: {
    steps: { stage: string; value: number; pct: number }[];
    avg_completion_hours: number;
  };
  recentUsers: { id: string; email: string; name: string; created_at: string; subscription_status: string; subscription_type: string | null; onboarding_completed: boolean }[];
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) { navigate('/admin/login'); return; }
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      setError(null);
      const res = await fetch(
        `${API_URL}/functions/v1/admin-stats?section=overview`,
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
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Přehled platformy Deseyo">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Dashboard" subtitle="Přehled platformy Deseyo">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">Nepodařilo se načíst data.</p>
          <button onClick={loadStats} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <RefreshCw className="w-4 h-4" /> Zkusit znovu
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { stats, userGrowth, subscriptionMetrics, funnel, recentUsers } = data;
  const arr = subscriptionMetrics.mrr * 12;
  const planDist = subscriptionMetrics.plan_distribution;
  const totalPlanUsers = planDist.reduce((s, p) => s + p.count, 0) || 1;
  const planColors: Record<string, string> = { L1: '#198379', L2: '#1cbda0', Restart: '#6b7280' };

  return (
    <AdminLayout title="Dashboard" subtitle="Přehled platformy Deseyo">

      {/* ── HERO STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Celkem uživatelů"
          value={stats.totalUsers}
          icon={Users}
          color="teal"
          subtitle="registrovaných účtů"
        />
        <StatCard
          title="MRR"
          value={`${subscriptionMetrics.mrr.toLocaleString('cs-CZ')} Kč`}
          icon={DollarSign}
          color="emerald"
          subtitle="měsíční opakující se příjem"
        />
        <StatCard
          title="Nové registrace dnes"
          value={stats.registeredToday}
          icon={UserPlus}
          color="blue"
          subtitle="dnešní datum"
        />
        <StatCard
          title="Dokončené lekce"
          value={stats.totalCompletions}
          icon={CheckCircle}
          color="amber"
          subtitle="celkem"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="ARR" value={`${(arr / 1000).toFixed(1)}K Kč`} icon={TrendingUp} color="teal" subtitle="roční opakující se příjem" />
        <StatCard title="Churn rate" value={`${subscriptionMetrics.churn_rate}%`} icon={TrendingDown} color="red" subtitle="z celkových předplatných" />
        <StatCard title="Konverze registrace → platba" value={`${userGrowth.conversion_rate}%`} icon={Target} color="teal" subtitle={`${userGrowth.paid_users} z ${userGrowth.total_users} uživatelů`} />
        <StatCard title="Aktivní uživatelé (7d)" value={userGrowth.active_7d} icon={Activity} color="blue" subtitle={`${userGrowth.active_30d} za 30 dní`} />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Registrations */}
        <SectionCard
          title="Registrace – posledních 90 dní"
          subtitle="Nové účty denně"
          className="lg:col-span-2"
          action={
            <Link to="/admin/sprava/analytics" className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: TEAL }}>
              Detail <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {userGrowth.registrations.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={userGrowth.registrations} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2} fill="url(#regGrad)" name="Registrace" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Žádné registrace v posledních 90 dnech</div>
          )}
        </SectionCard>

        {/* Plan distribution */}
        <SectionCard title="Rozložení plánů" subtitle="Aktivní předplatné">
          {planDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={planDist.map(p => ({ name: p.plan, value: p.count, color: planColors[p.plan] || '#6b7280' }))} cx="50%" cy="50%" outerRadius={55} innerRadius={30} dataKey="value" paddingAngle={3}>
                    {planDist.map((entry, i) => (
                      <Cell key={i} fill={planColors[entry.plan] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} už.`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {planDist.map((d) => (
                  <div key={d.plan} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: planColors[d.plan] || '#6b7280' }} />
                    {d.plan} ({Math.round(d.count / totalPlanUsers * 100)}%)
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {planDist.map((d) => (
                  <div key={d.plan} className="flex justify-between text-xs">
                    <span className="text-gray-500">{d.plan}</span>
                    <span className="font-semibold text-gray-900">{d.count} už.</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">Žádná aktivní předplatná</div>
          )}
        </SectionCard>
      </div>

      {/* ── FUNNEL + SUBSCRIPTION INFO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Funnel */}
        <SectionCard title="Konverzní funnel" subtitle="Registrace → placené předplatné" className="lg:col-span-2">
          <div className="space-y-2">
            {funnel.steps.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 text-right flex-shrink-0">{item.stage}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-3 transition-all"
                    style={{ width: `${item.pct}%`, backgroundColor: TEAL, opacity: 0.85 + i * 0.03 }}
                  >
                    <span className="text-xs text-white font-semibold">{item.value}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-10 text-right flex-shrink-0">{item.pct}%</span>
              </div>
            ))}
          </div>
          {funnel.avg_completion_hours > 0 && (
            <p className="text-xs text-gray-400 mt-4">
              Průměrná doba dokončení onboardingu: {funnel.avg_completion_hours} hodin
            </p>
          )}
        </SectionCard>

        {/* Subscription summary */}
        <SectionCard title="Předplatné" subtitle="Stav předplatných">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Aktivní</span>
              </div>
              <span className="text-lg font-bold text-emerald-700">{subscriptionMetrics.active_subs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Neaktivní</span>
              </div>
              <span className="text-lg font-bold text-red-600">{subscriptionMetrics.cancelled_subs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-700">Neúspěšné platby</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{subscriptionMetrics.failed_payments}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── RECENT USERS ── */}
      <div className="grid grid-cols-1 gap-4">
        <SectionCard
          title="Nedávné registrace"
          subtitle="Poslední uživatelé"
          action={
            <Link to="/admin/sprava/klientske-karty" className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: TEAL }}>
              Správa klientů <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Uživatel</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrace</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{user.name || user.email?.split('@')[0]}</p>
                          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="py-2.5">
                      {user.subscription_status === 'active' ? (
                        <Badge variant="success">{user.subscription_type || 'Aktivní'}</Badge>
                      ) : user.onboarding_completed ? (
                        <Badge variant="default">Registrace</Badge>
                      ) : (
                        <Badge variant="warning">Onboarding</Badge>
                      )}
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
