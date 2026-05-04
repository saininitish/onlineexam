import React from 'react';
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Trophy, 
  LogOut, 
  ChevronRight, 
  User, 
  ShieldCheck,
  Settings,
  Users,
  BookOpenCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BookOpenCheck, label: 'Manage Tests', path: '/admin/tests' },
    { icon: Users, label: 'Students', path: '/admin/students' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Trophy, label: 'Rankings', path: '/leaderboard/all' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Admin Sidebar */}
      <aside style={{
        width: '260px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 800 }}>
            <div style={{ background: '#6366f1', padding: '0.5rem', borderRadius: '10px' }}>
              <ShieldCheck size={24} />
            </div>
            Admin Portal
          </h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                color: isActive ? 'white' : '#94a3b8',
                textDecoration: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 600 : 500,
                border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
              })}
            >
              <item.icon size={20} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            </NavLink>
          ))}
        </nav>

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
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        marginLeft: '260px',
        flex: 1,
        padding: '2rem',
        minHeight: '100vh',
        width: 'calc(100% - 260px)',
        color: '#f8fafc'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
