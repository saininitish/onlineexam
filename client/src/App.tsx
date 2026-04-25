import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TestEngine from './pages/TestEngine';
import ResultPage from './pages/ResultPage';
import Leaderboard from './pages/Leaderboard';
import { useAuthStore } from './store/authStore';

const App: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <Router>
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
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
        </Routes>
      </main>
    </Router>
  );
};

export default App;
