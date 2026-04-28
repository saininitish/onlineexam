import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Medal, User } from 'lucide-react';
import api from '../services/api';

const Leaderboard: React.FC = () => {
  const { testId } = useParams();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [testTitle, setTestTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'all'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get(`/student/leaderboard/${testId}`);
        setLeaderboard(data.leaderboard);
        setTestTitle(data.test_title);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [testId]);

  const getFilteredData = () => {
    let filtered = [...leaderboard];
    const now = new Date();

    if (timeFilter === 'today') {
      const todayStr = now.toDateString();
      filtered = filtered.filter(entry => new Date(entry.submitted_at).toDateString() === todayStr);
    } else if (timeFilter === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(entry => new Date(entry.submitted_at) >= oneWeekAgo);
    }

    // Smart Ranking: High Score, then Low Time
    return filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time_taken - b.time_taken;
    });
  };

  const filteredLeaderboard = getFilteredData();

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Loading leaderboard...</div>;

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <Link to={`/test/${testId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600 }}>
          Reattempt Test
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass" style={{ padding: '2.5rem', textAlign: 'center' }}
      >
        <Trophy size={48} style={{ color: '#FFD700', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{testTitle}</p>

        {/* Time Filters */}
        <div style={{ display: 'inline-flex', background: 'var(--glass)', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          {(['all', 'weekly', 'today'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: timeFilter === f ? 'var(--primary)' : 'transparent',
                color: timeFilter === f ? 'white' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize', transition: 'all 0.2s'
              }}
            >
              {f === 'all' ? 'All Time' : f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      {filteredLeaderboard.length >= 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
          {[1, 0, 2].map((rank) => {
            const entry = filteredLeaderboard[rank];
            if (!entry) return null;
            const height = rank === 0 ? '180px' : rank === 1 ? '150px' : '120px';
            return (
              <motion.div
                key={rank}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.15 }}
                className="glass"
                style={{ width: '200px', height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', position: 'relative' }}
              >
                <div style={{ position: 'absolute', top: '-15px', width: '30px', height: '30px', borderRadius: '50%', background: medalColors[rank], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '0.85rem' }}>
                  {rank + 1}
                </div>
                <User size={24} style={{ color: medalColors[rank] }} />
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{entry.users?.name || 'Anonymous'}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{entry.score}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {Math.floor(entry.time_taken / 60)}m {entry.time_taken % 60}s
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <div className="glass" style={{ padding: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem', width: '60px' }}>Rank</th>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Score</th>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map((entry, idx) => {
              const isTop10 = idx < 10;
              return (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: isTop10 ? -10 : 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    background: isTop10 ? `rgba(99, 102, 241, ${0.15 - idx * 0.01})` : 'transparent',
                    boxShadow: idx === 0 ? 'inset 4px 0 0 var(--primary)' : 'none'
                  }}
                >
                  <td style={{ padding: '1.25rem 1rem' }}>
                    {idx < 3 ? (
                      <Medal size={24} style={{ color: medalColors[idx] }} />
                    ) : (
                      <span style={{ fontWeight: 800, color: idx < 10 ? 'var(--primary)' : 'var(--text-muted)', fontSize: idx < 10 ? '1.1rem' : '0.9rem' }}>
                        #{idx + 1}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                        <User size={16} color={idx < 3 ? medalColors[idx] : 'var(--text-muted)'} />
                      </div>
                      <span style={{ fontWeight: idx < 10 ? 700 : 500, fontSize: idx < 10 ? '1.05rem' : '1rem' }}>{entry.users?.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontWeight: 800, color: entry.score >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: idx < 10 ? '1.2rem' : '1rem' }}>{entry.score}</td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>{Math.floor(entry.time_taken / 60)}m {entry.time_taken % 60}s</td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(entry.submitted_at).toLocaleDateString()}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filteredLeaderboard.length === 0 && (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No attempts found for this time period.</p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
