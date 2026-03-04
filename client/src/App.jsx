import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import FeedPage from './pages/FeedPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import NewProjectPage from './pages/NewProjectPage';
import EditProjectPage from './pages/EditProjectPage';
import AriaPage from './pages/AriaPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { token, user, isLoading } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  if (!['ADMIN', 'OWNER'].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout><FeedPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/proyecto/:id" element={
        <ProtectedRoute>
          <Layout><ProjectDetailPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/nuevo" element={
        <ProtectedRoute>
          <Layout><NewProjectPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/proyecto/:id/editar" element={
        <ProtectedRoute>
          <Layout><EditProjectPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/aria" element={
        <ProtectedRoute>
          <Layout><AriaPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminRoute>
            <Layout><AdminPage /></Layout>
          </AdminRoute>
        </ProtectedRoute>
      } />
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
