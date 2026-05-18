import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Coins, 
  Gem, 
  Sparkles, 
  Flame, 
  Gift, 
  ShieldCheck, 
  Check, 
  Lock, 
  Star, 
  UserPlus, 
  Play, 
  Calendar, 
  Zap,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';

interface SaaSProfile {
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

const StoreRewards: React.FC = () => {
  const [profile, setProfile] = useState<SaaSProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'battlepass' | 'daily' | 'store' | 'referrals'>('overview');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [referralInput, setReferralInput] = useState<string>('');
  const [subscribing, setSubscribing] = useState<boolean>(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/saas/profile');
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching SaaS profile:', err);
      showMessage('error', err.response?.data?.message || 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubscribe = async (plan: 'Challenger' | 'Pro Monthly' | 'Pro Annual' | 'Elite Annual') => {
    try {
      setSubscribing(true);
      const res = await api.post('/saas/subscribe', { plan });
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUpgradeBattlePass = async () => {
    try {
      const res = await api.post('/saas/battle-pass');
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Battle pass upgrade failed');
    }
  };

  const handleClaimDaily = async () => {
    try {
      const res = await api.post('/saas/claim-daily');
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Daily claim failed');
    }
  };

  const handleBuyGems = async (pack: 'Starter' | 'Popular' | 'Pro' | 'Mega') => {
    try {
      const res = await api.post('/saas/buy-gems', { pack });
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Gem purchase failed');
    }
  };

  const handleBuyMock = async (mockId: string, mockName: string, costCoins: number) => {
    try {
      const res = await api.post('/saas/buy-mock', { mockId, mockName, costCoins });
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Mock purchase failed');
    }
  };

  const handleEnterTournament = async (tournamentId: string, tournamentName: string, entryFeeGems: number) => {
    try {
      const res = await api.post('/saas/enter-tournament', { tournamentId, tournamentName, entryFeeGems });
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Tournament registration failed');
    }
  };

  const handleWatchAd = async (action: 'earn_coins' | 'unlock_shortcut' | 'freeze_streak') => {
    try {
      const res = await api.post('/saas/watch-ad', { action });
      showMessage('success', res.data.message);
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Ad action failed');
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralInput.trim()) return;
    try {
      const res = await api.post('/saas/apply-referral', { referralCode: referralInput.trim() });
      showMessage('success', res.data.message);
      setReferralInput('');
      await fetchProfile();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Referral application failed');
    }
  };

  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Sparkles className="spin" size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3>Loading Gamified Economy...</h3>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const canClaimToday = profile?.lastClaimDate !== today;

  return (
    <div className="store-rewards-container" style={{ color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Wallet Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderRadius: '24px',
        padding: '2.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Exam Prep Battle Economy
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              <Flame size={16} /> {profile?.streak || 0} Day Streak
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Store & Rewards Arena <Sparkles color="#f59e0b" />
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem', maxWidth: '600px' }}>
            Unlock premium AI features, upgrade your Battle Pass, claim daily streaks, and dominate the national leaderboards.
          </p>
        </div>

        {/* Currency Badges */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Battle Coins */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.75rem', borderRadius: '16px', color: '#f59e0b' }}>
              <Coins size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Battle Coins</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#f59e0b' }}>{profile?.coins || 0}</h2>
            </div>
          </div>

          {/* Exam Gems */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '20px',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '16px', color: '#a855f7' }}>
              <Gem size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Exam Gems</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#a855f7' }}>{profile?.gems || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div style={{ 
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          padding: '1rem 1.5rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease'
        }}>
          {message.type === 'success' ? <Check size={24} /> : <Zap size={24} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        overflowX: 'auto', 
        paddingBottom: '1rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)' 
      }}>
        {[
          { id: 'overview', label: 'Economy Overview', icon: Trophy },
          { id: 'subscriptions', label: 'Pro Subscriptions', icon: ShieldCheck },
          { id: 'battlepass', label: 'Scholar Battle Pass', icon: Star },
          { id: 'daily', label: 'Daily Streak & Ads', icon: Flame },
          { id: 'store', label: 'Gems & Mock Store', icon: ShoppingBag },
          { id: 'referrals', label: 'Referral Squad', icon: UserPlus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              borderRadius: '16px',
              background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 10px 20px rgba(99,102,241,0.4)' : 'none'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Plan & Battle Pass Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Current Subscription Card */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '2rem', 
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Subscription</h3>
                  <span style={{ 
                    background: profile?.plan !== 'Challenger' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)', 
                    color: profile?.plan !== 'Challenger' ? '#10b981' : 'var(--text-muted)', 
                    padding: '0.35rem 1rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700 
                  }}>
                    {profile?.plan || 'Challenger'}
                  </span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
                  {profile?.plan === 'Challenger' ? 'Challenger (Free)' : profile?.plan}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {profile?.plan === 'Challenger' 
                    ? 'You are on the basic Challenger tier. Upgrade to Pro for unlimited battles, AI solutions, and shortcut tricks!' 
                    : 'You have full access to premium AI features, unlimited battles, and advanced analytics.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('subscriptions')}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: profile?.plan === 'Challenger' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {profile?.plan === 'Challenger' ? 'Upgrade to Pro' : 'Manage Subscription'} <ArrowRight size={18} />
              </button>
            </div>

            {/* Battle Pass Summary Card */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '2rem', 
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Scholar Battle Pass</h3>
                  <span style={{ 
                    background: profile?.battle_pass === 'Premium' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.1)', 
                    color: profile?.battle_pass === 'Premium' ? '#a855f7' : 'var(--text-muted)', 
                    padding: '0.35rem 1rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700 
                  }}>
                    {profile?.battle_pass || 'Free'} Pass
                  </span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Season 1: Apex Aspirants <Star color="#a855f7" />
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {profile?.battle_pass === 'Free' 
                    ? 'Unlock the Premium Battle Pass to get 150 Gems back, exclusive animated avatars, and permanent XP boosts!' 
                    : 'You are on the Premium track! Keep winning battles to unlock legendary exam chests.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('battlepass')}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: profile?.battle_pass === 'Free' ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {profile?.battle_pass === 'Free' ? 'Unlock Premium Pass' : 'View Pass Rewards'} <ArrowRight size={18} />
              </button>
            </div>

            {/* Daily Streak & Quick Action Card */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '2rem', 
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Rewards</h3>
                  <span style={{ background: canClaimToday ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: canClaimToday ? '#f59e0b' : '#10b981', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                    {canClaimToday ? 'Claim Available' : 'Claimed Today'}
                  </span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {profile?.streak || 0} Days Active <Flame color="#f59e0b" />
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {canClaimToday 
                    ? 'Your daily login reward is ready! Claim now to maintain your streak and earn bonus Battle Coins.' 
                    : 'Great job! You claimed your daily reward today. Come back tomorrow to build your streak.'}
                </p>
              </div>
              <button
                onClick={handleClaimDaily}
                disabled={!canClaimToday}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: canClaimToday ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                  color: canClaimToday ? '#0f172a' : 'var(--text-muted)',
                  border: 'none',
                  cursor: canClaimToday ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Gift size={20} /> {canClaimToday ? 'Claim Daily Reward' : 'Come Back Tomorrow'}
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Banner */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '24px', 
            padding: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f59e0b' }}>₹19</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Exam Day Cram Pass</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#10b981' }}>100%</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Ad-Free on Pro</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#a855f7' }}>150 Gems</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Returned on Battle Pass</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#6366f1' }}>500 Coins</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Per Friend Referral</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Choose Your Path to Exam Victory</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
              Unlock masterpiece AI questions, step-by-step doubt solving, voice TTS hosts, and eliminate all battle caps.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
            {/* Pro Monthly */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '2.5rem', 
              border: profile?.plan === 'Pro Monthly' ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {profile?.plan === 'Pro Monthly' && (
                <span style={{ position: 'absolute', top: '-12px', right: '24px', background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ACTIVE PLAN
                </span>
              )}
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Exam Prep Pro (Monthly)</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>Perfect for upcoming semester & term exams.</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: 0 }}>₹149</h2>
                  <span style={{ color: 'var(--text-muted)' }}>/ month</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    'Unlimited PvP & Squad Battles',
                    'Advanced AI Masterpiece Questions',
                    'Deep AI Step-by-Step Solutions',
                    'AI Shortcut Tricks & Mnemonics',
                    'Unlimited AI Doubt Solver Bot',
                    '100% Ad-Free Experience'
                  ].map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.25rem', borderRadius: '50%', color: '#10b981' }}>
                        <Check size={16} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe('Pro Monthly')}
                disabled={profile?.plan === 'Pro Monthly' || subscribing}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: profile?.plan === 'Pro Monthly' ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
                  color: profile?.plan === 'Pro Monthly' ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  cursor: profile?.plan === 'Pro Monthly' ? 'default' : 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
              >
                {profile?.plan === 'Pro Monthly' ? 'Current Plan' : subscribing ? 'Subscribing...' : 'Subscribe Monthly'}
              </button>
            </div>

            {/* Pro Annual (Bestseller) */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(99, 102, 241, 0.2) 100%)', 
              borderRadius: '24px', 
              padding: '2.5rem', 
              border: profile?.plan === 'Pro Annual' ? '2px solid #f59e0b' : '2px solid var(--primary)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(99,102,241,0.2)'
            }}>
              <span style={{ position: 'absolute', top: '-12px', right: '24px', background: '#f59e0b', color: '#0f172a', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                {profile?.plan === 'Pro Annual' ? 'ACTIVE PLAN' : 'BEST VALUE (₹100/mo)'}
              </span>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Exam Prep Pro (Annual) <Sparkles color="#f59e0b" size={20} />
                </h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>For serious JEE, NEET, UPSC & CUET aspirants.</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, color: '#f59e0b' }}>₹1,199</h2>
                  <span style={{ color: 'var(--text-muted)' }}>/ year</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    'Everything in Pro Monthly',
                    '500 Bonus Exam Gems Instantly',
                    'Exclusive Scholar King/Queen Frame',
                    'Priority Matchmaking + AI TTS Host',
                    'Advanced Weakness Mapping Analytics',
                    'Save 50% compared to monthly'
                  ].map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.25rem', borderRadius: '50%', color: '#f59e0b' }}>
                        <Check size={16} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe('Pro Annual')}
                disabled={profile?.plan === 'Pro Annual' || subscribing}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: profile?.plan === 'Pro Annual' ? 'rgba(255,255,255,0.1)' : '#f59e0b',
                  color: profile?.plan === 'Pro Annual' ? 'var(--text-muted)' : '#0f172a',
                  border: 'none',
                  cursor: profile?.plan === 'Pro Annual' ? 'default' : 'pointer',
                  fontWeight: 800,
                  transition: 'all 0.2s ease'
                }}
              >
                {profile?.plan === 'Pro Annual' ? 'Current Plan' : subscribing ? 'Subscribing...' : 'Subscribe Annually'}
              </button>
            </div>

            {/* Elite Annual */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '24px', 
              padding: '2.5rem', 
              border: profile?.plan === 'Elite Annual' ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              {profile?.plan === 'Elite Annual' && (
                <span style={{ position: 'absolute', top: '-12px', right: '24px', background: '#a855f7', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ACTIVE PLAN
                </span>
              )}
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Exam Prep Elite</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>The ultimate VIP mentorship bundle.</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, color: '#a855f7' }}>₹2,499</h2>
                  <span style={{ color: 'var(--text-muted)' }}>/ year</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    'Everything in Pro Annual',
                    '1000 Bonus Exam Gems Instantly',
                    'Free Entry to All Mega Tournaments',
                    'Monthly 1-on-1 AI Career Counselling',
                    'Physical Formula Cheat Sheets Delivered',
                    'Exclusive VIP Discord Lounge Access'
                  ].map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                      <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.25rem', borderRadius: '50%', color: '#a855f7' }}>
                        <Check size={16} />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe('Elite Annual')}
                disabled={profile?.plan === 'Elite Annual' || subscribing}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  background: profile?.plan === 'Elite Annual' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  color: profile?.plan === 'Elite Annual' ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  cursor: profile?.plan === 'Elite Annual' ? 'default' : 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.2s ease'
                }}
              >
                {profile?.plan === 'Elite Annual' ? 'Current Plan' : subscribing ? 'Subscribing...' : 'Upgrade to Elite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATTLE PASS */}
      {activeTab === 'battlepass' && (
        <div>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            marginBottom: '3rem',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <div>
              <span style={{ background: '#a855f7', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', display: 'inline-block' }}>
                SEASON 1 ACTIVE (60 DAYS REMAINING)
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Scholar Battle Pass: Apex Aspirants</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem', maxWidth: '600px' }}>
                Earn XP by winning battles to unlock tiers. Premium pass holders get 150 Gems returned upon completing Tier 50!
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', minWidth: '250px' }}>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Current Pass Status</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 1rem 0', color: profile?.battle_pass === 'Premium' ? '#a855f7' : 'white' }}>
                {profile?.battle_pass || 'Free'} Track
              </h3>
              {profile?.battle_pass === 'Free' ? (
                <button
                  onClick={handleUpgradeBattlePass}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    boxShadow: '0 10px 20px rgba(168,85,247,0.3)'
                  }}
                >
                  Unlock Premium (150 Gems)
                </button>
              ) : (
                <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Check size={20} /> Premium Unlocked
                </div>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Season 1 Reward Tracks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { tier: 1, free: '50 Battle Coins', premium: 'Apex Scholar Avatar + 10 Gems', unlocked: true },
              { tier: 5, free: '100 Battle Coins', premium: 'XP Booster Card (2x) + 15 Gems', unlocked: true },
              { tier: 10, free: '1 Diagnostic Mock Pass', premium: 'Animated Profile Banner + 20 Gems', unlocked: false },
              { tier: 25, free: '250 Battle Coins', premium: 'Legendary AI Shortcut Note + 30 Gems', unlocked: false },
              { tier: 50, free: '500 Battle Coins', premium: 'Apex Grandmaster Title + 75 Gems (Full Refund!)', unlocked: false },
            ].map((item) => (
              <div key={item.tier} style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '20px', 
                padding: '1.5rem 2rem', 
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                    {item.tier}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>Tier {item.tier} Rewards</h4>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Free: {item.free}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.5rem 1rem', borderRadius: '12px', color: '#a855f7', fontWeight: 600, fontSize: '0.9rem' }}>
                    Premium: {item.premium}
                  </div>
                  <button
                    disabled={!item.unlocked}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '12px',
                      background: item.unlocked ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                      color: item.unlocked ? 'white' : 'var(--text-muted)',
                      border: 'none',
                      cursor: item.unlocked ? 'pointer' : 'not-allowed',
                      fontWeight: 600
                    }}
                  >
                    {item.unlocked ? 'Claimed' : 'Locked'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY STREAK & ADS */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Daily Streak Roadmap */}
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>7-Day Daily Streak Roadmap</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              {[
                { day: 1, reward: '50 Coins', icon: Coins },
                { day: 2, reward: '100 Coins', icon: Coins },
                { day: 3, reward: '150 Coins', icon: Coins },
                { day: 4, reward: '5 Gems', icon: Gem },
                { day: 5, reward: '200 Coins', icon: Coins },
                { day: 6, reward: '250 Coins', icon: Coins },
                { day: 7, reward: 'Mystery Box', icon: Gift },
              ].map((item) => {
                const isCurrent = (profile?.streak || 0) + 1 === item.day;
                const isPassed = (profile?.streak || 0) >= item.day;

                return (
                  <div key={item.day} style={{ 
                    background: isPassed ? 'rgba(16, 185, 129, 0.1)' : isCurrent ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: isPassed ? '1px solid #10b981' : isCurrent ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600 }}>Day {item.day}</p>
                    <div style={{ margin: '0.5rem 0 1rem 0', color: isPassed ? '#10b981' : isCurrent ? '#f59e0b' : 'var(--text-muted)' }}>
                      <item.icon size={32} style={{ margin: '0 auto' }} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: isPassed ? '#10b981' : isCurrent ? '#f59e0b' : 'white' }}>
                      {item.reward}
                    </h4>
                    {isPassed && <Check size={16} style={{ position: 'absolute', top: '10px', right: '10px', color: '#10b981' }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                onClick={handleClaimDaily}
                disabled={!canClaimToday}
                style={{
                  padding: '1rem 3rem',
                  borderRadius: '16px',
                  background: canClaimToday ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                  color: canClaimToday ? '#0f172a' : 'var(--text-muted)',
                  border: 'none',
                  cursor: canClaimToday ? 'pointer' : 'not-allowed',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  boxShadow: canClaimToday ? '0 10px 20px rgba(245,158,11,0.3)' : 'none'
                }}
              >
                {canClaimToday ? 'Claim Daily Reward Now' : 'Daily Reward Claimed! Come Back Tomorrow'}
              </button>
            </div>
          </div>

          {/* Rewarded Ads Section */}
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Rewarded Ads (Zero Cash Perks)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[
                { title: 'Earn 100 Battle Coins', desc: 'Watch a quick 30s ad to boost your coin balance instantly.', action: 'earn_coins' as const, icon: Coins },
                { title: 'Unlock AI Shortcut Pass', desc: 'Get 1 instant AI shortcut trick & mnemonic for your next tricky question.', action: 'unlock_shortcut' as const, icon: Zap },
                { title: 'Activate Streak Freeze', desc: 'Protect your daily login streak for 24 hours without spending Gems.', action: 'freeze_streak' as const, icon: Flame },
              ].map((ad, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '20px', 
                  padding: '2rem', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ background: 'rgba(99, 102, 241, 0.2)', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                      <ad.icon size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{ad.title}</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: '1.5' }}>{ad.desc}</p>
                  </div>
                  <button
                    onClick={() => handleWatchAd(ad.action)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Play size={18} /> Watch 30s Ad
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GEMS & MOCK STORE */}
      {activeTab === 'store' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Gem Packs */}
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Exam Gems Treasury</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {[
                { name: 'Starter Pouch', gems: 30, price: '₹29', pack: 'Starter' as const, color: '#6366f1' },
                { name: 'Aspirant Stack', gems: 130, price: '₹99', pack: 'Popular' as const, color: '#f59e0b', popular: true },
                { name: 'Scholar Chest', gems: 400, price: '₹249', pack: 'Pro' as const, color: '#10b981' },
                { name: 'Champion Treasury', gems: 1000, price: '₹499', pack: 'Mega' as const, color: '#a855f7' },
              ].map((pack, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '24px', 
                  padding: '2rem', 
                  border: pack.popular ? `2px solid ${pack.color}` : '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {pack.popular && (
                    <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: pack.color, color: '#0f172a', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                      MOST POPULAR
                    </span>
                  )}
                  <div>
                    <div style={{ background: `rgba(${pack.popular ? '245,158,11' : '99,102,241'}, 0.1)`, width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: pack.color }}>
                      <Gem size={36} />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{pack.name}</h3>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: pack.color }}>{pack.gems} Gems</h2>
                  </div>
                  <button
                    onClick={() => handleBuyGems(pack.pack)}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: pack.popular ? pack.color : 'rgba(255,255,255,0.1)',
                      color: pack.popular ? '#0f172a' : 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Buy for {pack.price}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Branded Mock Test Bundles */}
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Branded Mock Test Bundles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[
                { id: 'mock_cuet_10', name: '10 Full-Length CUET Grand Mocks', institute: 'Delhi Univ Experts', cost: 1000 },
                { id: 'mock_jee_adv', name: 'JEE Advanced Challenger Series (15 Tests)', institute: 'Kota Top Faculty', cost: 2500 },
                { id: 'mock_neet_aiims', name: 'NEET AIIMS Benchmark Mocks (20 Tests)', institute: 'AIIMS Toppers Panel', cost: 2000 },
              ].map((mock) => {
                const owned = profile?.mock_purchases.includes(mock.id);

                return (
                  <div key={mock.id} style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '20px', 
                    padding: '2rem', 
                    border: owned ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {mock.institute}
                        </span>
                        {owned && (
                          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                            OWNED
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>{mock.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
                        Includes detailed video solutions, national percentile ranking, and AI weakness breakdown.
                      </p>
                    </div>

                    <button
                      onClick={() => handleBuyMock(mock.id, mock.name, mock.cost)}
                      disabled={owned}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: owned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.2)',
                        color: owned ? '#10b981' : '#f59e0b',
                        border: owned ? '1px solid #10b981' : '1px solid rgba(245, 158, 11, 0.5)',
                        cursor: owned ? 'default' : 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {owned ? <Check size={18} /> : <Coins size={18} />} 
                      {owned ? 'Unlocked' : `Unlock for ${mock.cost} Coins`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mega Tournaments */}
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Upcoming Mega Weekend Tournaments</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[
                { id: 'tourn_jee_may', name: 'JEE Grand Scholarship Clash', prize: '₹5,000,000 Pool + Laptops', fee: 30, date: 'May 24, 2026' },
                { id: 'tourn_neet_june', name: 'NEET All-India Mega Battle', prize: '₹3,000,000 Pool + iPads', fee: 30, date: 'June 7, 2026' },
              ].map((tourn) => {
                const registered = profile?.tournament_entries.includes(tourn.id);

                return (
                  <div key={tourn.id} style={{ 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.8) 100%)', 
                    borderRadius: '20px', 
                    padding: '2rem', 
                    border: registered ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                          <Calendar size={14} /> {tourn.date}
                        </span>
                        {registered && (
                          <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                            REGISTERED
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{tourn.name}</h3>
                      <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1.5rem 0' }}>🏆 {tourn.prize}</p>
                    </div>

                    <button
                      onClick={() => handleEnterTournament(tourn.id, tourn.name, tourn.fee)}
                      disabled={registered}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: registered ? 'rgba(168, 85, 247, 0.1)' : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                        color: 'white',
                        border: registered ? '1px solid #a855f7' : 'none',
                        cursor: registered ? 'default' : 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {registered ? <Check size={18} /> : <Gem size={18} />} 
                      {registered ? 'Entry Confirmed' : profile?.plan === 'Elite Annual' ? 'Enter Free (Elite VIP)' : `Enter for ${tourn.fee} Gems`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REFERRAL SQUAD */}
      {activeTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Your Code & Invite Banner */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Study Squad Referral Program</h2>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '1.1rem', maxWidth: '600px' }}>
                Invite your school & coaching friends! When they join and complete 1 battle, BOTH of you get 500 Coins + 10 Gems.
              </p>
              <div>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>YOUR UNIQUE REFERRAL CODE:</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '2px dashed var(--primary)', padding: '0.75rem 2rem', borderRadius: '16px', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '3px', color: '#f59e0b' }}>
                    {profile?.referral_code || 'LOADING...'}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile?.referral_code || '');
                      showMessage('success', 'Referral code copied to clipboard!');
                    }}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderRadius: '16px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            </div>

            {/* Enter Friend's Code Form */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '300px', flex: 1, maxWidth: '400px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Have a Friend's Invite Code?</h3>
              {profile?.referred_by ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '1rem', borderRadius: '12px', fontWeight: 600, textAlign: 'center' }}>
                  <Check size={20} style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
                  Referred by Code: {profile.referred_by}
                </div>
              ) : (
                <form onSubmit={handleApplyReferral} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Enter 6-Digit Code"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '1.1rem',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: '#10b981',
                      color: '#0f172a',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: '1.05rem'
                    }}
                  >
                    Apply & Claim +500 Coins
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Milestone Tiers */}
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Referral Milestone Rewards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {[
                { tier: 'Tier 1', friends: '3 Friends', reward: '7 Days Exam Prep Pro Free + Squad Leader Title', icon: ShieldCheck },
                { tier: 'Tier 2', friends: '10 Friends', reward: '1 Month Exam Prep Pro + Campus Legend Avatar', icon: Star },
                { tier: 'Tier 3', friends: '25 Friends', reward: '₹500 Amazon Gift Voucher + VIP Lounge Access', icon: Trophy },
              ].map((m, i) => (
                <div key={i} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '20px', 
                  padding: '2rem', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '16px', color: 'var(--primary)' }}>
                    <m.icon size={32} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>{m.tier} ({m.friends})</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>{m.reward}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreRewards;
