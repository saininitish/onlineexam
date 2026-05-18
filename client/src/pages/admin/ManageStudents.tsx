import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserCheck, Shield, Award, Zap, Coins, Gem, ChevronLeft, Eye, Trash2, User } from 'lucide-react';
import api from '../../services/api';

const ManageStudents: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student ${name}? All their battle results will also be removed.`)) return;
    try {
      await api.delete(`/admin/students/${studentId}`);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      alert(`Student ${name} deleted successfully.`);
    } catch (err: any) {
      console.error('Failed to delete student', err);
      alert(err?.response?.data?.message || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'white' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={() => navigate('/admin')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}
          >
            <ChevronLeft size={20} /> Back to Admin Dashboard
          </button>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Student Management</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Monitor student accounts, streaks, coins balance, and SaaS subscription tiers.</p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.75rem',
              borderRadius: '16px',
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              color: 'white',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>
      </header>

      <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Students...</div>
        ) : filteredStudents.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '1.25rem 1rem' }}>Student</th>
                <th style={{ padding: '1.25rem 1rem' }}>Role</th>
                <th style={{ padding: '1.25rem 1rem' }}>SaaS Plan</th>
                <th style={{ padding: '1.25rem 1rem' }}>Wallet Balance</th>
                <th style={{ padding: '1.25rem 1rem' }}>Streak</th>
                <th style={{ padding: '1.25rem 1rem' }}>Joined</th>
                <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <motion.tr 
                  key={s.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ borderBottom: idx === filteredStudents.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                >
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: s.role === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)', border: s.role === 'admin' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.role === 'admin' ? '#ef4444' : 'var(--primary)' }}>
                        {s.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>{s.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem 1rem' }}>
                    <span style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      background: s.role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: s.role === 'admin' ? 'var(--danger)' : 'var(--success)',
                      border: s.role === 'admin' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)'
                    }}>
                      {s.role || 'student'}
                    </span>
                  </td>

                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Award size={18} color="#a855f7" />
                      <span style={{ color: '#a855f7' }}>Elite Pro</span>
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Coins size={16} /> 1,250
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Gem size={16} /> 45
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f97316', fontWeight: 700 }}>
                      <Zap size={16} className="fill-current" /> 5 Days
                    </div>
                  </td>

                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Active'}
                  </td>

                  <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => alert(`Detailed stats for ${s.name} will be displayed here.`)}
                        style={{ background: 'var(--glass)', color: 'var(--primary)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid var(--glass-border)', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                      >
                        <Eye size={14} /> View
                      </button>
                      {s.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
