import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('professor@example.com');
  const [password, setPassword] = useState('Senha123!');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';
    if (!password) errors.password = 'Senha é obrigatória';
    else if (password.length < 6) errors.password = 'Senha deve ter no mínimo 6 caracteres';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      await login(email, password);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 0);
    } catch (err) {
      // Erro é tratado pelo store
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
        <div className="auth-blob auth-blob-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card auth-card-login">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <span className="auth-icon">🏃</span>
            </div>
            <h1 className="auth-title">Avaliação Física</h1>
            <p className="auth-subtitle">Sistema de Educação Física</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <span className="auth-alert-icon">⚠️</span>
              <span className="auth-alert-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label className="auth-label">
                <span className="auth-label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`auth-input ${validationErrors.email ? 'auth-input-error' : ''}`}
                placeholder="seu@email.com"
              />
              {validationErrors.email && (
                <span className="auth-error-text">{validationErrors.email}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">
                <span className="auth-label-icon">🔒</span>
                Senha
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setValidationErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`auth-input ${validationErrors.password ? 'auth-input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  aria-label="Mostrar/Ocultar senha"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <span className="auth-error-text">{validationErrors.password}</span>
              )}
            </div>

            <div className="auth-checkbox-group">
              <input
                type="checkbox"
                id="remember"
                className="auth-checkbox"
              />
              <label htmlFor="remember" className="auth-checkbox-label">
                Lembrar-me neste dispositivo
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-button auth-button-primary"
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner">⏳</span>
                  Entrando...
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <span className="auth-button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <p className="auth-switch-text">
            Não tem conta?{' '}
            <Link to="/register" className="auth-link">
              Criar nova conta
            </Link>
          </p>

          <div className="auth-demo-box">
            <p className="auth-demo-label">💡 Credenciais de Demo:</p>
            <p className="auth-demo-text">Email: professor@example.com</p>
            <p className="auth-demo-text">Senha: Senha123!</p>
          </div>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">📊</span>
            <h3>Avaliações Detalhadas</h3>
            <p>Crie e gerenciar avaliações de forma simples</p>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📈</span>
            <h3>Progresso Visível</h3>
            <p>Acompanhe evolução dos alunos</p>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">👥</span>
            <h3>Gestão de Turmas</h3>
            <p>Organize e gerencie turmas facilmente</p>
          </div>
        </div>
      </div>
    </div>
  );
};
