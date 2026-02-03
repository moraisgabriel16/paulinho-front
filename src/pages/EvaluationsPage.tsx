import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Evaluation, Student, Class } from '../types';
import { evaluationService } from '../services/evaluationService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import './EvaluationsPage.css';

const CRITERIA = [
  { key: 'coordination', label: 'Coordenação' },
  { key: 'balance', label: 'Equilíbrio' },
  { key: 'strength', label: 'Força' },
  { key: 'laterality', label: 'Lateralidade' },
  { key: 'flexibility', label: 'Flexibilidade' },
  { key: 'participation', label: 'Participação' },
  { key: 'speed', label: 'Velocidade' },
];

const formDataTemplate = {
  coordination: 3,
  balance: 3,
  strength: 3,
  laterality: 3,
  flexibility: 3,
  participation: 3,
  speed: 3,
  strengths: '',
  pointsToDevelop: '',
};

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<'student' | 'class'>('student');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classEvaluations, setClassEvaluations] = useState<{
    [studentId: string]: typeof formDataTemplate;
  }>({});
  const [formData, setFormData] = useState<{
    [key: string]: any;
  }>({
    coordination: 3,
    balance: 3,
    strength: 3,
    laterality: 3,
    flexibility: 3,
    participation: 3,
    speed: 3,
    strengths: '',
    pointsToDevelop: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadEvaluationsByStudent(selectedStudent);
    }
  }, [selectedStudent]);

  const loadData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      
      // Carregar todas as avaliações para preencher o estado de avaliados
      loadAllEvaluations();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvaluations = async () => {
    try {
      // Carregar avaliações de todos os alunos
      const evaluationsMap: Evaluation[] = [];
      const studentsData = await studentService.getAll();
      
      for (const student of studentsData) {
        try {
          const evals = await evaluationService.getByStudent(student.id);
          evaluationsMap.push(...evals);
        } catch (error) {
          // Ignorar erros individuais
        }
      }
      
      setAllEvaluations(evaluationsMap);
    } catch (error) {
      console.error('Erro ao carregar todas as avaliações:', error);
    }
  };

  const loadEvaluationsByStudent = async (studentId: string) => {
    try {
      const data = await evaluationService.getByStudent(studentId);
      setEvaluations(data);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (evaluationMode === 'student') {
      // Avaliar um aluno individual
      if (!selectedStudent) {
        alert('Selecione um aluno');
        return;
      }

      try {
        await evaluationService.create({
          student: selectedStudent,
          class: selectedClass,
          evaluationData: {
            coordination: formData.coordination,
            balance: formData.balance,
            strength: formData.strength,
            laterality: formData.laterality,
            flexibility: formData.flexibility,
            participation: formData.participation,
            speed: formData.speed,
          },
          strengths: formData.strengths,
          pointsToDevelop: formData.pointsToDevelop,
        });

        resetForm();
        loadEvaluationsByStudent(selectedStudent);
        alert('Avaliação criada com sucesso!');
      } catch (error) {
        console.error('Erro ao criar avaliação:', error);
        alert('Erro ao criar avaliação');
      }
    } else {
      // Avaliar turma inteira
      if (!selectedClass) {
        alert('Selecione uma turma');
        return;
      }

      // Encontrar a turma e obter seus alunos
      const currentClass = classes.find(c => c.id === selectedClass);
      if (!currentClass) {
        alert('Turma não encontrada');
        return;
      }

      const classStudents = students.filter(s => currentClass.students.includes(s.id));
      if (classStudents.length === 0) {
        alert('Nenhum aluno nesta turma');
        return;
      }

      try {
        for (const student of classStudents) {
          const evalData = classEvaluations[student.id];
          if (evalData) {
            await evaluationService.create({
              student: student.id,
              class: selectedClass,
              evaluationData: {
                coordination: evalData.coordination,
                balance: evalData.balance,
                strength: evalData.strength,
                laterality: evalData.laterality,
                flexibility: evalData.flexibility,
                participation: evalData.participation,
                speed: evalData.speed,
              },
              strengths: evalData.strengths,
              pointsToDevelop: evalData.pointsToDevelop,
            });
          }
        }

        resetClassEvaluations();
        loadAllEvaluations();
        alert(`Avaliações de ${classStudents.length} aluno(s) criadas com sucesso!`);
      } catch (error) {
        console.error('Erro ao criar avaliações em turma:', error);
        alert('Erro ao criar avaliações');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      coordination: 3,
      balance: 3,
      strength: 3,
      laterality: 3,
      flexibility: 3,
      participation: 3,
      speed: 3,
      strengths: '',
      pointsToDevelop: '',
    });
    setShowForm(false);
  };

  const resetClassEvaluations = () => {
    setClassEvaluations({});
    setSelectedClass('');
    setShowForm(false);
  };

  const handleCriteriaChange = (criterion: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [criterion]: value,
    }));
  };

  return (
    <div className="evaluations-container">
      <Header />

      <div className="evaluations-content">
        {/* Header */}
        <div className="evaluations-header">
          <h1 className="evaluations-title">📊 Avaliações</h1>
          <div className="evaluation-mode-buttons">
            <button
              onClick={() => {
                setEvaluationMode('student');
                setShowForm(!showForm);
              }}
              className={`add-evaluation-btn ${showForm && evaluationMode === 'student' ? 'cancel' : ''}`}
            >
              <span>{showForm && evaluationMode === 'student' ? '✖️' : '➕'}</span>
              <span>{showForm && evaluationMode === 'student' ? 'Cancelar' : 'Avaliar Aluno'}</span>
            </button>
            <button
              onClick={() => {
                setEvaluationMode('class');
                setShowForm(!showForm);
              }}
              className={`add-evaluation-btn class-mode ${showForm && evaluationMode === 'class' ? 'cancel' : ''}`}
            >
              <span>{showForm && evaluationMode === 'class' ? '✖️' : '👥'}</span>
              <span>{showForm && evaluationMode === 'class' ? 'Cancelar' : 'Avaliar Turma'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p className="loading-text">Carregando avaliações...</p>
          </div>
        ) : (
          <div className="evaluations-layout">
            {/* Formulário */}
            {showForm && (
              <div className="evaluation-form-card">
                <h2 className="evaluation-form-title">
                  <span>{evaluationMode === 'student' ? '📋 Avaliar Aluno' : '👥 Avaliar Turma'}</span>
                </h2>
                {evaluationMode === 'student' ? (
                  // MODO INDIVIDUAL
                  <form onSubmit={handleSubmit}>
                    {/* Selectors */}
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">👤 Selecione um Aluno</label>
                        <select
                          value={selectedStudent}
                          onChange={(e) => setSelectedStudent(e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">Escolha um aluno...</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.grade})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">📚 Turma (Opcional)</label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="form-select"
                        >
                          <option value="">Nenhuma turma</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Critérios de Avaliação */}
                    <div className="criteria-section">
                      <h3 className="criteria-title">⭐ Critérios de Avaliação (1-5)</h3>
                      <div className="criteria-grid">
                        {CRITERIA.map(({ key, label }) => (
                          <div key={key} className="criterion-item">
                            <label className="criterion-label">
                              <span>{label}</span>
                              <span className="criterion-value">{formData[key]}</span>
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="0.5"
                              value={formData[key]}
                              onChange={(e) => handleCriteriaChange(key, parseFloat(e.target.value))}
                              className="criterion-range"
                            />
                            <div className="criterion-scale">
                              <span>1</span>
                              <span>3</span>
                              <span>5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Campos Descritivos */}
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">💪 Pontos Fortes</label>
                        <textarea
                          value={formData.strengths}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              strengths: e.target.value,
                            }))
                          }
                          className="form-textarea"
                          placeholder="Descreva os pontos fortes do aluno..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">🎯 Pontos a Desenvolver</label>
                        <textarea
                          value={formData.pointsToDevelop}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pointsToDevelop: e.target.value,
                            }))
                          }
                          className="form-textarea"
                          placeholder="Descreva os pontos a desenvolver..."
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                      <button type="submit" className="form-btn form-btn-submit">
                        <span>✅</span>
                        <span>Salvar Avaliação</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  // MODO TURMA
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">📚 Selecione uma Turma</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => {
                          setSelectedClass(e.target.value);
                          setClassEvaluations({});
                        }}
                        className="form-select"
                        required
                      >
                        <option value="">Escolha uma turma...</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} ({cls.grade}) - {cls.students.length} alunos
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedClass && (
                      <div className="class-evaluations-container">
                        {(() => {
                          const currentClass = classes.find(c => c.id === selectedClass);
                          const classStudents = currentClass ? students.filter(s => currentClass.students.includes(s.id)) : [];
                          return (
                            <>
                              <h3 className="class-eval-title">
                                Alunos a Avaliar: {classStudents.length}
                              </h3>
                              <div className="class-evaluation-grid">
                                {classStudents.map((student) => (
                                  <div key={student.id} className="student-evaluation-box">
                                    <div className="student-box-header">
                                      <h4 className="student-box-name">👤 {student.name}</h4>
                                    </div>

                                    <div className="student-box-criteria">
                                      <label className="student-box-label">⭐ Critérios (1-5)</label>
                                      <div className="student-criteria-mini-grid">
                                        {CRITERIA.map(({ key, label }) => (
                                          <div key={key} className="student-criterion-mini">
                                            <label title={label}>{label}</label>
                                            <input
                                              type="range"
                                              min="1"
                                              max="5"
                                              step="0.5"
                                              value={classEvaluations[student.id]?.[key as keyof typeof formDataTemplate] || 3}
                                              onChange={(e) => {
                                                const newVal = parseFloat(e.target.value);
                                                setClassEvaluations(prev => ({
                                                  ...prev,
                                                  [student.id]: {
                                                    ...(prev[student.id] || { ...formDataTemplate }),
                                                    [key]: newVal,
                                                  },
                                                }));
                                              }}
                                              className="criterion-range-mini"
                                            />
                                            <span className="criterion-value-mini">
                                              {classEvaluations[student.id]?.[key as keyof typeof formDataTemplate] || 3}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="student-box-texts">
                                      <textarea
                                        placeholder="Pontos fortes..."
                                        value={classEvaluations[student.id]?.strengths || ''}
                                        onChange={(e) => {
                                          setClassEvaluations(prev => ({
                                            ...prev,
                                            [student.id]: {
                                              ...(prev[student.id] || { ...formDataTemplate }),
                                              strengths: e.target.value,
                                            },
                                          }));
                                        }}
                                        className="student-box-textarea"

                                      />
                                      <textarea
                                        placeholder="Pontos a desenvolver..."
                                        value={classEvaluations[student.id]?.pointsToDevelop || ''}
                                        onChange={(e) => {
                                          setClassEvaluations(prev => ({
                                            ...prev,
                                            [student.id]: {
                                              ...(prev[student.id] || { ...formDataTemplate }),
                                              pointsToDevelop: e.target.value,
                                            },
                                          }));
                                        }}
                                        className="student-box-textarea"

                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="form-actions">
                      <button type="submit" className="form-btn form-btn-submit">
                        <span>✅</span>
                        <span>Salvar Avaliações da Turma</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Lista de Alunos com Status de Avaliação */}
            {evaluationMode === 'student' && (
            <div className="evaluation-history-card">
              <div className="card-header">
                <h3>👥 Alunos e Status de Avaliação</h3>
              </div>
              <div className="students-evaluation-list">
                {students.length > 0 ? (
                  students.map((student) => {
                    const studentEvaluations = allEvaluations.filter(e => e.student === student.id);
                    const hasEvaluation = studentEvaluations.length > 0;
                    const lastEvaluation = studentEvaluations.sort(
                      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    )[0];
                    
                    return (
                      <div 
                        key={student.id} 
                        className={`student-evaluation-item ${hasEvaluation ? 'evaluated' : 'pending'}`}
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        <div className="student-eval-header">
                          <div className="student-eval-info">
                            <span className="student-eval-name">👤 {student.name}</span>
                            <span className="student-eval-grade">{student.grade}</span>
                          </div>
                          <div className="student-eval-status">
                            {hasEvaluation ? (
                              <>
                                <span className="eval-badge evaluated">✅ Avaliado</span>
                                <span className="eval-count">{studentEvaluations.length} avaliação(ões)</span>
                              </>
                            ) : (
                              <span className="eval-badge pending">⏳ Pendente</span>
                            )}
                          </div>
                        </div>
                        {hasEvaluation && lastEvaluation && (
                          <div className="student-eval-detail">
                            <span className="last-eval">
                              Última avaliação: {new Date(lastEvaluation.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <span className="empty-state-icon">📭</span>
                    <h2 className="empty-state-title">Nenhum aluno cadastrado</h2>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Histórico de Avaliações */}
            {evaluationMode === 'student' && (
            <div className="evaluation-history-card">
              <div className="card-header">
                <h3>
                  {selectedStudent
                    ? `📝 Avaliações de: ${students.find((s) => s.id === selectedStudent)?.name}`
                    : '📊 Detalhes das Avaliações'}
                </h3>
              </div>

              {selectedStudent && evaluations.length > 0 ? (
                <div className="history-list">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="evaluation-item">
                      <div className="evaluation-date">
                        <span>📅 {new Date(evaluation.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="evaluation-criteria-grid">
                        {CRITERIA.map(({ key, label }) => {
                          const value = evaluation.evaluationData[key as keyof typeof evaluation.evaluationData] as number;
                          const percentage = (value / 5) * 100;
                          return (
                            <div key={key} className="evaluation-criterion">
                              <div className="evaluation-criterion-label">{label}</div>
                              <div className="evaluation-criterion-value">{value}</div>
                              <div className="evaluation-criterion-bar">
                                <div 
                                  className="evaluation-criterion-fill" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedStudent ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📭</span>
                  <h2 className="empty-state-title">Nenhuma avaliação registrada</h2>
                  <p className="empty-state-text">Comece criando uma nova avaliação para este aluno.</p>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-state-icon">👁️</span>
                  <h2 className="empty-state-title">Selecione um aluno</h2>
                  <p className="empty-state-text">Escolha um aluno para ver o histórico de avaliações.</p>
                </div>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
