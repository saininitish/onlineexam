import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  Trophy, 
  Settings, 
  LogOut,
  ChevronRight,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const menuItems = React.useMemo(() => {
    if (!user) return [];
    return user.role === 'admin' ? [
      { icon: LayoutDashboard, label: 'Admin Panel', path: '/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: Trophy, label: 'Global Rankings', path: '/leaderboard/all' },
    ] : [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: BookOpen, label: 'My Tests', path: '/dashboard' },
      { icon: BarChart3, label: 'My Analytics', path: '/analytics' },
      { icon: Trophy, label: 'Leaderboard', path: '/leaderboard/all' },
    ];
  }, [user]);

  return (
    <div className="sidebar" style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      zIndex: 1000
    }}>
      {/* Brand */}
      <div className="brand" style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '10px' }}>
            <ShieldCheck size={24} />
          </div>
          Myra Chappy
        </h2>
      </div>

      {/* Profile Mini Card */}
      <div className="profile-mini" style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        padding: '1rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'white' }}>
            <User size={20} style={{ margin: 'auto' }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              color: isActive ? 'white' : 'var(--text-muted)',
              textDecoration: 'none',
              background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              fontWeight: isActive ? 600 : 500,
              border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent'
            })}
          >
            <item.icon size={20} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronRight size={14} className="chevron" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            color: '#f87171',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          className="logout-btn"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
