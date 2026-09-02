import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ClipboardList, Sparkles, CreditCard } from 'lucide-react';

interface AdminNavigationProps {
  onLogout?: () => void;
}

export function AdminNavigation({ onLogout }: AdminNavigationProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-700 text-white' : 'text-gray-100 hover:bg-indigo-700';
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/admin/sprava" className="text-xl font-bold">
            Admin Panel
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/admin/sprava"
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${isActive('/admin/sprava')}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              to="/admin/sprava/obsah"
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${isActive('/admin/sprava/obsah')}`}
            >
              <FileText className="w-4 h-4" />
              Obsah
            </Link>

            <Link
              to="/admin/sprava/klientske-karty"
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${isActive('/admin/sprava/klientske-karty')}`}
            >
              <CreditCard className="w-4 h-4" />
              Klientské karty
            </Link>

            <Link
              to="/admin/sprava/dotaznik"
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${isActive('/admin/sprava/dotaznik')}`}
            >
              <ClipboardList className="w-4 h-4" />
              Dotazník
            </Link>

            <Link
              to="/admin/sprava/texty"
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${isActive('/admin/sprava/texty')}`}
            >
              <Sparkles className="w-4 h-4" />
              Týdenní texty
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
