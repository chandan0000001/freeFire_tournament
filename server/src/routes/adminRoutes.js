import { cache } from '../config/redis.js';
import { transactional } from '../middleware/transactional.js';
import { getAdminTournaments } from '../controllers/tournamentController.js';
import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import {
  createTournament,
  updateTournament,
  updateTournamentSessions,
  updateTournamentStatus,
  deleteTournament,
} from '../controllers/tournamentController.js';
import {
  getAdminRegistrations,
  updatePaymentStatus,
  deleteRegistration,
} from '../controllers/registrationController.js';
import {
  setRoomCredentials,
  distributeRoomCredentials,
  getRoomDeliveryLogs,
  retryRoomDelivery,
} from '../controllers/roomController.js';
import { getMatches, createMatch, submitMatchResult } from '../controllers/matchController.js';
import {
  getAdminResults,
  reviewMatchResult,
  publishMatchResult,
  directRecordMatchResult,
} from '../controllers/resultController.js';
import {
  getAdminPrizes,
  createAdminPrize,
  updatePayoutStatus,
  deleteAdminPrize,
} from '../controllers/prizeController.js';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminAuditLogs,
  getDashboardStats,
  sendTestBrevoEmail,
} from '../controllers/settingController.js';

const router = express.Router();

// Apply auth & admin role requirement to all admin routes
router.use(authenticate, requireRole(ROLES.ADMIN, ROLES.SUPERADMIN));
router.use((req, res, next) => {
  for (const key of ['limit', 'page']) if (req.query[key] !== undefined) {
    const value = Number(req.query[key]);
    if (!Number.isSafeInteger(value) || value < 1 || (key === 'limit' && value > 200)) return res.status(400).json({ success: false, message: 'Invalid pagination.' });
  }
  next();
});

// Operational cache diagnostics are restricted to authenticated administrators.
router.get('/cache/status', (req, res) => res.json({ success: true, cache: cache.health() }));

// Dashboard KPI Stats
router.get('/dashboard/stats', getDashboardStats);

// Tournaments
router.get('/tournaments', getAdminTournaments);
router.post('/tournaments', transactional(createTournament));
router.patch('/tournaments/:id', transactional(updateTournament));
router.patch('/tournaments/:id/sessions', transactional(updateTournamentSessions));
router.patch('/tournaments/:id/status', transactional(updateTournamentStatus));
router.delete('/tournaments/:id', transactional(deleteTournament));

// Registrations & Manual Payments
router.get('/registrations', getAdminRegistrations);
router.patch('/registrations/:id/payment', transactional(updatePaymentStatus));
router.delete('/registrations/:id', transactional(deleteRegistration));

// Room Credentials Distribution
router.post('/rooms/:tournamentId', setRoomCredentials);
router.post('/rooms/:tournamentId/send', distributeRoomCredentials);
router.get('/rooms/:tournamentId/logs', getRoomDeliveryLogs);
router.post('/rooms/retry/:logId', retryRoomDelivery);

// Matches & Results Recording
router.get('/matches', getMatches);
router.post('/matches', transactional(createMatch));
router.post('/matches/:id/results', transactional(submitMatchResult));

// Match Results Review & Publishing
router.get('/results', getAdminResults);
router.post('/results/direct-record', transactional(directRecordMatchResult));
router.patch('/results/:id/review', transactional(reviewMatchResult));
router.post('/results/:id/publish', transactional(publishMatchResult));

// Cash Prizes & Payouts
router.get('/prizes', getAdminPrizes);
router.post('/prizes', transactional(createAdminPrize));
router.patch('/prizes/:id/payout', transactional(updatePayoutStatus));
router.delete('/prizes/:id', transactional(deleteAdminPrize));

// Settings & Audit Logs
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.post('/settings/test-email', sendTestBrevoEmail);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
