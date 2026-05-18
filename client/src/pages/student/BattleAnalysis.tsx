import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BarChart3, 
  Sparkles, 
  Loader2,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  AlertTriangle,
  Award,
  Smile,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface RoastData {
  new_difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  difficulty_justification: string;
  analysis: {
    accuracy_text: string;
    speed_text: string;
    summary: string;
  };
  weak_topics: { topic: string; mistake: string }[];
  suggested_practice: string[];
  funny_roast: string;
  motivational_line: string;
}

const BattleAnalysis: React.FC = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [explainingIdx, setExplainingIdx] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});

  // AI Roast & Adaptive Difficulty States
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [roastLoading, setRoastLoading] = useState<boolean>(false);
  const [roastError, setRoastError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get(`/battle/${battleId}/analysis`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch battle analysis', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [battleId]);

  const handleExplain = async (idx: number, q: any) => {
    if (explanations[idx]) return;
    setExplainingIdx(idx);
    try {
      const res = await api.post('/ai/explain', {
        question: q.question,
        correctAnswer: q.correct_answer,
        options: { 
          a: q.option_a, 
          b: q.option_b, 
          c: q.option_c, 
          d: q.option_d 
        }
      });
      setExplanations(prev => ({ ...prev, [idx]: res.data.explanation }));
    } catch (err) {
      console.error('Failed to get AI explanation', err);
    } finally {
      setExplainingIdx(null);
    }
  };

  const handleGenerateRoast = async () => {
    if (!data || !data.questions) return;
    setRoastLoading(true);
    setRoastError(null);

    // Calculate metrics
    const totalCount = data.questions.length;
    let correctCount = 0;
    data.questions.forEach((q: any, idx: number) => {
      const myAns = data.answers?.find((a: any) => a.user_id === user?.id && (a.question_id === q.id || a.question_id === idx.toString() || a.question_id === idx));
      if (myAns?.is_correct) correctCount++;
    });

    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 50;
    const currentDiff = data.questions[0]?.difficulty || 'Medium';
    const topicName = data.questions[0]?.topic || data.questions[0]?.subject || 'General Aptitude';

    try {
      const res = await api.post('/ai/battle-roast', {
        performanceData: {
          playerName: user?.name || 'Student',
          topic: topicName,
          accuracy,
          correctCount,
          totalCount,
          avgResponseTime: 35,
          currentDifficulty: currentDiff,
          weakTopics: [topicName, 'Time Management & Formula Recall']
        }
      });

      if (res.data?.data) {
        setRoastData(res.data.data);
      } else {
        throw new Error('No roast data received');
      }
    } catch (err: any) {
      console.error('Error generating roast:', err);
      setRoastError('Failed to generate AI Roast. Please try again.');
    } finally {
      setRoastLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Loading Analysis...</div>;
  if (!data || !data.questions) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>
      <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
      <h2>Analysis Unavailable</h2>
      <p style={{ color: 'var(--text-muted)' }}>Questions for this battle were not saved.</p>
      <button onClick={() => navigate('/dashboard')} className="glass" style={{ marginTop: '2rem', padding: '0.8rem 2rem', color: 'white' }}>Back to Dashboard</button>
    </div>
  );

  const isWinner = data.winner === user?.id;
  const opponentName = data.player1 === user?.id ? (data.p2?.name || 'AI Bot') : (data.p1?.name || 'Unknown');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', color: 'white' }}>
      <button 
        onClick={() => navigate('/dashboard')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem', fontWeight: 600 }}
      >
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      {/* Hero Result Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: isWinner 
            ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.05))' 
            : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))',
          border: `1px solid ${isWinner ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '28px',
          boxShadow: isWinner ? '0 20px 40px rgba(34,197,94,0.2)' : '0 20px 40px rgba(239,68,68,0.2)'
        }}
      >
        <Trophy size={64} style={{ color: isWinner ? '#fbbf24' : 'var(--text-muted)', margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '3.2rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
          {isWinner ? 'Victory! 🏆' : (data.winner ? 'Defeat 💀' : 'Draw 🤝')}
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', margin: 0 }}>
          Battle against <strong>{opponentName}</strong>
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '2.5rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Your Score</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0, color: isWinner ? 'var(--success)' : 'white' }}>{data.score1}</p>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, opacity: 0.2, alignSelf: 'center' }}>VS</div>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.5rem 0', fontWeight: 700 }}>Opponent</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0, color: !isWinner && data.winner ? 'var(--danger)' : 'white' }}>{data.score2}</p>
          </div>
        </div>
      </motion.div>

      {/* AI ADAPTIVE DIFFICULTY & MEME ROAST SECTION */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Flame color="#ef4444" /> AI Adaptive Difficulty & Meme Roast
          </h2>

          <button
            onClick={handleGenerateRoast}
            disabled={roastLoading}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '16px',
              background: roastLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
              color: roastLoading ? 'var(--text-muted)' : 'white',
              border: 'none',
              cursor: roastLoading ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: roastLoading ? 'none' : '0 10px 20px rgba(239,68,68,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {roastLoading ? (
              <>
                <RefreshCw className="spin" size={18} /> Analyzing Battle Mistakes...
              </>
            ) : (
              <>
                <Sparkles size={18} /> {roastData ? 'Regenerate AI Roast & Calibration' : 'Generate AI Meme Roast & Calibration'}
              </>
            )}
          </button>
        </div>

        {roastError && (
          <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontWeight: 600 }}>
            {roastError}
          </div>
        )}

        {roastData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '28px', 
              padding: '2.5rem', 
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}
          >
            {/* Top Bar: Difficulty Progression */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                  Calibrated Next Match Difficulty
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 900, 
                    color: roastData.new_difficulty === 'Easy' ? '#10b981' : roastData.new_difficulty === 'Medium' ? '#f59e0b' : roastData.new_difficulty === 'Hard' ? '#ef4444' : '#a855f7' 
                  }}>
                    {roastData.new_difficulty} Tier
                  </span>
                  {roastData.new_difficulty === 'Expert' || roastData.new_difficulty === 'Hard' ? (
                    <TrendingUp color="#ef4444" size={24} />
                  ) : (
                    <TrendingDown color="#10b981" size={24} />
                  )}
                </div>
              </div>

              <div style={{ maxWidth: '500px' }}>
                <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <strong>AI Justification:</strong> {roastData.difficulty_justification}
                </p>
              </div>
            </div>

            {/* Middle Grid: Analysis & Weak Topics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <Target size={20} /> Performance Breakdown
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                  <li>🎯 <strong>Accuracy:</strong> {roastData.analysis?.accuracy_text}</li>
                  <li>⚡ <strong>Speed:</strong> {roastData.analysis?.speed_text}</li>
                  <li>📊 <strong>Summary:</strong> {roastData.analysis?.summary}</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                  <AlertTriangle size={20} /> Weak Sub-Topics
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                  {roastData.weak_topics?.map((item, i) => (
                    <li key={i} style={{ borderBottom: i === roastData.weak_topics.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: i === roastData.weak_topics.length - 1 ? 0 : '0.5rem' }}>
                      <strong style={{ color: 'white' }}>{item.topic}:</strong> {item.mistake}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Section: Funny Roast & Motivation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Funny Roast Box */}
              <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(15,23,42,0.8) 100%)', padding: '2rem', borderRadius: '24px', border: '1px solid #ef4444' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={22} /> AI Meme Roast 😭💀
                </h3>
                <p style={{ margin: 0, fontSize: '1.15rem', lineHeight: '1.6', color: 'white', fontWeight: 600, fontStyle: 'italic' }}>
                  "{roastData.funny_roast}"
                </p>
              </div>

              {/* Motivation Box */}
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.8) 100%)', padding: '2rem', borderRadius: '24px', border: '1px solid #10b981' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={22} /> Arena Coach Motivation 🏆
                </h3>
                <p style={{ margin: 0, fontSize: '1.15rem', lineHeight: '1.6', color: 'white', fontWeight: 600 }}>
                  "{roastData.motivational_line}"
                </p>
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase' }}>Suggested Action:</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    {roastData.suggested_practice?.[0] || 'Revise your weak formulas in the AI Study Assistant before queuing up for the next match!'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Questions Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
          <BarChart3 color="var(--primary)" /> Question Analysis
        </h2>
        
        {data.questions.map((q: any, idx: number) => {
          const myAnswer = data.answers?.find((a: any) => a.user_id === user?.id && (a.question_id === q.id || a.question_id === idx.toString() || a.question_id === idx));
          const oppAnswer = data.answers?.find((a: any) => a.user_id !== user?.id && (a.question_id === q.id || a.question_id === idx.toString() || a.question_id === idx));
          
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass" 
              style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  QUESTION {idx + 1}
                </span>
                {myAnswer?.is_correct ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <CheckCircle2 size={16} /> CORRECT
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <XCircle size={16} /> INCORRECT
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', lineHeight: 1.5, fontWeight: 700 }}>{q.question}</h3>
              {q.question_hi && <p style={{ color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '1.5rem', fontSize: '1.05rem', lineHeight: 1.5 }}>{q.question_hi}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {['a', 'b', 'c', 'd'].map(key => {
                  const isCorrect = q.correct_answer === key;
                  const isMyPick = myAnswer?.selected === key;
                  const isOppPick = oppAnswer?.selected === key;
                  
                  let borderColor = 'rgba(255,255,255,0.1)';
                  let bgColor = 'rgba(255,255,255,0.02)';
                  
                  if (isCorrect) {
                    borderColor = 'var(--success)';
                    bgColor = 'rgba(34,197,94,0.1)';
                  } else if (isMyPick) {
                    borderColor = 'var(--danger)';
                    bgColor = 'rgba(239,68,68,0.1)';
                  }

                  return (
                    <div 
                      key={key} 
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: '16px', 
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, fontSize: '1.1rem' }}>{key}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{q[`option_${key}`]}</div>
                        {q[`option_${key}_hi`] && <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.25rem' }}>{q[`option_${key}_hi`]}</div>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isMyPick && (
                          <div title="Your Answer" style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>YOU</div>
                        )}
                        {isOppPick && (
                          <div title="Opponent Answer" style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', background: 'var(--secondary)', color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>OPP</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Explanation Section */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                {!explanations[idx] ? (
                  <motion.button
                    whileHover={{ scale: 1.02, background: 'rgba(168,85,247,0.2)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExplain(idx, q)}
                    disabled={explainingIdx === idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: 'rgba(168,85,247,0.1)',
                      border: '1px solid #a855f7',
                      color: '#a855f7',
                      padding: '0.85rem 1.5rem',
                      borderRadius: '16px',
                      cursor: explainingIdx === idx ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {explainingIdx === idx ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} />
                    )}
                    {explainingIdx === idx ? 'AI is analyzing shortcut tricks...' : 'Explain with AI (Shortcuts & Logic)'}
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(15,23,42,0.8) 100%)',
                      padding: '2rem',
                      borderRadius: '20px',
                      border: '1px solid rgba(168,85,247,0.3)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', marginBottom: '1rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <Sparkles size={20} /> AI EXPLANATION & SHORTCUT TRICK 🚀
                    </div>
                    <div style={{ 
                      fontSize: '1.05rem', 
                      lineHeight: 1.7, 
                      color: 'white', 
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit'
                    }}>
                      {explanations[idx]}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BattleAnalysis;
