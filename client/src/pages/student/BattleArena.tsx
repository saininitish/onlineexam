import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Timer, CheckCircle2, XCircle, Volume2, VolumeX } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const BattleArena: React.FC = () => {
  const { battleId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const [opponent, setOpponent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'starting' | 'active' | 'ended'>('waiting');
  const [timeLeft, setTimeLeft] = useState(60); // Default, will be updated by battleData
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAI, setIsAI] = useState(false);
  const [waitingTime, setWaitingTime] = useState(10);
  const [battleData, setBattleData] = useState<any>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  useEffect(() => {
    const initBattle = async () => {
      try {
        const { data } = await api.get(`/battle/${battleId}`);
        setBattleData(data);
        
        // Fetch AI questions for this battle
        let qData;
        try {
          const res = await api.post('/ai/generate-questions', {
            topic: `${data.chapter || ''} - ${data.topic || ''}`,
            difficulty: data.difficulty || 'Medium',
            count: data.question_count || 5
          });
          qData = res.data;
        } catch (aiErr) {
          console.warn('AI question generation failed, using fallback questions', aiErr);
          qData = [
            { question: "What is the capital of India?", option_a: "Mumbai", option_b: "New Delhi", option_c: "Kolkata", option_d: "Chennai", correct_answer: "b" },
            { question: "Which planet is known as the Red Planet?", option_a: "Venus", option_b: "Mars", option_c: "Jupiter", option_d: "Saturn", correct_answer: "b" },
            { question: "Who wrote 'Gitanjali'?", option_a: "Premchand", option_b: "Rabindranath Tagore", option_c: "Kalidas", option_d: "Sarojini Naidu", correct_answer: "b" },
            { question: "What is the largest ocean on Earth?", option_a: "Atlantic Ocean", option_b: "Pacific Ocean", option_c: "Indian Ocean", option_d: "Arctic Ocean", correct_answer: "b" },
            { question: "Which metal is liquid at room temperature?", option_a: "Iron", option_b: "Mercury", option_c: "Gold", option_d: "Silver", correct_answer: "b" }
          ];
        }
        setQuestions(qData);
        setTimeLeft(data.time_limit || 60);
        setLoading(false);

        // Initialize Socket
        const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
        const socket = io(socketBaseUrl, {
          path: '/socket.io/'
        });
        socketRef.current = socket;

        // Check if opponent is already here
        const isP1 = data.player1 === user?.id;
        const otherUser = isP1 ? data.p2 : data.p1;
        
        if (otherUser) {
          setOpponent({ userId: otherUser.id, userName: otherUser.name });
          setStatus('starting');
          setTimeout(() => {
            socket.emit('battle-ready', battleId);
          }, 3000);
        }

        socket.emit('join-battle', {
          battleId,
          userId: user?.id,
          userName: user?.name
        });

        socket.on('opponent-joined', (data) => {
          if (!opponent) {
            setOpponent(data);
            setStatus('starting');
            setTimeout(() => {
              socket.emit('battle-ready', battleId);
            }, 3000);
          }
        });

        socket.on('start-battle', () => {
          setStatus('active');
        });

        socket.on('opponent-answer', (data) => {
          setOpponentScore(data.score);
        });

        socket.on('battle-over', () => {
          setStatus('ended');
        });

      } catch (err) {
        console.error('Failed to init battle', err);
        navigate('/dashboard');
      }
    };

    if (battleId && user) {
      initBattle();
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [battleId, user, navigate]);

  // AI Matchmaking Timer
  useEffect(() => {
    let timer: any;
    if (status === 'waiting' && !opponent && waitingTime > 0) {
      timer = setInterval(() => setWaitingTime(prev => prev - 1), 1000);
    } else if (status === 'waiting' && !opponent && waitingTime === 0) {
      // Join AI Bot
      setIsAI(true);
      setOpponent({ userId: 'ai-bot', userName: 'AI Master Bot' });
      setStatus('starting');
      setTimeout(() => setStatus('active'), 3000);
    }
    return () => clearInterval(timer);
  }, [status, opponent, waitingTime]);

  // AI Bot Answer Simulation (Smart & Competitive)
  useEffect(() => {
    let botTimer: any;
    if (isAI && status === 'active' && currentQuestionIndex < questions.length) {
      // Determine bot stats based on difficulty
      const diff = battleData?.difficulty || 'Medium';
      let accuracy = 0.7; // Medium
      let minSpeed = 5000;
      let maxSpeed = 10000;

      if (diff === 'Hard') {
        accuracy = 0.9;
        minSpeed = 3000;
        maxSpeed = 6000;
      } else if (diff === 'Easy') {
        accuracy = 0.5;
        minSpeed = 7000;
        maxSpeed = 12000;
      }

      // Competitive Logic: If bot is losing, it speeds up slightly
      if (myScore > opponentScore) {
        minSpeed -= 1000;
        maxSpeed -= 2000;
      }

      const delay = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      
      botTimer = setTimeout(() => {
        const botCorrect = Math.random() < accuracy;
        const scoreGain = botCorrect ? 10 : 0;
        
        setOpponentScore(prev => prev + scoreGain);
        
        // Notify socket if needed (even for bot to sync state)
      }, delay);
    }
    return () => clearTimeout(botTimer);
  }, [isAI, status, currentQuestionIndex, questions.length, myScore, opponentScore, battleData]);

  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && status === 'active') {
      handleFinish();
    }
  }, [timeLeft, status]);

  // Voice (Text-to-Speech) Logic
  useEffect(() => {
    if (isVoiceEnabled && status === 'active' && questions[currentQuestionIndex]) {
      const q = questions[currentQuestionIndex];
      const text = `${q.question}. Option A: ${q.option_a}. Option B: ${q.option_b}. Option C: ${q.option_c}. Option D: ${q.option_d}.`;
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentQuestionIndex, status, isVoiceEnabled, questions]);

  const handleAnswer = async (optionKey: string) => {
    if (selectedAnswer || status !== 'active') return;

    const currentQ = questions[currentQuestionIndex];
    const correct = optionKey === currentQ.correct_answer;
    
    setSelectedAnswer(optionKey);
    setIsCorrect(correct);

    const newScore = myScore + (correct ? 10 : 0);
    setMyScore(newScore);

    // Notify opponent
    socketRef.current?.emit('send-answer', {
      battleId,
      userId: user?.id,
      score: newScore,
      questionIndex: currentQuestionIndex
    });

    // Save answer to DB (Non-blocking to prevent UI hang)
    api.post(`/battle/${battleId}/submit`, {
      question_id: currentQ.id || currentQuestionIndex,
      selected: optionKey,
      is_correct: correct,
      response_time: 60 - timeLeft
    }).catch(err => console.error('Failed to log answer:', err));

    setTimeout(() => {
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentQuestionIndex(prev => {
        if (prev < questions.length - 1) {
          return prev + 1;
        } else {
          handleFinish();
          return prev;
        }
      });
    }, 1500);
  };

  const handleFinish = async () => {
    setStatus('ended');
    const winnerId = (myScore > opponentScore) ? user?.id : (isAI ? null : opponent?.userId);
    
    if (socketRef.current && !isAI) {
      socketRef.current.emit('end-battle', {
        battleId,
        winnerId
      });
    }

    await api.post(`/battle/${battleId}/finish`, {
      winnerId: (winnerId === 'ai-bot') ? null : winnerId,
      score1: myScore,
      score2: opponentScore
    });
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Battle Arena...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* Header / Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{myScore}</p>
          </div>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.name[0]}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem' }}>
            <Timer size={24} />
            <span>{timeLeft}s</span>
          </div>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>Time Left</p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              borderRadius: '50%', 
              background: isVoiceEnabled ? 'var(--primary)' : 'var(--glass)', 
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </motion.button>
        </div>

        <div className="glass" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {opponent?.userName?.[0] || '?'}
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opponent</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{opponentScore}</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass"
            style={{ padding: '4rem', textAlign: 'center' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{ marginBottom: '2rem' }}
            >
              <Swords size={64} style={{ color: 'var(--primary)' }} />
            </motion.div>
            <h2>Waiting for an opponent...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No one found? AI will join in <strong style={{ color: 'var(--primary)' }}>{waitingTime}s</strong></p>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.8rem' }}>Battle ID: {battleId}</p>
          </motion.div>
        )}

        {status === 'starting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass"
            style={{ padding: '4rem', textAlign: 'center' }}
          >
            <h1 style={{ fontSize: '5rem', color: 'var(--primary)' }}>3</h1>
            <h2>Opponent Found! Get Ready...</h2>
          </motion.div>
        )}

        {status === 'active' && questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass"
            style={{ padding: '2.5rem' }}
          >
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {questions.map((_, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      width: '30px', 
                      height: '6px', 
                      borderRadius: '3px', 
                      background: i === currentQuestionIndex ? 'var(--primary)' : (i < currentQuestionIndex ? 'var(--success)' : 'var(--glass)') 
                    }} 
                  />
                ))}
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', lineHeight: 1.4 }}>{questions[currentQuestionIndex].question}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {['a', 'b', 'c', 'd'].map((key) => {
                const optText = questions[currentQuestionIndex][`option_${key}`];
                const isSelected = selectedAnswer === key;
                const isCorrectOpt = questions[currentQuestionIndex].correct_answer === key;
                
                let borderColor = 'var(--glass-border)';
                let bgColor = 'var(--glass)';
                
                if (isSelected) {
                  borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
                  bgColor = isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                } else if (selectedAnswer && isCorrectOpt) {
                  borderColor = 'var(--success)';
                  bgColor = 'rgba(16, 185, 129, 0.1)';
                }

                return (
                  <motion.button
                    key={key}
                    whileHover={!selectedAnswer ? { scale: 1.02, background: 'rgba(255,255,255,0.05)' } : {}}
                    whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(key)}
                    className="glass"
                    style={{
                      padding: '1.5rem',
                      textAlign: 'left',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      borderColor,
                      background: bgColor,
                      cursor: selectedAnswer ? 'default' : 'pointer'
                    }}
                  >
                    <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, textTransform: 'uppercase' }}>
                      {key}
                    </span>
                    {optText}
                    {isSelected && (
                      <div style={{ marginLeft: 'auto' }}>
                        {isCorrect ? <CheckCircle2 color="var(--success)" /> : <XCircle color="var(--danger)" />}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {status === 'ended' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ padding: '4rem', textAlign: 'center' }}
          >
            <Trophy size={80} style={{ color: myScore > opponentScore ? '#fbbf24' : 'var(--text-muted)', marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {myScore > opponentScore ? 'You Won!' : (myScore === opponentScore ? "It's a Draw!" : 'Better Luck Next Time!')}
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
              Final Score: {myScore} - {opponentScore}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/dashboard')}
                className="glass" 
                style={{ padding: '1rem 2.5rem', background: 'var(--primary)', color: 'white', fontWeight: 700, borderRadius: '12px' }}
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="glass" 
                style={{ padding: '1rem 2.5rem', color: 'white', fontWeight: 700, borderRadius: '12px' }}
              >
                Rematch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleArena;
