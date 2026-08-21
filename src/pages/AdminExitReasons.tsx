import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout, SectionCard } from '../components/AdminLayout';
import { LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ExitFeedbackDistribution {
  reason: string;
  label: string;
  count: number;
}

interface ExitFeedbackData {
  total: number;
  distribution: ExitFeedbackDistribution[];
  accountDeletions: number;
  subscriptionCancels: number;
}

const REASON_COLORS: Record<string, string> = {
  finance: '#f59e0b',
  time: '#3b82f6',
  other: '#9ca3af',
};

export function AdminExitReasons() {
  const navigate = useNavigate();
  const [exitFeedback, setExitFeedback] = useState<ExitFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { navigate('/admin/login'); return; }
    loadExitFeedback();
  }, [navigate]);

  const loadExitFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-exit-feedback`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );
      setExitFeedback(res.ok ? await res.json() : null);
    } catch {
      setExitFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Důvody odchodu" subtitle="Proč uživatelé ruší předplatné nebo mažou účet">
      <SectionCard>
        {loading ? (
          <div className="h-[220px] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exitFeedback && exitFeedback.total > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={220} className="sm:max-w-[280px]">
              <PieChart>
                <Pie
                  data={exitFeedback.distribution.filter(d => d.count > 0)}
                  cx="50%" cy="50%" outerRadius={90} innerRadius={52}
                  dataKey="count" nameKey="label" paddingAngle={3}
                >
                  {exitFeedback.distribution.filter(d => d.count > 0).map((entry, i) => (
                    <Cell key={i} fill={REASON_COLORS[entry.reason] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} odpovědí`} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-wrap gap-4">
                {exitFeedback.distribution.map((d) => (
                  <div key={d.reason} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: REASON_COLORS[d.reason] || '#6b7280' }} />
                    {d.label} — {d.count} ({Math.round(d.count / exitFeedback.total * 100)}%)
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-100">
                <LogOut className="w-3.5 h-3.5" />
                Celkem {exitFeedback.total} odpovědí · {exitFeedback.accountDeletions} smazání účtu · {exitFeedback.subscriptionCancels} zrušení předplatného
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[160px] flex items-center justify-center text-sm text-gray-400">Zatím žádná data</div>
        )}
      </SectionCard>
    </AdminLayout>
  );
}
