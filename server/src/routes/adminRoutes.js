import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import {
  createTournament,
  updateTournament,
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
import { getAdminPrizes, updatePayoutStatus } from '../controllers/prizeController.js';
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

// Dashboard KPI Stats
router.get('/dashboard/stats', getDashboardStats);

// Tournaments
router.post('/tournaments', createTournament);
router.patch('/tournaments/:id', updateTournament);
router.patch('/tournaments/:id/status', updateTournamentStatus);
router.delete('/tournaments/:id', deleteTournament);

// Registrations & Manual Payments
router.get('/registrations', getAdminRegistrations);
router.patch('/registrations/:id/payment', updatePaymentStatus);
router.delete('/registrations/:id', deleteRegistration);

// Room Credentials Distribution
router.post('/rooms/:tournamentId', setRoomCredentials);
router.post('/rooms/:tournamentId/send', distributeRoomCredentials);
router.get('/rooms/:tournamentId/logs', getRoomDeliveryLogs);
router.post('/rooms/retry/:logId', retryRoomDelivery);

// Matches & Results Recording
router.get('/matches', getMatches);
router.post('/matches', createMatch);
router.post('/matches/:id/results', submitMatchResult);

// Match Results Review & Publishing
router.get('/results', getAdminResults);
router.post('/results/direct-record', directRecordMatchResult);
router.patch('/results/:id/review', reviewMatchResult);
router.post('/results/:id/publish', publishMatchResult);

// Cash Prizes & Payouts
router.get('/prizes', getAdminPrizes);
router.patch('/prizes/:id/payout', updatePayoutStatus);

// Settings & Audit Logs
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);
router.post('/settings/test-email', sendTestBrevoEmail);
router.get('/audit-logs', getAdminAuditLogs);

export default router;
