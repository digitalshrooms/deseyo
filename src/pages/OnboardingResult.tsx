import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, CreditCard, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createGoPayPayment } from '../services/gopayService';

const PLAN_PRICING: Record<string, { amount: number; label: string; product_name: string; subscription_type: 'L1' | 'L2' } | null> = {
  Restart: null,
  L1: { amount: 29900, label: '299 Kč / měsíc', product_name: 'Deseyo L1 – měsíční členství', subscription_type: 'L1' },
  L2: { amount: 39900, label: '399 Kč / měsíc', product_name: 'Deseyo L2 – měsíční členství', subscription_type: 'L2' },
};

const PLAN_DETAILS = {
  Restart: {
    title: 'Restart',
    subtitle: 'Jemný začátek pro návrat do rytmu',
    description: 'Na základě tvých odpovědí jsme pro tebe vybrali program Restart. Je navržený tak, aby ti pomohl začít jemně, najít si vlastní tempo a postupně se dostat zpátky do pravidelného pohybu.',
    features: ['3 dny cvičení týdně', 'Jemné lekce přizpůsobené začátku', 'Důraz na vytvoření udržitelného rytmu', 'Žádný tlak, vlastní tempo'],
  },
  L1: {
    title: 'Deseyo L1',
    subtitle: 'Pravidelný základ pro udržitelný rozvoj',
    description: 'Na základě tvých odpovědí jsme pro tebe vybrali program Deseyo L1. Je navržený tak, aby ti dal jasný plán, pravidelnost a pomohl ti cítit se lépe v každodenním životě.',
    features: ['4 dny cvičení týdně', 'Strukturovaný program s jasným vedením', 'Propojení fyzio jógy, face jógy a Mind & Life', 'Důraz na pravidelnost a dlouhodobé výsledky'],
  },
  L2: {
    title: 'Deseyo L2',
    subtitle: 'Intenzivní program pro hlubší posun',
    description: 'Na základě tvých odpovědí jsme pro tebe vybrali program Deseyo L2. Je navržený pro ty, kdo chtějí jít o kus dál, mají kapacitu na pravidelné cvičení a hledají intenzivnější vedení.',
    features: ['4–5 dní cvičení týdně', 'Náročnější lekce s větším tahem', 'Komplexní přístup k tělu i mysli', 'Důraz na viditelný posun a pokrok'],
  },
};

export const OnboardingResult = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') as 'Restart' | 'L1' | 'L2' | null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) navigate('/moje-cesta', { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  const details = PLAN_DETAILS[plan];
  const pricing = PLAN_PRICING[plan];

  const handleContinue = async () => {
    if (!user || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      // Always read fresh from DB — the closure `user` may be stale from before
      // the questionnaire was submitted or before a payment landed
      const { data: freshUser, error: fetchError } = await supabase
        .from('users')
        .select('subscription_status, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const isActive =
        freshUser?.subscription_status === 'active' ||
        user.subscription_status === 'active';

      console.log('[OnboardingResult] fresh sub_status:', freshUser?.subscription_status, '| context sub_status:', user.subscription_status, '| isActive:', isActive);

      // User already has an active subscription (paid via ChoosePlan before questionnaire,
      // or already went through GoPay from this screen previously) → go straight to app
      if (isActive) {
        console.log('[OnboardingResult] subscription active → /moje-cesta');
        await refreshUser();
        navigate('/moje-cesta', { replace: true });
        return;
      }

      // Restart plan — no payment needed
      if (!pricing) {
        console.log('[OnboardingResult] Restart plan — activating directly');
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase.from('users').update({
          onboarding_completed: true,
          subscription_status: 'active',
          subscription_type: null,
          subscription_expires_at: periodEnd.toISOString(),
        }).eq('id', user.id);

        await refreshUser();
        navigate('/moje-cesta', { replace: true });
        return;
      }

      // L1 / L2 — redirect to GoPay
      console.log('[OnboardingResult] creating payment for plan', pricing.subscription_type);
      const result = await createGoPayPayment({
        subscription_type: pricing.subscription_type,
        amount: pricing.amount,
        currency: 'CZK',
        product_name: pricing.product_name,
        user_id: user.id,
        return_url: `${window.location.origin}/stav-platby?plan=${pricing.subscription_type}`,
      });
      window.location.href = result.payment_url;

    } catch (err) {
      console.error('[OnboardingResult] error:', err);
      setError('Nastala chyba. Zkuste to prosím znovu.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-teal-600" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-2">
            Pro tebe teď dává největší smysl začít tady:
          </h1>

          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-teal-600 mb-2">{details.title}</h2>
            <p className="text-lg text-gray-600">{details.subtitle}</p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 leading-relaxed">{details.description}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Co tě čeká:</h3>
            <ul className="space-y-3">
              {details.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing block — only shown if no active subscription yet */}
          {pricing && user?.subscription_status !== 'active' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Členství {details.title}</span>
                <span className="text-2xl font-bold text-gray-900">{pricing.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="w-3.5 h-3.5" />
                <span>Platba přes zabezpečenou bránu GoPay</span>
              </div>
            </div>
          )}

          {!pricing && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 text-center">
                Tento plán můžeš kdykoli změnit ve svém profilu.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-4 rounded-xl font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {pricing && user?.subscription_status !== 'active' ? 'Připravuji platbu…' : 'Pokračuji…'}
              </>
            ) : pricing && user?.subscription_status !== 'active' ? (
              <><CreditCard className="w-5 h-5" /> Zaplatit a začít</>
            ) : (
              <>Pokračovat do platformy <ArrowRight className="w-5 h-5" /></>
            )}
          </button>

          {pricing && user?.subscription_status !== 'active' && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Kliknutím budeš přesměrována na platební bránu GoPay.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
