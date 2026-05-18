import { Router } from 'express';
import { 
  getProfile, 
  getReferralCode, 
  subscribePlan, 
  upgradeBattlePass, 
  claimDailyReward, 
  buyGemsPack, 
  buyMockSeries, 
  enterMegaTournament, 
  watchRewardedAd, 
  applyReferralCode 
} from '../controllers/saasController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/referral', getReferralCode);
router.post('/subscribe', subscribePlan);
router.post('/battle-pass', upgradeBattlePass);
router.post('/claim-daily', claimDailyReward);
router.post('/buy-gems', buyGemsPack);
router.post('/buy-mock', buyMockSeries);
router.post('/enter-tournament', enterMegaTournament);
router.post('/watch-ad', watchRewardedAd);
router.post('/apply-referral', applyReferralCode);

export default router;
