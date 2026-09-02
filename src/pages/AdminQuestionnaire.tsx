import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Clock, Target, Heart, Brain, Activity } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { supabase } from '../lib/supabase';

interface QuestionnaireStats {
  total_responses: number;
  plan_distribution: {
    Restart: number;
    L1: number;
    L2: number;
  };
  q1_stats: Record<string, number>;
  q2_stats: Record<string, number>;
  q3_stats: Record<string, number>;
  q4_stats: Record<string, number>;
  q5_stats: Record<string, number>;
  q6_stats: Record<string, number>;
  q7_stats: Record<string, number>;
  q8_stats: Record<string, number>;
  q9_stats: Record<string, number>;
  q10_stats: Record<string, number>;
  q11_stats: Record<string, number>;
  priority_tags: {
    face_priority: number;
    fyzio_priority: number;
    mindlife_priority: number;
  };
  capacity_candidates: {
    high_capacity: number;
    restart: number;
  };
}

const QUESTION_LABELS: Record<string, Record<string, string>> = {
  q1: {
    '1': 'Potřebuju začít jemně a vrátit se do rytmu',
    '2': 'Cítím, že zvládnu pravidelný základ',
    '3': 'Mám chuť jít o kus dál',
  },
  q2: {
    '1': 'Spíš jsem necvičila a jedu nadoraz',
    '2': 'Něco dělám, ale nepravidelně',
    '3': 'Cvičím docela pravidelně a chci se posunout',
  },
  q3: {
    '1': 'Reálně dám spíš 3 dny týdně',
    '2': 'Většinou zvládnu 4 dny týdně',
    '3': 'Když budu chtít, dám i 4–5 dní týdně',
  },
  q4: {
    '1': 'Návrat do rytmu a pravidelný pohyb',
    '2': 'Úleva v těle v běžném dni',
    '3': 'Zaměření na obličej a výraz',
    '4': 'Zklidnění hlavy a zvládání stresu',
    '5': 'Jasný udržitelný systém',
  },
  q5: {
    '1': 'Záda / bedra',
    '2': 'Krk / šíje / ramena',
    '3': 'Kyčle / pánev',
    '4': 'Oči / čelo / výraz',
    '5': 'Čelist / dolní část obličeje',
    '6': 'Celková únava a napětí',
    '7': 'Nic konkrétního, celkový rytmus',
  },
  q6: {
    '1': 'Ráno',
    '2': 'Po práci',
    '3': 'Večer',
    '4': 'Každý den je to jiné',
  },
  q7: {
    '1': 'Začít jednoduše a bez tlaku',
    '2': 'Jasně daný plán',
    '3': 'Víc vedení, větší tah a posun',
  },
  q8: {
    '1': 'Ano, připomínky a novinky',
    '2': 'Jen občas, důležité věci',
    '3': 'Ne, e-maily nechci',
  },
  q9: {
    '1': 'Dostat se do pravidelnosti',
    '2': 'Řešení těla',
    '3': 'Řešení obličeje',
    '4': 'Řešení stresu a únavy',
    '5': 'Hledání funkčního systému',
  },
  q10: {
    '1': 'Moc obsahu, nevím co pustit',
    '2': 'Chybí lidskost a vedení',
    '3': 'Moc obecné, nesedne mi to',
    '4': 'Moc náročné',
    '5': 'Nevydržím u toho dlouho',
    '6': 'Celé moc komplikované',
  },
  q11: {
    '1': 'Pravidelněji se hýbat',
    '2': 'Cítit se líp v těle',
    '3': 'Vidět změnu v obličeji',
    '4': 'Být klidnější a stabilnější',
    '5': 'Mít udržitelný systém',
  },
};

