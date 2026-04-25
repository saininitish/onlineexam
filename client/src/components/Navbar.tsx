import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, FileText } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass" style={{ margin: '1rem', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 1000 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
        <FileText size={28} />
        <span>MockMaster</span>
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {user ? (
          <>
            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Hi, <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user.name}</span>
              </span>
              <button onClick={handleLogout} style={{ background: 'var(--glass)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'var(--text-main)', fontWeight: 500 }}>Login</Link>
            <Link to="/register" style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
