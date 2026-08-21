import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User as UserIcon, ArrowLeft, AtSign, EyeOff, Eye, ShieldCheck, RefreshCw } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_h264krr';
const EMAILJS_TEMPLATE_ID = 'template_a577xkm';
const EMAILJS_PUBLIC_KEY = 'saGOmdFFdZT_Ravmd';

const MAX_SENDS_PER_WINDOW = 3;
const RATE_WINDOW_MINUTES = 60;
const CODE_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 30;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

type Step = 'landing' | 'email-register' | 'email-login' | 'verify';

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
};

async function checkRateLimit(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('verification_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('created_at', windowStart);
  return (count ?? 0) < MAX_SENDS_PER_WINDOW;
}

async function sendVerificationCode(
  email: string,
  firstName: string
): Promise<{ ok: boolean; error?: string }> {
  const allowed = await checkRateLimit(email);
  if (!allowed) {
    return { ok: false, error: `Překročen limit. Zkuste to znovu za ${RATE_WINDOW_MINUTES} minut.` };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error: dbError } = await supabase
    .from('verification_codes')
    .insert({ email: email.toLowerCase(), code, expires_at: expiresAt });

  if (dbError) return { ok: false, error: 'Nepodařilo se uložit kód. Zkuste to znovu.' };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        to_name: firstName || email,
        verification_code: code,
        code1: code[0],
        code2: code[1],
        code3: code[2],
        code4: code[3],
        code5: code[4],
        code6: code[5],
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (err) {
    console.error('EmailJS error:', err);
    return { ok: false, error: 'Nepodařilo se odeslat email. Zkuste to znovu.' };
  }

  return { ok: true };
}

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

const InputField = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-normal text-[var(--text-muted)] mb-1.5">
      {label}
      {hint && <><br /><span className="text-xs font-normal text-[var(--text-subtle)]">{hint}</span></>}
    </label>
    {children}
  </div>
);

const inputClass = (extra = '') =>
  `w-full border border-[var(--border)] bg-[var(--bg-elevated)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-transparent outline-none text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] transition-shadow ${extra}`;

const VerificationBoxes = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (idx: number, char: string) => {
    const digits = char.replace(/\D/g, '').slice(0, 1);
    const arr = value.padEnd(6, ' ').split('');
    arr[idx] = digits || ' ';
    const next = arr.join('').trimEnd();
    onChange(next.replace(/ /g, ''));
    if (digits && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const arr = value.split('');
        arr[idx] = '';
        onChange(arr.join(''));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        const arr = value.split('');
        arr[idx - 1] = '';
        onChange(arr.join(''));
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const nextFocus = Math.min(pasted.length, 5);
    refs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleInput(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          autoFocus={idx === 0}
          className="w-11 h-14 text-center text-xl font-normal border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-transparent outline-none text-[var(--text)] bg-[var(--bg-elevated)] transition-shadow caret-transparent"
        />
      ))}
    </div>
  );
};