export const AdminQuestionnaire = () => {
  const [stats, setStats] = useState<QuestionnaireStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: responses, error } = await supabase
        .from('onboarding_responses')
        .select('*');

      if (error) throw error;

      if (!responses || responses.length === 0) {
        setStats({
          total_responses: 0,
          plan_distribution: { Restart: 0, L1: 0, L2: 0 },
          q1_stats: {},
          q2_stats: {},
          q3_stats: {},
          q4_stats: {},
          q5_stats: {},
          q6_stats: {},
          q7_stats: {},
          q8_stats: {},
          q9_stats: {},
          q10_stats: {},
          q11_stats: {},
          priority_tags: { face_priority: 0, fyzio_priority: 0, mindlife_priority: 0 },
          capacity_candidates: { high_capacity: 0, restart: 0 },
        });
        setLoading(false);
        return;
      }

      const aggregatedStats: QuestionnaireStats = {
        total_responses: responses.length,
        plan_distribution: { Restart: 0, L1: 0, L2: 0 },
        q1_stats: {},
        q2_stats: {},
        q3_stats: {},
        q4_stats: {},
        q5_stats: {},
        q6_stats: {},
        q7_stats: {},
        q8_stats: {},
        q9_stats: {},
        q10_stats: {},
        q11_stats: {},
        priority_tags: { face_priority: 0, fyzio_priority: 0, mindlife_priority: 0 },
        capacity_candidates: { high_capacity: 0, restart: 0 },
      };

      responses.forEach((response) => {
        aggregatedStats.plan_distribution[response.recommended_plan as 'Restart' | 'L1' | 'L2']++;

        ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].forEach((q) => {
          const key = `${q}_body_state` as keyof typeof response;
          const value = response[key] || response[`${q}_recent_state`] || response[`${q}_capacity`] ||
                       response[`${q}_main_need`] || response[`${q}_focus_area`] ||
                       response[`${q}_best_time`] || response[`${q}_start_style`] ||
                       response[`${q}_email_pref`];

          const actualKey = q === 'q1' ? 'q1_body_state' :
                           q === 'q2' ? 'q2_recent_state' :
                           q === 'q3' ? 'q3_capacity' :
                           q === 'q4' ? 'q4_main_need' :
                           q === 'q5' ? 'q5_focus_area' :
                           q === 'q6' ? 'q6_best_time' :
                           q === 'q7' ? 'q7_start_style' :
                           'q8_email_pref';

          const val = response[actualKey];
          if (val) {
            const statsKey = `${q}_stats` as keyof QuestionnaireStats;
            const currentStats = aggregatedStats[statsKey] as Record<string, number>;
            currentStats[val] = (currentStats[val] || 0) + 1;
          }
        });

        ['q9', 'q10', 'q11'].forEach((q) => {
          const key = q === 'q9' ? 'q9_reason_for_joining' :
                     q === 'q10' ? 'q10_platform_frustration' :
                     'q11_success_definition';
          const val = response[key];
          if (val) {
            const statsKey = `${q}_stats` as keyof QuestionnaireStats;
            const currentStats = aggregatedStats[statsKey] as Record<string, number>;
            currentStats[val] = (currentStats[val] || 0) + 1;
          }
        });

        if (response.face_priority) aggregatedStats.priority_tags.face_priority++;
        if (response.fyzio_priority) aggregatedStats.priority_tags.fyzio_priority++;
        if (response.mindlife_priority) aggregatedStats.priority_tags.mindlife_priority++;

        if (response.high_capacity_candidate) aggregatedStats.capacity_candidates.high_capacity++;
        if (response.restart_candidate) aggregatedStats.capacity_candidates.restart++;
      });

      setStats(aggregatedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (data: Record<string, number>, question: string, title: string) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return null;

    const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const maxValue = Math.max(...Object.values(data));

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {sortedEntries.map(([key, value]) => {
            const percentage = (value / total) * 100;
            const barWidth = (value / maxValue) * 100;
            const label = QUESTION_LABELS[question]?.[key] || key;

            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-2">
                    {value} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Dotazníky" subtitle="Analýza onboardingových odpovědí">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title="Dotazníky" subtitle="Analýza onboardingových odpovědí">
        <p className="text-center text-gray-600 py-8">Nepodařilo se načíst statistiky.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dotazníky" subtitle={`${stats.total_responses} odpovědí celkem`}>
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-teal-600" />
              <div>
                <p className="text-sm text-gray-600">Celkem odpovědí</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_responses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Restart plán</p>
                <p className="text-2xl font-bold text-gray-900">{stats.plan_distribution.Restart}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">L1 plán</p>
                <p className="text-2xl font-bold text-gray-900">{stats.plan_distribution.L1}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">L2 plán</p>
                <p className="text-2xl font-bold text-gray-900">{stats.plan_distribution.L2}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Distribuce doporučených plánů
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.plan_distribution).map(([plan, count]) => {
              const percentage = stats.total_responses > 0 ? (count / stats.total_responses) * 100 : 0;
              const maxCount = Math.max(...Object.values(stats.plan_distribution));
              const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{plan}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        plan === 'Restart' ? 'bg-blue-600' :
                        plan === 'L1' ? 'bg-green-600' :
                        'bg-purple-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Povinné otázky (1-8)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderBarChart(stats.q1_stats, 'q1', 'Q1: Jak na tom tělo je?')}
            {renderBarChart(stats.q2_stats, 'q2', 'Q2: Poslední týdny - pohyb a energie')}
            {renderBarChart(stats.q3_stats, 'q3', 'Q3: Kolik prostoru pro sebe?')}
            {renderBarChart(stats.q4_stats, 'q4', 'Q4: Co je nejdůležitější?')}
            {renderBarChart(stats.q5_stats, 'q5', 'Q5: Kde potřebuje víc péče?')}
            {renderBarChart(stats.q6_stats, 'q6', 'Q6: Kdy se daří cvičit?')}
            {renderBarChart(stats.q7_stats, 'q7', 'Q7: Jak začít udržitelně?')}
            {renderBarChart(stats.q8_stats, 'q8', 'Q8: E-mailové preference')}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Volitelné otázky (9-11)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(stats.q9_stats).length > 0 && renderBarChart(stats.q9_stats, 'q9', 'Q9: Co tě přivedlo sem?')}
            {Object.keys(stats.q10_stats).length > 0 && renderBarChart(stats.q10_stats, 'q10', 'Q10: Co štve na platformách?')}
            {Object.keys(stats.q11_stats).length > 0 && renderBarChart(stats.q11_stats, 'q11', 'Q11: Definice úspěchu')}
          </div>
          {Object.keys(stats.q9_stats).length === 0 && Object.keys(stats.q10_stats).length === 0 && Object.keys(stats.q11_stats).length === 0 && (
            <p className="text-center text-gray-500 py-8">Zatím žádné odpovědi na volitelné otázky</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-600" />
              Priority podle obsahu
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Face jóga priorita</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.priority_tags.face_priority}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-pink-600 h-3 rounded-full"
                    style={{ width: `${stats.total_responses > 0 ? (stats.priority_tags.face_priority / stats.total_responses) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Fyzio priorita</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.priority_tags.fyzio_priority}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${stats.total_responses > 0 ? (stats.priority_tags.fyzio_priority / stats.total_responses) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Mind & Life priorita</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.priority_tags.mindlife_priority}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${stats.total_responses > 0 ? (stats.priority_tags.mindlife_priority / stats.total_responses) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6 text-teal-600" />
              Odvozené kandidáty
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">High capacity (možný L2)</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.capacity_candidates.high_capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${stats.total_responses > 0 ? (stats.capacity_candidates.high_capacity / stats.total_responses) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">Restart kandidáti</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.capacity_candidates.restart}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${stats.total_responses > 0 ? (stats.capacity_candidates.restart / stats.total_responses) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </AdminLayout>
  );
};
