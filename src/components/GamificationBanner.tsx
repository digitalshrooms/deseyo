import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, TrendingUp, Target, Info } from 'lucide-react';
import { GamificationService, BannerMessage } from '../services/gamification';
import { useAuth } from '../contexts/AuthContext';

export function GamificationBanner() {
  const { user } = useAuth();
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBanner = async () => {
      try {
        const message = await GamificationService.getBannerMessage(user.id);
        setBanner(message);
      } catch (error) {
        console.error('Error fetching banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [user]);

  if (loading || !banner) return null;

  const getIcon = () => {
    switch (banner.type) {
      case 'praise':
        return <Award className="w-5 h-5" />;
      case 'reminder':
        return <Target className="w-5 h-5" />;
      case 'suggestion':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (banner.type) {
      case 'praise':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reminder':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'suggestion':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${getStyles()}`}>
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">{banner.message}</p>
        {banner.actionText && banner.actionLink && (
          <Link
            to={banner.actionLink}
            className="inline-block mt-2 text-sm font-semibold hover:underline"
          >
            {banner.actionText} →
          </Link>
        )}
      </div>
    </div>
  );
}
