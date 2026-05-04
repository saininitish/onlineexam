import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const AdminRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { 
    name: formData.name, 
    email: formData.email, 
    password: formData.password,
    role: 'admin',
    adminSecret: formData.adminSecret
  });
      alert('Admin account created successfully! Please login.');
      navigate('/admin/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#0f172a',
      color: 'white',
      padding: '2rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          padding: '3rem', 
          width: '100%', 
          maxWidth: '500px',
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            background: '#6366f1', 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
          }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Admin Signup</h2>
          <p style={{ color: '#94a3b8' }}>Create an administrator account</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#f87171', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '14px', 
                color: 'white', 
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="email"
              placeholder="Admin Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '14px', 
                color: 'white', 
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '14px', 
                color: 'white', 
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '14px', 
                color: 'white', 
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="password"
              placeholder="Admin Secret Key"
              value={formData.adminSecret}
              onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
              required
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid #6366f1', 
                padding: '1rem 1rem 1rem 3.5rem', 
                borderRadius: '14px', 
                color: 'white', 
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <p style={{ fontSize: '0.65rem', color: '#6366f1', marginTop: '0.4rem', marginLeft: '0.5rem' }}>Only authorized staff can provide this key.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#6366f1',
              color: 'white',
              padding: '1rem',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '1rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
            }}
          >
            {loading ? 'Creating Account...' : <><UserPlus size={20} /> Create Admin Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          Already have an admin account? <Link to="/admin/login" style={{ color: '#6366f1', fontWeight: 600 }}>Login here</Link>
        </p>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
           <button 
            onClick={() => navigate('/register')}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#64748b', 
              fontSize: '0.85rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              cursor: 'pointer'
            }}
           >
             <ArrowLeft size={14} /> Looking for Student Signup?
           </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminRegister;
