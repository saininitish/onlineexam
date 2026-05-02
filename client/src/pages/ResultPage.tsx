import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, MinusCircle, Trophy, ArrowLeft, BarChart, Clock, Target, TrendingUp, Zap, AlertCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { autoDetectTopic, autoDetectDifficulty } from '../utils/analytics';
import { parseQuestion } from '../utils/questionMeta';

const normOpt = (v: string | null | undefined) =>
  v == null || v === '' ? '' : String(v).trim().toLowerCase();

const ResultPage: React.FC = () => {
  const { id } = useParams();
  const role = useAuthStore(s => s.user?.role);
  const homePath = role === 'admin' ? '/admin' : '/dashboard';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const [explainingIds, setExplainingIds] = useState<string[]>([]);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data: result } = await api.get(`/student/attempt/${id}`);
        setData(result);
        try {
          const ts = localStorage.getItem(`timeSpent_${id}`);
          if (ts) setTimeSpentMap(JSON.parse(ts));
        } catch (e) {
          console.error(e);
        }
      } catch (err) {
        console.error('Failed to fetch result', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Analyzing your performance...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Result not found.</div>;

  const { attempt, answers: rawAnswers } = data;
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [];

  const rowIsCorrect = (a: any) => {
    const q = a.questions ?? a.question;
    const sel = normOpt(a.selected_answer);
    if (!sel) return false;
    if (q) return sel === normOpt(q.correct_answer);
    return !!a.is_correct;
  };

  const correct = answers.filter(rowIsCorrect).length;
  const wrong = answers.filter((a: any) => normOpt(a.selected_answer) && !rowIsCorrect(a)).length;
  const unanswered = answers.filter((a: any) => !normOpt(a.selected_answer)).length;
  const total = answers.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const marksPerQ = Number(attempt.tests?.marks_per_question) || 0;
  const maxMarks = total * marksPerQ;
  const scoreVal = attempt.score != null ? Number(attempt.score) : 0;

  // Time Efficiency
  const totalDurationSeconds = (attempt.tests?.duration || 0) * 60;
  const timeEfficiency = totalDurationSeconds > 0 ? Math.round(((totalDurationSeconds - attempt.time_taken) / totalDurationSeconds) * 100) : 0;
  const avgTimePerQ = total > 0 ? Math.round(attempt.time_taken / total) : 0;

  // Insights logic
  const getInsight = () => {
    if (accuracy >= 80 && avgTimePerQ < 45) return { text: "Excellent! You have great speed and accuracy.", icon: <Zap color="var(--accent)" /> };
    if (accuracy >= 70) return { text: "Good job! Focus on reducing silly mistakes to reach 90%+", icon: <TrendingUp color="var(--success)" /> };
    if (accuracy < 50 && avgTimePerQ < 30) return { text: "You are rushing! Slow down to improve your accuracy.", icon: <AlertCircle color="var(--danger)" /> };
    if (avgTimePerQ > 90) return { text: "Speed is slow. Practice more mock tests to improve time management.", icon: <Clock color="var(--secondary)" /> };
    return { text: "Keep practicing! Consistency is key to improvement.", icon: <Trophy color="var(--primary)" /> };
  };
  const insight = getInsight();

  // Topic-wise analysis
  const topicStats: Record<string, { correct: number, total: number }> = {};
  answers.forEach((ans: any) => {
    const q = ans.questions ?? ans.question;
    if (!q) return;
    const meta = parseQuestion(q.question);
    const topic = meta.topic && meta.topic !== 'General' ? meta.topic : autoDetectTopic(meta.text);
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
    topicStats[topic].total += 1;
    if (rowIsCorrect(ans)) topicStats[topic].correct += 1;
  });

  const handleAiExplain = async (qId: string, q: any) => {
    if (explanations[qId] || explainingIds.includes(qId)) return;
    setExplainingIds(prev => [...prev, qId]);
    try {
      const { data } = await api.post('/student/ai/explain', {
        question: q.question,
        correctAnswer: q.correct_answer,
        options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }
      });
      setExplanations(prev => ({ ...prev, [qId]: data.explanation }));
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message;
      alert(`AI Explanation failed: ${msg}`);
    } finally {
      setExplainingIds(prev => prev.filter(id => id !== qId));
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={homePath} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} /> {role === 'admin' ? 'Back to Admin' : 'Back to Dashboard'}
        </Link>
      </header>

      {/* New Analysis Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

        {/* Accuracy Circle */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1.5rem' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--glass-border)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${accuracy}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{accuracy}%</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Accuracy</span>
            </div>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Overall Performance</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{accuracy >= 80 ? 'Exceptional!' : accuracy >= 60 ? 'Above Average' : 'Needs Work'}</p>
        </motion.div>

        {/* Score & Time Stats */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}><Trophy size={20} color="var(--primary)" /></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Score</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{scoreVal} / {maxMarks}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(236,72,153,0.1)', borderRadius: '10px' }}><Clock size={20} color="var(--secondary)" /></div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Used</p>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{Math.floor(attempt.time_taken / 60)}m</p>
              </div>
            </div>
          </div>
          <div style={{ height: '1px', background: 'var(--glass-border)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{correct}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Correct</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>{wrong}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wrong</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-muted)' }}>{unanswered}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Skipped</p>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ height: '8px', background: 'var(--glass)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(correct / total) * 100}%`, background: 'var(--success)' }} />
              <div style={{ width: `${(wrong / total) * 100}%`, background: 'var(--danger)' }} />
              <div style={{ width: `${(unanswered / total) * 100}%`, background: 'var(--glass-border)' }} />
            </div>
          </div>
        </motion.div>

        {/* Speed & Insight */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              {insight.icon}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Smart Insight</h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{insight.text}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Speed</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 700 }}>{avgTimePerQ}s / Q</p>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--glass)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efficiency</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 700, color: timeEfficiency > 0 ? 'var(--success)' : 'var(--danger)' }}>{timeEfficiency}% Left</p>
            </div>
          </div>
        </motion.div>

        {/* Security & Integrity Report */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: (attempt.tab_switches > 0 || attempt.fullscreen_exits > 0) ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} color={(attempt.tab_switches > 0 || attempt.fullscreen_exits > 0) ? 'var(--danger)' : 'var(--success)'} />
            Security Report
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: attempt.tab_switches > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tab Switches</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: attempt.tab_switches > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{attempt.tab_switches || 0}</p>
            </div>
            <div style={{ padding: '0.75rem', background: attempt.fullscreen_exits > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--glass)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FS Exits</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: attempt.fullscreen_exits > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{attempt.fullscreen_exits || 0}</p>
            </div>
          </div>
          {attempt.tab_switches > 2 && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>
              ⚠️ High suspicious activity detected.
            </p>
          )}
        </motion.div>
      </div>

      {/* Topics Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={20} /> Topic Wise Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(topicStats).map(([topic, stats]) => {
            const acc = Math.round((stats.correct / stats.total) * 100);
            return (
              <div key={topic} style={{ padding: '1rem', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{topic}</span>
                  <span style={{ color: acc >= 70 ? 'var(--success)' : acc >= 40 ? 'var(--secondary)' : 'var(--danger)', fontWeight: 700 }}>{acc}%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--glass-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${acc}%`, background: acc >= 70 ? 'var(--success)' : acc >= 40 ? 'var(--secondary)' : 'var(--danger)' }} />
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stats.correct} Correct of {stats.total}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Question-by-Question Breakdown */}
      <section>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart size={22} /> Detailed Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {answers.map((ans: any, idx: number) => {
            const q = ans.questions ?? ans.question;
            if (!q) return null;
            const selectedNorm = normOpt(ans.selected_answer);
            const correctNorm = normOpt(q.correct_answer);
            const isCorrect = rowIsCorrect(ans);
            const isSkipped = !selectedNorm;
            const meta = parseQuestion(q.question);
            const topic = meta.topic && meta.topic !== 'General' ? meta.topic : autoDetectTopic(meta.text);
            const difficulty = meta.difficulty || autoDetectDifficulty(meta.text);
            const tSpent = timeSpentMap[q.id] || 0;

            return (
              <motion.div
                key={ans.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass"
                style={{
                  padding: '1.5rem',
                  borderLeft: `4px solid ${isSkipped ? 'var(--text-muted)' : isCorrect ? 'var(--success)' : 'var(--danger)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: isSkipped ? 'var(--glass)' : isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: isSkipped ? 'var(--text-muted)' : isCorrect ? 'var(--success)' : 'var(--danger)',
                        padding: '0.15rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700
                      }}>
                        Q{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                        {topic}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: difficulty === 'Hard' ? 'var(--danger)' : difficulty === 'Medium' ? 'var(--secondary)' : 'var(--success)' }}>
                        {difficulty}
                      </span>
                      {tSpent > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                          ⏱ {Math.floor(tSpent / 60)}m {tSpent % 60}s
                        </span>
                      )}
                    </div>
                    <p className="mixed-lang-text" dir="auto" style={{ fontWeight: 600, lineHeight: 1.55 }}>
                      {meta.text}
                    </p>
                  </div>
                  {isSkipped ? <MinusCircle size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.2rem' }} /> :
                    isCorrect ? <CheckCircle2 size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.2rem' }} /> :
                      <XCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '0.2rem' }} />}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const isUserAnswer = selectedNorm === opt;
                    const isRightAnswer = correctNorm === opt;
                    let bg = 'transparent';
                    let border = '1px solid var(--glass-border)';
                    let color = 'var(--text-muted)';

                    if (isRightAnswer) {
                      bg = 'rgba(16,185,129,0.12)';
                      border = '1px solid var(--success)';
                      color = 'var(--success)';
                    } else if (isUserAnswer && !isCorrect) {
                      bg = 'rgba(239,68,68,0.12)';
                      border = '1px solid var(--danger)';
                      color = 'var(--danger)';
                    }

                    return (
                      <div key={opt} className="mixed-lang-text" dir="auto" style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: bg, border, color, lineHeight: 1.55 }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', marginRight: '0.4rem' }}>{opt}.</span>
                        {q[`option_${opt}`]}
                        {isRightAnswer && <span style={{ marginLeft: '0.3rem' }}>✓</span>}
                        {isUserAnswer && !isCorrect && <span style={{ marginLeft: '0.3rem' }}>✗</span>}
                      </div>
                    );
                  })}
                </div>

                {/* AI Explanation Section */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  {explanations[ans.question_id] ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={14} /> AI EXPLANATION
                      </p>
                      <p className="mixed-lang-text" dir="auto" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                        {explanations[ans.question_id]}
                      </p>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => handleAiExplain(ans.question_id, q)}
                      disabled={explainingIds.includes(ans.question_id)}
                      style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', cursor: 'pointer' }}
                    >
                      {explainingIds.includes(ans.question_id) ? '⌛ Thinking...' : <><Sparkles size={16} /> Explain with AI</>}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div style={{ textAlign: 'center', paddingBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to={homePath} style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>
          {role === 'admin' ? 'Admin panel' : 'Back to Dashboard'}
        </Link>
        {role !== 'admin' && attempt?.test_id && (
          <Link to={`/test/${attempt.test_id}`} style={{ display: 'inline-block', padding: '1rem 2.5rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
            Reattempt This Test
          </Link>
        )}
      </div>
    </div>
  );
};

export default ResultPage;
