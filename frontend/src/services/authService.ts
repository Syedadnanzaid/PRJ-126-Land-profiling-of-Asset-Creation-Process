import { apiRequest } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse | null> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse | null> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getCurrentUser(): Promise<User | null> {
  return apiRequest<User>('/auth/me');
}

export function logoutUser(): void {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  return token !== null && token.trim() !== '';
}
