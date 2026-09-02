import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingDown, AlertCircle, Users, Clock, XCircle, RefreshCw, Loader2, Activity
} from 'lucide-react';
import { AdminLayout, StatCard, SectionCard, Badge } from '../components/AdminLayout';

const TEAL = '#198379';

const API_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface RetentionData {
  retention: {
    churn_risk_users: {
      user_id: string; email: string; name: string; plan: string;
      days_inactive: number; lessons_completed: number; risk_level: string;
    }[];
    churn_risk_count: number;
    no_lesson_users: { user_id: string; email: string; name: string; plan: string; days_since_reg: number }[];
    no_lesson_count: number;
    stuck_onboarding: { user_id: string; email: string; name: string; days_stuck: number; onboarding_started: boolean }[];
    stuck_count: number;
    active_total: number;
    retention_curve: { week: string; retention: number }[];
  };
  subscriptionMetrics: {
    mrr: number;
    active_subs: number;
    cancelled_subs: number;
    total_subs: number;
    churn_rate: number;
    failed_payments: number;
  };
}

export function AdminRetention() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(
        `${API_URL}/functions/v1/admin-stats?section=retention`,
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
      <AdminLayout title="Retention" subtitle="Churn risk a neaktivní uživatelé">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Retention" subtitle="Churn risk a neaktivní uživatelé">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">Nepodařilo se načíst data.</p>
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <RefreshCcw className="w-4 h-4" /> Zkusit znovu
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { retention, subscriptionMetrics } = data;
  const churnPct = retention.active_total > 0 ? Math.round(retention.churn_risk_count / retention.active_total * 100) : 0;

  return (
    <AdminLayout title="Retention" subtitle="Churn risk a neaktivní uživatelé">

      <div className="flex justify-end mb-4">
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Obnovit
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Churn risk uživatelé" value={retention.churn_risk_count} icon={AlertCircle} color="red" subtitle={`${churnPct}% z aktivních`} />
        <StatCard title="Bez dokončené lekce" value={retention.no_lesson_count} icon={XCircle} color="amber" subtitle="z aktivních předplatných" />
        <StatCard title="Zaseknutí v onboardingu" value={retention.stuck_count} icon={Clock} color="blue" subtitle="3+ dní bez dokončení" />
        <StatCard title="Churn rate" value={`${subscriptionMetrics.churn_rate}%`} icon={TrendingDown} color="red" subtitle="z celkových předplatných" />
      </div>

      {/* Retention curve */}
      {retention.retention_curve.length > 0 && (
        <SectionCard title="Retention curve" subtitle="% uživatelů aktivních po X týdnech od registrace" className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={retention.retention_curve} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="retention" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} name="Retention" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      {/* Churn risk table */}
      <SectionCard title="Uživatelé v riziku odchodu" subtitle="Aktivní předplatné, ale neaktivní 14+ dní" className="mb-6">
        {retention.churn_risk_users.length > 0 ? (
          <div className="space-y-3">
            {retention.churn_risk_users.map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                  {(u.name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.name || u.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-400">{u.email} · {u.plan}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-gray-500">Neaktivní: <span className="font-semibold text-gray-700">{u.days_inactive} dní</span></p>
                  <p className="text-xs text-gray-400">{u.lessons_completed} dokončených lekcí</p>
                </div>
                <Badge variant={u.risk_level === 'high' ? 'error' : 'warning'}>
                  {u.risk_level === 'high' ? 'Vysoké' : 'Střední'} riziko
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Žádní uživatelé v riziku odchodu
          </div>
        )}
      </SectionCard>

      {/* No lessons */}
      <SectionCard title="Uživatelé bez dokončené lekce" subtitle="Aktivní předplatné, ale žádné dokončené lekce" className="mb-6">
        {retention.no_lesson_users.length > 0 ? (
          <div className="space-y-2">
            {retention.no_lesson_users.slice(0, 10).map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.name || u.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u.plan}</p>
                </div>
                <span className="text-xs text-amber-600 font-semibold">{u.days_since_reg} dní od registrace</span>
              </div>
            ))}
            {retention.no_lesson_users.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-2">a {retention.no_lesson_users.length - 10} dalších...</p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Všichni aktivní uživatelé dokončili alespoň jednu lekci</div>
        )}
      </SectionCard>

      {/* Stuck onboarding */}
      <SectionCard title="Zaseknutí v onboardingu" subtitle="Registrováni 3+ dní, ale nedokončili onboarding">
        {retention.stuck_onboarding.length > 0 ? (
          <div className="space-y-2">
            {retention.stuck_onboarding.slice(0, 10).map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.name || u.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u.onboarding_started ? 'Začal onboarding' : 'Nezačal onboarding'}</p>
                </div>
                <span className="text-xs text-blue-600 font-semibold">{u.days_stuck} dní čeká</span>
              </div>
            ))}
            {retention.stuck_onboarding.length > 10 && (
              <p className="text-xs text-gray-400 text-center pt-2">a {retention.stuck_onboarding.length - 10} dalších...</p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Žádní uživatelé nejsou zaseknutí v onboardingu</div>
        )}
      </SectionCard>
    </AdminLayout>
  );
}
