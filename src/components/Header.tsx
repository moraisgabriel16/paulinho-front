import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/alunos', label: 'Alunos', icon: '👥' },
    { path: '/turmas', label: 'Turmas', icon: '📚' },
    { path: '/avaliacoes', label: 'Avaliações', icon: '📝' },
    { path: '/evolucao', label: 'Evolução', icon: '📈' },
    { path: '/relatorios', label: 'Relatórios', icon: '📄' },
  ];

  return (
    <header className="header-wrapper">
      <div className="header-container">
        {/* Logo & Branding */}
        <div className="header-logo-section" onClick={() => navigate('/')}>
          <div className="logo-icon">🏃</div>
          <div className="logo-text">
            <h1>Avaliação</h1>
            <p>Educação Física</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="header-user-section">
          {/* User Info */}
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">
                {user?.role === 'professor' ? '👨‍🏫 Professor' : '👨‍💼 Coordenador'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span>
            <span>Sair</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="mobile-menu-btn"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${showMobileMenu ? 'active' : ''}`}>
        {navLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => {
              navigate(link.path);
              setShowMobileMenu(false);
            }}
            className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
