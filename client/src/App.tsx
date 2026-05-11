import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { warmUpApi } from './services/api';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import Navbar from './components/Navbar';

// Lazy loading pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminRegister = lazy(() => import('./pages/admin/Register'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Analytics = lazy(() => import('./pages/AnalyticsShared'));
const TestEngine = lazy(() => import('./pages/TestEngine'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

// Public Layout (Navbar + Content)
const PublicLayout = () => (
  <>
    <Navbar />
    <main style={{ padding: '2rem', minHeight: '100vh' }}>
      <Outlet />
    </main>
  </>
);

const App: React.FC = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    warmUpApi();
  }, []);

  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} 
            />
            <Route 
              path="/admin/login" 
              element={!user ? <AdminLogin /> : <Navigate to="/admin" replace />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} 
            />
            <Route 
              path="/admin/register" 
              element={!user ? <AdminRegister /> : <Navigate to="/admin" replace />} 
            />
          </Route>

          {/* Admin Routes - Bilkul Alag! */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="tests" element={<div>Manage Tests Page (Coming Soon)</div>} />
            <Route path="students" element={<div>Manage Students Page (Coming Soon)</div>} />
            {/* Shared analytics but inside admin layout */}
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Student Routes - Bilkul Alag! */}
          <Route path="/dashboard" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Special Routes (Test Engine doesn't have sidebar) */}
          <Route 
            path="/test/:id" 
            element={user ? <TestEngine /> : <Navigate to="/login" />} 
          />
          
          <Route element={user?.role === 'admin' ? <AdminLayout /> : <StudentLayout />}>
             <Route path="/result/:id" element={<ResultPage />} />
             <Route path="/leaderboard/:testId" element={<Leaderboard />} />
             <Route path="/analytics" element={<Analytics />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
