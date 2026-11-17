import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Layout
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';

// Public Pages
import HomePage from './pages/public/HomePage.jsx';
import TournamentsPage from './pages/public/TournamentsPage.jsx';
import TournamentDetailPage from './pages/public/TournamentDetailPage.jsx';
import SquadRegisterPage from './pages/public/SquadRegisterPage.jsx';
import SoloRegisterPage from './pages/public/SoloRegisterPage.jsx';
import RegistrationStatusPage from './pages/public/RegistrationStatusPage.jsx';
import LeaderboardPage from './pages/public/LeaderboardPage.jsx';
import ResultsPage from './pages/public/ResultsPage.jsx';
import WinnersPage from './pages/public/WinnersPage.jsx';
import RulesPage from './pages/public/RulesPage.jsx';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview.jsx';
import AdminTournaments from './pages/admin/AdminTournaments.jsx';
import AdminRegistrations from './pages/admin/AdminRegistrations.jsx';
import AdminRooms from './pages/admin/AdminRooms.jsx';
import AdminResultsReview from './pages/admin/AdminResultsReview.jsx';
import AdminPrizes from './pages/admin/AdminPrizes.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

// Spectator Pages
import SpectatorLoginPage from './pages/spectator/SpectatorLoginPage.jsx';
import SpectatorWorkspace from './pages/spectator/SpectatorWorkspace.jsx';

// Protected Admin Guard
function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-500">Checking credentials...</div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

// Protected Spectator Guard
function ProtectedSpectatorRoute({ children }) {
  const { user, loading, isSpectator } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-500">Checking credentials...</div>;
  if (!user || !isSpectator) return <Navigate to="/spectator/login" replace />;
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
          {/* Public Website Routes */}
          <Route path="/" element={<PublicShell><HomePage /></PublicShell>} />
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

          {/* Auth Pages */}
          <Route path="/admin/login" element={<PublicShell><AdminLoginPage /></PublicShell>} />
          <Route path="/spectator/login" element={<SpectatorLoginPage />} />

          {/* Spectator Protected Workspace */}
          <Route
            path="/spectator/workspace"
            element={
              <ProtectedSpectatorRoute>
                <SpectatorWorkspace />
              </ProtectedSpectatorRoute>
            }
          />

          {/* Protected Admin Routes */}
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

          {/* Catch-all 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
