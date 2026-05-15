import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, FileText, Trophy, X, Zap, Swords, Settings2, RefreshCw, Database } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const Dashboard: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({ xp: 0, coins: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [battleHistory, setBattleHistory] = useState<any[]>([]);
  
  const [battleConfig, setBattleConfig] = useState({ 
    subject: 'Mathematics', 
    chapter: '',
    topic: '', 
    difficulty: 'Medium',
    time_limit: 60,
    question_count: 5,
    context: '',
    standard: 'UG Level'
  });
  const [syllabusData, setSyllabusData] = useState<{
    subjects: string[],
    chapters: string[],
    topics: {topic: string, description: string}[]
  }>({ subjects: [], chapters: [], topics: [] });

  const [creatingBattle, setCreatingBattle] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const baseSubjects = ['Mathematics', 'Science', 'History', 'Geography', 'English', 'General Knowledge', 'Other'];
  const allSubjects = [...new Set([...baseSubjects, ...syllabusData.subjects])];

  // Fetch syllabus data
  useEffect(() => {
    api.get('/syllabus/subjects').then(res => setSyllabusData(prev => ({ ...prev, subjects: res.data || [] })));
  }, []);

  useEffect(() => {
    if (syllabusData.subjects.includes(battleConfig.subject)) {
      api.get(`/syllabus/chapters?subject=${battleConfig.subject}`).then(res => setSyllabusData(prev => ({ ...prev, chapters: res.data || [] })));
    } else {
      setSyllabusData(prev => ({ ...prev, chapters: [], topics: [] }));
    }
  }, [battleConfig.subject, syllabusData.subjects]);

  useEffect(() => {
    if (battleConfig.chapter && syllabusData.chapters.includes(battleConfig.chapter)) {
      api.get(`/syllabus/topics?subject=${battleConfig.subject}&chapter=${battleConfig.chapter}`).then(res => {
        setSyllabusData(prev => ({ ...prev, topics: res.data || [] }));
      });
    } else {
      setSyllabusData(prev => ({ ...prev, topics: [] }));
    }
  }, [battleConfig.chapter, battleConfig.subject, syllabusData.chapters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, attemptsRes, battleRes] = await Promise.all([
        api.get('/student/dashboard'),
        api.get('/student/attempts'),
        api.get('/battle/history')
      ]);
      
      console.log('[Dashboard] Data received:', { dash: dashRes.data, attempts: attemptsRes.data, battles: battleRes.data });
      
      const dashData = dashRes.data || {};
      setTests(dashData.tests || []);
      setUserStats(dashData.stats || { xp: 0, coins: 0, streak: 0 });
      setAttempts(attemptsRes.data || []);
      setBattleHistory(battleRes.data || []);
    } catch (err) {
      console.error('[Dashboard] Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startBattle = async () => {
    if (!battleConfig.chapter.trim() || !battleConfig.topic.trim()) {
      alert('Please enter both Chapter and Topic name!');
      return;
    }
    setCreatingBattle(true);
    try {
      const { data } = await api.post('/battle/create', battleConfig);
      navigate(`/battle/${data.id}`);
    } catch (err) {
      alert('Failed to create battle. Make sure you ran the SQL commands!');
    } finally {
      setCreatingBattle(false);
      setShowBattleModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBattleConfig({ ...battleConfig, context: event.target?.result as string });
    };
    reader.readAsText(file);
  };

  const getTestAttemptInfo = (testId: string) => {
    if (!Array.isArray(attempts)) return { count: 0, last: null };
    const forTest = attempts.filter((a) => a.test_id === testId);
    if (forTest.length === 0) return { count: 0, last: null };
    const last = [...forTest].sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
    return { count: forTest.length, last };
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '1rem', color: 'white' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <RefreshCw size={40} color="var(--primary)" />
      </motion.div>
      <p>Loading your personalized dashboard...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header className="glass" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.05))', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Hey, {user?.name?.split(' ')?.[0] || 'Student'}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              You've completed <span style={{ color: 'white', fontWeight: 700 }}>{attempts?.length || 0} tests</span>. Ready for more?
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="glass" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '100px' }}>
              <Zap size={20} color="#f59e0b" style={{ marginBottom: '0.4rem' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{userStats?.streak || 0}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Streak</p>
            </div>
            <div className="glass" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '100px' }}>
              <Trophy size={20} color="#fbbf24" style={{ marginBottom: '0.4rem' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{Math.floor((userStats?.xp || 0) / 1000) + 1}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchData} className="glass" style={{ padding: '1rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={20} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Battle Arena */}
      <section className="glass" style={{ padding: '2rem', border: '1px solid rgba(236,72,153,0.3)', background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', fontWeight: 800 }}><Swords size={28} color="var(--secondary)" /> Custom Quiz Battle</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Challenge the AI with your own chapters, topics, and time limits!</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(236,72,153,0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowBattleModal(true)} 
          style={{ background: 'linear-gradient(135deg, var(--secondary), #be185d)', color: 'white', padding: '1rem 2rem', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <Settings2 size={20} /> Configure Battle
        </motion.button>
      </section>

      {/* Main Grid */}
      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2.5rem' }}>
        {/* Mock Tests */}
        <section>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><FileText color="var(--primary)" /> Available Mock Tests ({tests?.length || 0})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {Array.isArray(tests) && tests.length > 0 ? tests.map((test, idx) => {
              const { count, last } = getTestAttemptInfo(test.id);
              return (
                <motion.div 
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8, boxShadow: '0 12px 30px rgba(0,0,0,0.3)' }}
                  className="glass" 
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--glass-border)' }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>{test.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Clock size={14} /> {test.duration} min • +{test.marks_per_question}/Q
                    </div>
                  </div>
                  {count > 0 && last && (
                    <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', color: 'var(--success)' }}>
                      Last Attempt: <strong>{last.score}</strong> ({new Date(last.submitted_at).toLocaleDateString()})
                    </div>
                  )}
                  <button 
                    onClick={() => navigate(`/test/${test.id}`)}
                    style={{ background: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '10px', fontWeight: 700, width: '100%' }}
                  >
                    {count > 0 ? 'Reattempt' : 'Start Test'}
                  </button>
                </motion.div>
              );
            }) : (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No tests found. Make sure tests are created in the admin panel.</p>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar: Recent */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Battle History */}
          <section>
            <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem' }}>
              <Swords color="var(--secondary)" size={24} /> Recent Battles
            </h2>
            <div className="glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid rgba(236,72,153,0.2)' }}>
              {battleHistory.length > 0 ? battleHistory.map((b) => {
                const isWinner = b.winner === user?.id;
                const opponentName = b.player1 === user?.id ? (b.p2?.name || 'AI Bot') : (b.p1?.name || 'Unknown');
                return (
                  <motion.div 
                    key={b.id} 
                    whileHover={{ scale: 1.02, cursor: 'pointer' }}
                    onClick={() => navigate(`/battle/analysis/${b.id}`)}
                    style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '10px',
                      borderLeft: `4px solid ${isWinner ? 'var(--success)' : 'var(--danger)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>vs {opponentName}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isWinner ? 'var(--success)' : 'var(--danger)' }}>
                        {isWinner ? 'WON' : 'LOST'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{b.topic || 'Custom Quiz'}</span>
                      <span>{b.score1} - {b.score2}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>No battles fought yet.</p>
              )}
            </div>
          </section>

          {/* Test History */}
          <section>
            <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.4rem' }}>
              <History color="var(--primary)" size={24} /> Test History
            </h2>
          <div className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.isArray(attempts) && attempts.length > 0 ? attempts.slice(0, 8).map((a, i) => (
              <motion.div 
                key={a.id} 
                whileHover={{ x: 5, background: 'rgba(255,255,255,0.03)' }}
                style={{ padding: '0.75rem', borderBottom: i < Math.min(attempts.length, 8) - 1 ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer', borderRadius: '8px' }} 
                onClick={() => navigate(`/result/${a.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.tests?.title}</span>
                  <span style={{ color: (a.score || 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{a.score}</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.submitted_at).toLocaleDateString()}</p>
              </motion.div>
            )) : <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No attempts yet.</p>}
          </div>
          </section>
        </aside>
      </div>

      {/* Advanced Battle Modal */}
      <AnimatePresence>
        {showBattleModal && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBattleModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowBattleModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings2 /> Battle Settings</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                  <select value={battleConfig.subject} onChange={(e) => setBattleConfig({...battleConfig, subject: e.target.value, chapter: '', topic: ''})} style={{ padding: '0.8rem', width: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }}>
                    {allSubjects.map(s => <option key={s} value={s} style={{ background: '#1e293b' }}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Chapter Name</label>
                  <input 
                    type="text" 
                    list="chapter-list"
                    placeholder="e.g. Chapter 1: Introduction..." 
                    value={battleConfig.chapter} 
                    onChange={(e) => setBattleConfig({...battleConfig, chapter: e.target.value, topic: ''})} 
                    style={{ padding: '0.8rem', width: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                  />
                  <datalist id="chapter-list">
                    {syllabusData.chapters.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Topic Name</label>
                  <input 
                    type="text" 
                    list="topic-list"
                    placeholder="e.g. Newton's Laws, Trigonometry..." 
                    value={battleConfig.topic} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = syllabusData.topics.find(t => t.topic === val);
                      setBattleConfig({
                        ...battleConfig, 
                        topic: val,
                        context: selected?.description || battleConfig.context
                      });
                    }} 
                    style={{ padding: '0.8rem', width: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                  />
                  <datalist id="topic-list">
                    {syllabusData.topics.map(t => <option key={t.topic} value={t.topic} />)}
                  </datalist>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Questions ({battleConfig.question_count})</label>
                    <input type="range" min="5" max="50" step="5" value={battleConfig.question_count} onChange={(e) => setBattleConfig({...battleConfig, question_count: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Time ({battleConfig.time_limit}s)</label>
                    <input type="range" min="30" max="600" step="30" value={battleConfig.time_limit} onChange={(e) => setBattleConfig({...battleConfig, time_limit: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--secondary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button key={d} onClick={() => setBattleConfig({...battleConfig, difficulty: d})} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: battleConfig.difficulty === d ? 'var(--secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Exam Level (Standard)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['School Level', 'UG Level', 'PG Level', 'Competitive'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setBattleConfig({...battleConfig, standard: s})} 
                        style={{ 
                          padding: '0.6rem', 
                          borderRadius: '8px', 
                          border: '1px solid var(--glass-border)', 
                          background: battleConfig.standard === s ? 'var(--primary)' : 'transparent', 
                          color: 'white', 
                          cursor: 'pointer', 
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                    Upload Syllabus (CSV) - <span style={{ color: 'var(--primary)' }}>Optional</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                      style={{ 
                        padding: '0.8rem', 
                        width: '100%', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: 'white', 
                        border: '1px solid var(--glass-border)', 
                        outline: 'none',
                        fontSize: '0.8rem'
                      }}
                    />
                    {battleConfig.context && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={14} /> Syllabus context uploaded successfully!
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    onClick={() => navigate('/dashboard/syllabus')} 
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Database size={16} /> Syllabus Manager
                  </button>
                  <button onClick={startBattle} disabled={creatingBattle} style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    {creatingBattle ? 'Creating Room...' : 'Start Battle ⚔️'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
