import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle, Sun, Moon, User, Pause, Play } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getStoredTestUiLang, setStoredTestUiLang, testUiStrings, type TestUiLang } from '../i18n/testUi';
import { parseQuestion } from '../utils/questionMeta';
import { Skeleton, SkeletonCard } from '../components/Skeleton';
import { useProctoring } from '../hooks/useProctoring';
import { Radio } from 'lucide-react';


const TestEngine: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const role = user?.role;
  
  // Only join proctoring room once user is identified
  useEffect(() => {
    if (user) {
      console.log('User identified, joining proctoring room...');
    }
  }, [user]);

  useProctoring('student', user?.id || 'anonymous', 'global-proctor-room');


  const [test, setTest] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = localStorage.getItem(`test_index_${id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [answers, setAnswers] = useState<{ question_id: string, selected_answer: string }[]>(() => {
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
  const [cheatWarnings, setCheatWarnings] = useState<string[]>([]);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [hasBeenFullscreen, setHasBeenFullscreen] = useState(false);
  const [syncDriftMs, setSyncDriftMs] = useState(0);
  const [, setIsSyncing] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const sessionKey = `test_session_${id}`;
  const AUTO_SAVE_INTERVAL = 5000;
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const answersRef = useRef(answers);
  const currentIdxRef = useRef(currentIdx);
  const markedForReviewRef = useRef(markedForReview);
  const timeLeftRef = useRef(timeLeft);
  const uiLangRef = useRef(uiLang);
  const isDarkRef = useRef(isDark);
  const submittingRef = useRef(false);
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const timeSpentMapRef = useRef(timeSpentMap);
  const lastTickRef = useRef<number>(Date.now());
  const focusLossCountRef = useRef(0);
  const fullscreenExitCountRef = useRef(0);

  useEffect(() => {
    timeSpentMapRef.current = timeSpentMap;
  }, [timeSpentMap]);

  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  useEffect(() => {
    markedForReviewRef.current = markedForReview;
  }, [markedForReview]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    uiLangRef.current = uiLang;
  }, [uiLang]);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const loadSavedSession = useCallback(() => {
    try {
      const raw = localStorage.getItem(sessionKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [sessionKey]);

  const saveSession = useCallback(() => {
    if (!id || submittingRef.current) return;

    const payload = {
      currentIdx: currentIdxRef.current,
      answers: answersRef.current,
      markedForReview: markedForReviewRef.current,
      timeLeft: timeLeftRef.current,
      timeSpentMap: timeSpentMapRef.current,
      uiLang: uiLangRef.current,
      isDark: isDarkRef.current,
      lastSavedAt: Date.now()
    };

    localStorage.setItem(sessionKey, JSON.stringify(payload));
    localStorage.setItem(`test_index_${id}`, currentIdxRef.current.toString());
    localStorage.setItem(`test_answers_${id}`, JSON.stringify(answersRef.current));
  }, [id, sessionKey]);

  const reportTestEvent = useCallback(async (event: string, details: Record<string, any> = {}) => {
    if (!id) return;
    try {
      await api.post('/student/test-heartbeat', {
        test_id: id,
        event,
        details,
        current_question: test?.questions?.[currentIdx]?.id ?? null,
        time_left: timeLeft,
        page_timestamp: Date.now()
      });
    } catch {
      // Ignore network failure for monitoring pings.
    }
  }, [id, test, currentIdx, timeLeft]);

  // Keep answersRef in sync with answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    const saved = loadSavedSession();
    if (saved && !sessionRestored) {
      if (Array.isArray(saved.answers)) setAnswers(saved.answers);
      if (typeof saved.currentIdx === 'number') setCurrentIdx(saved.currentIdx);
      if (Array.isArray(saved.markedForReview)) setMarkedForReview(saved.markedForReview);
      if (typeof saved.timeLeft === 'number') setTimeLeft(saved.timeLeft);
      if (saved.timeSpentMap && typeof saved.timeSpentMap === 'object') setTimeSpentMap(saved.timeSpentMap);
      if (saved.uiLang) setUiLang(saved.uiLang);
      if (typeof saved.isDark === 'boolean') setIsDark(saved.isDark);
      setSessionRestored(true);
    }
  }, [loadSavedSession, sessionRestored]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get(`/student/test/${id}`);
        setTest(data);

        const saved = loadSavedSession();
        const restoredTime = saved && typeof saved.timeLeft === 'number' ? saved.timeLeft : null;
        const initialTime = restoredTime !== null ? Math.min(restoredTime, data.duration * 60) : data.duration * 60;
        setTimeLeft(initialTime);
        startTimeRef.current = Date.now() - ((data.duration * 60 - initialTime) * 1000);
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
  }, [id, navigate, role, loadSavedSession]);

  // Save index to localStorage
  useEffect(() => {
    localStorage.setItem(`test_index_${id}`, currentIdx.toString());
  }, [id, currentIdx]);

  useEffect(() => {
    const saveTimer = window.setInterval(saveSession, AUTO_SAVE_INTERVAL);
    return () => window.clearInterval(saveTimer);
  }, [saveSession]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFocusLossCount(prev => {
          const next = prev + 1;
          focusLossCountRef.current = next;
          setCheatWarnings(w => [...w, `Tab switched ${next} time${next === 1 ? '' : 's'}. Stay on the test screen.`]);
          reportTestEvent('tab-switch', { count: next });
          return next;
        });
      }
    };

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (isFullscreen) {
        setHasBeenFullscreen(true);
      } else if (hasBeenFullscreen) {
        setFullscreenExitCount(prev => {
          const next = prev + 1;
          fullscreenExitCountRef.current = next;
          setCheatWarnings(w => [...w, `Full-screen exited ${next} time${next === 1 ? '' : 's'}. Please remain in full-screen mode.`]);
          reportTestEvent('fullscreen-exit', { count: next });
          return next;
        });
      }
    };

    const handleBeforeUnload = () => {
      saveSession();
      reportTestEvent('page-unload');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasBeenFullscreen, reportTestEvent, saveSession]);

  useEffect(() => {
    if (!test || submitting) return;

    const syncTimer = window.setInterval(async () => {
      setIsSyncing(true);
      try {
        const currentQuestionId = test.questions?.[currentIdx]?.id ?? null;
        const { data } = await api.post('/student/test-heartbeat', {
          test_id: id,
          event: 'heartbeat',
          current_question: currentQuestionId,
          time_left: timeLeft,
          page_timestamp: Date.now()
        });

        const drift = data.serverTime - Date.now();
        setSyncDriftMs(drift);
        if (Math.abs(drift) > 1500) {
          lastTickRef.current += drift;
        }
      } catch {
        // noop
      } finally {
        setIsSyncing(false);
      }
    }, 15000);

    return () => window.clearInterval(syncTimer);
  }, [test, currentIdx, timeLeft, submitting, id]);

  // Timer - uses ref to avoid stale closures
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
        time_taken: timeTaken,
        tab_switches: focusLossCountRef.current,
        fullscreen_exits: fullscreenExitCountRef.current,
        time_spent_map: timeSpentMapRef.current
      });

      // Save time tracking locally for analytics
      localStorage.setItem(`timeSpent_${data.attempt_id}`, JSON.stringify(timeSpentMapRef.current));
      localStorage.removeItem(`test_answers_${id}`);
      localStorage.removeItem(`test_index_${id}`);
      localStorage.removeItem(`test_session_${id}`);

      if (role === 'admin') {
        navigate(`/result/${data.attempt_id}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true, state: { submittedAttemptId: data.attempt_id } });
      }
    } catch (err: any) {
      console.error('Failed to submit test', err);
      const msg = err?.response?.data?.message || err.message || 'Unknown error';
      alert('Submit failed: ' + msg);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [id, navigate, role]);

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
  }, [test, submitting, isPaused, currentIdx, doSubmit]);

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
    saveSession();
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    doSubmit();
  };

  /*
  const requestFullscreenMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setHasBeenFullscreen(true);
        setCheatWarnings(w => [...w, 'Full-screen mode enabled.']);
      }
    } catch (err) {
      console.error('Fullscreen request failed', err);
      setCheatWarnings(w => [...w, 'Please allow full-screen mode for best test security.']);
    }
  };
  */

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
    <div lang={uiLang === 'hi' ? 'hi' : 'en'} style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <div>
            <Skeleton width="150px" height="1rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100px" height="0.8rem" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Skeleton width="40px" height="40px" borderRadius="50%" />
          <Skeleton width="120px" height="2rem" borderRadius="20px" />
          <Skeleton width="80px" height="2rem" borderRadius="8px" />
        </div>
      </motion.div>

      {/* Warning Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ padding: '1rem 1.5rem', borderRadius: '14px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
      >
        <Skeleton width="200px" height="1rem" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="300px" height="0.8rem" />
      </motion.div>

      {/* Main Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
        {/* Question Section Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SkeletonCard />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <Skeleton width="120px" height="3rem" borderRadius="10px" />
            <Skeleton width="200px" height="3rem" borderRadius="12px" />
            <Skeleton width="120px" height="3rem" borderRadius="10px" />
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Skeleton width="100px" height="1.5rem" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Skeleton width="100%" height="2rem" borderRadius="8px" />
            <Skeleton width="100%" height="2rem" borderRadius="8px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="40px" borderRadius="8px" />
            ))}
          </div>
          <Skeleton width="100%" height="6px" borderRadius="3px" />
          <Skeleton width="150px" height="1rem" style={{ alignSelf: 'center' }} />
        </div>
      </div>
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
    <div lang={uiLang === 'hi' ? 'hi' : 'en'} className={`test-engine-container ${isDark ? '' : 'light-theme'}`} style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
      <style>{`
        .test-engine-container { background-color: var(--bg-dark); color: var(--text-main); transition: all 0.3s ease; }
        .test-engine-container.light-theme { 
          background-color: #f1f5f9; 
          color: #0f172a; 
          background-image: none;
        }
        .light-theme .glass { background: white; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .light-theme .mixed-lang-text { color: #1e293b; }
        .light-theme button.glass { background: #e2e8f0; color: #1e293b; }
        
        @media (max-width: 900px) {
          .test-engine-grid { grid-template-columns: 1fr !important; }
          .test-engine-sidebar { position: static !important; width: 100% !important; }
        }
        .navigation-grid::-webkit-scrollbar { width: 4px; }
        .navigation-grid::-webkit-scrollbar-track { background: transparent; }
        .navigation-grid::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }
        .navigation-grid::-webkit-scrollbar-thumb:hover { background: var(--primary); }
      `}</style>

      {/* Top Professional Header */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass"
        style={{
          marginBottom: '1.5rem',
          padding: '0.75rem 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRadius: 0,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          gap: '1rem'
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
            }}
          >
            <User size={20} style={{ color: 'white' }} />
          </motion.div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {useAuthStore.getState().user?.name || 'Student'}
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Portal ID: {useAuthStore.getState().user?.id?.slice(0, 8)}
            </p>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: '1rem',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            textAlign: 'center',
            maxWidth: '400px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ color: 'var(--primary)' }}
          >
            ●
          </motion.span>
          {test.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDark(!isDark)}
            style={{
              background: 'var(--glass)',
              color: 'var(--text-main)',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: isPaused ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: isPaused ? 'var(--success)' : 'var(--danger)',
              padding: '0.4rem 0.8rem',
              borderRadius: '10px',
              border: `1px solid ${isPaused ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? 'Resume' : 'Pause'}
          </motion.button>

          <motion.div
            animate={timeLeft < 60 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft < 60 ? Infinity : 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)',
              fontWeight: 800,
              fontSize: '1.1rem',
              background: timeLeft < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
              padding: '0.4rem 0.8rem',
              borderRadius: '10px',
              border: `1px solid ${timeLeft < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`
            }}
          >
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </motion.div>
          
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--danger)',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0.3rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
          >
            <Radio size={14} />
            <span>LIVE PROCTORING</span>
          </motion.div>
        </motion.div>
      </motion.nav>

      {cheatWarnings.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              marginBottom: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(239, 68, 68, 0.05))',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: 'var(--danger)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--danger), transparent)',
                opacity: 0.6
              }}
            />
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              <strong>Security Warning</strong>
            </motion.div>
            {cheatWarnings.slice(-2).map((warning, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', lineHeight: 1.4 }}
              >
                {warning}
              </motion.p>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="glass"
            style={{
              padding: '2rem',
              overflow: 'hidden',
              position: 'relative',
              minHeight: '400px',
              background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {isPaused && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 10,
                      backdropFilter: 'blur(16px)',
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'inherit'
                    }}
                  >
                    <motion.h3
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ marginBottom: '1.5rem', color: 'white', fontSize: '1.5rem' }}
                    >
                      ⏸️ Test Paused
                    </motion.h3>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPaused(false)}
                      style={{
                        padding: '0.8rem 2.5rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))',
                        color: 'white',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(99,102,241,0.2)'
                      }}
                    >
                      ▶️ Resume Test
                    </motion.button>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(99,102,241,0.2)'
                    }}
                  >
                    QUESTION {currentIdx + 1}
                  </motion.span>
                  <div role="group" style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid var(--glass-border)', overflow: 'hidden', fontSize: '0.7rem', fontWeight: 800 }}>
                    <motion.button
                      whileHover={{ backgroundColor: uiLang === 'en' ? 'var(--primary)' : 'transparent' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTestUiLang('en')}
                      style={{
                        padding: '0.3rem 0.6rem',
                        background: uiLang === 'en' ? 'var(--primary)' : 'transparent',
                        color: uiLang === 'en' ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      EN
                    </motion.button>
                    <motion.button
                      whileHover={{ backgroundColor: uiLang === 'hi' ? 'var(--primary)' : 'transparent' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTestUiLang('hi')}
                      style={{
                        padding: '0.3rem 0.6rem',
                        background: uiLang === 'hi' ? 'var(--primary)' : 'transparent',
                        color: uiLang === 'hi' ? 'white' : 'var(--text-muted)',
                        borderLeft: '1px solid var(--glass-border)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      हिंदी
                    </motion.button>
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      background: 'var(--glass)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    Correct: <span style={{ color: 'var(--success)' }}>+{test.marks_per_question || 0}</span> |
                    Wrong: <span style={{ color: 'var(--danger)' }}>-{test.negative_mark || 0}</span>
                  </motion.span>
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mixed-lang-text"
                  dir="auto"
                  style={{
                    fontSize: '1.4rem',
                    marginBottom: '2rem',
                    lineHeight: 1.6,
                    fontWeight: 600,
                    color: 'inherit'
                  }}
                >
                  {(uiLang === 'hi' && parsedQuestion.text_hi) ? parsedQuestion.text_hi : parsedQuestion.text}
                </motion.h3>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  {['a', 'b', 'c', 'd'].map((opt, index) => {
                    const optionText = currentQuestion[`option_${opt}`];
                    const isSelected = selectedOption === opt;
                    return (
                      <motion.button
                        key={opt}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                        whileHover={{
                          x: 8,
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                          scale: 1.02
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                        style={{
                          padding: '1.1rem 1.5rem',
                          textAlign: 'left',
                          borderRadius: '14px',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.08))'
                            : 'var(--glass)',
                          border: isSelected
                            ? '2px solid var(--primary)'
                            : '1px solid var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1.25rem',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <motion.span
                          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))'
                              : 'var(--glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            fontSize: '0.85rem',
                            color: isSelected ? 'white' : 'var(--text-muted)',
                            border: isSelected ? 'none' : '1px solid var(--glass-border)',
                            boxShadow: isSelected ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
                          }}
                        >
                          {opt}
                        </motion.span>
                        <span className="mixed-lang-text" dir="auto" style={{ fontSize: '1.05rem', flex: 1 }}>
                          {optionText.includes('|||')
                            ? (uiLang === 'hi' ? optionText.split('|||')[1]?.trim() : optionText.split('|||')[0]?.trim())
                            : optionText}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              right: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--primary)',
                              fontSize: '1.2rem'
                            }}
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              disabled={currentIdx === 0}
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: '10px',
                background: currentIdx === 0 ? 'var(--glass-border)' : 'var(--glass)',
                border: '1px solid var(--glass-border)',
                color: currentIdx === 0 ? 'var(--text-muted)' : 'var(--text-main)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: currentIdx === 0 ? 0.4 : 1,
                cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <ChevronLeft size={18} />
              {L.previous}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const qId = currentQuestion.id;
                setMarkedForReview(prev =>
                  prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
                );
              }}
              style={{
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                background: markedForReview.includes(currentQuestion.id)
                  ? 'linear-gradient(135deg, var(--secondary), rgba(236, 72, 153, 0.8))'
                  : 'var(--glass)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: markedForReview.includes(currentQuestion.id)
                  ? '0 4px 15px rgba(236, 72, 153, 0.2)'
                  : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {markedForReview.includes(currentQuestion.id) ? '🔖 Marked' : '🏁 Mark for Review'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitClick}
              disabled={submitting}
              style={{
                padding: '0.8rem 2rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--success), rgba(16,185,129,0.8))',
                color: 'white',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: submitting ? 0.6 : 1,
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 15px rgba(16,185,129,0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={16} />
              {submitting ? L.submitting : L.submitTest}
            </motion.button>

            {currentIdx < totalQuestions - 1 && (
              <motion.button
                whileHover={{ scale: 1.05, x: 5, boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIdx(prev => prev + 1)}
                style={{
                  padding: '0.8rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))',
                  color: 'white',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {L.next} <ChevronRight size={18} />
              </motion.button>
            )}
          </motion.footer>
        </div>

        {/* Sidebar — same column height feel, page scroll if needed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'sticky',
            top: '1rem',
            alignSelf: 'start',
            background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 700
            }}
          >
            {L.navigation}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              gap: '0.5rem',
              background: 'var(--glass)',
              padding: '0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>{answeredCount}</div>
              <div>{L.answered}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1.1rem' }}>{totalQuestions - answeredCount}</div>
              <div>{L.remaining}</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem',
              background: 'var(--glass)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}
            className="navigation-grid"
          >
            {test.questions.map((q: any, i: number) => {
              const isAnswered = answers.some(a => a.question_id === q.id);
              const isMarked = markedForReview.includes(q.id);
              const isCurrent = currentIdx === i;

              let bgColor = 'var(--glass)';
              let borderColor = 'var(--glass-border)';
              const textColor = 'white';
              let boxShadow = 'none';

              if (isCurrent) {
                bgColor = 'linear-gradient(135deg, var(--primary), rgba(99,102,241,0.8))';
                borderColor = 'none';
                boxShadow = '0 4px 15px rgba(99,102,241,0.3)';
              } else if (isMarked) {
                bgColor = 'linear-gradient(135deg, var(--secondary), rgba(236, 72, 153, 0.8))';
                borderColor = 'rgba(236, 72, 153, 0.5)';
                boxShadow = '0 2px 8px rgba(236, 72, 153, 0.2)';
              } else if (isAnswered) {
                bgColor = 'linear-gradient(135deg, var(--success), rgba(16,185,129,0.8))';
                borderColor = 'var(--success)';
                boxShadow = '0 2px 8px rgba(16,185,129,0.2)';
              }

              return (
                <motion.button
                  key={q.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.02 + 0.6, type: 'spring', stiffness: 200 }}
                  whileHover={{
                    scale: 1.1,
                    boxShadow: isCurrent
                      ? '0 6px 20px rgba(99,102,241,0.4)'
                      : isMarked
                        ? '0 6px 20px rgba(236, 72, 153, 0.4)'
                        : isAnswered
                          ? '0 6px 20px rgba(16,185,129,0.4)'
                          : '0 6px 20px rgba(0,0,0,0.2)'
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentIdx(i)}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: '8px',
                    background: bgColor,
                    border: borderColor === 'none' ? 'none' : `1px solid ${borderColor}`,
                    color: textColor,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: boxShadow,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {i + 1}
                  {isMarked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '12px',
                        height: '12px',
                        background: 'var(--secondary)',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-dark)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.7rem',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '0.75rem'
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--glass)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                background: 'linear-gradient(135deg, var(--success), rgba(16,185,129,0.8))',
                borderRadius: '2px'
              }} />
              Answered
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--glass)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                borderRadius: '2px'
              }} />
              Unanswered
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--glass)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                gridColumn: '1 / -1'
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                background: 'linear-gradient(135deg, var(--secondary), rgba(236, 72, 153, 0.8))',
                borderRadius: '2px'
              }} />
              Marked for Review
            </motion.div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            style={{ marginTop: '0.5rem' }}
          >
            <div style={{
              height: '8px',
              background: 'var(--glass)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--glass-border)'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--success), rgba(16,185,129,0.8))',
                  borderRadius: '4px',
                  boxShadow: '0 0 10px rgba(16,185,129,0.3)'
                }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '0.4rem',
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              {L.percentComplete(Math.round((answeredCount / totalQuestions) * 100))}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            style={{
              marginTop: 'auto',
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05))',
              borderRadius: '10px',
              border: '1px solid rgba(236, 72, 153, 0.2)',
              display: 'flex',
              gap: '0.8rem',
              alignItems: 'flex-start'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AlertCircle size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
            </motion.div>
            <div>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                margin: 0,
                fontWeight: 600
              }}>
                {L.tipRefresh}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                margin: '0.5rem 0 0',
                fontStyle: 'italic'
              }}>
                Focus losses: {focusLossCount}, fullscreen exits: {fullscreenExitCount}, sync drift: {syncDriftMs.toFixed(0)}ms
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass"
            style={{
              padding: '2.5rem',
              maxWidth: '450px',
              width: '100%',
              textAlign: 'center',
              background: 'linear-gradient(135deg, var(--glass), rgba(255,255,255,0.02))',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <Send size={48} style={{ color: 'var(--primary)' }} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}
            >
              {L.submitTitle}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))'
                }}
              >
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--success)',
                    margin: 0
                  }}
                >
                  {answeredCount}
                </motion.p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Attempted</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
                }}
              >
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--danger)',
                    margin: 0
                  }}
                >
                  {totalQuestions - answeredCount}
                </motion.p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Unattempted</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="glass"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.05))',
                  gridColumn: '1 / -1'
                }}
              >
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--secondary)',
                    margin: 0
                  }}
                >
                  {markedForReview.length}
                </motion.p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Marked for Review</p>
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                color: 'var(--text-muted)',
                marginBottom: '2rem',
                lineHeight: 1.55,
                fontSize: '0.9rem'
              }}
            >
              Kya aap sure hain ki aap apna test submit karna chahte hain? Submit karne ke baad aap answers change nahi kar payenge.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              style={{ display: 'flex', gap: '1rem' }}
            >
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {L.goBack}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={confirmSubmit}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--success), rgba(16,185,129,0.8))',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                ✓ {L.confirmSubmit}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TestEngine;
// Final structural check complete.
