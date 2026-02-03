import React, { useState, useEffect } from 'react';
import './EvolucaoPage.css';
import { Header } from '../components/Header';
import { Student } from '../types';
import { evaluationService } from '../services/evaluationService';
import { studentService } from '../services/studentService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const CRITERIA = [
  { key: 'coordination', label: 'Coordenação', color: '#3b82f6' },
  { key: 'balance', label: 'Equilíbrio', color: '#8b5cf6' },
  { key: 'strength', label: 'Força', color: '#ec4899' },
  { key: 'laterality', label: 'Lateralidade', color: '#f59e0b' },
  { key: 'flexibility', label: 'Flexibilidade', color: '#10b981' },
  { key: 'participation', label: 'Participação', color: '#06b6d4' },
  { key: 'speed', label: 'Velocidade', color: '#f97316' },
];

export const EvolucaoPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [progressData, setProgressData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    'coordination',
    'balance',
    'strength',
  ]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadProgress(selectedStudent);
    }
  }, [selectedStudent]);

  const loadStudents = async () => {
    try {
      const data = await studentService.getAll();
      setStudents(data);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (studentId: string) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaToggle = (criterion: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(criterion) ? prev.filter((c) => c !== criterion) : [...prev, criterion]
    );
  };

  const currentStudent = students.find((s) => s.id === selectedStudent);

  return (
    <div className="evolucao-page">
      <Header />

      <div className="evolucao-container">
        <div className="evolucao-header">
          <h2 className="evolucao-title">📊 Acompanhamento de Evolução</h2>
        </div>

        {loading ? (
          <div className="evolucao-loading">
            <div className="evolucao-loading-spinner"></div>
          </div>
        ) : (
          <div>
            {/* Seletor de Aluno */}
            <div className="evolucao-card">
              <div className="student-selector">
                <label className="student-selector-label">
                  Selecione um Aluno
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="student-selector-input"
                >
                  <option value="">Escolha um aluno...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.grade})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && currentStudent && (
                <div className="student-info-grid">
                  <div className="student-info-card info-name">
                    <div className="student-info-label">Nome</div>
                    <div className="student-info-value">{currentStudent.name}</div>
                  </div>
                  <div className="student-info-card info-grade">
                    <div className="student-info-label">Série</div>
                    <div className="student-info-value">{currentStudent.grade}</div>
                  </div>
                  <div className="student-info-card info-evaluations">
                    <div className="student-info-label">Total de Avaliações</div>
                    <div className="student-info-value">{progressData?.totalEvaluations || 0}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico de Evolução por Critério */}
            {selectedStudent && chartData.length > 0 ? (
              <>
                {/* Seletor de Critérios */}
                <div className="evolucao-card">
                  <div className="evolucao-card-title">🎯 Selecione Critérios para Visualizar</div>
                  <div className="criteria-grid">
                    {CRITERIA.map(({ key, label, color }) => (
                      <label key={key} className="criteria-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCriteria.includes(key)}
                          onChange={() => handleCriteriaToggle(key)}
                        />
                        <span
                          className="criteria-color-dot"
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="criteria-label">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Gráfico de Linha */}
                <div className="chart-container">
                  <div className="chart-title">📈 Progresso por Critério</div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(1) : value} />
                        <Legend />
                        {selectedCriteria.map((criterion) => {
                          const criteriaObj = CRITERIA.find((c) => c.key === criterion);
                          return (
                            <Line
                              key={criterion}
                              type="monotone"
                              dataKey={criterion}
                              stroke={criteriaObj?.color}
                              name={criteriaObj?.label}
                              connectNulls
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico de Barras - Comparação de Médias */}
                <div className="bar-chart-container">
                  <div className="chart-title">📊 Comparação de Médias</div>
                  <div className="bar-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={progressData.progressData.map((c: any) => ({
                          name: CRITERIA.find((cr) => cr.key === c.criterion)?.label,
                          média: parseFloat(c.average.toFixed(2)),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Bar dataKey="média" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : null}

            {/* Estatísticas - Exibir sempre que houver progressData */}
            {selectedStudent && progressData && progressData.progressData && progressData.progressData.length > 0 && (
              <div className="evolucao-card">
                <div className="evolucao-card-title">📊 Estatísticas por Critério</div>
                <div className="statistics-grid">
                  {progressData.progressData.map((criterion: any) => (
                    <div key={criterion.criterion} className="statistic-card">
                      <div className="statistic-criterion-label">
                        {CRITERIA.find((c) => c.key === criterion.criterion)?.label}
                      </div>
                      <div className="statistic-values">
                        <div className="statistic-value-item">
                          <div className="statistic-value-label">Média</div>
                          <div className="statistic-value-number average">
                            {criterion.average.toFixed(2)}
                          </div>
                        </div>
                        <div className="statistic-value-item">
                          <div className="statistic-value-label">Última</div>
                          <div className="statistic-value-number latest">
                            {criterion.latest}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
