import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  Shield,
  Check,
  Tag,
  X,
  User as UserIcon,
  Mail,
  MapPin,
  Home as HomeIcon,
  Hash,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createGoPayPayment, activateFreeSubscription } from '../services/gopayService';

const PLANS = {
  L1: { id: 'L1', name: 'Deseyo L1', price: 299, amount: 29900 },
  L2: { id: 'L2', name: 'Deseyo L2', price: 399, amount: 39900 },
} as const;

type PlanId = keyof typeof PLANS;

interface DiscountResult {
  valid: boolean;
  error?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  original_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  code?: string;
}

export const BillingDetails = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planParam = (params.get('plan') || '').toUpperCase() as PlanId;
  const plan = PLANS[planParam] ?? PLANS.L1;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [discountInput, setDiscountInput] = useState('');
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedImmediateAccess, setAgreedImmediateAccess] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);
  const [showConsentErrors, setShowConsentErrors] = useState(false);

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

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setStreet(user.street || '');
      setCity(user.city || '');
      setPostalCode(user.zip || '');
    }
  }, [user]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const postalValid = /^\d{5}$/.test(postalCode.trim());

  const formValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    emailValid &&
    street.trim() !== '' &&
    city.trim() !== '' &&
    postalValid;

  const finalAmount = discount?.valid ? (discount.final_amount ?? plan.amount) : plan.amount;
  const finalPrice = Math.round(finalAmount / 100);

  const nextPaymentDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const handleVerifyCode = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setVerifying(true);
    setDiscountError('');
    setDiscount(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-discount-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ code, plan_id: plan.id, base_amount: plan.amount }),
        }
      );
      const data: DiscountResult = await res.json();

      if (!res.ok || !data.valid) {
        setDiscountError(data.error || 'Kód nelze uplatnit.');
        setDiscount(null);
      } else {
        setDiscount(data);
      }
    } catch {
      setDiscountError('Nepodařilo se ověřit kód. Zkuste to znovu.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemoveCode = () => {
    setDiscount(null);
    setDiscountInput('');
    setDiscountError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || submitting) return;

    if (!agreedTerms || !agreedImmediateAccess) {
      setShowConsentErrors(true);
      return;
    }

    if (!user) return;

    setSubmitting(true);
    setError('');

    try {
      const { error: saveError } = await updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        street: street.trim(),
        city: city.trim(),
        zip: postalCode.trim(),
      });
      if (saveError) throw saveError;

      // 100%-discount codes bring the price to 0 — GoPay refuses to create a 0,-
      // card payment, so skip it entirely and activate the subscription directly.
      if (discount?.valid && finalAmount === 0) {
        await activateFreeSubscription({
          user_id: user.id,
          subscription_type: plan.id,
          discount_code: discount.code!,
        });
        await refreshUser();
        navigate('/moje-cesta', { replace: true });
        return;
      }

      const result = await createGoPayPayment({
        subscription_type: plan.id,
        amount: finalAmount,
        original_amount: plan.amount,
        currency: 'CZK',
        product_name: `${plan.name} – měsíční členství`,
        user_id: user.id,
        return_url: `${window.location.origin}/stav-platby?plan=${plan.id}`,
        discount_code: discount?.valid ? discount.code : undefined,
      });
      window.location.href = result.payment_url;
    } catch (err) {
      console.error('Payment error:', err);
      setError('Nepodařilo se spustit platbu. Zkuste to prosím znovu.');
      setSubmitting(false);
    }
  };

  const fieldClass = (fieldName: string, isValid: boolean) => {
    const isTouched = touched[fieldName];
    return `w-full border rounded-xl outline-none text-sm transition-all py-2.5 pl-11 pr-4 ${
      isTouched && !isValid
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'focus:ring-2'
    }`;
  };

  const fieldStyle = (fieldName: string, isValid: boolean): React.CSSProperties => {
    const isTouched = touched[fieldName];
    return {
      backgroundColor: 'var(--bg-elevated)',
      color: 'var(--text)',
      borderColor: isTouched && !isValid ? undefined : isTouched && isValid ? 'var(--primary)' : 'var(--border)',
    };
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-sm font-normal mb-1.5" style={{ color: 'var(--text-muted)' }}>{children}</label>
  );

  const SectionHeading = ({ step, children }: { step: number; children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-normal flex-shrink-0 text-white"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        {step}
      </span>
      <h2 className="text-base font-normal" style={{ color: 'var(--text)' }}>{children}</h2>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Background blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />

      <div className="relative z-10 px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-6 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
          >
            <p className="text-xs font-normal tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--primary)' }}>
              Poslední krok
            </p>
            <h1 className="font-normal mb-2 leading-tight" style={{ fontSize: 'clamp(26px, 5vw, 36px)', color: 'var(--primary)' }}>
              Fakturační údaje
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ještě pár údajů a máte hotovo.</p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-5 lg:gap-6">
            {/* ── MAIN COLUMN: FORM ── */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-5 sm:p-6 space-y-5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', animation: 'fadeInUp 0.4s ease-out 0.1s both' }}
            >
              {/* Account section */}
              <div>
                <SectionHeading step={1}>Vaše údaje</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Jméno</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => setTouched({ ...touched, firstName: true })}
                        className={fieldClass('firstName', firstName.trim() !== '')}
                        style={fieldStyle('firstName', firstName.trim() !== '')}
                        placeholder="Jan"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Příjmení</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => setTouched({ ...touched, lastName: true })}
                        className={fieldClass('lastName', lastName.trim() !== '')}
                        style={fieldStyle('lastName', lastName.trim() !== '')}
                        placeholder="Novák"
                        required
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        className={fieldClass('email', emailValid)}
                        style={fieldStyle('email', emailValid)}
                        placeholder="jan@example.com"
                        required
                      />
                    </div>
                    {touched.email && !emailValid && (
                      <p className="text-xs text-red-500 mt-1.5">Zadejte platný e-mail.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address section */}
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <SectionHeading step={2}>Fakturační adresa</SectionHeading>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Ulice a číslo</Label>
                    <div className="relative">
                      <HomeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        onBlur={() => setTouched({ ...touched, street: true })}
                        className={fieldClass('street', street.trim() !== '')}
                        style={fieldStyle('street', street.trim() !== '')}
                        placeholder="Náhorní 123"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Město</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onBlur={() => setTouched({ ...touched, city: true })}
                        className={fieldClass('city', city.trim() !== '')}
                        style={fieldStyle('city', city.trim() !== '')}
                        placeholder="Praha"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>PSČ</Label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        onBlur={() => setTouched({ ...touched, postalCode: true })}
                        className={fieldClass('postalCode', postalValid)}
                        style={fieldStyle('postalCode', postalValid)}
                        placeholder="110 00"
                        required
                      />
                    </div>
                    {touched.postalCode && !postalValid && (
                      <p className="text-xs text-red-500 mt-1.5">Zadejte 5místné PSČ.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount code section */}
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <SectionHeading step={3}>Slevový kód</SectionHeading>
                {discount?.valid ? (
                  <div className="flex items-center justify-between gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-sm font-normal" style={{ color: 'var(--text)' }}>
                          Kód uplatněn: {discount.discount_type === 'percentage'
                            ? `-${discount.discount_value}%`
                            : `-${Math.round((discount.discount_amount ?? 0) / 100)} Kč`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{discount.code}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCode}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-subtle)' }} />
                        <input
                          type="text"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleVerifyCode())}
                          className="w-full rounded-xl outline-none text-sm transition-all py-2.5 pl-11 pr-4 uppercase tracking-wider focus:ring-2"
                          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                          placeholder="ZADEJTE KÓD"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={!discountInput.trim() || verifying}
                        className="px-5 py-3 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Ověřuji...</span>
                          </>
                        ) : (
                          'Použít'
                        )}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-xs text-red-500 mt-2">{discountError}</p>
                    )}
                  </div>
                )}
              </div>

            </form>

            {/* ── SIDEBAR: ORDER SUMMARY + CONSENTS (sticky on desktop) ── */}
            <div
              className="lg:sticky lg:top-6 h-full"
              style={{ animation: 'fadeInUp 0.4s ease-out 0.15s both' }}
            >
              <div className="rounded-2xl p-5 sm:p-6 h-full flex flex-col" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h2 className="text-sm font-normal tracking-widest uppercase mb-[30px]" style={{ color: 'var(--text-subtle)' }}>
                  Shrnutí objednávky
                </h2>

                <div className="grid sm:grid-cols-2 gap-3 flex-1">
                  {/* ── Left: order details ── */}
                  <div className="rounded-xl p-3 h-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-subtle)' }}>Vybrali jste si členství</p>
                        <p className="text-base font-normal" style={{ color: 'var(--text)' }}>{plan.name}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--primary-soft)' }}>
                        <Lock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                      </div>
                    </div>

                    <div className="space-y-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-muted)' }}>Cena plánu</span>
                        {discount?.valid ? (
                          <span className="line-through" style={{ color: 'var(--text-subtle)' }}>{plan.price} Kč</span>
                        ) : (
                          <span style={{ color: 'var(--text)' }}>{plan.price} Kč</span>
                        )}
                      </div>
                      {discount?.valid && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--text-muted)' }}>Sleva</span>
                          <span style={{ color: 'var(--primary)' }}>
                            {discount.discount_type === 'percentage'
                              ? `-${discount.discount_value}%`
                              : `-${Math.round((discount.discount_amount ?? 0) / 100)} Kč`}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline pt-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>Cena dnes</span>
                      <div className="text-right">
                        {discount?.valid && (
                          <span className="text-sm line-through mr-2" style={{ color: 'var(--text-subtle)' }}>{plan.price} Kč</span>
                        )}
                        <span className="text-2xl font-normal" style={{ color: 'var(--text)' }}>{finalPrice} Kč</span>
                        <span className="text-xs ml-1" style={{ color: 'var(--text-subtle)' }}>/ měs.</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-subtle)' }}>Obnovování</span>
                        <span style={{ color: 'var(--text-muted)' }}>Měsíčně</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--text-subtle)' }}>Další platba</span>
                        <span style={{ color: 'var(--text-muted)' }}>{nextPaymentDate}</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed mt-3" style={{ color: 'var(--text-subtle)' }}>
                      Členství můžete kdykoli ukončit ve svém profilu. Přístup vám zůstane do konce již uhrazeného období.
                    </p>
                  </div>

                  {/* ── Right: consents ── */}
                  <div className="rounded-xl p-3 h-full" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
                      Abychom vám mohli členství zpřístupnit hned po zaplacení, potřebujeme ještě několik potvrzení.
                    </p>

                    <div className="space-y-2">
                          <div>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={agreedTerms}
                                onChange={(e) => setAgreedTerms(e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0 cursor-pointer accent-[var(--primary)]"
                              />
                              <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                                Seznámil/a jsem se s{' '}
                                <a href="/obchodni-podminky" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: 'var(--primary)' }}>
                                  Všeobecnými obchodními podmínkami DESEYO
                                </a>{' '}
                                a souhlasím s nimi, seznámil/a jsem se se{' '}
                                <a href="/zasady-ochrany-osobnich-udaju" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: 'var(--primary)' }}>
                                  Zásadami zpracování osobních údajů
                                </a>{' '}
                                a potvrzuji, že je mi 18 let nebo více.
                              </span>
                            </label>
                            {showConsentErrors && !agreedTerms && (
                              <p className="flex items-center gap-1.5 text-[11px] text-red-500 mt-1 ml-5">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                Tento souhlas je povinný.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={agreedImmediateAccess}
                                onChange={(e) => setAgreedImmediateAccess(e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0 cursor-pointer accent-[var(--primary)]"
                              />
                              <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                                Souhlasím, aby mi byl digitální obsah a funkce platformy DESEYO zpřístupněny ihned po zaplacení, tedy před uplynutím 14denní lhůty pro odstoupení od smlouvy.
                                Beru na vědomí, že zahájením plnění mi v rozsahu zpřístupněného digitálního obsahu zaniká zákonné právo odstoupit od smlouvy podle § 1837 písm. l) občanského zákoníku.
                              </span>
                            </label>
                            {showConsentErrors && !agreedImmediateAccess && (
                              <p className="flex items-center gap-1.5 text-[11px] text-red-500 mt-1 ml-5">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                Tento souhlas je povinný.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={agreedMarketing}
                                onChange={(e) => setAgreedMarketing(e.target.checked)}
                                className="mt-0.5 w-3.5 h-3.5 rounded flex-shrink-0 cursor-pointer accent-[var(--primary)]"
                              />
                              <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text)' }}>
                                Chci dostávat e-mailem novinky, tipy ke cvičení a informace o obsahu DESEYO.
                              </span>
                            </label>
                          </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mt-3">
                    {error}
                  </div>
                )}

                <p className="text-xs text-center mt-4 mb-2" style={{ color: 'var(--text-subtle)' }}>
                  Kliknutím na tlačítko odesíláte objednávku zavazující k platbě.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formValid || submitting}
                  className="flex w-full py-3 rounded-xl font-normal text-sm text-white transition-all duration-200 items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Připravuji platbu...
                    </>
                  ) : (
                    `Zaplatit a aktivovat členství · ${finalPrice} Kč`
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zabezpečená platba přes GoPay · Zrušení kdykoliv</span>
                </div>

                <div className="flex items-center justify-center gap-3 mt-3 opacity-50 flex-wrap">
                  <img src="/images/gopay-logo.png" alt="GoPay" className="h-5 object-contain" />
                  <img src="/images/visa.png" alt="Visa" className="h-4 object-contain" />
                  <img src="/images/mastercard.png" alt="Mastercard" className="h-5 object-contain" />
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/vyber-planu')}
                  className="w-full mt-3 pt-3 flex items-center justify-center gap-1.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zpět k výběru plánu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
