import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Analytics } from '@vercel/analytics/react';

// Layout & Immediate Entry Frame
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import PageLoadingFallback from './components/common/PageLoadingFallback.jsx';

// Direct synchronous import for Homepage (Zero initial loading spinner delay)
import HomePage from './pages/public/HomePage.jsx';

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
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.jsx'));

// Lazy-loaded Admin Pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboardOverview = lazy(() => import('./pages/admin/AdminDashboardOverview.jsx'));
const AdminTournaments = lazy(() => import('./pages/admin/AdminTournaments.jsx'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations.jsx'));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms.jsx'));
const AdminResultsReview = lazy(() => import('./pages/admin/AdminResultsReview.jsx'));
const AdminPrizes = lazy(() => import('./pages/admin/AdminPrizes.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs.jsx'));

// Protected Admin Guard
function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoadingFallback />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

// Public Shell Layout (with standard Navbar & Footer)
function PublicShell({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Immediate HomePage - NO full-page loading spinner */}
          <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />

          {/* Lazy-loaded routes wrapped in suspense */}
          <Route
            path="/*"
            element={
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/tournaments" element={<PublicShell><TournamentsPage /></PublicShell>} />
                  <Route path="/tournaments/:slug" element={<PublicShell><TournamentDetailPage /></PublicShell>} />
                  <Route path="/join/squad/:tournamentId" element={<PublicShell><SquadRegisterPage /></PublicShell>} />
                  <Route path="/join/solo/:tournamentId" element={<PublicShell><SoloRegisterPage /></PublicShell>} />
                  <Route path="/status" element={<PublicShell><RegistrationStatusPage /></PublicShell>} />
                  <Route path="/leaderboard" element={<PublicShell><LeaderboardPage /></PublicShell>} />
                  <Route path="/results" element={<PublicShell><ResultsPage /></PublicShell>} />
                  <Route path="/winners" element={<PublicShell><WinnersPage /></PublicShell>} />
                  <Route path="/rules" element={<PublicShell><RulesPage /></PublicShell>} />
                  <Route path="/contact" element={<PublicShell><RulesPage /></PublicShell>} />
                  <Route path="/privacy" element={<PublicShell><PrivacyPolicyPage /></PublicShell>} />

                  {/* Admin Auth & Dashboard */}
                  <Route path="/admin/login" element={<PublicShell><AdminLoginPage /></PublicShell>} />
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
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="audit-logs" element={<AdminAuditLogs />} />
                  </Route>

                  {/* Custom 404 Catch-All */}
                  <Route path="*" element={<PublicShell><NotFoundPage /></PublicShell>} />
                </Routes>
              </Suspense>
            }
          />
        </Routes>
        <Analytics />
      </Router>
    </AuthProvider>
  );
}