export const AuthPage = () => {
  const [step, setStep] = useState<Step>('landing');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    scrollTop();
  }, [step]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
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

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('Hesla se neshodují. Zkuste to prosím znovu.');
      return;
    }
    setLoading(true);

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      setError('Tento email je již zaregistrován. Přihlaste se.');
      setLoading(false);
      return;
    }

    const result = await sendVerificationCode(email, firstName);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Nepodařilo se odeslat kód.');
      return;
    }
    startResendCooldown();
    setStep('verify');
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    const result = await sendVerificationCode(email, firstName);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Nepodařilo se odeslat kód.');
      return;
    }
    startResendCooldown();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: record } = await supabase
      .from('verification_codes')
      .select('id, expires_at')
      .eq('email', email.toLowerCase())
      .eq('code', verificationCode.trim())
      .maybeSingle();

    if (!record) {
      setError('Neplatný kód. Zkontrolujte email a zkuste znovu.');
      setLoading(false);
      return;
    }

    if (new Date(record.expires_at) < new Date()) {
      setError('Kód vypršel. Pošlete si nový kód.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(
      email, password, firstName, lastName, username, 'L1'
    );

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    await supabase.from('verification_codes').delete().eq('id', record.id);

    setLoading(false);
    navigate('/vyber-planu');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(loginEmail, loginPassword);
      if (signInError) {
        setError('Nesprávný email nebo heslo');
      } else {
        navigate('/moje-cesta');
      }
    } catch {
      setError('Něco se pokazilo. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) setError('Přihlášení přes Google selhalo');
    } catch {
      setError('Něco se pokazilo. Zkuste to prosím znovu.');
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    try {
      const { error } = await signInWithApple();
      if (error) setError('Přihlášení přes Apple selhalo');
    } catch {
      setError('Něco se pokazilo. Zkuste to prosím znovu.');
    }
  };

  const goTo = (s: Step) => {
    setError('');
    setVerificationCode('');
    setStep(s);
  };

  const goBackToRegister = () => {
    setError('');
    setVerificationCode('');
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(0);
    setStep('email-register');
  };

  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const passwordsMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Subtle background blobs matching homepage */}
      <div
        className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <div
        className="absolute bottom-0 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: 'var(--primary)' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ── LANDING ── */}
            {step === 'landing' && (
              <motion.div key="landing" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-8 pt-10 pb-6 text-center">
                    <h1 className="font-normal mb-2 tracking-tight" style={{ fontSize: 'clamp(24px, 5vw, 30px)', color: 'var(--primary)' }}>
                      Vítejte v Deseyu
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                      Prostor, kde se měníme k lepšímu — začni svou cestu ještě dnes.
                    </p>
                  </div>

                  <div className="px-8 pb-8 space-y-3">
                    <button
                      type="button"
                      onClick={handleAppleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white font-normal py-3.5 px-4 rounded-xl transition-all hover:shadow-md disabled:opacity-50"
                    >
                      <AppleIcon />
                      <span>Pokračovat s Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] text-gray-800 font-normal py-3.5 px-4 rounded-xl border border-[var(--border)] transition-all hover:shadow-sm disabled:opacity-50"
                    >
                      <GoogleIcon />
                      <span>Pokračovat s Google</span>
                    </button>

                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-xs font-normal text-[var(--text-subtle)] tracking-widest">NEBO</span>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <button
                      type="button"
                      onClick={() => goTo('email-register')}
                      className="w-full font-normal py-3.5 px-4 rounded-xl transition-all hover:shadow-md hover:opacity-90 text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      Registrovat s emailem
                    </button>

                    <p className="text-center text-sm text-[var(--text-muted)] pt-1">
                      Už máte účet?{' '}
                      <button
                        type="button"
                        onClick={() => goTo('email-login')}
                        className="font-normal transition-colors"
                        style={{ color: 'var(--primary)' }}
                      >
                        Přihlaste se
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── REGISTER ── */}
            {step === 'email-register' && (
              <motion.div key="register" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-8 pt-8 pb-4 flex items-center gap-3 border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => goTo('landing')}
                      className="text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-elevated)]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg font-normal text-[var(--text)]">Vytvořit účet</h2>
                      <p className="text-xs text-[var(--text-subtle)]">Krok 1 ze 3</p>
                    </div>
                  </div>

                  <form onSubmit={handleSendCode} className="px-8 py-6 space-y-5">
                    {/* Name row */}
                    <div>
                      <label className="block text-sm font-normal text-[var(--text-muted)] mb-1.5">Jméno a příjmení<br /><span className="text-xs font-normal text-[var(--text-subtle)]">Nebude sdíleno</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={inputClass('pl-9 pr-3 py-2.5')}
                            placeholder="Jméno"
                            required
                          />
                        </div>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={inputClass('px-3 py-2.5')}
                          placeholder="Příjmení"
                          required
                        />
                      </div>
                    </div>

                    <InputField label="Uživatelské jméno" hint="Pod tímto jménem tě uvidí ostatní na platformě">
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                          className={inputClass('pl-9 pr-4 py-2.5')}
                          placeholder="jak_te_uvidí_ostatní"
                          required
                        />
                      </div>
                    </InputField>

                    <InputField label="Email">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClass('pl-9 pr-4 py-2.5')}
                          placeholder="jan@example.com"
                          required
                        />
                      </div>
                    </InputField>

                    <InputField label="Heslo" hint="Minimálně 6 znaků">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={inputClass('pl-9 pr-10 py-2.5')}
                          placeholder="Zadej heslo"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </InputField>

                    <InputField label="Potvrzení hesla">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          className={inputClass(
                            `pl-9 pr-10 py-2.5 ${
                              passwordsMismatch
                                ? 'border-red-300 bg-red-50'
                                : passwordsMatch
                                ? 'border-green-300 bg-green-50/60'
                                : ''
                            }`
                          )}
                          placeholder="Zopakuj heslo"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors"
                        >
                          {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordsMismatch && (
                        <p className="text-xs text-red-500 mt-1">Hesla se neshodují</p>
                      )}
                      {passwordsMatch && (
                        <p className="text-xs text-green-600 mt-1">Hesla se shodují</p>
                      )}
                    </InputField>

                    {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 font-normal rounded-xl transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {loading ? 'Odesílám kód...' : 'Pokračovat'}
                    </button>

                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Už máte účet?{' '}
                      <button
                        type="button"
                        onClick={() => goTo('email-login')}
                        className="font-normal transition-colors"
                        style={{ color: 'var(--primary)' }}
                      >
                        Přihlaste se
                      </button>
                    </p>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── VERIFY ── */}
            {step === 'verify' && (
              <motion.div key="verify" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-8 pt-8 pb-4 flex items-center gap-3 border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={goBackToRegister}
                      className="text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-elevated)]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg font-normal text-[var(--text)]">Ověř svůj email</h2>
                      <p className="text-xs text-[var(--text-subtle)]">Krok 2 ze 3</p>
                    </div>
                  </div>

                  <form onSubmit={handleVerify} className="px-8 py-8 space-y-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary-soft)' }}
                      >
                        <ShieldCheck className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          Na váš email{' '}
                          <span className="font-normal text-[var(--text)]">{email}</span>{' '}
                          jsme poslali 6místný ověřovací kód.
                        </p>
                        <p className="text-xs text-[var(--text-subtle)] mt-1.5">
                          Platnost kódu je {CODE_EXPIRY_MINUTES} minut.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <VerificationBoxes
                        value={verificationCode}
                        onChange={setVerificationCode}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || verificationCode.length < 6}
                      className="w-full py-3.5 font-normal rounded-xl transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {loading ? 'Ověřuji...' : 'Ověřit účet'}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || loading}
                        className="inline-flex items-center gap-1.5 text-sm font-normal transition-colors disabled:text-[var(--text-subtle)] disabled:cursor-not-allowed"
                        style={{ color: resendCooldown > 0 ? undefined : '#198379' }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {resendCooldown > 0
                          ? `Znovu poslat kód (${resendCooldown}s)`
                          : 'Znovu poslat kód'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── LOGIN ── */}
            {step === 'email-login' && (
              <motion.div key="login" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-8 pt-8 pb-4 flex items-center gap-3 border-b border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => goTo('landing')}
                      className="text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-elevated)]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-normal text-[var(--text)]">Přihlásit se</h2>
                  </div>

                  <form onSubmit={handleEmailLogin} className="px-8 py-6 space-y-5">
                    <InputField label="Email">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className={inputClass('pl-9 pr-4 py-2.5')}
                          placeholder="jan@example.com"
                          required
                        />
                      </div>
                    </InputField>

                    <InputField label="Heslo">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)] pointer-events-none" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className={inputClass('pl-9 pr-10 py-2.5')}
                          placeholder="Vaše heslo"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </InputField>

                    {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 font-normal rounded-xl transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {loading ? 'Přihlašuji...' : 'Přihlásit se'}
                    </button>

                    <p className="text-center text-sm text-[var(--text-muted)]">
                      Nemáte účet?{' '}
                      <button
                        type="button"
                        onClick={() => goTo('landing')}
                        className="font-normal transition-colors"
                        style={{ color: 'var(--primary)' }}
                      >
                        Registrujte se
                      </button>
                    </p>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-[var(--text-subtle)] text-center max-w-sm">
          Registrací souhlasíte s{' '}
          <a href="/obchodni-podminky" className="underline hover:text-[var(--text-muted)] transition-colors">
            obchodními podmínkami
          </a>{' '}
          a{' '}
          <a href="/zasady-ochrany-soukromi" className="underline hover:text-[var(--text-muted)] transition-colors">
            zásadami ochrany soukromí
          </a>
          .
        </p>
      </div>
    </div>
  );
};
