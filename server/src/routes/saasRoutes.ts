import { Router } from 'express';
import { getProfile, getReferralCode } from '../controllers/saasController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.get('/referral', getReferralCode);

export default router;
