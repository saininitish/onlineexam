import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, List, BarChart3, Eye, Trophy, Search, Play, Users, FileQuestion, Radio, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';
import { LiveProctoring } from '../../components/admin/LiveProctoring';
import api from '../../services/api';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'students' | 'results' | 'monitor'>('tests');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, resultsRes, studentsRes] = await Promise.all([
          api.get('/admin/tests'),
          api.get('/admin/results'),
          api.get('/admin/students')
        ]);
        setTests(testsRes.data || []);
        setResults(resultsRes.data || []);
        setStudents(studentsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch admin dashboard overview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredResults = results.filter(res =>
    res.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.tests?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', color: 'white' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> ADMIN COMMAND CENTER
            </span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0 }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '1.05rem' }}>High-level system metrics, student activity, and quick navigation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/tests')}
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.85rem 1.75rem', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', transition: 'all 0.2s ease' }}
          >
            <List size={18} /> Manage Tests & PYQs
          </button>
          <button
            onClick={() => navigate('/admin/students')}
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white', padding: '0.85rem 1.75rem', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', boxShadow: '0 10px 25px rgba(99,102,241,0.4)', transition: 'all 0.2s ease' }}
          >
            <Users size={18} /> Manage Students
          </button>
        </div>
      </header>

      {/* STAT CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {/* Stat Card 1: Tests */}
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => navigate('/admin/tests')}
          style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <FileQuestion size={24} />
            </div>
            <ArrowUpRight size={20} color="var(--text-muted)" />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{tests.length}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>Total Mock Tests</p>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Create & manage questions</span> →
          </div>
        </motion.div>

        {/* Stat Card 2: Students */}
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => navigate('/admin/students')}
          style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Users size={24} />
            </div>
            <ArrowUpRight size={20} color="var(--text-muted)" />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{students.length}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>Registered Students</p>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>View accounts & wallets</span> →
          </div>
        </motion.div>

        {/* Stat Card 3: Results */}
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => navigate('/admin/analytics')}
          style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
              <BarChart3 size={24} />
            </div>
            <ArrowUpRight size={20} color="var(--text-muted)" />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{results.length}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>Battle Attempts</p>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Detailed performance analytics</span> →
          </div>
        </motion.div>

        {/* Stat Card 4: Live Proctoring */}
        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => setActiveTab('monitor')}
          style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Radio size={24} className="spin" />
            </div>
            <span style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>LIVE</span>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Active</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>AI Proctoring Stream</p>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Open live cheating monitor</span> →
          </div>
        </motion.div>
      </div>

      {/* Tabs / Section Selector */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        {(['tests', 'students', 'results', 'monitor'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.85rem 2rem', 
              borderRadius: '16px',
              background: activeTab === tab ? 'var(--glass)' : 'transparent',
              color: activeTab === tab ? (tab === 'tests' ? 'var(--primary)' : tab === 'students' ? 'var(--success)' : tab === 'monitor' ? 'var(--danger)' : '#f59e0b') : 'var(--text-muted)',
              fontWeight: 800,
              fontSize: '1rem',
              border: activeTab === tab ? `1px solid ${tab === 'tests' ? 'var(--primary)' : tab === 'students' ? 'var(--success)' : tab === 'monitor' ? 'var(--danger)' : '#f59e0b'}` : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab === 'tests' && <><List size={18} /> Recent Tests ({tests.length})</>}
            {tab === 'students' && <><Users size={18} /> Recent Students ({students.length})</>}
            {tab === 'results' && <><BarChart3 size={18} /> Recent Results ({results.length})</>}
            {tab === 'monitor' && <><Radio size={18} /> Live Monitor</>}
          </button>
        ))}

        {activeTab === 'results' && (
          <div style={{ marginLeft: 'auto', position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search students or tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                borderRadius: '16px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', minHeight: '400px' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Overview...</div>
        ) : activeTab === 'tests' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Mock Tests</h2>
              <button 
                onClick={() => navigate('/admin/tests')} 
                style={{ background: 'transparent', color: 'var(--primary)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}
              >
                Manage All Tests →
              </button>
            </div>

            {tests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tests.slice(0, 5).map(test => (
                  <div
                    key={test.id}
                    style={{
                      padding: '1.5rem', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{test.title}</h3>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span>⏱ {test.duration}m</span>
                        <span>✅ +{test.marks_per_question}</span>
                        <span>❌ -{test.negative_mark}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/admin/tests')}
                      style={{ background: 'var(--glass)', color: 'white', padding: '0.65rem 1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      Edit Test / Add Qs
                    </button>
                  </div>
                ))}

                {tests.length > 5 && (
                  <button
                    onClick={() => navigate('/admin/tests')}
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 800, cursor: 'pointer', marginTop: '1rem', fontSize: '1rem' }}
                  >
                    View All {tests.length} Tests & Questions
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <FileQuestion size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p>No tests created yet. Click "Manage Tests & PYQs" above to get started!</p>
              </div>
            )}
          </div>
        ) : activeTab === 'students' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Recent Registered Students</h2>
              <button 
                onClick={() => navigate('/admin/students')} 
                style={{ background: 'transparent', color: 'var(--success)', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}
              >
                Manage All Students →
              </button>
            </div>

            {students.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {students.slice(0, 5).map(s => (
                  <div 
                    key={s.id}
                    style={{
                      padding: '1.5rem', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                        <Users size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>{s.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)', textTransform: 'capitalize' }}>
                        {s.role || 'student'}
                      </span>
                      <button
                        onClick={() => navigate('/admin/students')}
                        style={{ background: 'var(--glass)', color: 'white', padding: '0.65rem 1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Manage Account
                      </button>
                    </div>
                  </div>
                ))}

                {students.length > 5 && (
                  <button
                    onClick={() => navigate('/admin/students')}
                    style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 800, cursor: 'pointer', marginTop: '1rem', fontSize: '1rem' }}
                  >
                    View All {students.length} Students & Wallets
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p>No students registered yet.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'monitor' ? (
          <LiveProctoring roomId="global-proctor-room" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '1.25rem 1rem' }}>Student</th>
                <th style={{ padding: '1.25rem 1rem' }}>Test</th>
                <th style={{ padding: '1.25rem 1rem' }}>Score</th>
                <th style={{ padding: '1.25rem 1rem' }}>Time</th>
                <th style={{ padding: '1.25rem 1rem' }}>Cheating Status</th>
                <th style={{ padding: '1.25rem 1rem' }}>Date</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(res => (
                <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{res.users?.name || 'N/A'}</td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{res.tests?.title || 'N/A'}</td>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 800, color: res.score >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>{res.score}</td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{Math.floor(res.time_taken / 60)}m {res.time_taken % 60}s</td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    {res.tab_switches > 0 || res.fullscreen_exits > 0 ? (
                      <span style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '0.35rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>
                        ⚠️ {res.tab_switches} Tabs | {res.fullscreen_exits} FS
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '0.35rem 0.85rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>Clean</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{new Date(res.submitted_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => window.location.href = `/result/${res.id}`}
                      style={{ background: 'var(--glass)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
