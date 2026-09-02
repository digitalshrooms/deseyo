import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertTriangle, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SubPageHeader, ProfileField, ProfileAlert, PrimaryBtn, ExitSurvey, submitExitFeedback, type ExitReason } from '../components/profile/ProfileShared';

export const SecurityPage = () => {
  const { user, updatePassword, signOut } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // idle → survey (why are you leaving?) → confirm (final "are you sure")
  const [deleteStep, setDeleteStep] = useState<'idle' | 'survey' | 'confirm'>('idle');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess(false);
    if (newPassword !== confirmPassword) { setPasswordError('Hesla se neshodují.'); return; }
    if (newPassword.length < 6) { setPasswordError('Heslo musí mít alespoň 6 znaků.'); return; }
    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);
    if (error) { setPasswordError('Chyba při změně hesla.'); }
    else { setPasswordSuccess(true); setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPasswordSuccess(false), 3500); }
    setPasswordLoading(false);
  };

  const handleSurveyContinue = async (reason: ExitReason, otherText: string) => {
    await submitExitFeedback('account_deletion', reason, otherText, user?.email);
    setDeleteStep('confirm');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/self-delete-user`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ userId: user.id }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Smazání selhalo'); }
      await signOut();
    } catch (err: any) { setDeleteError(err.message || 'Nepodařilo se smazat účet.'); setDeleteLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
        <SubPageHeader title="Heslo a zabezpečení" />

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="p-5 space-y-7">

            <div>
              <h2 className="text-base font-normal mb-1" style={{ color: 'var(--text)' }}>Změna hesla</h2>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Nastavte nové přihlašovací heslo</p>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <ProfileField
                  label="Nové heslo"
                  icon={<Lock className="w-4 h-4" />}
                  suffix={
                    <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-subtle)' }}>
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                >
                  <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="••••••••" required minLength={6} />
                </ProfileField>
                <ProfileField
                  label="Potvrdit nové heslo"
                  icon={<Lock className="w-4 h-4" />}
                  suffix={
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-subtle)' }}>
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                >
                  <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }} placeholder="••••••••" required minLength={6} />
                </ProfileField>
                {passwordError && <ProfileAlert type="error" message={passwordError} />}
                {passwordSuccess && <ProfileAlert type="success" message="Heslo bylo úspěšně změněno." />}
                <PrimaryBtn loading={passwordLoading} label="Změnit heslo" loadingLabel="Měním heslo…" />
              </form>
            </div>

            <div className="border-t pt-6" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-normal mb-1" style={{ color: 'var(--text)' }}>Smazat účet</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Trvale odstraní účet, data a členství. Akce je nevratná.</p>
              {deleteError && <ProfileAlert type="error" message={deleteError} className="mb-3" />}
              {deleteStep === 'idle' && (
                <button
                  onClick={() => setDeleteStep('survey')}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-normal transition-all hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Smazat účet
                </button>
              )}
              {deleteStep === 'survey' && (
                <ExitSurvey
                  title="Než odejdete, chtěli bychom vědět, proč odcházíte."
                  onSkip={() => setDeleteStep('confirm')}
                  onContinue={handleSurveyContinue}
                />
              )}
              {deleteStep === 'confirm' && (
                <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-normal text-red-300">Opravdu chcete smazat účet?</p>
                      <p className="text-xs text-red-400/70 mt-1 leading-relaxed">Všechna data, kredity a pokrok budou trvale odstraněny. Tuto akci nelze vrátit zpět.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleDeleteAccount} disabled={deleteLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-normal rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                      {deleteLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Mažu…</> : 'Ano, smazat účet'}
                    </button>
                    <button onClick={() => { setDeleteStep('idle'); setDeleteError(''); }} className="px-4 py-2.5 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                      Zrušit
                    </button>
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
