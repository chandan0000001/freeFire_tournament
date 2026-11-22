import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Analytics } from '@vercel/analytics/react';

// Layout & Immediate Entry Frame
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import PageLoadingFallback from './components/common/PageLoadingFallback.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// Direct synchronous import for Homepage & NotFoundPage (Zero delay, instant render)
import HomePage from './pages/public/HomePage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// Lazy-loaded Public Pages
const TournamentsPage = lazy(() => import('./pages/public/TournamentsPage.jsx'));
const TournamentDetailPage = lazy(() => import('./pages/public/TournamentDetailPage.jsx'));
const SquadRegisterPage = lazy(() => import('./pages/public/SquadRegisterPage.jsx'));
const SoloRegisterPage = lazy(() => import('./pages/public/SoloRegisterPage.jsx'));
const RegistrationStatusPage = lazy(() => import('./pages/public/RegistrationStatusPage.jsx'));
const LeaderboardPage = lazy(() => import('./pages/public/LeaderboardPage.jsx'));
const ResultsPage = lazy(() => import('./pages/public/ResultsPage.jsx'));
const WinnersPage = lazy(() => import('./pages/public/WinnersPage.jsx'));
const RulesPage = lazy(() => import('./pages/public/RulesPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage.jsx'));
const ContactPage = lazy(() => import('./pages/public/ContactPage.jsx'));
const WalletPage = lazy(() => import('./pages/public/WalletPage.jsx'));
const LoginPage = lazy(() => import('./pages/public/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage.jsx'));

// Lazy-loaded Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboardOverview = lazy(() => import('./pages/admin/AdminDashboardOverview.jsx'));
const AdminTournaments = lazy(() => import('./pages/admin/AdminTournaments.jsx'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations.jsx'));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms.jsx'));
const AdminResultsReview = lazy(() => import('./pages/admin/AdminResultsReview.jsx'));
const AdminPrizes = lazy(() => import('./pages/admin/AdminPrizes.jsx'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs.jsx'));

// Protected Admin Guard
function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoadingFallback />;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return children;
}

// Protected Player Route (Wallet Access Requires Sign In)
function ProtectedPlayerRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoadingFallback />;
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}

// Public Shell Layout (with standard Navbar & Footer)
function PublicShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Immediate HomePage */}
              <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />

              {/* Public Tournaments & Competitive Info (Browse Without Sign In) */}
              <Route path="/tournaments" element={<PublicShell><TournamentsPage /></PublicShell>} />
              <Route path="/tournaments/:slug" element={<PublicShell><TournamentDetailPage /></PublicShell>} />
              <Route path="/leaderboard" element={<PublicShell><LeaderboardPage /></PublicShell>} />
              <Route path="/results" element={<PublicShell><ResultsPage /></PublicShell>} />
              <Route path="/winners" element={<PublicShell><WinnersPage /></PublicShell>} />
              <Route path="/rules" element={<PublicShell><RulesPage /></PublicShell>} />
              <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
              <Route path="/privacy" element={<PublicShell><PrivacyPolicyPage /></PublicShell>} />

              {/* Protected Tournament Registration (Sign In Required) */}
              <Route
                path="/join/squad/:tournamentId"
                element={
                  <ProtectedPlayerRoute>
                    <PublicShell><SquadRegisterPage /></PublicShell>
                  </ProtectedPlayerRoute>
                }
              />
              <Route
                path="/join/solo/:tournamentId"
                element={
                  <ProtectedPlayerRoute>
                    <PublicShell><SoloRegisterPage /></PublicShell>
                  </ProtectedPlayerRoute>
                }
              />

              {/* Protected My Registrations (Sign In Required) */}
              <Route
                path="/status"
                element={
                  <ProtectedPlayerRoute>
                    <PublicShell><RegistrationStatusPage /></PublicShell>
                  </ProtectedPlayerRoute>
                }
              />
              <Route
                path="/my-registrations"
                element={
                  <ProtectedPlayerRoute>
                    <PublicShell><RegistrationStatusPage /></PublicShell>
                  </ProtectedPlayerRoute>
                }
              />

              {/* Protected Player Wallet (Login Required) */}
              <Route
                path="/wallet"
                element={
                  <ProtectedPlayerRoute>
                    <PublicShell><WalletPage /></PublicShell>
                  </ProtectedPlayerRoute>
                }
              />

              {/* Unified Auth Pages */}
              <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />
              <Route path="/register" element={<PublicShell><RegisterPage /></PublicShell>} />
              <Route path="/forgot-password" element={<PublicShell><ForgotPasswordPage /></PublicShell>} />
              <Route path="/reset-password" element={<PublicShell><ResetPasswordPage /></PublicShell>} />

              {/* Protected Admin Workspace */}
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardOverview />} />
                <Route path="tournaments" element={<AdminTournaments />} />
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="rooms" element={<AdminRooms />} />
                <Route path="results" element={<AdminResultsReview />} />
                <Route path="prizes" element={<AdminPrizes />} />
                <Route path="withdrawals" element={<AdminWithdrawals />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>

              {/* Custom 404 Catch-All (cleanly catches /browse and any unmapped URL) */}
              <Route path="*" element={<PublicShell><NotFoundPage /></PublicShell>} />
            </Routes>
          </Suspense>
          <Analytics />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function ScrollToTop() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0); }, [pathname]); return null; }
