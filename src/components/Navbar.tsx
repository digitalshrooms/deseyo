import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User, Menu, X, Sparkles, Heart, Radio, HelpCircle, MapPin, ChevronRight } from 'lucide-react';

const SECTION_IDS = ['kurzy', 'programy', 'o-nas'];

const supportsSmoothScroll = 'scrollBehavior' in document.documentElement.style;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: supportsSmoothScroll ? 'smooth' : 'auto',
      block: 'start',
    });
  }
}

const HomepageNavItem: React.FC<{ sectionId: string; label: string; isActive: boolean; onGoToSection: (id: string) => void; onClick: () => void }> = ({
  sectionId,
  label,
  isActive,
  onGoToSection,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={`#${sectionId}`}
      onClick={(e) => {
        e.preventDefault();
        onGoToSection(sectionId);
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative font-normal text-sm whitespace-nowrap px-4 py-2 rounded-full transition-colors duration-200 inline-block focus:outline-none"
      style={{
        color: isActive || isHovered ? 'var(--primary-dark)' : '#374151',
        backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
      }}
    >
      {label}
    </a>
  );
};

interface SidebarNavLink {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Discord-style rail hover — same "hover shows the active color" rule as
// the rest of the nav, just laid out as a full-width row instead of a pill.
const SidebarNavItem: React.FC<{ link: SidebarNavLink; isActive: boolean; onClick?: () => void }> = ({ link, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = link.icon;
  const highlighted = isActive || isHovered;

  return (
    <Link
      to={link.path}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-normal transition-colors duration-200"
      style={{
        color: highlighted ? '#FFFFFF' : 'var(--text-muted)',
        backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {link.label}
    </Link>
  );
};

export const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const isHomepage = location.pathname === '/';
  const isAuthPage = location.pathname === '/prihlaseni';
  const isPublicPage = isHomepage || isAuthPage || location.pathname === '/kontakt';
  // Homepage always keeps the top pill, logged in or not — only its right-side
  // actions change (Můj kurz instead of Přihlásit se/Registrovat).
  const isLightNavbar = isHomepage || (isPublicPage && !user);
  const isDarkNavbar = !!user && !isHomepage;
  // The přihlášení page also shows the homepage's section links so a
  // visitor can jump straight to "Kurzy"/"Programy"/"O nás" from there.
  const showSectionNav = isHomepage || isAuthPage;

  const navLinks = useMemo(() => [
    { path: '/moje-cesta', label: 'Moje cesta', icon: MapPin },
    { path: '/fyzio-joga', label: 'Fyzio jóga', icon: Heart },
    { path: '/face-joga', label: 'Facejóga', icon: Sparkles },
    { path: '/oblibene', label: 'Oblíbené', icon: Heart },
    { path: '/ziva-setkani', label: 'Živá setkání', icon: Radio },
    { path: '/mind-life', label: 'Mind&Life', icon: Sparkles },
    { path: '/konzultace', label: 'Konzultace', icon: HelpCircle },
  ], []);

  const homepageSections = useMemo(() => [
    { id: 'kurzy', label: 'Kurzy' },
    { id: 'programy', label: 'Programy' },
    { id: 'o-nas', label: 'O nás' },
  ], []);

  const toggleMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  // From the homepage this just scrolls. From elsewhere (e.g. přihlášení)
  // it navigates home first, then scrolls once the sections exist.
  const goToSection = useCallback((id: string) => {
    if (isHomepage) {
      scrollToSection(id);
    } else {
      navigate('/');
      setTimeout(() => scrollToSection(id), 300);
    }
  }, [isHomepage, navigate]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, closeMenu]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        const top = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(top || '0', 10) * -1);
      };
    }
  }, [mobileMenuOpen]);

  // Close the drawer automatically on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  // Scrollspy for homepage sections — whichever section's top has most
  // recently passed a fixed line near the top of the viewport is "active".
  // (An IntersectionObserver with a narrow rootMargin band was here before;
  // for a tall section like "kurzy" the band could end up thinner than the
  // 0.3 threshold required, so it would rarely/inconsistently fire.)
  useEffect(() => {
    if (!isHomepage) return;
    const REFERENCE_LINE = 140;

    const updateActiveSection = () => {
      let current = '';
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= REFERENCE_LINE) current = id;
      }
      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isHomepage]);

  const glassStyle: React.CSSProperties = isLightNavbar
    ? {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(17, 18, 20, 0.08)',
        boxShadow: '0 8px 24px -8px rgba(17, 18, 20, 0.1)',
      }
    : {
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--nav-border)',
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
      };

  // ── Logged-in: floating left sidebar (Discord-style rail) ──
  if (isDarkNavbar) {
    const profileActive = isActive('/profil');

    const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
      <>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center px-4 py-5 flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <img src="/images/deseyo_logo_vertikalni.png" alt="Deseyo" className="w-full h-auto" />
        </Link>

        <div className="mx-3 flex-shrink-0" style={{ borderTop: '1px solid var(--nav-border)' }} />

        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <SidebarNavItem key={link.path} link={link} isActive={isActive(link.path)} onClick={onNavigate} />
          ))}
        </nav>

        <div
          className="px-3 py-3 flex items-center gap-2 flex-shrink-0"
          style={{ borderTop: '1px solid var(--nav-border)' }}
        >
          <Link
            to="/profil"
            onClick={onNavigate}
            aria-label="Profil"
            className="flex items-center gap-2.5 min-w-0 flex-1 rounded-xl px-1.5 py-1 transition-all hover:opacity-80"
            style={{ backgroundColor: profileActive ? 'var(--primary-soft)' : 'transparent' }}
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
              style={{
                color: profileActive ? '#FFFFFF' : 'var(--text-muted)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <User className="w-4 h-4" />
            </span>
            <span className="min-w-0 flex flex-col">
              <span
                className="text-xs font-normal truncate"
                style={{ color: profileActive ? '#FFFFFF' : 'var(--text)' }}
              >
                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Uživatel'}
              </span>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-subtle)' }}>
                {user?.username ? `@${user.username}` : user?.email}
              </span>
            </span>
          </Link>
        </div>
      </>
    );

    return (
      <>
        {/* Mobile trigger — floats top-left since the rail itself lives on the left edge */}
        <button
          onClick={toggleMenu}
          aria-label={mobileMenuOpen ? 'Zavřít menu' : 'Otevřít menu'}
          aria-expanded={mobileMenuOpen}
          className="lg:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-11 h-11 rounded-2xl transition-all"
          style={glassStyle}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" style={{ color: 'var(--primary-dark)' }} />
          ) : (
            <Menu className="w-5 h-5" style={{ color: 'var(--primary-dark)' }} />
          )}
        </button>

        {/* Desktop floating rail */}
        <aside
          className="hidden lg:flex fixed left-3 top-3 bottom-3 z-40 w-64 flex-col rounded-2xl overflow-hidden"
          style={glassStyle}
        >
          <SidebarContent />
        </aside>

        {/* Mobile slide-out drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                className="lg:hidden fixed inset-0 z-40 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeMenu}
              />
              <motion.aside
                ref={mobileMenuRef}
                className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[80vw] flex flex-col rounded-r-2xl overflow-hidden touch-pan-y"
                style={glassStyle}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.5, right: 0 }}
                dragSnapToOrigin
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 || info.velocity.x < -400) closeMenu();
                }}
              >
                <SidebarContent onNavigate={closeMenu} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
<header className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-7xl">
        {/* Main pill */}
        <div className="relative rounded-2xl overflow-hidden" style={glassStyle}>
          <div className="px-4 md:px-5 h-14 sm:h-16 flex items-center justify-between gap-3">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center flex-shrink-0 hover:opacity-90 transition-opacity"
              onClick={closeMenu}
            >
              <img src="/images/deseyo_logo_vertikalni.png" alt="Deseyo" className="h-6 sm:h-8 w-auto" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center justify-center flex-1 gap-1">
              {showSectionNav ? (
                homepageSections.map((s) => (
                  <HomepageNavItem
                    key={s.id}
                    sectionId={s.id}
                    label={s.label}
                    isActive={isHomepage && activeSection === s.id}
                    onGoToSection={goToSection}
                    onClick={() => {}}
                  />
                ))
              ) : null}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {showSectionNav && (
                <button
                  onClick={toggleMenu}
                  className="md:hidden flex items-center justify-center w-9 h-9 rounded-full"
                  style={{
                    backgroundColor: 'var(--primary-soft)',
                    border: '1px solid var(--border)',
                    color: 'var(--primary-dark)',
                  }}
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              )}
              {user ? (
                <Link
                  to="/moje-cesta"
                  className="px-4 py-2 text-sm rounded-full font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Můj kurz
                </Link>
              ) : (
                <>
                  <Link
                    to="/prihlaseni"
                    className="hidden sm:block px-4 py-2 text-sm font-medium rounded-full transition-all hover:opacity-80"
                    style={{ color: isLightNavbar ? '#374151' : 'var(--text-muted)' }}
                  >
                    Přihlásit se
                  </Link>
                  <Link
                    to="/prihlaseni"
                    className="px-4 py-2 text-sm rounded-full font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Registrovat
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mt-2 rounded-2xl overflow-hidden origin-top"
              style={glassStyle}
            >
              <nav className="px-3 py-4 flex flex-col gap-1">
                {showSectionNav ? (
                  <>
                    {homepageSections.map((s, index) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <a
                          href={`#${s.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            closeMenu();
                            goToSection(s.id);
                          }}
                          className="flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                          style={{
                            color: isHomepage && activeSection === s.id ? 'var(--primary-dark)' : isLightNavbar ? '#374151' : 'var(--text-muted)',
                            backgroundColor: isHomepage && activeSection === s.id ? 'var(--primary-soft)' : 'transparent',
                          }}
                        >
                          <span className="font-medium text-sm">{s.label}</span>
                          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.2)' }} />
                        </a>
                      </motion.div>
                    ))}
                    <div className="mt-2 pt-3 mx-1 flex items-center gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      {user ? (
                        <Link
                          to="/moje-cesta"
                          onClick={closeMenu}
                          className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          Můj kurz
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/prihlaseni"
                            onClick={closeMenu}
                            className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{ color: '#374151', backgroundColor: 'rgba(0,0,0,0.05)' }}
                          >
                            Přihlásit se
                          </Link>
                          <Link
                            to="/prihlaseni"
                            onClick={closeMenu}
                            className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            Registrovat
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                ) : null}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
