import express from 'express';
import { getTournaments, getTournamentBySlug } from '../controllers/tournamentController.js';
import {
  registerSquad,
  registerSolo,
  checkRegistrationStatus,
  getMyRegistrations,
  submitCaptainEvidence,
} from '../controllers/registrationController.js';
import { getLeaderboards, getWinners, getPlayerProfile } from '../controllers/leaderboardController.js';
import { getPublishedResults } from '../controllers/resultController.js';
import { getPublicSettings } from '../controllers/settingController.js';
import {
  getWalletByEmail,
  createDepositRequest,
  createWithdrawalRequest,
  joinTournamentWithCoins,
} from '../controllers/walletController.js';
import { upload } from '../middleware/upload.js';
import { registrationLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Tournaments
router.get('/tournaments', getTournaments);
router.get('/tournaments/:slug', getTournamentBySlug);
router.post('/tournaments/:id/join-with-coins', authenticate, joinTournamentWithCoins);

// Wallet & Coins (Player Facing)
router.get('/wallet/:email', getWalletByEmail);
router.post('/wallet/lookup', getWalletByEmail);
router.post('/wallet/deposit', authenticate, createDepositRequest);
router.post('/wallet/withdraw', authenticate, createWithdrawalRequest);

// Registrations (Authentication compulsory for registration & viewing personal registrations)
router.post('/registrations/squad', authenticate, registrationLimiter, registerSquad);
router.post('/registrations/solo', authenticate, registrationLimiter, registerSolo);
router.get('/registrations/my', authenticate, getMyRegistrations);
router.get('/registrations/check/:ref', checkRegistrationStatus);
router.post('/registrations/evidence', authenticate, upload.single('screenshot'), submitCaptainEvidence);

// Competitive Info
router.get('/leaderboards', getLeaderboards);
router.get('/leaderboard', getLeaderboards);
router.get('/results', getPublishedResults);
router.get('/winners', getWinners);
router.get('/players/:id', getPlayerProfile);

// Public settings
router.get('/settings/public', getPublicSettings);

export default router;
