import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditService } from '../services/creditService';
import { Gift, Check, Lock, CalendarDays, Clock } from 'lucide-react';

export const CreditsCard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingDismissed, setBookingDismissed] = useState(false);

  if (!user) return null;

  const credits = user.consultation_credits ?? 0;
  const isL2 = user.level_tag === 'L2';
  const showBookingPrompt = isL2 && credits >= 4 && !bookingDismissed;

  const handleSpecialMoment = async () => {
    setClaiming(true);
    setClaimMsg(null);
    const res = await CreditService.claimSpecialMoment(user.id);
    if (res.ok) {
      setClaimMsg('Tvůj kredit byl přidán. Děkujeme za otevřenost.');
      await refreshUser();
    } else if (res.daysRemaining !== undefined) {
      setClaimMsg(`Další Zvláštní moment bude dostupný za ${res.daysRemaining} dní.`);
    } else {
      setClaimMsg('Něco se nepovedlo. Zkus to prosím znovu.');
    }
    setClaiming(false);
    setConfirmOpen(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-teal-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Kredity na konzultaci</h3>
          <p className="text-3xl font-bold text-gray-900">
            {credits} <span className="text-lg font-normal text-gray-500">/ 4</span>
          </p>
          {!isL2 ? (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Využiješ je v L2 — čekají na tebe.
            </p>
          ) : credits >= 4 ? (
            <p className="text-sm text-teal-700 mt-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Máš dost kreditů na konzultaci.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Potřebuješ {4 - credits} kredit{4 - credits === 1 ? '' : 'y'} na konzultaci.
            </p>
          )}
        </div>
      </div>

      {showBookingPrompt && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-teal-900 mb-3">
            Máš dost kreditů na konzultaci. Chceš ji rezervovat?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/kontakt')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Rezervovat termín
            </button>
            <button
              onClick={() => setBookingDismissed(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Uložit na jindy
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Zvláštní moment</h4>
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">
          Když bylo pro tebe něco těžké — a vydržela jsi, můžeš si přidat jeden kredit.
          Jednou za 60 dní. Nic se neověřuje, je to mezi tebou a tebou.
        </p>
        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={claiming}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            Přidat kredit za Zvláštní moment
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpecialMoment}
              disabled={claiming}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {claiming ? 'Ukládám...' : 'Potvrdit'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Zrušit
            </button>
          </div>
        )}
        {claimMsg && (
          <p className="mt-2 text-sm text-gray-700">{claimMsg}</p>
        )}
      </div>
    </div>
  );
};
