export interface APIError {
  message: string;
}

export interface ProfileUpdateResponse {
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export interface EnrolledStudentsPage {
  start: number;
  limit: number;
  length: number;
  users: Student[];
  total: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export type ModuleOrder = 'up' | 'down';
