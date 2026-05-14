import { Router } from 'express';
import authRoutes from './authRoutes.js';
import testRoutes from './testRoutes.js';
import studentRoutes from './studentRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import saasRoutes from './saasRoutes.js';
import aiRoutes from './aiRoutes.js';
import battleRoutes from './battleRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', testRoutes);
router.use('/student', studentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/saas', saasRoutes);
router.use('/ai', aiRoutes);
router.use('/battle', battleRoutes);

export default router;
