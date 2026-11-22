import { transactional } from '../middleware/transactional.js';
import express from 'express';
import {
  register,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Player Auth
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, transactional(resetPassword));

// Admin Auth
router.post('/admin/login', authLimiter, adminLogin);

// Current User Profile & Wallet
router.get('/me', authenticate, getMe);

export default router;
