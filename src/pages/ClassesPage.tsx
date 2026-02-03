import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Class, Student } from '../types';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import './ClassesPage.css';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '5º Ano',
    teacher: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);

  const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesData, studentsData] = await Promise.all([
        classService.getAll(),
        studentService.getAll(),
      ]);
      setClasses(classesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome da turma é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome da turma deve ter pelo menos 2 caracteres';
    }

    if (!formData.grade) {
      errors.grade = 'Série é obrigatória';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingId) {
        await classService.update(editingId, {
          name: formData.name,
          grade: formData.grade,
        });
      } else {
        await classService.create({
          name: formData.name,
          grade: formData.grade,
        });
      }
      resetForm();
      loadData();
      alert(editingId ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar turma:', error);
      alert('Erro ao salvar turma');
    }
  };

  const handleEdit = (cls: Class) => {
    setFormData({
      name: cls.name,
      grade: cls.grade,
      teacher: cls.teacher || '',
      description: cls.description || '',
    });
    setEditingId(cls.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta turma?')) {
      try {
        await classService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erro ao deletar turma:', error);
        alert('Erro ao deletar turma');
      }
    }
  };

  const handleAddStudent = async (classId: string, studentId: string) => {
    try {
      // Validar se o aluno já está na turma (checagem local)
      if (selectedClass && selectedClass.students.includes(studentId)) {
        alert('Este aluno já está inscrito nesta turma!');
        return;
      }

      const updatedClass = await classService.addStudent(classId, studentId);
      loadData();
      setSelectedClass(updatedClass);
    } catch (error: any) {
      console.error('Erro ao adicionar aluno:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao adicionar aluno';
      alert(errorMsg);
      // Recarregar dados para sincronizar o estado
      loadData();
    }
  };

  const handleRemoveStudent = async (classId: string, studentId: string) => {
    try {
      const updatedClass = await classService.removeStudent(classId, studentId);
      loadData();
      setSelectedClass(updatedClass);
    } catch (error: any) {
      console.error('Erro ao remover aluno:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao remover aluno';
      alert(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '5º Ano',
      teacher: '',
      description: '',
    });
    setEditingId(null);
    setShowForm(false);
    setFormErrors({});
  };

  const availableStudents = students.filter((s) => {
    if (!selectedClass) return true;
    // Verifica se o aluno já está na turma selecionada
    const isInSelectedClass = selectedClass.students.some((classStudentId: any) => {
      const sId = String(s.id);
      const csId = String(classStudentId);
      return sId === csId;
    });
    // Se já está na turma selecionada, não mostra (já está lá)
    if (isInSelectedClass) return false;
    // Verifica se o aluno já está em outra turma
    const isInAnotherClass = s.classId && s.classId.trim() !== '';
    // Se já está em outra turma, não mostra
    return !isInAnotherClass;
  });

  return (
    <div className="classes-container">
      <Header />

      <div className="classes-content">
        {/* Header */}
        <div className="classes-header">
          <h1 className="classes-title">📚 Gestão de Turmas</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className={`add-class-btn ${showForm ? 'cancel' : ''}`}
          >
            <span>{showForm ? '✖️' : '➕'}</span>
            <span>{showForm ? 'Cancelar' : 'Nova Turma'}</span>
          </button>
        </div>

        {/* Form Card */}
        {showForm && (
          <div className="form-card">
            <h2 className="form-title">
              <span>{editingId ? '✏️ Editar' : '➕ Adicionar'}</span>
              <span> Turma</span>
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">📖 Nome da Turma</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${formErrors.name ? 'form-input-error' : ''}`}
                    placeholder="ex: 5ºA"
                    required
                  />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">📚 Série</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`form-select ${formErrors.grade ? 'form-input-error' : ''}`}
                  >
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                  {formErrors.grade && <span className="form-error">{formErrors.grade}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="form-btn form-btn-cancel"
                >
                  <span>✖️</span>
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="form-btn form-btn-submit">
                  <span>{editingId ? '✏️' : '➕'}</span>
                  <span>{editingId ? 'Atualizar' : 'Criar'} Turma</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {editingId && selectedClass && (
          <div className="form-card form-card-info">
            <h3 className="form-info-title">
              <span>ℹ️ Turma Selecionada: </span>
              <span className="highlight">{selectedClass.name}</span>
            </h3>
            <p className="form-info-text">👥 Alunos inscritos: <strong>{selectedClass.students.length}</strong></p>
            <p className="form-info-text">Gerencie os alunos no painel à direita</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="classes-layout">
          {/* Classes List Card */}
          <div>
            <div className="classes-list-card">
              <div className="card-header">
                <h3>📋 Turmas ({classes.length})</h3>
              </div>
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner">⏳</div>
                  <p className="loading-text">Carregando turmas...</p>
                </div>
              ) : classes.length > 0 ? (
                <div>
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className={`class-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                    >
                      <div className="class-main-info">
                        <div className="class-name">{cls.name}</div>
                        <div className="class-grade">{cls.grade}</div>
                      </div>
                      <div className="class-stats">
                        <div className="class-count">
                          <span className="stat-label">👥 Alunos:</span>
                          <span className="stat-value">{cls.students.length}</span>
                        </div>
                      </div>
                      <div className="class-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cls);
                            setSelectedClass(cls);
                          }}
                          className="action-btn action-btn-edit"
                          title="Editar turma"
                        >
                          <span>✏️</span>
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cls.id);
                          }}
                          className="action-btn action-btn-delete"
                          title="Deletar turma"
                        >
                          <span>🗑️</span>
                          <span>Deletar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-state-icon">📭</span>
                  <h2 className="empty-state-title">Nenhuma turma cadastrada</h2>
                  <p className="empty-state-text">Comece criando uma nova turma para gerenciar seus alunos.</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="empty-state-btn"
                  >
                    <span>➕</span>
                    <span>Criar Primeira Turma</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Class Details Card */}
          {selectedClass && (
            <div>
              <div className="class-details-card">
                <div className="class-details-header">
                  <h3 className="class-details-title">
                    👥 Gerenciar Alunos: <span className="class-name-highlight">{selectedClass.name}</span>
                  </h3>
                  <button
                    onClick={() => {
                      handleEdit(selectedClass);
                    }}
                    className="class-edit-btn"
                    title="Editar informacoes da turma"
                  >
                    <span>✏️</span> Editar Turma
                  </button>
                </div>

                {/* Enrolled Students Section */}
                <div className="students-section">
                  <h4 className="students-section-title students-section-enrolled-title">
                    <span>✅ Alunos Inscritos ({students.filter((s) => selectedClass.students.includes(s.id)).length})</span>
                  </h4>
                  {selectedClass.students.length > 0 ? (
                    <div className="students-list">
                      {students
                        .filter((s) => selectedClass.students.includes(s.id))
                        .map((student) => (
                          <div key={student.id} className="student-item student-item-enrolled">
                            <div className="student-info">
                              <div className="student-name">👨‍🎓 {student.name}</div>
                              <div className="student-details">{student.age} anos • {student.grade}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(selectedClass.id, student.id)}
                              className="student-action-btn student-remove-btn"
                              title="Remover aluno"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="no-students-message">⚠️ Nenhum aluno inscrito nesta turma</div>
                  )}
                </div>

                {/* Available Students Section */}
                {availableStudents.length > 0 && (
                  <div className="students-section">
                    <h4 className="students-section-title students-section-available-title">
                      <span>➕ Alunos Disponíveis ({availableStudents.length})</span>
                    </h4>
                    <div className="students-filter">
                      <select
                        value={gradeFilter || ''}
                        onChange={(e) => setGradeFilter(e.target.value || null)}
                        className="students-filter-select"
                      >
                        <option value="">Todas as séries</option>
                        {grades.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="students-list">
                      {availableStudents
                        .filter((s) => !gradeFilter || s.grade === gradeFilter)
                        .map((student) => (
                          <div key={student.id} className="student-item student-item-available">
                            <div className="student-info">
                              <div className="student-name">👨‍🎓 {student.name}</div>
                              <div className="student-details">{student.age} anos • {student.grade}</div>
                            </div>
                            <button
                              onClick={() => handleAddStudent(selectedClass.id, student.id)}
                              className="student-action-btn student-add-btn"
                              title="Adicionar aluno"
                            >
                              Adicionar
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
