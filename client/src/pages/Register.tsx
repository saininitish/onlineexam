import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import api from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass" 
        style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem' }}>Join Myra Chappy and start practicing</p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1rem 1rem 1rem 3rem', borderRadius: '12px', color: 'white', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'student'})}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: formData.role === 'student' ? 'var(--primary)' : 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white' }}
            >
              Student
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'admin'})}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: formData.role === 'admin' ? 'var(--primary)' : 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white' }}
            >
              Admin
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '1rem', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '1rem', 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Account...' : <><UserPlus size={20} /> Register</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
