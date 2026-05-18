import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILES_FILE = path.join(__dirname, '../../saas_profiles.json');

export interface SaaSProfile {
  userId: string;
  coins: number;
  gems: number;
  plan: 'Challenger' | 'Pro Monthly' | 'Pro Annual' | 'Elite Annual';
  battle_pass: 'Free' | 'Premium';
  streak: number;
  lastClaimDate: string | null;
  referral_code: string;
  referred_by: string | null;
  mock_purchases: string[];
  tournament_entries: string[];
}

export class SaaSService {
  /**
   * Helper to get local fallback profiles
   */
  private static getLocalProfiles(): Record<string, SaaSProfile> {
    try {
      if (fs.existsSync(PROFILES_FILE)) {
        const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading saas_profiles.json:', e);
    }
    return {};
  }

  /**
   * Helper to save local fallback profiles
   */
  private static saveLocalProfiles(profiles: Record<string, SaaSProfile>) {
    try {
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing saas_profiles.json:', e);
    }
  }

  /**
   * Get or Create User SaaS Profile (Hybrid Supabase + Local Fallback)
   */
  static async getUserProfile(userId: string) {
    // First get base user info from Supabase
    const { data: baseUser, error: baseError } = await supabase
      .from('users')
      .select('id, name, email, points, streak, rank')
      .eq('id', userId)
      .single();

    if (baseError) throw new AppError(baseError.message, 500);

    let profileData: Partial<SaaSProfile> = {};

    // Try fetching SaaS columns from Supabase
    const { data: sbData, error: sbError } = await supabase
      .from('users')
      .select('coins, gems, plan, battle_pass, last_claim_date, referral_code, referred_by, mock_purchases, tournament_entries')
      .eq('id', userId)
      .single();

    if (sbError && sbError.code === '42703') {
      // Supabase columns do not exist yet -> Fallback to Local JSON
      const localProfiles = this.getLocalProfiles();
      if (!localProfiles[userId]) {
        // Initialize default profile
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localProfiles[userId] = {
          userId,
          coins: 500, // Welcome bonus coins
          gems: 20,   // Welcome bonus gems
          plan: 'Challenger',
          battle_pass: 'Free',
          streak: baseUser?.streak || 0,
          lastClaimDate: null,
          referral_code: newCode,
          referred_by: null,
          mock_purchases: [],
          tournament_entries: []
        };
        this.saveLocalProfiles(localProfiles);
      }
      profileData = localProfiles[userId];
    } else if (sbData) {
      profileData = {
        userId,
        coins: sbData.coins || 500,
        gems: sbData.gems || 20,
        plan: sbData.plan || 'Challenger',
        battle_pass: sbData.battle_pass || 'Free',
        streak: baseUser?.streak || 0,
        lastClaimDate: sbData.last_claim_date || null,
        referral_code: sbData.referral_code || Math.random().toString(36).substring(2, 8).toUpperCase(),
        referred_by: sbData.referred_by || null,
        mock_purchases: sbData.mock_purchases || [],
        tournament_entries: sbData.tournament_entries || []
      };
    }

    const level = Math.floor(Math.sqrt((baseUser?.points || 0) / 100)) + 1;
    const rank = level < 5 ? 'Bronze' : level < 15 ? 'Silver' : level < 30 ? 'Gold' : 'Diamond';

    return {
      ...baseUser,
      ...profileData,
      level,
      rank
    };
  }

  /**
   * Helper to update profile (Supabase or Local Fallback)
   */
  static async updateProfile(userId: string, updates: Partial<SaaSProfile>) {
    // Try updating Supabase first
    const sbUpdates: any = {};
    if (updates.coins !== undefined) sbUpdates.coins = updates.coins;
    if (updates.gems !== undefined) sbUpdates.gems = updates.gems;
    if (updates.plan !== undefined) sbUpdates.plan = updates.plan;
    if (updates.battle_pass !== undefined) sbUpdates.battle_pass = updates.battle_pass;
    if (updates.lastClaimDate !== undefined) sbUpdates.last_claim_date = updates.lastClaimDate;
    if (updates.referral_code !== undefined) sbUpdates.referral_code = updates.referral_code;
    if (updates.referred_by !== undefined) sbUpdates.referred_by = updates.referred_by;
    if (updates.mock_purchases !== undefined) sbUpdates.mock_purchases = updates.mock_purchases;
    if (updates.tournament_entries !== undefined) sbUpdates.tournament_entries = updates.tournament_entries;

    if (Object.keys(sbUpdates).length > 0) {
      const { error } = await supabase.from('users').update(sbUpdates).eq('id', userId);
      if (error && error.code === '42703') {
        // Fallback to local JSON
        const localProfiles = this.getLocalProfiles();
        if (localProfiles[userId]) {
          localProfiles[userId] = { ...localProfiles[userId], ...updates };
          this.saveLocalProfiles(localProfiles);
        }
      }
    }
    return this.getUserProfile(userId);
  }

  /**
   * Subscribe to a Plan
   */
  static async subscribe(userId: string, plan: 'Challenger' | 'Pro Monthly' | 'Pro Annual' | 'Elite Annual') {
    const profile = await this.getUserProfile(userId);
    let bonusGems = 0;
    if (plan === 'Pro Annual') bonusGems = 500;
    if (plan === 'Elite Annual') bonusGems = 1000;

    await this.updateProfile(userId, {
      plan,
      gems: profile.gems + bonusGems
    });

    return { plan, bonusGems, message: `Successfully subscribed to ${plan}!` };
  }

  /**
   * Upgrade Battle Pass to Premium
   */
  static async upgradeBattlePass(userId: string) {
    const profile = await this.getUserProfile(userId);
    if (profile.battle_pass === 'Premium') {
      throw new AppError('Battle Pass is already Premium!', 400);
    }
    if (profile.gems < 150) {
      throw new AppError('Insufficient Exam Gems! You need 150 Gems to unlock the Premium Battle Pass.', 400);
    }

    await this.updateProfile(userId, {
      battle_pass: 'Premium',
      gems: profile.gems - 150
    });

    return { battle_pass: 'Premium', message: 'Premium Battle Pass unlocked successfully!' };
  }

  /**
   * Claim Daily Login Reward
   */
  static async claimDaily(userId: string) {
    const profile = await this.getUserProfile(userId);
    const today = new Date().toISOString().split('T')[0];

    if (profile.lastClaimDate === today) {
      throw new AppError('You have already claimed your daily reward today! Come back tomorrow.', 400);
    }

    const newStreak = profile.streak + 1;
    let coinsAwarded = 50 * Math.min(newStreak, 6);
    let gemsAwarded = newStreak % 7 === 0 ? 25 : (newStreak === 4 ? 5 : 0);
    let mysteryBox = newStreak % 7 === 0 ? 'Legendary Scholar Box (Contains 25 Gems + 200 Coins)' : null;

    if (mysteryBox) {
      coinsAwarded += 200;
    }

    await this.updateProfile(userId, {
      coins: profile.coins + coinsAwarded,
      gems: profile.gems + gemsAwarded,
      streak: newStreak,
      lastClaimDate: today
    });

    // Also update base streak in supabase
    await supabase.from('users').update({ streak: newStreak }).eq('id', userId);

    return {
      coinsAwarded,
      gemsAwarded,
      newStreak,
      mysteryBox,
      message: `Daily reward claimed! +${coinsAwarded} Coins${gemsAwarded > 0 ? ` & +${gemsAwarded} Gems` : ''}`
    };
  }

  /**
   * Buy Gem Packs
   */
  static async buyGems(userId: string, pack: 'Starter' | 'Popular' | 'Pro' | 'Mega') {
    const profile = await this.getUserProfile(userId);
    let gemsToAdd = 0;
    if (pack === 'Starter') gemsToAdd = 30;
    if (pack === 'Popular') gemsToAdd = 130; // 120 + 10 bonus
    if (pack === 'Pro') gemsToAdd = 400;     // 350 + 50 bonus
    if (pack === 'Mega') gemsToAdd = 1000;   // 800 + 200 bonus

    await this.updateProfile(userId, { gems: profile.gems + gemsToAdd });

    return { gemsAdded: gemsToAdd, newBalance: profile.gems + gemsToAdd, message: `Successfully purchased ${pack} Gem Pack!` };
  }

  /**
   * Buy Branded Mock Test Series
   */
  static async buyMock(userId: string, mockId: string, mockName: string, costCoins: number) {
    const profile = await this.getUserProfile(userId);
    if (profile.mock_purchases.includes(mockId)) {
      throw new AppError('You already own this Mock Test Series!', 400);
    }
    if (profile.coins < costCoins) {
      throw new AppError(`Insufficient Battle Coins! You need ${costCoins} Coins.`, 400);
    }

    const updatedMocks = [...profile.mock_purchases, mockId];
    await this.updateProfile(userId, {
      coins: profile.coins - costCoins,
      mock_purchases: updatedMocks
    });

    return { mockId, mockName, message: `Successfully unlocked ${mockName}!` };
  }

  /**
   * Enter Mega Tournament
   */
  static async enterTournament(userId: string, tournamentId: string, tournamentName: string, entryFeeGems: number) {
    const profile = await this.getUserProfile(userId);
    if (profile.tournament_entries.includes(tournamentId)) {
      throw new AppError('You are already registered for this Tournament!', 400);
    }

    if (profile.plan !== 'Elite Annual') {
      if (profile.gems < entryFeeGems) {
        throw new AppError(`Insufficient Exam Gems! Entry fee is ${entryFeeGems} Gems (Free for Elite Subscribers).`, 400);
      }
      await this.updateProfile(userId, { gems: profile.gems - entryFeeGems });
    }

    const updatedTournaments = [...profile.tournament_entries, tournamentId];
    await this.updateProfile(userId, { tournament_entries: updatedTournaments });

    return { tournamentId, tournamentName, message: `Successfully registered for ${tournamentName}!` };
  }

  /**
   * Watch Rewarded Ad
   */
  static async watchAd(userId: string, action: 'earn_coins' | 'unlock_shortcut' | 'freeze_streak') {
    const profile = await this.getUserProfile(userId);
    if (action === 'earn_coins') {
      await this.updateProfile(userId, { coins: profile.coins + 100 });
      return { coinsAdded: 100, message: 'Ad watched successfully! +100 Battle Coins.' };
    } else if (action === 'unlock_shortcut') {
      return { unlocked: true, message: 'AI Shortcut Trick unlocked for this session!' };
    } else if (action === 'freeze_streak') {
      return { frozen: true, message: 'Streak Freeze activated! Your streak is safe for 24 hours.' };
    }
    throw new AppError('Invalid ad action', 400);
  }

  /**
   * Apply Friend's Referral Code
   */
  static async applyReferral(userId: string, referralCode: string) {
    const profile = await this.getUserProfile(userId);
    if (profile.referred_by) {
      throw new AppError('You have already applied a referral code!', 400);
    }
    if (profile.referral_code.toUpperCase() === referralCode.toUpperCase()) {
      throw new AppError('You cannot use your own referral code!', 400);
    }

    // Find referrer in local profiles or supabase
    let referrerId: string | null = null;
    let referrerProfile: SaaSProfile | null = null;

    const localProfiles = this.getLocalProfiles();
    for (const [id, prof] of Object.entries(localProfiles)) {
      if (prof.referral_code?.toUpperCase() === referralCode.toUpperCase()) {
        referrerId = id;
        referrerProfile = prof;
        break;
      }
    }

    if (!referrerId) {
      // Try supabase
      const { data } = await supabase.from('users').select('id').eq('referral_code', referralCode.toUpperCase()).single();
      if (data) referrerId = data.id;
    }

    if (!referrerId) {
      throw new AppError('Invalid Referral Code! Please check and try again.', 404);
    }

    // Award 500 Coins + 10 Gems to current user
    await this.updateProfile(userId, {
      referred_by: referralCode.toUpperCase(),
      coins: profile.coins + 500,
      gems: profile.gems + 10
    });

    // Award 500 Coins + 10 Gems to referrer
    if (referrerProfile) {
      localProfiles[referrerId] = {
        ...referrerProfile,
        coins: referrerProfile.coins + 500,
        gems: referrerProfile.gems + 10
      };
      this.saveLocalProfiles(localProfiles);
    } else {
      // Try updating supabase referrer
      const { data: refSb } = await supabase.from('users').select('coins, gems').eq('id', referrerId).single();
      if (refSb) {
        await supabase.from('users').update({
          coins: (refSb.coins || 0) + 500,
          gems: (refSb.gems || 0) + 10
        }).eq('id', referrerId);
      }
    }

    return { message: 'Referral Code applied successfully! +500 Coins & +10 Gems awarded to both you and your friend.' };
  }

  /**
   * Get or Create Referral Code
   */
  static async getOrCreateReferralCode(userId: string) {
    const profile = await this.getUserProfile(userId);
    return profile.referral_code;
  }
}
