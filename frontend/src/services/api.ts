/**
 * Central API client for the frontend.
 * Provides a reusable fetch wrapper that automatically handles
 * JSON serialization, authorization headers, and error parsing.
 */

export const API_BASE_URL = 'http://localhost:5000/api';

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = localStorage.getItem('token');

  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('Content-Type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      // Ignore JSON parse errors if body is empty
    }
  }

  if (!response.ok) {
    let errorMessage = 'API request failed';
    if (data && typeof data === 'object' && 'message' in data) {
      errorMessage = String((data as { message: unknown }).message);
    }
    throw new Error(errorMessage);
  }

  return data as T | null;
}
