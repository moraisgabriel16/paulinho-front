export interface User {
  id: string;
  name: string;
  email: string;
  role: 'professor' | 'coordenador';
  school?: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  grade: string;
  classId: string;
  observations?: string;
  teacher: string;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  students: string[];
  teacher: string;
  description?: string;
}

export interface EvaluationData {
  coordination: number;
  balance: number;
  strength: number;
  laterality: number;
  flexibility: number;
  participation: number;
  speed: number;
}

export interface Evaluation {
  id: string;
  student: string;
  class?: string;
  teacher: string;
  date: string;
  evaluationData: EvaluationData;
  strengths: string;
  pointsToDevelop: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
