import express from 'express';
import { adminLogin, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/admin/login', authLimiter, adminLogin);
router.get('/me', authenticate, getMe);

export default router;
