import apiClient from './api';
import { Student } from '../types';

const normalizeStudent = (data: any): Student => ({
  id: data.id || data._id || '',
  name: data.name || '',
  age: data.age || 0,
  grade: data.grade || '',
  classId: typeof data.classId === 'string' ? data.classId : (data.classId?._id || data.classId?.id || ''),
  observations: data.observations || '',
  teacher: typeof data.teacher === 'string' ? data.teacher : (data.teacher?._id || data.teacher?.id || ''),
  createdAt: data.createdAt || new Date().toISOString(),
});

export const studentService = {
  getAll: async (classId?: string): Promise<Student[]> => {
    const params = classId ? { classId } : {};
    const response = await apiClient.get('/students', { params });
    return response.data.map(normalizeStudent);
  },

  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return normalizeStudent(response.data);
  },

  create: async (studentData: Partial<Student>): Promise<Student> => {
    const response = await apiClient.post('/students', studentData);
    return normalizeStudent(response.data);
  },

  update: async (id: string, studentData: Partial<Student>): Promise<Student> => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return normalizeStudent(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};
