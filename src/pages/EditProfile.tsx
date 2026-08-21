import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, AtSign, Mail, Loader2, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { SubPageHeader, ProfileField, ProfileAlert, PrimaryBtn } from '../components/profile/ProfileShared';

export const EditProfile = () => {
  const { user, updateUser, sendEmailChangeCode, confirmEmailChange } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState(false);
  const [personalError, setPersonalError] = useState('');

  const [username, setUsername] = useState(user?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Email change flow: idle → enterEmail → verifyCode → done
  const [emailChangeStep, setEmailChangeStep] = useState<'idle' | 'enterEmail' | 'verifyCode' | 'done'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeCode, setEmailChangeCode] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const emailCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) { setFirstName(user.first_name || ''); setLastName(user.last_name || ''); setUsername(user.username || ''); }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (emailCooldownRef.current) clearInterval(emailCooldownRef.current); };
  }, []);

  const startEmailCooldown = () => {
    setEmailResendCooldown(30);
    emailCooldownRef.current = setInterval(() => {
      setEmailResendCooldown(prev => {
        if (prev <= 1) { clearInterval(emailCooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeLoading(true); setEmailChangeError('');
    const { error } = await sendEmailChangeCode(newEmail);
    setEmailChangeLoading(false);
    if (error) { setEmailChangeError(error); return; }
    startEmailCooldown();
    setEmailChangeStep('verifyCode');
  };

  const handleResendEmailChangeCode = async () => {
    if (emailResendCooldown > 0) return;
    setEmailChangeLoading(true); setEmailChangeError('');
    const { error } = await sendEmailChangeCode(newEmail);
    setEmailChangeLoading(false);
    if (error) { setEmailChangeError(error); return; }
    startEmailCooldown();
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeLoading(true); setEmailChangeError('');
    const { error } = await confirmEmailChange(newEmail, emailChangeCode.replace(/\s/g, ''));
    setEmailChangeLoading(false);
    if (error) { setEmailChangeError(error); return; }
    setEmailChangeStep('done');
  };

  const resetEmailChangeFlow = () => {
    setEmailChangeStep('idle');
    setNewEmail('');
    setEmailChangeCode('');
    setEmailChangeError('');
    setEmailResendCooldown(0);
    if (emailCooldownRef.current) clearInterval(emailCooldownRef.current);
  };

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalLoading(true); setPersonalError(''); setPersonalSuccess(false);
    const { error } = await updateUser({
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
    });
    if (error) { setPersonalError('Chyba při aktualizaci jména.'); }
    else { setPersonalSuccess(true); setTimeout(() => setPersonalSuccess(false), 3500); }
    setPersonalLoading(false);
  };

  // Once-per-week cooldown on username changes
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const lastChangedAt = user?.username_changed_at ? new Date(user.username_changed_at).getTime() : null;
  const msUntilNextChange = lastChangedAt ? lastChangedAt + WEEK_MS - Date.now() : 0;
  const usernameOnCooldown = msUntilNextChange > 0;
  const daysUntilNextChange = Math.ceil(msUntilNextChange / (24 * 60 * 60 * 1000));

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameLoading(true); setUsernameError(''); setUsernameSuccess(false);

    if (usernameOnCooldown) {
      setUsernameError(`Uživatelské jméno můžete znovu změnit za ${daysUntilNextChange} ${daysUntilNextChange === 1 ? 'den' : daysUntilNextChange < 5 ? 'dny' : 'dní'}.`);
      setUsernameLoading(false);
      return;
    }

    const trimmed = username.trim();
    if (!trimmed || !/^[a-zA-Z0-9._]{1,20}$/.test(trimmed)) {
      setUsernameError('Uživatelské jméno smí obsahovat jen písmena, čísla, tečku a podtržítko (max. 20 znaků).');
      setUsernameLoading(false);
      return;
    }

    if (trimmed === (user?.username || '')) {
      setUsernameLoading(false);
      return;
    }

    const { error } = await updateUser({
      username: trimmed,
      username_changed_at: new Date().toISOString(),
    });
    if (error) { setUsernameError('Chyba při aktualizaci uživatelského jména.'); }
    else { setUsernameSuccess(true); setUsername(trimmed); setTimeout(() => setUsernameSuccess(false), 3500); }
    setUsernameLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
        <SubPageHeader title="Upravit profil" />

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="p-5 space-y-6">

            {/* Name form */}
            <div>
              <h2 className="text-base font-normal mb-1" style={{ color: 'var(--text)' }}>Jméno a příjmení</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Zobrazované jméno účtu</p>
              <form onSubmit={handleUpdatePersonal} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label="Jméno" icon={<UserIcon className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      required
                    />
                  </ProfileField>
                  <ProfileField label="Příjmení" icon={<UserIcon className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      required
                    />
                  </ProfileField>
                </div>
                <p className="text-[11px] -mt-2" style={{ color: 'var(--text-subtle)' }}>Nebude sdíleno</p>
                {personalError && <ProfileAlert type="error" message={personalError} />}
                {personalSuccess && <ProfileAlert type="success" message="Jméno bylo aktualizováno." />}
                <PrimaryBtn loading={personalLoading} label="Uložit jméno" loadingLabel="Ukládám…" />
              </form>
            </div>

            {/* Username section */}
            <div className="border-t pt-5" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-normal mb-1" style={{ color: 'var(--text)' }}>Uživatelské jméno</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Jen písmena, čísla, tečka a podtržítko, max. 20 znaků. Lze změnit jednou za týden.
              </p>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <ProfileField label="Uživatelské jméno" icon={<AtSign className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    placeholder="uzivatelske.jmeno"
                    maxLength={20}
                    disabled={usernameOnCooldown}
                    required
                  />
                </ProfileField>
                {usernameOnCooldown && (
                  <p className="text-[11px] -mt-2" style={{ color: 'var(--text-subtle)' }}>
                    Další změna možná za {daysUntilNextChange} {daysUntilNextChange === 1 ? 'den' : daysUntilNextChange < 5 ? 'dny' : 'dní'}.
                  </p>
                )}
                {usernameError && <ProfileAlert type="error" message={usernameError} />}
                {usernameSuccess && <ProfileAlert type="success" message="Uživatelské jméno bylo aktualizováno." />}
                <PrimaryBtn loading={usernameLoading} label="Uložit uživatelské jméno" loadingLabel="Ukládám…" />
              </form>
            </div>

            {/* Email change section */}
            <div className="border-t pt-5" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-normal mb-1" style={{ color: 'var(--text)' }}>Emailová adresa</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pro změnu emailu pošleme ověřovací kód na novou adresu</p>

              {/* Current email display */}
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
                <span className="text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{user?.email}</span>
              </div>

              {/* IDLE: show button to start flow */}
              {emailChangeStep === 'idle' && (
                <button
                  onClick={() => { setEmailChangeStep('enterEmail'); setEmailChangeError(''); }}
                  className="text-xs font-normal transition-colors hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  Změnit emailovou adresu
                </button>
              )}

              {/* ENTER NEW EMAIL */}
              {emailChangeStep === 'enterEmail' && (
                <form onSubmit={handleSendEmailChangeCode} className="space-y-3 mt-2">
                  <ProfileField label="Nová emailová adresa" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      placeholder="novy@email.cz"
                      required
                      autoFocus
                    />
                  </ProfileField>
                  {emailChangeError && <ProfileAlert type="error" message={emailChangeError} />}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailChangeLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {emailChangeLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Odesílám…</> : 'Odeslat ověřovací kód'}
                    </button>
                    <button
                      type="button"
                      onClick={resetEmailChangeFlow}
                      className="px-3 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Zrušit
                    </button>
                  </div>
                </form>
              )}

              {/* VERIFY CODE */}
              {emailChangeStep === 'verifyCode' && (
                <form onSubmit={handleConfirmEmailChange} className="space-y-4 mt-2">
                  <div className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: 'var(--primary-soft)', border: '1px solid var(--border)' }}>
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Kód byl odeslán na <strong style={{ color: 'var(--text)' }}>{newEmail}</strong>. Zadejte jej níže pro potvrzení změny.
                    </p>
                  </div>
                  <ProfileVerificationBoxes value={emailChangeCode} onChange={setEmailChangeCode} />
                  {emailChangeError && <ProfileAlert type="error" message={emailChangeError} />}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailChangeLoading || emailChangeCode.replace(/\s/g, '').length < 6}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {emailChangeLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Ověřuji…</> : 'Potvrdit změnu emailu'}
                    </button>
                    <button
                      type="button"
                      onClick={resetEmailChangeFlow}
                      className="px-3 text-sm transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Zrušit
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendEmailChangeCode}
                    disabled={emailResendCooldown > 0 || emailChangeLoading}
                    className="flex items-center gap-1.5 text-xs font-normal transition-colors disabled:cursor-not-allowed"
                    style={{ color: emailResendCooldown > 0 ? 'var(--text-subtle)' : 'var(--primary)' }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {emailResendCooldown > 0 ? `Znovu odeslat (${emailResendCooldown}s)` : 'Znovu odeslat kód'}
                  </button>
                </form>
              )}

              {/* DONE */}
              {emailChangeStep === 'done' && (
                <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                  <div>
                    <p className="text-sm font-normal" style={{ color: '#34d399' }}>Email byl úspěšně změněn</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Nová adresa: {newEmail}</p>
                    <button onClick={resetEmailChangeFlow} className="text-xs mt-2 underline" style={{ color: 'var(--text-muted)' }}>Zavřít</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

function ProfileVerificationBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Keep a fixed-length 6-slot array internally; empty slots are ''
  const slots: string[] = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const commit = (arr: string[]) => onChange(arr.join(''));

  const handleChange = (idx: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const arr = [...slots];
    arr[idx] = digit;
    commit(arr);
    if (idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...slots];
      if (arr[idx]) {
        arr[idx] = '';
        commit(arr);
      } else if (idx > 0) {
        arr[idx - 1] = '';
        commit(arr);
        refs.current[idx - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const arr = Array.from({ length: 6 }, (_, i) => digits[i] || '');
    commit(arr);
    refs.current[Math.min(digits.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {slots.map((slot, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={slot}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="w-10 h-12 text-center text-lg font-normal rounded-xl outline-none caret-transparent transition-all"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: slot ? '1px solid var(--primary)' : '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      ))}
    </div>
  );
}
