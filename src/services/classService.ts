import apiClient from './api';
import { Class } from '../types';

export const classService = {
  getAll: async (): Promise<Class[]> => {
    const response = await apiClient.get('/classes');
    // Garantir que cada turma tem um id válido
    return response.data.map((cls: any) => ({
      id: cls.id || cls._id || '',
      name: cls.name,
      grade: cls.grade,
      students: Array.isArray(cls.students) 
        ? cls.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: cls.teacher,
    }));
  },

  getById: async (id: string): Promise<Class> => {
    const response = await apiClient.get(`/classes/${id}`);
    return {
      id: response.data.id || response.data._id || id,
      name: response.data.name,
      grade: response.data.grade,
      students: Array.isArray(response.data.students)
        ? response.data.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: response.data.teacher,
    };
  },

  create: async (classData: Partial<Class>): Promise<Class> => {
    const response = await apiClient.post('/classes', classData);
    const cls = response.data.class || response.data;
    return {
      id: cls.id || cls._id || '',
      name: cls.name,
      grade: cls.grade,
      students: Array.isArray(cls.students)
        ? cls.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: cls.teacher,
    };
  },

  update: async (id: string, classData: Partial<Class>): Promise<Class> => {
    const response = await apiClient.put(`/classes/${id}`, classData);
    return {
      id: response.data.id || response.data._id || id,
      name: response.data.name,
      grade: response.data.grade,
      students: Array.isArray(response.data.students)
        ? response.data.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: response.data.teacher,
    };
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },

  addStudent: async (classId: string, studentId: string): Promise<Class> => {
    const response = await apiClient.post(`/classes/${classId}/students`, { studentId });
    const cls = response.data.class || response.data;
    return {
      id: cls.id || cls._id || classId,
      name: cls.name,
      grade: cls.grade,
      students: Array.isArray(cls.students)
        ? cls.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: cls.teacher,
    };
  },

  removeStudent: async (classId: string, studentId: string): Promise<Class> => {
    const response = await apiClient.delete(`/classes/${classId}/students/${studentId}`);
    const cls = response.data.class || response.data;
    return {
      id: cls.id || cls._id || classId,
      name: cls.name,
      grade: cls.grade,
      students: Array.isArray(cls.students)
        ? cls.students.map((s: any) => (typeof s === 'string' ? s : s.id || s._id || ''))
        : [],
      teacher: cls.teacher,
    };
  },
};
