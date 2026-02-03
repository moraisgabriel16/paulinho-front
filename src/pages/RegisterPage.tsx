import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './AuthPage.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'professor' as const,
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Nome é obrigatório';
    else if (formData.name.length < 3) errors.name = 'Nome deve ter no mínimo 3 caracteres';
    
    if (!formData.email) errors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email inválido';
    
    if (!formData.password) errors.password = 'Senha é obrigatória';
    else if (formData.password.length < 6) errors.password = 'Senha deve ter no mínimo 6 caracteres';
    
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirme a senha';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Senhas não correspondem';
    
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/');
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
        <div className="auth-card auth-card-register">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <span className="auth-icon">📚</span>
            </div>
            <h1 className="auth-title">Criar Conta</h1>
            <p className="auth-subtitle">Junte-se ao sistema de avaliação</p>
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
                <span className="auth-label-icon">👤</span>
                Nome Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`auth-input ${validationErrors.name ? 'auth-input-error' : ''}`}
                placeholder="Seu nome completo"
              />
              {validationErrors.name && (
                <span className="auth-error-text">{validationErrors.name}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">
                <span className="auth-label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="auth-form-group">
              <label className="auth-label">
                <span className="auth-label-icon">✅</span>
                Confirmar Senha
              </label>
              <div className="auth-password-wrapper">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`auth-input ${validationErrors.confirmPassword ? 'auth-input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="auth-password-toggle"
                  aria-label="Mostrar/Ocultar senha"
                >
                  {showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className="auth-error-text">{validationErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-button auth-button-primary"
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner">⏳</span>
                  Criando conta...
                </>
              ) : (
                <>
                  <span>Criar Conta</span>
                  <span className="auth-button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <p className="auth-switch-text">
            Já tem conta?{' '}
            <Link to="/login" className="auth-link">
              Fazer login
            </Link>
          </p>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">🔐</span>
            <h3>Seguro</h3>
            <p>Seus dados são protegidos</p>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">⚡</span>
            <h3>Rápido</h3>
            <p>Acesso instantâneo ao sistema</p>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🎯</span>
            <h3>Eficiente</h3>
            <p>Gerencie tudo facilmente</p>
          </div>
        </div>
      </div>
    </div>
  );
};
