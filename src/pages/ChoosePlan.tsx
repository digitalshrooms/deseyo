import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PLANS = [
  {
    id: 'L1' as const,
    name: 'Deseyo L1',
    price: 299,
    amount: 29900,
    period: 'měsíc',
    tagline: 'Pravidelný základ',
    description: 'Strukturovaný program pro udržitelný rozvoj pohybu a mysli.',
    features: [
      'Plný přístup ke všem lekcím',
      'FyzioYoga & FaceYoga programy',
      'Osobní plán na míru',
      'Živá setkání každý měsíc',
      'Zrušení kdykoliv',
    ],
    icon: Zap,
    highlight: false,
  },
  {
    id: 'L2' as const,
    name: 'Deseyo L2',
    price: 399,
    amount: 39900,
    period: 'měsíc',
    tagline: 'Intenzivní rozvoj',
    description: 'Pro ty, kdo chtějí jít dál. Komplexní přístup s konzultacemi.',
    features: [
      'Vše z L1',
      'Konzultační kredity s lektorkou',
      'Prioritní podpora',
      'Exkluzivní obsah a workshopy',
      'Zrušení kdykoliv',
    ],
    icon: Crown,
    highlight: true,
    badge: 'Nejoblíbenější',
  },
] as const;

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export const ChoosePlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'L1' | 'L2' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');

    // ThemeProvider's own effect can fire after this one on a fresh page
    // load and re-apply the stored (possibly dark) theme, so keep forcing
    // light for as long as this page is mounted.
    const observer = new MutationObserver(() => {
      if (root.getAttribute('data-theme') !== 'light') root.setAttribute('data-theme', 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
      if (prev) root.setAttribute('data-theme', prev);
    };
  }, []);

  const handleSelect = (id: 'L1' | 'L2') => {
    setSelected(id);
    setError(null);
  };

  const handleContinue = (planId: 'L1' | 'L2') => {
    if (!user) return;
    setError(null);
    navigate(`/fakturacni-udaje?plan=${planId}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Background blobs matching homepage hero */}
      <div
        className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <div
        className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: 'var(--primary)' }}
      />

      <div className="relative z-10 px-4 py-16 sm:py-24">
        {/* Header */}
        <motion.div
          className="text-center mb-14 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p
            className="text-xs font-normal tracking-[0.2em] uppercase mb-3"
            style={{ color: 'var(--primary)' }}
          >
            Krok 3 ze 3
          </p>
          <h1 className="font-normal mb-4 leading-tight" style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: 'var(--primary)' }}>
            Vyber si svou cestu
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Začni svou proměnu ještě dnes. Zrušit lze kdykoliv.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mx-auto mb-8">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const isSelected = selected === plan.id;
            return (
              <motion.div
                key={plan.id}
                custom={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="relative"
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="text-white text-xs font-normal px-4 py-1.5 rounded-full shadow-sm"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelect(plan.id)}
                  className="w-full text-left rounded-2xl p-6 transition-all duration-200 outline-none group"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    boxShadow: isSelected ? '0 8px 32px rgba(4, 159, 179, 0.12)' : undefined,
                  }}
                >
                  {/* Icon + check row */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{ backgroundColor: isSelected ? 'var(--primary-soft)' : 'var(--bg-elevated)' }}
                    >
                      <Icon
                        className="w-5 h-5 transition-colors"
                        style={{ color: isSelected ? 'var(--primary)' : 'var(--text-subtle)' }}
                      />
                    </div>

                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-strong)',
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Tagline + name */}
                  <p className="text-xs font-normal tracking-widest uppercase mb-1" style={{ color: 'var(--text-subtle)' }}>
                    {plan.tagline}
                  </p>
                  <h3 className="text-xl font-normal mb-2" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                  <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>

                  {/* Price */}
                  <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-4xl font-normal" style={{ color: 'var(--text)' }}>{plan.price}</span>
                    <span className="text-sm ml-1" style={{ color: 'var(--text-subtle)' }}>Kč / {plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: isSelected ? 'var(--primary-soft)' : 'var(--bg-elevated)' }}
                        >
                          <Check
                            className="w-2.5 h-2.5"
                            style={{ color: isSelected ? 'var(--primary)' : 'var(--text-subtle)' }}
                            strokeWidth={3}
                          />
                        </div>
                        <span className="text-sm" style={{ color: isSelected ? 'var(--text)' : 'var(--text-muted)' }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Per-card CTA button */}
                  <div className="mt-6">
                    <div
                      className={`w-full py-3 rounded-xl text-sm font-normal text-center transition-all duration-200 group-hover:scale-105 ${
                        isSelected
                          ? 'text-white'
                          : 'border-2 border-[var(--border)] text-[var(--text-muted)] group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] group-hover:bg-[var(--primary-soft)]'
                      }`}
                      style={isSelected ? { backgroundColor: 'var(--primary)' } : undefined}
                    >
                      {`Vybrat plán`}
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Global CTA */}
        <motion.div
          className="w-full max-w-2xl mx-auto space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <button
            type="button"
            onClick={() => selected && handleContinue(selected)}
            disabled={!selected}
            className="w-full py-4 rounded-xl font-normal text-base text-white transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {selected
              ? `Pokračovat k fakturaci – ${PLANS.find(p => p.id === selected)?.price} Kč / měs.`
              : 'Vyberte plán pro pokračování'}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
            <Shield className="w-3.5 h-3.5" />
            <span>Zabezpečená platba přes GoPay · Zrušení kdykoliv</span>
          </div>
        </motion.div>

        {/* Payment logos */}
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap opacity-50">
          <img src="/images/gopay-logo.png" alt="GoPay" className="h-5 object-contain" />
          <img src="/images/visa.png" alt="Visa" className="h-4 object-contain" />
          <img src="/images/mastercard.png" alt="Mastercard" className="h-5 object-contain" />
          <img src="/images/maestro.png" alt="Maestro" className="h-5 object-contain" />
        </div>
      </div>
    </div>
  );
};
