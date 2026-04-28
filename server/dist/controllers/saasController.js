import { SaaSService } from '../services/saasService.js';
import { handleError } from '../utils/errorHandler.js';
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new Error('Unauthorized');
        const profile = await SaaSService.getUserProfile(userId);
        res.status(200).json({
            status: 'success',
            data: profile
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
export const getReferralCode = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new Error('Unauthorized');
        const code = await SaaSService.getOrCreateReferralCode(userId);
        res.status(200).json({
            status: 'success',
            referral_code: code
        });
    }
    catch (error) {
        handleError(error, res);
    }
};
