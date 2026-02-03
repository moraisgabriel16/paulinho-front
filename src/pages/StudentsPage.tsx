import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Student } from '../types';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { Class } from '../types';
import './StudentsPage.css';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    grade: '5º Ano',
    classId: '',
    observations: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        studentService.getAll(),
        classService.getAll(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend: any = {
        name: formData.name,
        age: parseInt(formData.age),
        grade: formData.grade,
        observations: formData.observations,
      };

      // Apenas adicionar classId se tiver valor válido
      if (formData.classId && formData.classId.trim().length > 0) {
        // Verificar se o classId é válido (deve ser um MongoDB ObjectId)
        if (/^[a-f\d]{24}$/i.test(formData.classId)) {
          dataToSend.classId = formData.classId;
        } else {
          console.warn('ClassId inválido:', formData.classId);
          alert('ID da turma inválido. Selecione uma turma válida.');
          return;
        }
      }
      
      if (editingId) {
        await studentService.update(editingId, dataToSend);
      } else {
        await studentService.create(dataToSend);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      alert('Erro ao salvar aluno');
    }
  };

  const handleEdit = (student: Student) => {
    setFormData({
      name: student.name,
      age: student.age.toString(),
      grade: student.grade,
      classId: student.classId,
      observations: student.observations || '',
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este aluno?')) {
      try {
        await studentService.delete(id);
        loadData();
      } catch (error) {
        console.error('Erro ao deletar aluno:', error);
        alert('Erro ao deletar aluno');
      }
    }
  };

  const getClassName = (studentId: string, studentClassId?: string): string => {
    // Primeiro tenta pelo classId do aluno (se tiver)
    if (studentClassId) {
      const cls = classes.find(c => c.id === studentClassId);
      if (cls) return cls.name;
    }
    
    // Se não encontrou, procura nas turmas pelo array students
    const cls = classes.find(c => c.students.includes(studentId));
    return cls ? cls.name : 'N/A';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      grade: '5º Ano',
      classId: '',
      observations: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'];

  return (
    <div className="students-container">
      <Header />

      <div className="students-content">
        {/* Header */}
        <div className="students-header">
          <h1 className="students-title">👥 Gestão de Alunos</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className={`add-student-btn ${showForm ? 'cancel' : ''}`}
          >
            <span>{showForm ? '✖️' : '➕'}</span>
            <span>{showForm ? 'Cancelar' : 'Novo Aluno'}</span>
          </button>
        </div>

        {/* Form Card */}
        {showForm && (
          <div className="form-card">
            <h2 className="form-title">
              <span>{editingId ? '✏️ Editar' : '➕ Adicionar'}</span>
              <span> Aluno</span>
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">👤 Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Nome completo do aluno"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🎂 Idade</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Idade"
                    min="1"
                    max="25"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">📚 Série</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">📖 Turma (Opcional)</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
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

                <div className="form-group full">
                  <label className="form-label">📝 Observações</label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        observations: e.target.value,
                      }))
                    }
                    className="form-textarea"
                    placeholder="Observações adicionais sobre o aluno..."
                  />
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
                  <span>{editingId ? 'Atualizar' : 'Criar'} Aluno</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Card */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p className="loading-text">Carregando alunos...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="students-table-card">
            <div className="table-header">
              <h2>📊 Lista de Alunos ({students.length})</h2>
            </div>
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Idade</th>
                    <th>Série</th>
                    <th>Turma</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-name">
                          <span>👨‍🎓</span>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td>{student.age} anos</td>
                      <td>
                        <span className="student-badge">{student.grade}</span>
                      </td>
                      <td>
                        <span className="student-class-name">{getClassName(student.id, student.classId)}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(student)}
                            className="action-btn action-btn-edit"
                            title="Editar aluno"
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="action-btn action-btn-delete"
                            title="Deletar aluno"
                          >
                            <span>🗑️</span>
                            <span>Deletar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="students-table-card">
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <h2 className="empty-state-title">Nenhum aluno cadastrado</h2>
              <p className="empty-state-text">
                Comece adicionando um novo aluno à sua turma para gerenciar seu desempenho nas atividades de educação física.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="empty-state-btn"
              >
                <span>➕</span>
                <span>Adicionar Primeiro Aluno</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
