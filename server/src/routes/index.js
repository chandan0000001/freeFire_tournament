import express from 'express';
import authRoutes from './authRoutes.js';
import publicRoutes from './publicRoutes.js';
import adminRoutes from './adminRoutes.js';
import spectatorRoutes from './spectatorRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/spectator', spectatorRoutes);

export default router;
