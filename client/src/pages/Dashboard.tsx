import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, History, Clock, FileText, ChevronRight, Trophy, BarChart3, X, CheckCircle2, XCircle, MinusCircle, RotateCcw, Award, Zap, Sparkles } from 'lucide-react';
import api, { getCached } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { SkeletonGrid, SkeletonList } from '../components/Skeleton';

const normOpt = (v: string | null | undefined) =>
  v == null || v === '' ? '' : String(v).trim().toLowerCase();

const rowIsCorrect = (a: any) => {
  const q = a.questions ?? a.question;
  const sel = normOpt(a.selected_answer);
  if (!sel) return false;
  if (q) return sel === normOpt(q.correct_answer);
  return !!a.is_correct;
};

const Dashboard: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({ xp: 0, coins: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [submitSummary, setSubmitSummary] = useState<any>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cache tests as they don't change often
        const { tests, stats } = await getCached('/student/dashboard', 120000);
        setTests(tests);
        if (stats) setUserStats(stats);
        
        // Always fetch fresh attempts to keep reattempt/history accurate
        const attemptsRes = await api.get('/student/attempts');
        setAttempts(attemptsRes.data);
      } catch (err) {
        try {
          const [{ data: dashData }, attemptsRes] = await Promise.all([
            api.get('/student/dashboard'),
            api.get('/student/attempts')
          ]);
          setTests(dashData.tests);
          if (dashData.stats) setUserStats(dashData.stats);
          setAttempts(attemptsRes.data);
        } catch (fallbackError) {
          console.error('Failed to fetch dashboard data', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const id = (location.state as { submittedAttemptId?: string } | null)?.submittedAttemptId;
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(`/student/attempt/${id}`);
        if (!cancelled) setSubmitSummary(data);
        const attemptsRes = await api.get('/student/attempts');
        if (!cancelled) setAttempts(attemptsRes.data);
      } catch (err) {
        console.error('Failed to load submitted attempt summary', err);
      } finally {
        if (!cancelled) {
          navigate('/dashboard', { replace: true, state: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.state, navigate]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={30} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'var(--glass)', height: '2.5rem', borderRadius: '8px', width: '300px' }} />
            <p style={{ color: 'var(--text-muted)', background: 'var(--glass)', height: '1rem', borderRadius: '4px', width: '400px' }} />
          </div>
        </motion.div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 300px)',
          gap: '2rem',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
          >
            <FileText style={{ color: 'var(--primary)' }} size={22} />
            <h2 style={{ fontSize: '1.35rem' }}>Available Mock Tests</h2>
          </motion.div>
          <SkeletonGrid columns={3} rows={2} />
        </section>

        <section>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
          >
            <History style={{ color: 'var(--secondary)' }} size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Recent Attempts</h2>
          </motion.div>
          <SkeletonList count={5} />
        </section>
      </div>
    </div>
  );

  const summaryAnswers = submitSummary?.answers;
  const answersList = Array.isArray(summaryAnswers) ? summaryAnswers : [];
  const sCorrect = answersList.filter(rowIsCorrect).length;
  const sWrong = answersList.filter((a: any) => normOpt(a.selected_answer) && !rowIsCorrect(a)).length;
  const sSkipped = answersList.filter((a: any) => !normOpt(a.selected_answer)).length;
  const sTotal = answersList.length;
  const sMarksPer = Number(submitSummary?.attempt?.tests?.marks_per_question) || 0;
  const sMax = sTotal * sMarksPer;
  const sScore = submitSummary?.attempt?.score != null ? Number(submitSummary.attempt.score) : 0;
  const sAccuracy = sTotal > 0 ? Math.round((sCorrect / sTotal) * 100) : 0;

  const getTestAttemptInfo = (testId: string) => {
    const forTest = attempts.filter((a) => a.test_id === testId);
    const count = forTest.length;
    if (count === 0) return { count: 0, last: null as (typeof attempts)[0] | null };
    const last = [...forTest].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0];
    return { count, last };
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* SaaS Hero Section */}
      <header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{ 
            padding: '2.5rem', 
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.05))',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="text-primary" style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Student Workspace</p>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'white', marginBottom: '0.5rem' }}>
                Hey, {user?.name.split(' ')[0]}! <span style={{ opacity: 0.5 }}>👋</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: 1.6 }}>
                You've completed <span style={{ color: 'white', fontWeight: 700 }}>{attempts.length} tests</span> so far. Keep pushing your limits!
              </p>
            </div>
            
            {/* Gamification Stats */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { label: 'Streak', value: `${userStats.streak || 0} Days`, icon: Sparkles, color: '#ec4899' },
                { label: 'Total XP', value: (userStats.xp || 0).toLocaleString(), icon: Zap, color: '#f59e0b' },
                { label: 'Level', value: Math.floor((userStats.xp || 0) / 1000) + 1, icon: Trophy, color: '#94a3b8' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="glass"
                  style={{ padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center', minWidth: '120px' }}
                >
                  <stat.icon size={20} style={{ color: stat.color, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.25rem' }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/analytics')}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <BarChart3 size={18} /> View Full Report
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
            >
              My Achievements
            </motion.button>
          </div>
        </motion.div>
      </header>

      {submitSummary && (
        <AnimatePresence>
          <motion.section
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass"
            style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)', position: 'relative', overflow: 'hidden', zIndex: 1100 }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                opacity: 0.6
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BarChart3 size={26} style={{ color: 'var(--accent)' }} />
                </motion.div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>🎉 Test Completed!</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{submitSummary.attempt?.tests?.title}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setSubmitSummary(null)}
                aria-label="Dismiss summary"
                style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 0 }}
              >
                <X size={18} />
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ textAlign: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              >
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Final Score</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: sScore >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {sScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}> / {sMax}</span>
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ textAlign: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              >
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Accuracy</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{sAccuracy}%</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ textAlign: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              >
                <CheckCircle2 size={24} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{sCorrect}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Correct</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ textAlign: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              >
                <XCircle size={24} style={{ color: 'var(--danger)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>{sWrong}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Wrong</p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{ textAlign: 'center', padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
              >
                <MinusCircle size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', margin: 0 }}>{sSkipped}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Skipped</p>
              </motion.div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate(`/result/${submitSummary.attempt?.id}`)}
              style={{ padding: '0.85rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))', color: 'white', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }}
            >
              📊 View Detailed Analysis
            </motion.button>
          </motion.section>
        </AnimatePresence>
      )}

      <div
        className="dashboard-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 300px)',
          gap: '2rem',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* Available Tests — compact card grid */}
        <section style={{ minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
          >
            <FileText style={{ color: 'var(--primary)' }} size={22} />
            <h2 style={{ fontSize: '1.35rem' }}>Available Mock Tests</h2>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
              maxWidth: '640px'
            }}
          >
            {tests.length > 0 ? tests.map((test, index) => {
              const { count: attemptCount, last: lastAttempt } = getTestAttemptInfo(test.id);
              const triedBefore = attemptCount > 0;

              return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{
                  y: -8,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
                className="glass"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => navigate(`/test/${test.id}`)}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: triedBefore ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                    opacity: 0.6
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: triedBefore && lastAttempt ? '0.5rem' : 0 }}>
                    <motion.h3
                      whileHover={{ color: 'var(--primary)' }}
                      style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.35, fontWeight: 700 }}
                    >
                      {test.title}
                    </motion.h3>
                    {triedBefore && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        style={{
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start',
                          padding: '0.15rem 0.45rem', borderRadius: '5px',
                          background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)'
                        }}
                      >
                        Attempted{attemptCount > 1 ? ` (${attemptCount}×)` : ''}
                      </motion.span>
                    )}
                  </div>
                  {triedBefore && lastAttempt && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.4 }}
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}
                    >
                      Last: <strong style={{ color: 'var(--text-main)' }}>{lastAttempt.score}</strong>
                      {' · '}
                      {new Date(lastAttempt.submitted_at).toLocaleDateString()}
                    </motion.p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {test.duration} min · +{test.marks_per_question}/Q · -{test.negative_mark}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/test/${test.id}`); }}
                      style={{
                        background: triedBefore ? 'linear-gradient(135deg, var(--success), rgba(16,185,129,0.8))' : 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))',
                        color: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.2)'
                      }}
                    >
                      {triedBefore ? (
                        <><RotateCcw size={14} /> Reattempt</>
                      ) : (
                        <><Play size={14} fill="currentColor" /> Start</>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,215,0,0.15)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/leaderboard/${test.id}`); }}
                      style={{
                        background: 'rgba(255,215,0,0.08)',
                        color: '#FFD700',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        width: '100%',
                        border: '1px solid rgba(255,215,0,0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      <Trophy size={14} /> Leaderboard
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
            }) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass"
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  borderRadius: '14px',
                  gridColumn: '1 / -1',
                  background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))'
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--primary)' }} />
                </motion.div>
                <p style={{ margin: 0 }}>No tests available at the moment.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Check back later for new mock tests! 🚀</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Recent Attempts */}
        <section>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
          >
            <History style={{ color: 'var(--secondary)' }} size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Recent Attempts</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {attempts.length > 0 ? attempts.slice(0, 8).map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.4 }}
                whileHover={{ x: 8, backgroundColor: 'rgba(255,255,255,0.02)' }}
                style={{
                  paddingBottom: '1rem',
                  borderBottom: index < Math.min(attempts.length, 8) - 1 ? '1px solid var(--glass-border)' : 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '0.5rem'
                }}
                onClick={() => navigate(`/result/${attempt.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                  <motion.span
                    whileHover={{ color: 'var(--primary)' }}
                    style={{ fontWeight: 600, flex: 1, marginRight: '1rem' }}
                  >
                    {attempt.tests?.title}
                  </motion.span>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    style={{
                      color: attempt.score >= 0 ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      background: attempt.score >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: `1px solid ${attempt.score >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}
                  >
                    {attempt.score}
                  </motion.div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{new Date(attempt.submitted_at).toLocaleDateString()} • {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</span>
                  <motion.span
                    whileHover={{ color: 'var(--primary)' }}
                    style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)' }}
                  >
                    View <ChevronRight size={14} />
                  </motion.span>
                </div>
              </motion.div>
            )) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem' }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <History size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--secondary)' }} />
                </motion.div>
                <p style={{ margin: 0 }}>No attempts yet. Start a test to see your results here!</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Your progress will appear here after your first attempt. 📈</p>
              </motion.div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
