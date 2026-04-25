import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Sun, Moon, User } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getStoredTestUiLang, setStoredTestUiLang, testUiStrings, type TestUiLang } from '../i18n/testUi';
import { parseQuestion } from '../utils/questionMeta';

const TestEngine: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore(s => s.user?.role);
  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = localStorage.getItem(`test_index_${id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [answers, setAnswers] = useState<{question_id: string, selected_answer: string}[]>(() => {
    const saved = localStorage.getItem(`test_answers_${id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uiLang, setUiLang] = useState<TestUiLang>(() => getStoredTestUiLang());
  const [isPaused, setIsPaused] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const answersRef = useRef(answers);
  const submittingRef = useRef(false);
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const timeSpentMapRef = useRef(timeSpentMap);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    timeSpentMapRef.current = timeSpentMap;
  }, [timeSpentMap]);

  // Keep answersRef in sync with answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get(`/student/test/${id}`);
        setTest(data);
        setTimeLeft(data.duration * 60);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error('Failed to fetch test', err);
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate, role]);

  // Save index to localStorage
  useEffect(() => {
    localStorage.setItem(`test_index_${id}`, currentIdx.toString());
  }, [id, currentIdx]);

  // Timer - uses ref to avoid stale closures
  useEffect(() => {
    if (timeLeft <= 0 || submitting || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // Track time for current question
        if (test?.questions && test.questions[currentIdx]) {
          const qId = test.questions[currentIdx].id;
          const now = Date.now();
          const delta = (now - lastTickRef.current) / 1000;
          lastTickRef.current = now;
          setTimeSpentMap(m => ({ ...m, [qId]: (m[qId] || 0) + delta }));
        }

        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto submit using refs to get latest data
          doSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test, submitting]);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      clearInterval(timerRef.current);
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const { data } = await api.post('/student/submit', {
        test_id: id,
        answers: answersRef.current,
        time_taken: timeTaken
      });
      // Save time tracking locally for analytics
      localStorage.setItem(`timeSpent_${data.attempt_id}`, JSON.stringify(timeSpentMapRef.current));
      
      // Clear auto-save
      localStorage.removeItem(`test_answers_${id}`);
      localStorage.removeItem(`test_index_${id}`);
      if (role === 'admin') {
        navigate(`/result/${data.attempt_id}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true, state: { submittedAttemptId: data.attempt_id } });
      }
    } catch (err: any) {
      console.error('Failed to submit test', err);
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      alert('Submit failed: ' + msg);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [id, navigate, role]);

  const handleOptionSelect = (qId: string, option: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const existingIdx = newAnswers.findIndex(a => a.question_id === qId);
      if (existingIdx > -1) {
        newAnswers[existingIdx].selected_answer = option;
      } else {
        newAnswers.push({ question_id: qId, selected_answer: option });
      }
      localStorage.setItem(`test_answers_${id}`, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const handleSubmitClick = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    doSubmit();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const L = testUiStrings[uiLang];

  const setTestUiLang = (lang: TestUiLang) => {
    setUiLang(lang);
    setStoredTestUiLang(lang);
  };

  if (loading) return (
    <div lang={uiLang === 'hi' ? 'hi' : 'en'} style={{ textAlign: 'center', padding: '5rem' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)' }}>{L.preparing}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );

  if (!test || !test.questions || test.questions.length === 0) return (
    <div lang={uiLang === 'hi' ? 'hi' : 'en'} style={{ textAlign: 'center', padding: '5rem' }}>
      <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
      <p>{L.noQuestions}</p>
      <button onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')} style={{ marginTop: '1rem', padding: '0.75rem 2rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 600 }}>
        {L.backDashboard}
      </button>
    </div>
  );

  const currentQuestion = test?.questions?.[currentIdx];
  if (!currentQuestion) {
    // If currentIdx is out of bounds (e.g. from localStorage of a previous larger test), reset it
    if (currentIdx > 0) setCurrentIdx(0);
    return null;
  }
  const parsedQuestion = parseQuestion(currentQuestion.question);
  const selectedOption = answers.find(a => a.question_id === currentQuestion.id)?.selected_answer;
  const answeredCount = answers.length;
  const totalQuestions = test.questions.length;

  return (
    <div lang={uiLang === 'hi' ? 'hi' : 'en'} className={isDark ? '' : 'light-theme'} style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      <style>{`
        body { transition: background-color 0.3s ease; }
        .light-theme body { background-image: none; background-color: #f1f5f9; }
        @media (max-width: 900px) {
          .test-engine-grid { grid-template-columns: 1fr !important; }
          .test-engine-sidebar { position: static !important; width: 100% !important; }
        }
      `}</style>

      {/* Top Professional Header */}
      <nav className="glass" style={{ marginBottom: '1.5rem', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <User size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{useAuthStore.getState().user?.name || 'Student'}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Exam Portal ID: {useAuthStore.getState().user?.id?.slice(0,8)}</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.1rem', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <span style={{ color: 'var(--primary)' }}>●</span> {test.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
           <button onClick={() => setIsDark(!isDark)} style={{ background: 'var(--glass)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {isDark ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>
             <Clock size={20} />
             <span>{formatTime(timeLeft)}</span>
           </div>
        </div>
      </nav>

      <div
        className="test-engine-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '1.5rem',
          alignItems: 'start',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}
      >
        {/* Question Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          <div className="glass" style={{ padding: '2rem', overflow: 'hidden', position: 'relative', minHeight: '400px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isPaused && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit'
                  }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Test Paused</h3>
                    <button
                      onClick={() => setIsPaused(false)}
                      style={{ padding: '0.8rem 2.5rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none' }}
                    >
                      Resume Test
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <span style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                    QUESTION {currentIdx + 1}
                  </span>
                  <div role="group" style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden', fontSize: '0.7rem', fontWeight: 800 }}>
                    <button onClick={() => setTestUiLang('en')} style={{ padding: '0.3rem 0.6rem', background: uiLang === 'en' ? 'var(--primary)' : 'transparent', color: uiLang === 'en' ? 'white' : 'var(--text-muted)' }}>EN</button>
                    <button onClick={() => setTestUiLang('hi')} style={{ padding: '0.3rem 0.6rem', background: uiLang === 'hi' ? 'var(--primary)' : 'transparent', color: uiLang === 'hi' ? 'white' : 'var(--text-muted)', borderLeft: '1px solid var(--glass-border)' }}>हिंदी</button>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Correct: <span style={{ color: 'var(--success)' }}>+{test.marks_per_question || 0}</span> | Wrong: <span style={{ color: 'var(--danger)' }}>-{test.negative_mark || 0}</span>
                  </span>
                </div>

                <h3 className="mixed-lang-text" dir="auto" style={{ fontSize: '1.4rem', marginBottom: '2rem', lineHeight: 1.6, fontWeight: 600 }}>
                  {parsedQuestion.text}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['a', 'b', 'c', 'd'].map((opt) => {
                    const optionText = currentQuestion[`option_${opt}`];
                    const isSelected = selectedOption === opt;
                    return (
                      <motion.button
                        key={opt}
                        whileHover={{ x: 5 }}
                        onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                        style={{
                          padding: '1.1rem 1.5rem', textAlign: 'left', borderRadius: '14px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--glass)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                          display: 'flex', alignItems: 'center', gap: '1.25rem',
                          transition: 'all 0.2s ease', cursor: 'pointer', color: 'var(--text-main)'
                        }}
                      >
                        <span style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? 'var(--primary)' : 'var(--glass)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: isSelected ? 'white' : 'var(--text-muted)', border: isSelected ? 'none' : '1px solid var(--glass-border)'
                        }}>{opt}</span>
                        <span className="mixed-lang-text" dir="auto" style={{ fontSize: '1.05rem', flex: 1 }}>{optionText}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button
              onClick={() => setCurrentIdx(prev => prev - 1)}
              style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: currentIdx === 0 ? 0.4 : 1, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={18} /> {L.previous}
            </button>

            <button
              onClick={() => {
                const qId = currentQuestion.id;
                setMarkedForReview(prev => 
                  prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
                );
              }}
              style={{ padding: '1rem 1.5rem', borderRadius: '12px', background: markedForReview.includes(currentQuestion.id) ? 'var(--secondary)' : 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600 }}
            >
              {markedForReview.includes(currentQuestion.id) ? '🔖 Marked' : '🏁 Mark for Review'}
            </button>

            <button
              onClick={handleSubmitClick}
              disabled={submitting}
              style={{ padding: '0.8rem 2rem', borderRadius: '10px', background: 'var(--success)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: submitting ? 0.6 : 1 }}
            >
              <Send size={16} /> {submitting ? L.submitting : L.submitTest}
            </button>

            {currentIdx < totalQuestions - 1 && (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {L.next} <ChevronRight size={18} />
              </button>
            )}
          </footer>
        </div>

        {/* Sidebar — same column height feel, page scroll if needed */}
        <div
          className="glass test-engine-sidebar"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'sticky',
            top: '1rem',
            alignSelf: 'start'
          }}
        >
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L.navigation}</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', gap: '0.5rem' }}>
            <span>{L.answered}: <strong style={{ color: 'var(--success)' }}>{answeredCount}</strong></span>
            <span>{L.remaining}: <strong style={{ color: 'var(--danger)' }}>{totalQuestions - answeredCount}</strong></span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {test.questions.map((q: any, i: number) => {
              const isAnswered = answers.some(a => a.question_id === q.id);
              const isMarked = markedForReview.includes(q.id);
              const isCurrent = currentIdx === i;
              
              let bgColor = 'var(--glass)';
              let borderColor = 'var(--glass-border)';
              let textColor = 'white';

              if (isCurrent) {
                bgColor = 'var(--primary)';
                borderColor = 'none';
              } else if (isMarked) {
                bgColor = 'var(--secondary)';
                borderColor = 'rgba(236, 72, 153, 0.5)';
              } else if (isAnswered) {
                bgColor = 'rgba(16, 185, 129, 0.2)';
                borderColor = 'var(--success)';
                textColor = 'var(--success)';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: '100%', aspectRatio: '1/1', borderRadius: '8px',
                    background: bgColor,
                    border: borderColor === 'none' ? 'none' : `1px solid ${borderColor}`,
                    color: textColor,
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {i + 1}
                  {isMarked && <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: 'var(--secondary)', borderRadius: '50%', border: '2px solid var(--bg-dark)' }} />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', borderRadius: '2px' }} /> Answered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '2px' }} /> Unanswered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', background: 'var(--secondary)', borderRadius: '2px' }} /> Marked</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }} /> Current</div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ height: '6px', background: 'var(--glass)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / totalQuestions) * 100}%`, background: 'var(--success)', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
              {L.percentComplete(Math.round((answeredCount / totalQuestions) * 100))}
            </p>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.2)', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
            <AlertCircle size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {L.tipRefresh}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass" style={{ padding: '2.5rem', maxWidth: '450px', width: '100%', textAlign: 'center' }}
          >
            <Send size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
            <h2 style={{ marginBottom: '1.5rem' }}>{L.submitTitle}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{answeredCount}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Attempted</p>
              </div>
              <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>{totalQuestions - answeredCount}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Unattempted</p>
              </div>
              <div className="glass" style={{ padding: '1rem', borderRadius: '12px', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)', margin: 0 }}>{markedForReview.length}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Marked for Review</p>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.55, fontSize: '0.9rem' }}>
              Kya aap sure hain ki aap apna test submit karna chahte hain? Submit karne ke baad aap answers change nahi kar payenge.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 600 }}
              >
                {L.goBack}
              </button>
              <button
                onClick={confirmSubmit}
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--success)', color: 'white', fontWeight: 700 }}
              >
                ✓ {L.confirmSubmit}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TestEngine;
