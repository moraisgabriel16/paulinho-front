import React, { useState, useEffect, useRef } from 'react';
import './RelatóriosPage.css';
import { Header } from '../components/Header';
import { Student, Class } from '../types';
import { evaluationService } from '../services/evaluationService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CRITERIA_LABELS: { [key: string]: string } = {
  coordination: 'Coordenação',
  balance: 'Equilíbrio',
  strength: 'Força',
  laterality: 'Lateralidade',
  flexibility: 'Flexibilidade',
  participation: 'Participação',
  speed: 'Velocidade',
};

export const RelatóriosPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'student' | 'class'>('student');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [progressData, setProgressData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isEditingObservations, setIsEditingObservations] = useState(false);
  const [editingObservationsText, setEditingObservationsText] = useState('');
  const [savingObservations, setSavingObservations] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (reportType === 'student' && selectedStudent) {
      loadStudentProgress(selectedStudent);
    } else if (reportType === 'class' && selectedClass) {
      loadClassProgress(selectedClass);
    }
  }, [selectedStudent, selectedClass, reportType]);

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

  const loadStudentProgress = async (studentId: string) => {
    try {
      const data = await evaluationService.getProgress(studentId);
      setProgressData(data);

      // Preparar dados para o gráfico
      if (data.progressData && data.progressData.length > 0) {
        const firstCriterion = data.progressData[0];
        const evaluationDates = firstCriterion.evaluations.map((e: any) => ({
          date: new Date(e.date).toLocaleDateString('pt-BR'),
        }));

        const chartDataFinal = evaluationDates.map((item: any, index: number) => {
          const point: any = { date: item.date };
          data.progressData.forEach((criterion: any) => {
            point[criterion.criterion] = criterion.evaluations[index]?.value || 0;
          });
          return point;
        });

        setChartData(chartDataFinal);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const loadClassProgress = async (classId: string) => {
    try {
      const data = await evaluationService.getClassProgress(classId);
      setProgressData(data);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const saveObservations = async () => {
    if (!selectedStudent || !currentStudent) return;

    setSavingObservations(true);
    try {
      // Atualizar o estudante com as novas observações
      await studentService.update(selectedStudent, {
        ...currentStudent,
        observations: editingObservationsText,
      });

      // Atualizar o estado local
      setStudents(
        students.map((s) =>
          s.id === selectedStudent
            ? { ...s, observations: editingObservationsText }
            : s
        )
      );

      setIsEditingObservations(false);
      alert('Observações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      alert('Erro ao salvar observações');
    } finally {
      setSavingObservations(false);
    }
  };

  const startEditingObservations = () => {
    const student = students.find((s) => s.id === selectedStudent);
    if (student) {
      setEditingObservationsText(student.observations || '');
      setIsEditingObservations(true);
    }
  };

  const generateStudentPDF = async () => {
    if (!selectedStudent || !progressData || !progressData.progressData) return;

    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;

    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE AVALIAÇÃO', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Aluno: ${student.name}`, 20, 35);
    doc.text(`Série: ${student.grade}`, 20, 42);
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 49);

    // Tabela de Critérios
    doc.setFontSize(14);
    doc.text('Avaliações por Critério', 20, 60);

    const tableData = progressData.progressData.map((criterion: any) => [
      CRITERIA_LABELS[criterion.criterion],
      criterion.average.toFixed(2),
      criterion.latest.toString(),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Critério', 'Média', 'Última Avaliação']],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255],
      },
    });

    // Adicionar gráfico se houver dados
    if (chartData.length > 0 && chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const finalY = (doc as any).lastAutoTable.finalY + 20;

        doc.setFontSize(14);
        doc.text('Progresso por Criterio', 20, finalY);

        // Adicionar imagem do gráfico (redimensionada para caber na página)
        const imgWidth = 170;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;
        doc.addImage(imgData, 'PNG', 20, finalY + 10, imgWidth, imgHeight);

        const graphicY = finalY + 10 + imgHeight + 10;

        // Observações
        if (graphicY + 30 < doc.internal.pageSize.getHeight()) {
          doc.setFontSize(12);
          doc.text('Observações do Professor:', 20, graphicY);
          doc.setFontSize(10);
          const observationText = student.observations || 'Nenhuma observação registrada';
          doc.text(observationText, 20, graphicY + 7, { maxWidth: 170 });
        } else {
          // Se não couber na mesma página, adiciona nova página
          doc.addPage();
          doc.setFontSize(12);
          doc.text('Observações do Professor:', 20, 20);
          doc.setFontSize(10);
          const observationText = student.observations || 'Nenhuma observação registrada';
          doc.text(observationText, 20, 27, { maxWidth: 170 });
        }
      } catch (error) {
        console.error('Erro ao adicionar gráfico ao PDF:', error);
        // Se falhar o gráfico, apenas adiciona observações
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Observações do Professor:', 20, finalY);
        doc.setFontSize(10);
        const observationText = student.observations || 'Nenhuma observação registrada';
        doc.text(observationText, 20, finalY + 7, { maxWidth: 170 });
      }
    } else {
      // Se não houver dados de gráfico, apenas adiciona observações
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Observações do Professor:', 20, finalY);
      doc.setFontSize(10);
      const observationText = student.observations || 'Nenhuma observação registrada';
      doc.text(observationText, 20, finalY + 7, { maxWidth: 170 });
    }

    doc.save(`relatorio_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  const generateClassPDF = () => {
    if (!selectedClass || !progressData || !progressData.progressData) return;

    const cls = classes.find((c) => c.id === selectedClass);
    if (!cls) return;

    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('RELATÓRIO DE TURMA', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Turma: ${cls.name}`, 20, 35);
    doc.text(`Série: ${cls.grade}`, 20, 42);
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, 49);
    doc.text(`Total de Alunos: ${cls.students.length}`, 20, 56);

    // Tabela de Critérios
    doc.setFontSize(14);
    doc.text('Médias da Turma por Critério', 20, 67);

    const tableData = progressData.progressData.map((criterion: any) => [
      CRITERIA_LABELS[criterion.criterion],
      criterion.average.toFixed(2),
      criterion.maxValue.toString(),
      criterion.minValue.toString(),
    ]);

    autoTable(doc, {
      startY: 77,
      head: [['Critério', 'Média', 'Máximo', 'Mínimo']],
      body: tableData,
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 255, 240],
      },
    });

    // Destaques
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Destaques da Turma:', 20, finalY);

    const sortedByCriteria = [...progressData.progressData].sort(
      (a: any, b: any) => b.average - a.average
    );

    doc.setFontSize(10);
    doc.text(
      `✓ Melhor Desempenho: ${CRITERIA_LABELS[sortedByCriteria[0].criterion]} (${sortedByCriteria[0].average.toFixed(2)})`,
      25,
      finalY + 8
    );
    doc.text(
      `✗ Maior Dificuldade: ${CRITERIA_LABELS[sortedByCriteria[sortedByCriteria.length - 1].criterion]} (${sortedByCriteria[sortedByCriteria.length - 1].average.toFixed(2)})`,
      25,
      finalY + 15
    );

    doc.save(`relatorio_turma_${cls.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handlePrint = async () => {
    if (reportType === 'student') {
      await generateStudentPDF();
    } else {
      generateClassPDF();
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudent);
  const currentClass = classes.find((c) => c.id === selectedClass);

  return (
    <div className="relatorios-page">
      <Header />

      <div className="relatorios-container">
        <div className="relatorios-header">
          <h2 className="relatorios-title">📋 Geração de Relatórios</h2>
        </div>

        {loading ? (
          <div className="relatorios-loading">
            <div className="relatorios-loading-spinner"></div>
          </div>
        ) : (
          <div>
            {/* Tipo de Relatório */}
            <div className="relatorios-card">
              <div className="relatorios-card-title">📄 Tipo de Relatório</div>
              <div className="report-type-selector">
                <label className="report-type-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="student"
                    checked={reportType === 'student'}
                    onChange={(e) => {
                      setReportType(e.target.value as 'student' | 'class');
                      setSelectedStudent('');
                      setSelectedClass('');
                    }}
                  />
                  <span className="report-type-label">Relatório Individual</span>
                </label>
                <label className="report-type-option">
                  <input
                    type="radio"
                    name="reportType"
                    value="class"
                    checked={reportType === 'class'}
                    onChange={(e) => {
                      setReportType(e.target.value as 'student' | 'class');
                      setSelectedStudent('');
                      setSelectedClass('');
                    }}
                  />
                  <span className="report-type-label">Relatório de Turma</span>
                </label>
              </div>
            </div>

            {/* Seleção */}
            <div className="relatorios-card">
              <div className="selector-container">
                {reportType === 'student' ? (
                  <div>
                    <label className="selector-label">Selecione um Aluno</label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="selector-input"
                    >
                      <option value="">Escolha um aluno...</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="selector-label">Selecione uma Turma</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="selector-input"
                    >
                      <option value="">Escolha uma turma...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.grade})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {progressData && (
              <>
                <div className="preview-section">
                  <div className="preview-header">
                    {reportType === 'student' && currentStudent && (
                      <div>
                        <div className="preview-title">Relatório de Avaliação</div>
                        <div className="preview-info">
                          <div className="preview-info-item">
                            <span className="preview-info-label">Aluno</span>
                            <span className="preview-info-value">{currentStudent.name}</span>
                          </div>
                          <div className="preview-info-item">
                            <span className="preview-info-label">Série</span>
                            <span className="preview-info-value">{currentStudent.grade}</span>
                          </div>
                          <div className="preview-info-item">
                            <span className="preview-info-label">Data</span>
                            <span className="preview-info-value">
                              {new Date().toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {reportType === 'class' && currentClass && (
                      <div>
                        <div className="preview-title">Relatório de Turma</div>
                        <div className="preview-info">
                          <div className="preview-info-item">
                            <span className="preview-info-label">Turma</span>
                            <span className="preview-info-value">{currentClass.name}</span>
                          </div>
                          <div className="preview-info-item">
                            <span className="preview-info-label">Série</span>
                            <span className="preview-info-value">{currentClass.grade}</span>
                          </div>
                          <div className="preview-info-item">
                            <span className="preview-info-label">Total de Alunos</span>
                            <span className="preview-info-value">{currentClass.students.length}</span>
                          </div>
                          <div className="preview-info-item">
                            <span className="preview-info-label">Data</span>
                            <span className="preview-info-value">
                              {new Date().toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {reportType === 'student' && currentStudent && progressData && progressData.progressData && (
                    <div>
                      <div className="criteria-preview-grid">
                        {progressData.progressData.map((criterion: any) => (
                          <div key={criterion.criterion} className="criterion-preview-card">
                            <div className="criterion-preview-name">
                              {CRITERIA_LABELS[criterion.criterion]}
                            </div>
                            <div className="criterion-preview-values">
                              <div className="criterion-value">
                                <div className="criterion-value-label">Média</div>
                                <div className="criterion-value-number">
                                  {criterion.average.toFixed(2)}
                                </div>
                              </div>
                              <div className="criterion-value">
                                <div className="criterion-value-label">Última</div>
                                <div className="criterion-value-number green">
                                  {criterion.latest}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Gráfico de Progresso */}
                      {chartData.length > 0 && progressData && progressData.progressData && (
                        <div
                          ref={chartRef}
                          style={{
                            width: '100%',
                            height: '400px',
                            marginTop: '2rem',
                            padding: '1rem',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                          }}
                        >
                          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                            📈 Progresso por Critério
                          </div>
                          <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[0, 5]} />
                              <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(1) : value} />
                              <Legend />
                              {progressData.progressData.map((criterion: any) => (
                                <Line
                                  key={criterion.criterion}
                                  type="monotone"
                                  dataKey={criterion.criterion}
                                  stroke={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'][
                                    progressData.progressData.indexOf(criterion)
                                  ]}
                                  name={CRITERIA_LABELS[criterion.criterion]}
                                  connectNulls
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Seção de Observações com Edição */}
                      <div className="observations-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div className="observations-title">📝 Observações do Professor</div>
                          {!isEditingObservations && (
                            <button
                              onClick={startEditingObservations}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                              }}
                            >
                              ✏️ Editar
                            </button>
                          )}
                        </div>

                        {isEditingObservations ? (
                          <div>
                            <textarea
                              value={editingObservationsText}
                              onChange={(e) => setEditingObservationsText(e.target.value)}
                              style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '0.75rem',
                                border: '2px solid #3b82f6',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                              }}
                              placeholder="Digite as observações do professor..."
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                              <button
                                onClick={saveObservations}
                                disabled={savingObservations}
                                style={{
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: savingObservations ? 'not-allowed' : 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  opacity: savingObservations ? 0.6 : 1,
                                }}
                              >
                                {savingObservations ? '💾 Salvando...' : '💾 Salvar'}
                              </button>
                              <button
                                onClick={() => setIsEditingObservations(false)}
                                disabled={savingObservations}
                                style={{
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: '#6b7280',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                }}
                              >
                                ✕ Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="observations-content">
                            {currentStudent.observations || 'Nenhuma observação registrada'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {reportType === 'class' && currentClass && progressData && progressData.progressData && (
                    <div>
                      <div className="criteria-preview-grid">
                        {progressData.progressData.map((criterion: any) => (
                          <div key={criterion.criterion} className="criterion-preview-card">
                            <div className="criterion-preview-name">
                              {CRITERIA_LABELS[criterion.criterion]}
                            </div>
                            <div className="criterion-preview-values">
                              <div className="criterion-value">
                                <div className="criterion-value-label">Média</div>
                                <div className="criterion-value-number">
                                  {criterion.average.toFixed(2)}
                                </div>
                              </div>
                              <div className="criterion-value">
                                <div className="criterion-value-label">Máx</div>
                                <div className="criterion-value-number green">
                                  {criterion.maxValue}
                                </div>
                              </div>
                              <div className="criterion-value">
                                <div className="criterion-value-label">Mín</div>
                                <div className="criterion-value-number red">
                                  {criterion.minValue}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="observations-section">
                        <div className="observations-title">⭐ Destaques da Turma</div>
                        <div className="observations-content">
                          {progressData && progressData.progressData && (() => {
                            const sorted = [...progressData.progressData].sort(
                              (a: any, b: any) => b.average - a.average
                            );
                            return (
                              <div>
                                <div className="highlight-item">
                                  <span className="highlight-icon">✓</span>
                                  <div className="highlight-text">
                                    <span className="highlight-text-label">Melhor Desempenho:</span>{' '}
                                    {CRITERIA_LABELS[sorted[0].criterion]} ({sorted[0].average.toFixed(2)})
                                  </div>
                                </div>
                                <div className="highlight-item">
                                  <span className="highlight-icon">✗</span>
                                  <div className="highlight-text">
                                    <span className="highlight-text-label">Maior Dificuldade:</span>{' '}
                                    {CRITERIA_LABELS[sorted[sorted.length - 1].criterion]} (
                                    {sorted[sorted.length - 1].average.toFixed(2)})
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="relatorios-buttons">
                  <button onClick={() => handlePrint()} className="relatorios-btn relatorios-btn-primary">
                    📄 Gerar PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="relatorios-btn relatorios-btn-secondary"
                  >
                    🖨️ Imprimir
                  </button>
                </div>
              </>
            )}

            {!progressData && selectedStudent === '' && selectedClass === '' && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-message">
                  Selecione um aluno ou turma para gerar um relatório.
                </div>
              </div>
            )}

            {!progressData && (selectedStudent !== '' || selectedClass !== '') && (
              <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-message">
                  Nenhuma avaliação registrada para gerar relatório.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
