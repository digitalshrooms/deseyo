import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Sparkles,
  CreditCard, BarChart3, Bell, Search, LogOut, ChevronLeft,
  ChevronRight, TrendingUp, Shield, Zap,
  BookOpen, X, Menu, ChevronDown,
  Command, DollarSign, Tag
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Přehled',
    items: [
      { path: '/admin/sprava', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/sprava/analytics', icon: BarChart3, label: 'Analytics' },
      { path: '/admin/sprava/finance', icon: DollarSign, label: 'Finance & Platby' },
    ],
  },
  {
    label: 'Uživatelé',
    items: [
      { path: '/admin/sprava/klientske-karty', icon: Users, label: 'Klientské karty' },
      { path: '/admin/sprava/duvody-odchodu', icon: LogOut, label: 'Důvody odchodu' },
      { path: '/admin/sprava/subscriptions', icon: CreditCard, label: 'Předplatné' },
      { path: '/admin/sprava/retention', icon: TrendingUp, label: 'Retention' },
    ],
  },
  {
    label: 'Obsah',
    items: [
      { path: '/admin/sprava/obsah', icon: BookOpen, label: 'Kurzy & Lekce' },
      { path: '/admin/sprava/dotaznik', icon: ClipboardList, label: 'Dotazníky' },
      { path: '/admin/sprava/texty', icon: Sparkles, label: 'Týdenní texty' },
      { path: '/admin/sprava/slevy', icon: Tag, label: 'Slevové kódy' },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light');
    return () => { if (prev) root.setAttribute('data-theme', prev); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    navigate('/admin/login');
  };

  const isActive = (path: string) =>
    location.pathname === path;

  const adminEmail = localStorage.getItem('adminEmail') || 'admin@deseyo.cz';
  const initials = adminEmail.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-gray-100 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
          {!collapsed && (
            <Link to="/admin/sprava" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#198379' }}>
                <span className="text-white text-xs font-bold">D</span>
              </div>
              <span className="font-bold text-gray-900 text-sm truncate">Deseyo Admin</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#198379' }}>
              <span className="text-white text-xs font-bold">D</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 flex-shrink-0 ${collapsed ? '' : 'ml-auto'}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center rounded-xl transition-all duration-150 group ${
                      collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={active ? { backgroundColor: '#198379' } : undefined}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {!collapsed && item.label === 'Alerty' && (
                      <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                        {notifications}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin profile */}
        <div className={`border-t border-gray-100 p-3 flex-shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold"
              title="Odhlásit se"
            >
              {initials}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{adminEmail}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Odhlásit"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            {title && (
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* Search */}
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm hover:bg-gray-100 transition-colors min-w-[180px]"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Hledat...</span>
            <kbd className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-500">⌘K</kbd>
          </button>

          {/* Platform status */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Platforma online</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* Quick action */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ backgroundColor: '#198379' }}>
            <Zap className="w-4 h-4" />
            Akce
          </button>

          {/* Security badge */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Command palette */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Command className="w-5 h-5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Hledat uživatele, stránky, akce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-gray-900 text-sm placeholder-gray-400"
              />
              <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-400 px-2 mb-2">Rychlé akce</p>
              {NAV_SECTIONS.flatMap(s => s.items).filter(item =>
                !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1">↵</kbd> vybrat</span>
              <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1">Esc</kbd> zavřít</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  title,
  value,
  change,
  changePositive,
  icon: Icon,
  color = 'teal',
  subtitle,
}: {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon: React.ElementType;
  color?: 'teal' | 'blue' | 'amber' | 'red' | 'emerald' | 'violet';
  subtitle?: string;
}) {
  const colorMap = {
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            changePositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            {changePositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
