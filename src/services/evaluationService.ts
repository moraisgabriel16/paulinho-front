import apiClient from './api';
import { Evaluation, EvaluationData } from '../types';

const normalizeEvaluation = (data: any): Evaluation => ({
  id: data.id || data._id || '',
  student: typeof data.student === 'string' ? data.student : (data.student?._id || data.student?.id || ''),
  class: typeof data.class === 'string' ? data.class : (data.class?._id || data.class?.id || ''),
  teacher: typeof data.teacher === 'string' ? data.teacher : (data.teacher?._id || data.teacher?.id || ''),
  date: data.date || new Date().toISOString(),
  evaluationData: data.evaluationData || {},
  strengths: data.strengths || '',
  pointsToDevelop: data.pointsToDevelop || '',
});

export const evaluationService = {
  getByStudent: async (studentId: string): Promise<Evaluation[]> => {
    const response = await apiClient.get(`/evaluations/student/${studentId}`);
    return response.data.map(normalizeEvaluation);
  },

  getByClass: async (classId: string): Promise<Evaluation[]> => {
    const response = await apiClient.get(`/evaluations/class/${classId}`);
    return response.data.map(normalizeEvaluation);
  },

  getById: async (id: string): Promise<Evaluation> => {
    const response = await apiClient.get(`/evaluations/${id}`);
    return normalizeEvaluation(response.data);
  },

  create: async (evaluationData: {
    student: string;
    class?: string;
    evaluationData: EvaluationData;
    strengths: string;
    pointsToDevelop: string;
  }): Promise<Evaluation> => {
    const response = await apiClient.post('/evaluations', evaluationData);
    return normalizeEvaluation(response.data);
  },

  update: async (id: string, evaluationData: Partial<Evaluation>): Promise<Evaluation> => {
    const response = await apiClient.put(`/evaluations/${id}`, evaluationData);
    return normalizeEvaluation(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/evaluations/${id}`);
  },

  getProgress: async (studentId: string): Promise<any> => {
    const response = await apiClient.get(`/evaluations/progress/student/${studentId}`);
    return response.data;
  },

  getClassProgress: async (classId: string): Promise<any> => {
    const response = await apiClient.get(`/evaluations/progress/class/${classId}`);
    return response.data;
  },
};
