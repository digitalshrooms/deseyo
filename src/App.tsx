import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import { Homepage } from './pages/Homepage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { FyzioYoga } from './pages/FyzioYoga';
import { TestFyzioJoga } from './pages/TestFyzioJoga';
import { LessonPage } from './pages/LessonPage';
import { Faceyoga } from './pages/Faceyoga';
import { LiveEvents } from './pages/LiveEvents';
import { MindLife } from './pages/MindLife';
import { Support } from './pages/Support';
import { Konsultace } from './pages/Konsultace';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { EditSubscription } from './pages/EditSubscription';
import { InvoicesPage } from './pages/InvoicesPage';
import { SecurityPage } from './pages/SecurityPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { ObchodniPodminky } from './pages/ObchodniPodminky';
import { Contact } from './pages/Contact';
import { AdminData } from './pages/AdminData';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminContent } from './pages/AdminContent';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminFinance } from './pages/AdminFinance';
import { AdminRetention } from './pages/AdminRetention';
import { AdminSubscriptions } from './pages/AdminSubscriptions';
import { Favorites } from './pages/Favorites';
import { OnboardingQuestionnaire } from './pages/OnboardingQuestionnaire';
import { OnboardingResult } from './pages/OnboardingResult';
import { AdminQuestionnaire } from './pages/AdminQuestionnaire';
import { AdminWeeklyTexts } from './pages/AdminWeeklyTexts';
import { AdminDiscountCodes } from './pages/AdminDiscountCodes';
import { AdminClientCards } from './pages/AdminClientCards';
import { AdminExitReasons } from './pages/AdminExitReasons';
import { MojeCesta } from './pages/MojeCesta';
import { AuthCallback } from './pages/AuthCallback';
import { Pricing } from './pages/Pricing';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailed } from './pages/PaymentFailed';
import { ChoosePlan } from './pages/ChoosePlan';
import { BillingDetails } from './pages/BillingDetails';
import { DailyOnboardingProvider } from './components/DailyOnboardingProvider';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
  </div>
);

// Guards full platform pages (videos, dashboard, etc.)
// Requires: authenticated + active subscription + onboarding completed
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    console.log('[ProtectedRoute] no user → /auth');
    return <Navigate to="/prihlaseni" replace />;
  }

  if (user.subscription_status !== 'active') {
    console.log('[ProtectedRoute] sub_status =', user.subscription_status, '→ /vyber-planu');
    return <Navigate to="/vyber-planu" replace />;
  }

  if (!user.onboarding_completed) {
    console.log('[ProtectedRoute] onboarding incomplete → /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  return <DailyOnboardingProvider>{children}</DailyOnboardingProvider>;
};

// Guards /auth and other pre-login pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (user) {
    if (user.subscription_status !== 'active') {
      return <Navigate to="/vyber-planu" replace />;
    }
    if (!user.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/moje-cesta" replace />;
  }

  return <>{children}</>;
};

