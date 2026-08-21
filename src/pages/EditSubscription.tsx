import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Crown, ArrowUpCircle, Loader2, XCircle } from 'lucide-react';
import { createGoPayPayment } from '../services/gopayService';
import { SubPageHeader, ProfileAlert, SubCard, ExitSurvey, submitExitFeedback, type ExitReason } from '../components/profile/ProfileShared';

export const EditSubscription = () => {
  const { user, updateUser } = useAuth();
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  // idle → survey (why are you leaving?) → confirm (final "are you sure")
  const [cancelStep, setCancelStep] = useState<'idle' | 'survey' | 'confirm' | 'done'>('idle');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const currentLevel: 'L1' | 'L2' =
    (user?.subscription_type === 'L1' || user?.subscription_type === 'L2')
      ? user.subscription_type
      : (user?.level_tag === 'L2' ? 'L2' : 'L1');
  const isActive = user?.subscription_status === 'active';

  const handleUpgradeToL2 = async () => {
    if (!user) return;
    setUpgradeError(''); setUpgradeLoading(true);
    try {
      const result = await createGoPayPayment({ subscription_type: 'L2', amount: 39900, currency: 'CZK', product_name: 'Deseyo L2 – měsíční členství', user_id: user.id, return_url: `${window.location.origin}/stav-platby?plan=L2&source=upgrade` });
      window.location.href = result.payment_url;
    } catch { setUpgradeError('Nepodařilo se spustit platbu. Zkuste to prosím znovu.'); setUpgradeLoading(false); }
  };

  const handleCancelSurveyContinue = async (reason: ExitReason, otherText: string) => {
    await submitExitFeedback('subscription_cancel', reason, otherText, user?.email);
    setCancelStep('confirm');
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true); setCancelError('');
    const { error } = await updateUser({ subscription_status: 'canceled' });
    if (error) { setCancelError('Nepodařilo se zrušit předplatné. Zkuste to prosím znovu.'); setCancelLoading(false); return; }
    setCancelLoading(false);
    setCancelStep('done');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">
        <SubPageHeader title="Upravit předplatné" />

        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="p-5">
            <h2 className="text-base font-normal mb-1" style={{ color: 'var(--text)' }}>Předplatné</h2>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Aktivní plán a možnosti rozšíření</p>
            {upgradeError && <ProfileAlert type="error" message={upgradeError} className="mb-4" />}
            <div className="space-y-3">
              <SubCard
                tier="L1" title="Deseyo L1" price={299}
                description="Strukturovaný program s plným přístupem ke všem lekcím."
                features={['Plný přístup ke všem lekcím', 'FyzioYoga & FaceYoga programy', 'Osobní plán na míru', 'Živá setkání každý měsíc']}
                icon={<Zap className="w-4 h-4" />}
                isActive={currentLevel === 'L1' && isActive}
                isOwned={currentLevel === 'L2'}
              />
              <SubCard
                tier="L2" title="Deseyo L2" price={399}
                description="Komplexní přístup s konzultacemi — pro ty, kdo chtějí jít dál rychleji."
                features={['Vše z L1', 'Konzultační kredity s lektorkou', 'Prioritní podpora', 'Exkluzivní obsah a workshopy']}
                icon={<Crown className="w-4 h-4" />}
                isActive={currentLevel === 'L2' && isActive}
                isPremium
                upgradeAction={
                  currentLevel !== 'L2' ? (
                    !upgradeConfirm ? (
                      <button
                        onClick={() => setUpgradeConfirm(true)}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        Přejít na L2
                      </button>
                    ) : (
                      <div className="mt-3 rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <p className="text-sm font-normal" style={{ color: 'var(--text)' }}>Přechod na L2 — 399 Kč / měs.</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          Budete přesměrováni na platební bránu GoPay. Po platbě se účet automaticky přepne na L2.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUpgradeToL2}
                            disabled={upgradeLoading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            {upgradeLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Připravuji…</> : 'Zaplatit a aktivovat – 399 Kč / měs.'}
                          </button>
                          <button onClick={() => { setUpgradeConfirm(false); setUpgradeError(''); }} className="px-3 py-2.5 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                            Zrušit
                          </button>
                        </div>
                      </div>
                    )
                  ) : undefined
                }
              />
            </div>

            {/* Cancel subscription */}
            {isActive && cancelStep !== 'done' && (
              <div className="mt-4">
                {cancelError && <ProfileAlert type="error" message={cancelError} className="mb-3" />}
                {cancelStep === 'idle' && (
                  <button
                    onClick={() => setCancelStep('survey')}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-normal transition-all hover:opacity-80"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    <XCircle className="w-4 h-4" />
                    Zrušit předplatné
                  </button>
                )}
                {cancelStep === 'survey' && (
                  <ExitSurvey
                    title="Než odejdete, chtěli bychom vědět, proč odcházíte."
                    onSkip={() => setCancelStep('confirm')}
                    onContinue={handleCancelSurveyContinue}
                  />
                )}
                {cancelStep === 'confirm' && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-sm font-normal text-red-300">Opravdu chcete zrušit předplatné?</p>
                    <p className="text-xs text-red-400/70 leading-relaxed">Ztratíte přístup ke všem placeným lekcím a programům.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCancelSubscription} disabled={cancelLoading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-normal rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
                        {cancelLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Ruším…</> : 'Ano, zrušit předplatné'}
                      </button>
                      <button onClick={() => { setCancelStep('idle'); setCancelError(''); }} className="px-4 py-2.5 text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {cancelStep === 'done' && (
              <ProfileAlert type="success" message="Předplatné bylo zrušeno." className="mt-4" />
            )}

            <p className="text-[10px] mt-4 text-center" style={{ color: 'var(--text-subtle)' }}>Členství lze kdykoliv zrušit · Fakturace probíhá měsíčně</p>
          </div>
        </div>
      </div>
    </div>
  );
};
