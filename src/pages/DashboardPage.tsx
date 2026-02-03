import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Class } from '../types';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    pendingEvaluations: 5,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const classesData = await classService.getAll();
        setClasses(classesData);
        
        const allStudents = await studentService.getAll();
        
        setStats({
          totalStudents: allStudents.length,
          totalClasses: classesData.length,
          pendingEvaluations: 5,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header-section">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Bem-vindo! Aqui está o resumo do seu sistema de avaliações.</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner">⏳</div>
            <span className="loading-text">Carregando dados...</span>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="dashboard-stats">
              {/* Card: Total de Alunos */}
              <div className="stat-card blue">
                <div className="stat-card-inner">
                  <div className="stat-card-icon">👥</div>
                  <div className="stat-card-label">Total de Alunos</div>
                  <div className="stat-card-value">{stats.totalStudents}</div>
                  <p className="stat-card-description">Cadastrados no sistema</p>
                </div>
              </div>

              {/* Card: Total de Turmas */}
              <div className="stat-card green">
                <div className="stat-card-inner">
                  <div className="stat-card-icon">📚</div>
                  <div className="stat-card-label">Total de Turmas</div>
                  <div className="stat-card-value">{stats.totalClasses}</div>
                  <p className="stat-card-description">Turmas ativas</p>
                </div>
              </div>

              {/* Card: Avaliações Pendentes */}
              <div className="stat-card orange">
                <div className="stat-card-inner">
                  <div className="stat-card-icon">⏰</div>
                  <div className="stat-card-label">Avaliações Pendentes</div>
                  <div className="stat-card-value">{stats.pendingEvaluations}</div>
                  <p className="stat-card-description">Para esta semana</p>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="quick-actions-card">
                <div className="quick-actions-title">⚡ Ação Rápida</div>
                <div className="quick-actions-buttons">
                  <button
                    onClick={() => navigate('/avaliacoes')}
                    className="quick-action-btn"
                  >
                    ✏️ Nova Avaliação
                  </button>
                  <button
                    onClick={() => navigate('/turmas')}
                    className="quick-action-btn"
                  >
                    ➕ Criar Turma
                  </button>
                </div>
              </div>
            </div>

            {/* Classes Section */}
            <div className="classes-section">
              <div className="classes-header">
                <h2>📖 Turmas Recentes</h2>
              </div>

              {classes.length > 0 ? (
                <div className="table-wrapper">
                  <table className="classes-table">
                    <thead>
                      <tr>
                        <th>Turma</th>
                        <th>Série</th>
                        <th>Alunos</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.slice(0, 5).map((cls) => (
                        <tr key={cls.id}>
                          <td>
                            <span className="class-name">{cls.name}</span>
                          </td>
                          <td>
                            <span className="grade-badge">{cls.grade}</span>
                          </td>
                          <td>{cls.students.length} aluno{cls.students.length !== 1 ? 's' : ''}</td>
                          <td>
                            <button
                              onClick={() => navigate(`/turmas/${cls.id}`)}
                              className="view-details-btn"
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-state-icon">📭</span>
                  <p className="empty-state-title">Nenhuma turma criada ainda</p>
                  <p className="empty-state-text">Crie sua primeira turma para começar a cadastrar alunos e avaliar o desempenho deles.</p>
                  <button
                    onClick={() => navigate('/turmas')}
                    className="create-class-btn"
                  >
                    <span>➕</span>
                    Criar Primeira Turma
                  </button>
                </div>
              )}
            </div>

            {/* Tip Section */}
            <div className="tip-section">
              <span className="tip-icon">💡</span>
              <div className="tip-content">
                <h3>Comece por aqui!</h3>
                <p>
                  Crie sua primeira turma, adicione alunos, e comece a avaliar o desempenho deles nas atividades de educação física.
                  Seus dados serão salvos automaticamente e você poderá acompanhar a evolução dos alunos em tempo real.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