// Guards onboarding pages — requires auth only.
// Does NOT require subscription_status=active because the user may be coming
// straight from PaymentSuccess where the DB write just happened.
// Redirects to /moje-cesta only if onboarding already completed AND allowCompleted=false.
const OnboardingRoute = ({ children, allowCompleted = false }: { children: React.ReactNode; allowCompleted?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    console.log('[OnboardingRoute] no user → /auth');
    return <Navigate to="/prihlaseni" replace />;
  }

  if (user.onboarding_completed && !allowCompleted) {
    console.log('[OnboardingRoute] already done → /moje-cesta');
    return <Navigate to="/moje-cesta" replace />;
  }

  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const CONTENT_ONLY_ROUTES = [
  '/zasady-ochrany-osobnich-udaju',
  '/podminky-uzivani',
  '/obchodni-podminky',
  '/stav-platby',
  '/platba-zrusena',
  '/vyber-planu',
];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdminRoute = useMemo(() => pathname.startsWith('/admin'), [pathname]);
  const isContentOnlyRoute = useMemo(() => CONTENT_ONLY_ROUTES.includes(pathname) || isAdminRoute, [pathname]);
  // Homepage always keeps its light styling, logged in or not — matches
  // Navbar keeping the top pill (with "Můj kurz") there regardless of login.
  const isLightPage = pathname === '/' || ((pathname === '/prihlaseni' || pathname === '/kontakt') && !user);
  // Logged-in users get the floating left sidebar (see Navbar) instead of
  // the top pill, so content needs left breathing room on desktop instead
  // of top breathing room. Homepage is exempt — it always shows the top pill.
  const isAppNav = !!user && pathname !== '/';

  if (isContentOnlyRoute) {
    return (
      <AnimatePresence mode="wait">
        <PageTransition key={pathname}>{children}</PageTransition>
      </AnimatePresence>
    );
  }

  return (
    <div
      className={`flex flex-col min-h-screen ${isAppNav ? 'lg:pl-[284px]' : ''}`}
      style={{ backgroundColor: isLightPage ? '#ffffff' : 'var(--bg)' }}
    >
      <Navbar />
      <div
        className={isAppNav ? 'h-16 lg:hidden flex-shrink-0' : 'h-[72px] sm:h-[80px] flex-shrink-0'}
        style={{ backgroundColor: isLightPage ? '#ffffff' : 'var(--bg)' }}
      />
      <AnimatePresence mode="wait">
        <div className="flex-1" key={pathname}>
          <PageTransition>{children}</PageTransition>
        </div>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

function AppContent() {
  return (
    <Router>
      <ScrollToTop />
      <LayoutWrapper>
        <Routes>
            <Route path="/" element={<Homepage />} />
            <Route
              path="/prihlaseni"
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              }
            />
            <Route path="/auth" element={<Navigate to="/prihlaseni" replace />} />
            <Route
              path="/moje-cesta"
              element={
                <ProtectedRoute>
                  <MojeCesta />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kurz"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fyzio-joga"
              element={
                <ProtectedRoute>
                  <FyzioYoga />
                </ProtectedRoute>
              }
            />
            <Route path="/fyzio-yoga" element={<Navigate to="/fyzio-joga" replace />} />
            <Route
              path="/test-fyziojoga"
              element={
                <ProtectedRoute>
                  <TestFyzioJoga />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lekce/:slug"
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/face-joga"
              element={
                <ProtectedRoute>
                  <Faceyoga />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ziva-setkani"
              element={
                <ProtectedRoute>
                  <LiveEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mind-life"
              element={
                <ProtectedRoute>
                  <MindLife />
                </ProtectedRoute>
              }
            />
            <Route
              path="/konzultace"
              element={
                <ProtectedRoute>
                  <Konsultace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/oblibene"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/podpora"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/profile" element={<Navigate to="/profil" replace />} />
            <Route
              path="/upravit-profil"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upravit-predplatne"
              element={
                <ProtectedRoute>
                  <EditSubscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faktury"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/zabezpeceni"
              element={
                <ProtectedRoute>
                  <SecurityPage />
                </ProtectedRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/faceyoga" element={<Navigate to="/face-joga" replace />} />
            <Route path="/zasady-ochrany-osobnich-udaju" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<Navigate to="/zasady-ochrany-osobnich-udaju" replace />} />
            <Route path="/podminky-uzivani" element={<TermsOfUse />} />
            <Route path="/terms-of-use" element={<Navigate to="/podminky-uzivani" replace />} />
            <Route path="/obchodni-podminky" element={<ObchodniPodminky />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/contact" element={<Navigate to="/kontakt" replace />} />
            <Route path="/cenik" element={<Pricing />} />
            <Route path="/pricing" element={<Navigate to="/cenik" replace />} />
            <Route path="/vyber-planu" element={<ChoosePlan />} />
            <Route path="/choose-plan" element={<Navigate to="/vyber-planu" replace />} />
            <Route path="/fakturacni-udaje" element={<BillingDetails />} />
            <Route path="/billing-details" element={<Navigate to="/fakturacni-udaje" replace />} />
            <Route path="/stav-platby" element={<PaymentSuccess />} />
            <Route path="/payment-success" element={<Navigate to="/stav-platby" replace />} />
            <Route path="/platba-zrusena" element={<PaymentFailed />} />
            <Route path="/payment-failed" element={<Navigate to="/platba-zrusena" replace />} />
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingQuestionnaire />
                </OnboardingRoute>
              }
            />
            <Route
              path="/onboarding-result"
              element={
                <OnboardingRoute allowCompleted={true}>
                  <OnboardingResult />
                </OnboardingRoute>
              }
            />
            <Route
              path="/admin/data"
              element={
                <ProtectedRoute>
                  <AdminData />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/sprava" element={<AdminDashboard />} />
            <Route path="/admin/sprava/obsah" element={<AdminContent />} />
            <Route path="/admin/sprava/uzivatele" element={<AdminUsers />} />
            <Route path="/admin/sprava/klientske-karty" element={<AdminClientCards />} />
            <Route path="/admin/sprava/duvody-odchodu" element={<AdminExitReasons />} />
            <Route path="/admin/sprava/dotaznik" element={<AdminQuestionnaire />} />
            <Route path="/admin/sprava/texty" element={<AdminWeeklyTexts />} />
            <Route path="/admin/sprava/slevy" element={<AdminDiscountCodes />} />
            <Route path="/admin/sprava/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/sprava/finance" element={<AdminFinance />} />
            <Route path="/admin/sprava/retention" element={<AdminRetention />} />
            <Route path="/admin/sprava/subscriptions" element={<AdminSubscriptions />} />
          </Routes>
      </LayoutWrapper>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
