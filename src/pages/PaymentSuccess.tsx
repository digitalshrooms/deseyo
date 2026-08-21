import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { getPaymentStatus, GoPayState } from '../services/gopayService';
import { createInvoiceRecord } from '../services/invoiceService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const FAST_INTERVAL_MS = 1000;
const SLOW_INTERVAL_MS = 2000;
const FAST_POLLS = 10;
const MAX_POLLS = 25;

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const paymentId = searchParams.get('id');
  // planFromUrl is only a hint — the authoritative source is always the DB payment record
  const planFromUrl = searchParams.get('plan') as 'L1' | 'L2' | null;
  // source=upgrade means the user came from the profile upgrade flow, not initial onboarding
  const sourceUpgrade = searchParams.get('source') === 'upgrade';

  const [state, setState] = useState<GoPayState | null>(null);
  const [phase, setPhase] = useState<'checking' | 'activating' | 'done' | 'failed' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activatedPlan, setActivatedPlan] = useState<'L1' | 'L2' | null>(null);

  const pollCount = useRef(0);
  const activatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activateUser = async () => {
    if (activatingRef.current) return;
    activatingRef.current = true;
    setPhase('activating');

    let userId = user?.id;
    if (!userId) {
      await new Promise(r => setTimeout(r, 800));
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }

    if (userId) {
      // Always read the plan from the DB payment record — never trust the URL param alone
      let plan: 'L1' | 'L2' = planFromUrl ?? 'L1';

      let paymentAmount = 0;
      let paymentProductName = '';

      if (paymentId) {
        const { data: paymentRows } = await supabase
          .from('payments')
          .select('subscription_type, amount, product_name')
          .eq('gopay_payment_id', paymentId)
          .maybeSingle();

        if (paymentRows?.subscription_type === 'L1' || paymentRows?.subscription_type === 'L2') {
          plan = paymentRows.subscription_type;
        }
        paymentAmount = paymentRows?.amount ?? 0;
        paymentProductName = paymentRows?.product_name ?? `Deseyo ${plan} – měsíční členství`;
      }

      setActivatedPlan(plan);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const updates = {
        subscription_status: 'active',
        subscription_type: plan,
        subscription_plan: plan,
        subscription_expires_at: periodEnd.toISOString(),
        level_tag: plan,
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('[PaymentSuccess] DB update error:', error.message);
        await new Promise(r => setTimeout(r, 500));
        await supabase.from('users').update(updates).eq('id', userId);
      } else {
        console.log('[PaymentSuccess] user activated, plan:', plan, 'userId:', userId);
      }

      await refreshUser();

      // Create invoice record (non-blocking — failure doesn't affect activation)
      if (paymentAmount > 0 && userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', userId)
          .maybeSingle();

        createInvoiceRecord({
          userId,
          paymentId,
          amount: paymentAmount,
          productName: paymentProductName,
          subscriptionType: plan,
          buyerName: userData?.name ?? null,
          buyerEmail: userData?.email ?? null,
        }).catch((err) => console.error('[PaymentSuccess] invoice creation failed:', err));
      }
    } else {
      console.warn('[PaymentSuccess] no userId found — GoPay webhook will handle activation');
    }

    setPhase('done');
  };

  useEffect(() => {
    if (!paymentId) {
      setPhase('error');
      setErrorMsg('Platební ID chybí. Kontaktujte podporu.');
      return;
    }

    const poll = async () => {
      try {
        const s = await getPaymentStatus(paymentId);
        setState(s);

        if (s === 'PAID' || s === 'AUTHORIZED') {
          await activateUser();
          return;
        }

        if (s === 'CANCELED' || s === 'TIMEOUTED') {
          setPhase('failed');
          // If user came from profile upgrade and cancelled, redirect back to profile
          if (sourceUpgrade) {
            setTimeout(() => navigate('/profil', { replace: true }), 2500);
          }
          return;
        }

        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          const delay = pollCount.current < FAST_POLLS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
          timerRef.current = setTimeout(poll, delay);
        } else {
          setPhase('error');
          setErrorMsg('Ověření platby trvá déle než obvykle. Obnovte stránku nebo kontaktujte podporu.');
        }
      } catch (err) {
        console.error('[PaymentSuccess] poll error:', err);
        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          const delay = pollCount.current < FAST_POLLS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS;
          timerRef.current = setTimeout(poll, delay);
        } else {
          setPhase('error');
          setErrorMsg('Nepodařilo se ověřit platbu. Obnovte stránku nebo kontaktujte podporu.');
        }
      }
    };

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [paymentId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleContinue = () => {
    if (sourceUpgrade || user?.onboarding_completed) {
      navigate('/moje-cesta', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ backgroundColor: 'var(--primary)' }} />

      <div className="relative z-10 max-w-md w-full">
        <div className="flex justify-center mb-10">
          <img src="/images/logo_vedle.png" alt="Deseyo" className="h-7 object-contain" />
        </div>

        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>

          {(phase === 'checking' || phase === 'activating') && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'var(--primary-soft)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-9 h-9 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-normal mb-2" style={{ color: 'var(--text)' }}>
                  {phase === 'activating' ? 'Aktivuji členství…' : 'Ověřujeme platbu…'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {phase === 'activating'
                    ? 'Skoro hotovo, ještě okamžik.'
                    : 'Čekáme na potvrzení od GoPay.'}
                </p>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-soft)' }}>
                <CheckCircle className="w-11 h-11" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-normal tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--primary)' }}>
                  Platba potvrzena
                </p>
                <h1 className="font-normal mb-2" style={{ fontSize: 'clamp(24px, 5vw, 32px)', color: 'var(--primary)' }}>Vítejte v Deseyo!</h1>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Vaše členství{activatedPlan ? ` ${activatedPlan}` : ''} je aktivní. Čeká vás krátký dotazník — připravíme program přesně pro vás.
                </p>
                {paymentId && (
                  <p className="text-xs mt-3" style={{ color: 'var(--text-subtle)' }}>ID: {paymentId}</p>
                )}
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-xl font-normal text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Pokračovat <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
                <Shield className="w-3.5 h-3.5" />
                <span>Členství lze kdykoliv zrušit</span>
              </div>
            </div>
          )}

          {phase === 'failed' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-normal mb-1" style={{ color: 'var(--text)' }}>Platba nebyla dokončena</h2>
                {state && (
                  <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                    Stav: <span className="font-normal text-red-600">{state}</span>
                  </p>
                )}
                <p className="text-xs mb-5" style={{ color: 'var(--text-subtle)' }}>Nebylo vám nic účtováno.</p>
                <button
                  onClick={() => navigate(sourceUpgrade ? '/profil' : '/vyber-planu', { replace: true })}
                  className="w-full py-3.5 rounded-xl font-normal text-sm text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {sourceUpgrade ? 'Zpět do profilu' : 'Zkusit znovu'}
                </button>
              </div>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-normal mb-2" style={{ color: 'var(--text)' }}>Problém s ověřením</h2>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {errorMsg ?? 'Platba mohla proběhnout. Zkuste obnovit stránku.'}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3.5 rounded-xl font-normal text-sm transition-colors flex items-center justify-center gap-2"
                    style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <RefreshCw className="w-4 h-4" /> Obnovit stránku
                  </button>
                  <button
                    onClick={() => navigate(sourceUpgrade ? '/profil' : '/vyber-planu', { replace: true })}
                    className="w-full py-3.5 rounded-xl text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {sourceUpgrade ? 'Zpět do profilu' : 'Zpět na výběr plánu'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
