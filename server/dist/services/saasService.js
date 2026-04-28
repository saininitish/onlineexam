import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';
export class SaaSService {
    /**
     * Generates a unique referral code for a user if they don't have one
     */
    static async getOrCreateReferralCode(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('referral_code')
            .eq('id', userId)
            .single();
        if (error)
            throw new AppError(error.message, 500);
        if (data.referral_code)
            return data.referral_code;
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase.from('users').update({ referral_code: newCode }).eq('id', userId);
        return newCode;
    }
    /**
     * Process a referral when a new user signs up
     */
    static async processReferral(newUserId, referralCode) {
        const { data: referrer, error } = await supabase
            .from('users')
            .select('id, coins')
            .eq('referral_code', referralCode.toUpperCase())
            .single();
        if (error || !referrer)
            return; // Silent fail if code is invalid
        // Award 50 coins to the referrer
        await supabase.from('users').update({ coins: (referrer.coins || 0) + 50 }).eq('id', referrer.id);
        // Award 20 coins to the new user as a welcome bonus
        await supabase.from('users').update({ coins: 20 }).eq('id', newUserId);
    }
    /**
     * Get User Growth Stats (Level, Rank, etc.)
     */
    static async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('name, email, xp, coins, streak, referral_code')
            .eq('id', userId)
            .single();
        if (error)
            throw new AppError(error.message, 500);
        const level = Math.floor(Math.sqrt(data.xp / 100)) + 1;
        const rank = level < 5 ? 'Bronze' : level < 15 ? 'Silver' : level < 30 ? 'Gold' : 'Diamond';
        return { ...data, level, rank };
    }
}
