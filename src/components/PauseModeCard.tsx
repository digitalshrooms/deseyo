import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PauseService } from '../services/pauseService';
import { Pause, Calendar, Play } from 'lucide-react';

type Status = {
  active: boolean;
  start: string | null;
  end: string | null;
  count90d: number;
  remaining: number;
};

export const PauseModeCard = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      PauseService.getPauseStatus(user.id).then(setStatus);
    }
  }, [user]);

  const maxDays = PauseService.getMaxPauseDays();

  const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  const getMaxEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + maxDays);
    return d.toISOString().slice(0, 10);
  };

  const handleStart = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    const date = endDate ? new Date(endDate + 'T23:59:59') : new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    const res = await PauseService.startPause(user.id, date);
    if (!res.ok) {
      setError(res.error || 'Chyba pri spusteni pauzy');
    } else {
      const updated = await PauseService.getPauseStatus(user.id);
      setStatus(updated);
      await refreshUser();
    }
    setLoading(false);
  };

  const handleEnd = async () => {
    if (!user) return;
    setLoading(true);
    await PauseService.endPauseNow(user.id);
    const updated = await PauseService.getPauseStatus(user.id);
    setStatus(updated);
    await refreshUser();
    setLoading(false);
  };

  if (!status) return null;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Pause className="w-6 h-6 text-blue-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Dat si pauzu</h3>
          <p className="text-sm text-gray-600 mt-1">
            Max {maxDays} dni. Tvuj plan zustava presne tam, kde jsi ho nechala.
          </p>
        </div>
      </div>

      {status.active ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-800 mb-2">
            <strong>Pauza je aktivni.</strong>
          </p>
          {status.end && (
            <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              Konec pauzy: {new Date(status.end).toLocaleDateString('cs-CZ')}
            </p>
          )}
          <button
            onClick={handleEnd}
            disabled={loading}
            className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            Vratit se k planu
          </button>
        </div>
      ) : status.remaining === 0 ? (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          Vycerpala jsi 2 pauzy za poslednich 90 dni. Mozna je cas zvazit Restart plan.
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum navratu</label>
            <input
              type="date"
              value={endDate || getDefaultEndDate()}
              min={getDefaultEndDate()}
              max={getMaxEndDate()}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
            />
          </div>
          <p className="text-xs text-gray-500">
            Zbyva ti {status.remaining} pauz{status.remaining === 1 ? 'a' : 'y'} v poslednich 90 dnech.
          </p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ukladam...' : 'Spustit pauzu'}
          </button>
        </div>
      )}
    </div>
  );
};
