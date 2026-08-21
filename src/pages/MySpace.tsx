import { useAuth } from '../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MySpace = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/prihlaseni');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#191b1f' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-8 h-8" style={{ color: '#A2B6B9' }} />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Muj prostor
            </h1>
          </div>
          <p className="text-gray-300 text-base sm:text-lg">
            Profil a nastaveni
          </p>
        </div>

        <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#2c2e33' }}>
          <h2 className="text-xl font-bold text-white mb-4">Osobni udaje</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Jmeno</label>
              <div className="text-white text-lg">{user?.name || 'Neuvedeno'}</div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <div className="text-white text-lg">{user?.email}</div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Plan</label>
              <div className="text-white text-lg">{user?.current_plan || 'L1'}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:opacity-80 transition-all"
          style={{ backgroundColor: '#dc2626' }}
        >
          <LogOut className="w-5 h-5" />
          <span>Odhlasit se</span>
        </button>
      </div>
    </div>
  );
};
