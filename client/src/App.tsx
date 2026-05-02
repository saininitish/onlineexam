import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useAuthStore } from './store/authStore';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const TestEngine = lazy(() => import('./pages/TestEngine'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

const App: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Router>
      {user && <Sidebar />}
      {!user && <Navbar />}
      <main style={{
        marginLeft: user ? '260px' : '0',
        padding: '2rem',
        minHeight: '100vh',
        transition: 'margin 0.3s ease',
        width: user ? 'calc(100% - 260px)' : '100%'
      }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading page...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />} />

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={user && user.role === 'student' ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/test/:id" element={user && (user.role === 'student' || user.role === 'admin') ? <TestEngine /> : <Navigate to="/login" />} />
            <Route path="/result/:id" element={user ? <ResultPage /> : <Navigate to="/login" />} />
            <Route path="/leaderboard/:testId" element={user ? <Leaderboard /> : <Navigate to="/login" />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={user && (user.role === 'admin' || user.role === 'student') ? <Analytics /> : <Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
};

export default App;
