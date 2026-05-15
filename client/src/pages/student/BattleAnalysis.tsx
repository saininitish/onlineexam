import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, CheckCircle2, XCircle, AlertCircle, BarChart3, Sparkles, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const BattleAnalysis: React.FC = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [explainingIdx, setExplainingIdx] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});

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

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>Loading Analysis...</div>;
  if (!data || !data.questions) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>
      <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
      <h2>Analysis Unavailable</h2>
      <p style={{ color: 'var(--text-muted)' }}>Questions for this battle were not saved.</p>
      <button onClick={() => navigate('/dashboard')} className="glass" style={{ marginTop: '2rem', padding: '0.8rem 2rem', color: 'white' }}>Back to Dashboard</button>
    </div>
  );

  const isWinner = data.winner === user?.id;
  const opponentName = data.player1 === user?.id ? (data.p2?.name || 'AI Bot') : (data.p1?.name || 'Unknown');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <button 
        onClick={() => navigate('/dashboard')} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '2rem' }}
      >
        <ChevronLeft size={20} /> Back to Dashboard
      </button>

      {/* Hero Result */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          background: isWinner 
            ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.05))' 
            : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))',
          border: `1px solid ${isWinner ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}
      >
        <Trophy size={64} style={{ color: isWinner ? '#fbbf24' : 'var(--text-muted)', marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          {isWinner ? 'Victory!' : (data.winner ? 'Defeat' : 'Draw')}
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Battle against <strong>{opponentName}</strong>
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '2.5rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Score</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: isWinner ? 'var(--success)' : 'white' }}>{data.score1}</p>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, opacity: 0.2, alignSelf: 'center' }}>VS</div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opponent</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 900, color: !isWinner && data.winner ? 'var(--danger)' : 'white' }}>{data.score2}</p>
          </div>
        </div>
      </motion.div>

      {/* Questions Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
              style={{ padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>QUESTION {idx + 1}</span>
                {myAnswer?.is_correct ? (
                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> CORRECT
                  </span>
                ) : (
                  <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <XCircle size={16} /> INCORRECT
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>{q.question}</h3>
              {q.question_hi && <p style={{ color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '1.5rem', fontSize: '1rem' }}>{q.question_hi}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {['a', 'b', 'c', 'd'].map(key => {
                  const isCorrect = q.correct_answer === key;
                  const isMyPick = myAnswer?.selected === key;
                  const isOppPick = oppAnswer?.selected === key;
                  
                  let borderColor = 'var(--glass-border)';
                  let bgColor = 'transparent';
                  
                  if (isCorrect) {
                    borderColor = 'var(--success)';
                    bgColor = 'rgba(34,197,94,0.05)';
                  } else if (isMyPick) {
                    borderColor = 'var(--danger)';
                    bgColor = 'rgba(239,68,68,0.05)';
                  }

                  return (
                    <div 
                      key={key} 
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '10px', 
                        border: `1px solid ${borderColor}`,
                        background: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        position: 'relative'
                      }}
                    >
                      <span style={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>{key}</span>
                      <div style={{ flex: 1 }}>
                        <div>{q[`option_${key}`]}</div>
                        {q[`option_${key}_hi`] && <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{q[`option_${key}_hi`]}</div>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isMyPick && (
                          <div title="Your Answer" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>YOU</div>
                        )}
                        {isOppPick && (
                          <div title="Opponent Answer" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>OPP</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Explanation Section */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                {!explanations[idx] ? (
                  <motion.button
                    whileHover={{ scale: 1.02, background: 'rgba(99,102,241,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExplain(idx, q)}
                    disabled={explainingIdx === idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'var(--glass)',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      cursor: explainingIdx === idx ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {explainingIdx === idx ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {explainingIdx === idx ? 'AI is thinking...' : 'Explain with AI'}
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      background: 'rgba(99,102,241,0.05)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(99,102,241,0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.8rem', fontSize: '0.9rem', fontWeight: 800 }}>
                      <Sparkles size={18} /> AI EXPLANATION
                    </div>
                    <div style={{ 
                      fontSize: '0.95rem', 
                      lineHeight: 1.7, 
                      color: 'var(--text-main)', 
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
