import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { EvolucaoPage } from './pages/EvolucaoPage';
import { RelatóriosPage } from './pages/RelatóriosPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import './App.css';

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alunos"
          element={
            <ProtectedRoute>
              <StudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/turmas"
          element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/avaliacoes"
          element={
            <ProtectedRoute>
              <EvaluationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evolucao"
          element={
            <ProtectedRoute>
              <EvolucaoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <RelatóriosPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
