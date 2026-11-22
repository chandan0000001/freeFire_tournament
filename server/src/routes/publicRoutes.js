import { publicCache } from '../middleware/publicCache.js';
import { transactional } from '../middleware/transactional.js';
import { ownWallet } from '../middleware/ownership.js';
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
router.get('/tournaments', publicCache(getTournaments, 'tournaments'));
router.get('/tournaments/:slug', publicCache(getTournamentBySlug, 'tournament'));
router.post('/tournaments/:id/join-with-coins', authenticate, ownWallet, registrationLimiter, transactional(joinTournamentWithCoins));

// Wallet & Coins (Player Facing)
router.get('/wallet/:email', authenticate, ownWallet, getWalletByEmail);
router.post('/wallet/lookup', authenticate, ownWallet, getWalletByEmail);
router.post('/wallet/deposit', authenticate, ownWallet, registrationLimiter, transactional(createDepositRequest));
router.post('/wallet/withdraw', authenticate, ownWallet, registrationLimiter, transactional(createWithdrawalRequest));

// Registrations (Authentication compulsory for registration & viewing personal registrations)
router.post('/registrations/squad', authenticate, registrationLimiter, transactional(registerSquad));
router.post('/registrations/solo', authenticate, registrationLimiter, transactional(registerSolo));
router.get('/registrations/my', authenticate, getMyRegistrations);
router.get('/registrations/check/:ref', checkRegistrationStatus);
router.post('/registrations/evidence', authenticate, upload.single('screenshot'), submitCaptainEvidence);

// Competitive Info
router.get('/leaderboards', publicCache(getLeaderboards, 'leaderboard'));
router.get('/leaderboard', publicCache(getLeaderboards, 'leaderboard'));
router.get('/results', publicCache(getPublishedResults, 'results'));
router.get('/winners', publicCache(getWinners, 'winners'));
router.get('/players/:id', getPlayerProfile);

// Public settings
router.get('/settings/public', publicCache(getPublicSettings, 'settings'));

export default router;
