import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Crown, X } from 'lucide-react';
import { useState } from 'react';

export const UpgradeBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || user.subscription_plan === 'Legend' || isDismissed) {
    return null;
  }

  const getMessage = () => {
    if (user.subscription_plan === 'Basic') {
      return {
        title: 'Odemkněte plný potenciál Deseyo',
        description: 'Získejte přístup ke všem kategoriím a kurzům s Premium plánem',
        cta: 'Přejít na Premium'
      };
    }
    return {
      title: 'Staňte se Legendou',
      description: 'Získejte exkluzivní bonusové lekce a prémiový obsah s Legend plánem',
      cta: 'Přejít na Legend'
    };
  };

  const message = getMessage();

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: '#2c2e33' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-blue-500/20"></div>
      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A2B6B9' }}>
              <Crown className="w-5 h-5" style={{ color: '#191b1f' }} />
            </div>
            <div>
              <p className="font-bold text-base sm:text-lg text-white">{message.title}</p>
              <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">{message.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profil')}
              className="px-5 py-2.5 rounded-lg hover:opacity-90 transition-all font-semibold text-sm whitespace-nowrap"
              style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
            >
              {message.cta}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: '#fff' }}
              aria-label="Zavřít"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
