import express from 'express';
import { adminLogin, spectatorLogin, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/admin/login', authLimiter, adminLogin);
router.post('/spectator/login', authLimiter, spectatorLogin);
router.get('/me', authenticate, getMe);

export default router;
