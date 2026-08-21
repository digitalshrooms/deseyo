import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, CreditCard, ChevronRight, Shield, LogOut, FileText } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Profile = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-16">

        {/* ── Page heading (same pattern as Fyzio jóga etc.) ── */}
        <div className="flex items-center gap-3 mb-8">
          <UserIcon className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
          <h1 className="font-normal leading-none" style={{ fontSize: 'clamp(28px, 6vw, 40px)', color: 'var(--primary)' }}>
            Profil
          </h1>
        </div>

        {/* ── Identity card: avatar + name/email ── */}
        <div
          className="flex items-center gap-4 rounded-2xl p-4 mb-6"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: '1.5px solid var(--primary)', color: 'var(--primary)' }}
          >
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{user?.name || 'Uživatel'}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {user?.username ? `@${user.username}` : user?.email}
            </p>
          </div>
        </div>

        {/* ── ÚČET ── */}
        <SettingsSection label="Účet">
          <SettingsRow
            icon={<UserIcon className="w-4 h-4" />}
            label="Upravit profil"
            to="/upravit-profil"
          />
          <SettingsRow
            icon={<Shield className="w-4 h-4" />}
            label="Heslo a zabezpečení"
            to="/zabezpeceni"
          />
        </SettingsSection>

        {/* ── PŘEDPLATNÉ ── */}
        <SettingsSection label="Předplatné">
          <SettingsRow
            icon={<CreditCard className="w-4 h-4" />}
            label="Upravit předplatné"
            to="/upravit-predplatne"
          />
          <SettingsRow
            icon={<FileText className="w-4 h-4" />}
            label="Faktury"
            to="/faktury"
          />
        </SettingsSection>

        {/* ── NASTAVENÍ ── */}
        <SettingsSection label="Nastavení">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm" style={{ color: 'var(--text)' }}>Tmavý režim</span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-normal transition-colors duration-200 text-left"
            style={{ color: '#f87171' }}
          >
            <LogOut className="w-4 h-4" />
            Odhlásit se
          </button>
        </SettingsSection>

      </div>
    </div>
  );
};

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-normal mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </h2>
      <div className="rounded-2xl overflow-hidden divide-y divide-[var(--border)]" style={{ backgroundColor: 'var(--bg-card)' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-sm transition-colors duration-200"
      style={{ color: isHovered ? 'var(--primary-dark)' : 'var(--text)' }}
    >
      <span className="flex items-center gap-3">
        <span style={{ color: isHovered ? 'var(--primary-dark)' : 'var(--text-muted)' }}>{icon}</span>
        {label}
      </span>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
    </button>
  );
}
