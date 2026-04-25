import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, History, Clock, FileText, ChevronRight, Trophy, BarChart3, X, CheckCircle2, XCircle, MinusCircle, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

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
  const [loading, setLoading] = useState(true);
  const [submitSummary, setSubmitSummary] = useState<any>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          api.get('/student/tests'),
          api.get('/student/attempts')
        ]);
        setTests(testsRes.data);
        setAttempts(attemptsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
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
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading Dashboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <style>{`
        @media (max-width: 900px) {
          .dashboard-main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Student Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name}. Ready to ace your next exam?</p>
      </header>

      {submitSummary && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass"
          style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={26} style={{ color: 'var(--accent)' }} />
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>Test submitted — quick analysis</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{submitSummary.attempt?.tests?.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmitSummary(null)}
              aria-label="Dismiss summary"
              style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 0 }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Score / Max</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: sScore >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {sScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}> / {sMax}</span>
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Accuracy</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{sAccuracy}%</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{sCorrect} sahi</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={18} style={{ color: 'var(--danger)' }} />
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{sWrong} galat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MinusCircle size={18} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{sSkipped} chhoda</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/result/${submitSummary.attempt?.id}`)}
            style={{ padding: '0.85rem 1.5rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer' }}
          >
            Poora analysis (question-by-question)
          </button>
        </motion.section>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FileText style={{ color: 'var(--primary)' }} size={22} />
            <h2 style={{ fontSize: '1.35rem' }}>Available Mock Tests</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
              maxWidth: '640px'
            }}
          >
            {tests.length > 0 ? tests.map((test) => {
              const { count: attemptCount, last: lastAttempt } = getTestAttemptInfo(test.id);
              const triedBefore = attemptCount > 0;

              return (
              <motion.div
                key={test.id}
                whileHover={{ y: -2 }}
                className="glass"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: triedBefore && lastAttempt ? '0.5rem' : 0 }}>
                    <h3 style={{ fontSize: '0.95rem', margin: 0, lineHeight: 1.35, fontWeight: 700 }}>{test.title}</h3>
                    {triedBefore && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', alignSelf: 'flex-start',
                        padding: '0.15rem 0.45rem', borderRadius: '5px',
                        background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.35)'
                      }}>
                        Attempted{attemptCount > 1 ? ` (${attemptCount}×)` : ''}
                      </span>
                    )}
                  </div>
                  {triedBefore && lastAttempt && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Last: <strong style={{ color: 'var(--text-main)' }}>{lastAttempt.score}</strong>
                      {' · '}
                      {new Date(lastAttempt.submitted_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {test.duration} min · +{test.marks_per_question}/Q · -{test.negative_mark}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <button
                      onClick={() => navigate(`/test/${test.id}`)}
                      style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', width: '100%', border: 'none', cursor: 'pointer' }}
                    >
                      {triedBefore ? (
                        <><RotateCcw size={14} /> Reattempt</>
                      ) : (
                        <><Play size={14} fill="currentColor" /> Start</>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/leaderboard/${test.id}`)}
                      style={{ background: 'rgba(255,215,0,0.08)', color: '#FFD700', padding: '0.45rem 0.75rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.75rem', width: '100%', border: '1px solid rgba(255,215,0,0.2)', cursor: 'pointer' }}
                    >
                      <Trophy size={14} /> Board
                    </button>
                  </div>
                </div>
              </motion.div>
            );
            }) : (
              <div className="glass" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: '1 / -1', borderRadius: '14px' }}>
                No tests available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Recent Attempts */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <History style={{ color: 'var(--secondary)' }} size={24} />
            <h2 style={{ fontSize: '1.5rem' }}>Recent Attempts</h2>
          </div>

          <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attempts.length > 0 ? attempts.slice(0, 8).map((attempt) => (
              <motion.div
                key={attempt.id}
                whileHover={{ x: 5 }}
                style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/result/${attempt.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600 }}>{attempt.tests?.title}</span>
                  <span style={{ color: attempt.score >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {attempt.score}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{new Date(attempt.submitted_at).toLocaleDateString()} • {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s</span>
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)' }}>View <ChevronRight size={14} /></span>
                </div>
              </motion.div>
            )) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>No attempts yet. Start a test to see your results here!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
