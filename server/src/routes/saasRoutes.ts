import { Router } from 'express';
import { getProfile, getReferralCode } from '../controllers/saasController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/referral', getReferralCode);

export default router;
