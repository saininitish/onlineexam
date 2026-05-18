import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SaaSService } from '../services/saasService.js';
import { handleError } from '../utils/errorHandler.js';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const profile = await SaaSService.getUserProfile(userId);
    res.status(200).json({
      status: 'success',
      data: profile
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getReferralCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const code = await SaaSService.getOrCreateReferralCode(userId);
    res.status(200).json({
      status: 'success',
      referral_code: code
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const subscribePlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { plan } = req.body;
    if (!['Challenger', 'Pro Monthly', 'Pro Annual', 'Elite Annual'].includes(plan)) {
      throw new Error('Invalid plan selected');
    }

    const result = await SaaSService.subscribe(userId, plan);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const upgradeBattlePass = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const result = await SaaSService.upgradeBattlePass(userId);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const claimDailyReward = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const result = await SaaSService.claimDaily(userId);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const buyGemsPack = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { pack } = req.body;
    if (!['Starter', 'Popular', 'Pro', 'Mega'].includes(pack)) {
      throw new Error('Invalid gem pack selected');
    }

    const result = await SaaSService.buyGems(userId, pack);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const buyMockSeries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { mockId, mockName, costCoins } = req.body;
    if (!mockId || !mockName || typeof costCoins !== 'number') {
      throw new Error('Invalid mock test parameters');
    }

    const result = await SaaSService.buyMock(userId, mockId, mockName, costCoins);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const enterMegaTournament = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { tournamentId, tournamentName, entryFeeGems } = req.body;
    if (!tournamentId || !tournamentName || typeof entryFeeGems !== 'number') {
      throw new Error('Invalid tournament parameters');
    }

    const result = await SaaSService.enterTournament(userId, tournamentId, tournamentName, entryFeeGems);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const watchRewardedAd = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { action } = req.body;
    if (!['earn_coins', 'unlock_shortcut', 'freeze_streak'].includes(action)) {
      throw new Error('Invalid ad action');
    }

    const result = await SaaSService.watchAd(userId, action);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const applyReferralCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const { referralCode } = req.body;
    if (!referralCode || typeof referralCode !== 'string') {
      throw new Error('Invalid referral code');
    }

    const result = await SaaSService.applyReferral(userId, referralCode);
    res.status(200).json({
      status: 'success',
      ...result
    });
  } catch (error) {
    handleError(error, res);
  }
};
