import { Router } from 'express';
import authRoutes from './authRoutes.js';
import testRoutes from './testRoutes.js';
import studentRoutes from './studentRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import saasRoutes from './saasRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', testRoutes);
router.use('/student', studentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/saas', saasRoutes);

export default router;
