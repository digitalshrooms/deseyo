import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, CreditCard, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createGoPayPayment } from '../services/gopayService';

const PLANS = [
  {
    id: 'monthly',
    name: 'Měsíční členství',
    price: 199,
    priceLabel: '199 Kč',
    period: '/ měsíc',
    amount: 19900,
    product_name: 'Měsíční členství DESEYO',
    features: [
      'Plný přístup ke všem lekcím',
      'FyzioYoga & FaceYoga programy',
      'Živá setkání každý měsíc',
      'Osobní plán na míru',
      'Zrušení kdykoliv',
    ],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Roční členství',
    price: 1490,
    priceLabel: '1 490 Kč',
    period: '/ rok',
    amount: 149000,
    product_name: 'Roční členství DESEYO',
    features: [
      'Plný přístup ke všem lekcím',
      'FyzioYoga & FaceYoga programy',
      'Živá setkání každý měsíc',
      'Osobní plán na míru',
      'Prioritní podpora',
      'Ušetříš 898 Kč oproti měsíčnímu',
    ],
    highlight: true,
    badge: 'Nejoblíbenější',
  },
];

export const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (plan: typeof PLANS[0]) => {
    setError(null);
    setLoadingPlan(plan.id);

    try {
      const result = await createGoPayPayment({
        amount: plan.amount,
        currency: 'CZK',
        product_name: plan.product_name,
        user_id: user?.id,
        return_url: `${window.location.origin}/stav-platby`,
      });

      // Redirect user to GoPay payment gateway
      window.location.href = result.payment_url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nepodařilo se zahájit platbu. Zkuste to prosím znovu.'
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="pt-20 pb-12 px-6 text-center">
        <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">
          Ceník
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Začni svou cestu
          <br />
          <span className="text-teal-400">k lepšímu tělu</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Vyberte si plán, který vám nejvíce vyhovuje. Bez závazků, bez skrytých poplatků.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-2xl mx-auto px-6 mb-8">
          <div className="flex items-start gap-3 bg-red-950/60 border border-red-800/50 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
              plan.highlight
                ? 'border-teal-500/60 bg-gradient-to-b from-teal-950/40 to-gray-900/60 shadow-xl shadow-teal-900/20'
                : 'border-gray-800 bg-gray-900/40'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-4xl font-extrabold text-white">{plan.priceLabel}</span>
                <span className="text-gray-400 mb-1">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePayment(plan)}
              disabled={loadingPlan !== null}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                plan.highlight
                  ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-900/40'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingPlan === plan.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Přesměrování na platební bránu…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Zaplatit
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="border border-gray-800 rounded-2xl bg-gray-900/30 px-8 py-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-teal-900/50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Zabezpečená platba</p>
                <p className="text-gray-400 text-xs">Šifrování SSL / TLS</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-800" />
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-teal-900/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Platba přes GoPay</p>
                <p className="text-gray-400 text-xs">Certifikovaná platební brána</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-800" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Platba bude provedena přes zabezpečenou platební bránu{' '}
              <span className="text-white font-medium">GoPay</span>. Vaše platební údaje
              nejsou nikdy ukládány na našich serverech.
            </p>
          </div>

          {/* Payment logos */}
          <div className="mt-6 pt-5 border-t border-gray-800 flex items-center gap-3 flex-wrap justify-center">
            {['visa', 'mastercard', 'maestro', 'visa-electron', 'mastercard-electronic'].map((logo) => (
              <img
                key={logo}
                src={`/images/${logo}.png`}
                alt={logo}
                className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
            <img
              src="/images/gopay-logo.png"
              alt="GoPay"
              className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
