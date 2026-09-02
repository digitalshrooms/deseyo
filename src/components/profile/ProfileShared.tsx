import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export type ExitReason = 'finance' | 'time' | 'other';

export async function submitExitFeedback(
  context: 'account_deletion' | 'subscription_cancel',
  reason: ExitReason,
  otherText: string,
  userEmail?: string | null,
) {
  await supabase.from('exit_feedback').insert({
    context,
    reason,
    other_text: reason === 'other' ? (otherText.trim() || null) : null,
    user_email: userEmail ?? null,
  });
}

const EXIT_REASONS: { id: ExitReason; label: string }[] = [
  { id: 'finance', label: 'Nemám na to finance' },
  { id: 'time', label: 'Nemám na to čas' },
  { id: 'other', label: 'Jiné' },
];

/**
 * Short optional survey shown before a destructive/leaving action (account
 * deletion, subscription cancellation) actually goes through. The caller
 * decides what "continue" means (show a final confirm step, or act directly).
 */
export function ExitSurvey({ title, onSkip, onContinue }: {
  title: string;
  onSkip: () => void;
  onContinue: (reason: ExitReason, otherText: string) => void;
}) {
  const [reason, setReason] = useState<ExitReason | null>(null);
  const [otherText, setOtherText] = useState('');

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-normal" style={{ color: 'var(--text)' }}>{title}</p>
      <div className="space-y-2">
        {EXIT_REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReason(r.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-colors"
            style={{
              border: `1.5px solid ${reason === r.id ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: reason === r.id ? 'var(--primary-soft)' : 'transparent',
              color: reason === r.id ? 'var(--primary-dark)' : 'var(--text)',
            }}
          >
            <span
              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ border: `2px solid ${reason === r.id ? 'var(--primary)' : 'var(--text-subtle)'}` }}
            >
              {reason === r.id && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />}
            </span>
            {r.label}
          </button>
        ))}
        {reason === 'other' && (
          <textarea
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Napište prosím krátce proč…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!reason}
          onClick={() => reason && onContinue(reason, otherText)}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-normal text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Pokračovat
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2.5 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Přeskočit
        </button>
      </div>
    </div>
  );
}

export function SubPageHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-8">
      <button
        onClick={() => navigate('/profil')}
        aria-label="Zpět na profil"
        className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary-dark)' }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="font-normal leading-none" style={{ fontSize: 'clamp(22px, 5vw, 32px)', color: 'var(--primary)' }}>
        {title}
      </h1>
    </div>
  );
}

export function ProfileField({ label, icon, suffix, children }: { label: string; icon: React.ReactNode; suffix?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div>
      <label className="block text-[10px] font-normal uppercase tracking-widest mb-2" style={{ color: 'var(--text-subtle)' }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-subtle)' }}>{icon}</span>
        {children}
        {suffix}
      </div>
    </div>
  );
}

export function PrimaryBtn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-normal text-sm text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{loadingLabel}</> : label}
    </button>
  );
}

export function ProfileAlert({ type, message, className = '' }: { type: 'error' | 'success'; message: string; className?: string }) {
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${className}`} style={{ backgroundColor: isError ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`, color: isError ? '#f87171' : '#34d399' }}>
      {isError ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

export function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <p className="text-[10px] font-normal uppercase tracking-widest mb-1" style={{ color: 'var(--text-subtle)' }}>{label}</p>
      <p className="text-sm font-normal" style={{ color: accent ? 'var(--primary)' : 'var(--text)' }}>{value}</p>
    </div>
  );
}

export function SubCard({ title, price, description, features, icon, isActive, isOwned, isPremium, upgradeAction }: {
  tier: 'L1' | 'L2'; title: string; price: number; description: string; features: string[];
  icon: React.ReactNode; isActive?: boolean; isOwned?: boolean; isPremium?: boolean; upgradeAction?: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 transition-all"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
      }}
    >
      {isPremium && !isActive && (
        <span className="absolute -top-2.5 left-4 text-[10px] font-normal uppercase tracking-wide px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--primary)' }}>
          Nejoblíbenější
        </span>
      )}
      <div className="flex items-start gap-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isActive ? 'var(--primary)' : 'var(--primary-soft)', color: isActive ? '#FFFFFF' : 'var(--primary-dark)' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-normal text-sm" style={{ color: 'var(--text)' }}>{title}</span>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-normal uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                <CheckCircle2 className="w-2.5 h-2.5" /> Aktivní
              </span>
            )}
            {isOwned && (
              <span className="inline-flex text-[10px] font-normal uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-subtle)' }}>
                Zahrnuto
              </span>
            )}
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{description}</p>
          <p className="text-sm font-normal mb-3" style={{ color: 'var(--text)' }}>{price} Kč <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/ měs.</span></p>
          <ul className="space-y-1.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f}</span>
              </li>
            ))}
          </ul>
          {upgradeAction}
        </div>
      </div>
    </div>
  );
}
