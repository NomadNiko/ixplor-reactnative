import { API_URL, AUTH_ENDPOINTS } from './config';
import { getTokensInfo } from './storage';
import type { AuthResponse, LoginRequest, RegisterRequest, GoogleAuthRequest, AppleAuthRequest, User } from './types';

const createHeaders = async (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const tokens = await getTokensInfo();
    if (tokens?.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }
  }

  return headers;
};

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.SIGN_IN}`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(data: RegisterRequest): Promise<void> {
    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.SIGN_UP}`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
  },

  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    console.log('=== Google Auth API Call ===');
    console.log('Endpoint:', `${API_URL}${AUTH_ENDPOINTS.GOOGLE_AUTH}`);
    console.log('Request data being sent:', data);
    console.log('Request headers:', await createHeaders(false));

    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.GOOGLE_AUTH}`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const error = await response.json();
      console.log('Error response from backend:', error);
      throw new Error(error.message || 'Google authentication failed');
    }

    const result = await response.json();
    console.log('Success response from backend:', result);
    return result;
  },

  async appleAuth(data: AppleAuthRequest): Promise<AuthResponse> {
    console.log('🍎 Apple Auth API Call');
    console.log('Endpoint:', `${API_URL}${AUTH_ENDPOINTS.APPLE_AUTH}`);
    console.log('Request data being sent:', data);

    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.APPLE_AUTH}`, {
      method: 'POST',
      headers: await createHeaders(false),
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('Error response from backend:', error);
      throw new Error(error.message || 'Apple authentication failed');
    }

    const result = await response.json();
    console.log('Success response from backend:', result);
    return result;
  },

  async getMe(): Promise<User> {
    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.ME}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      console.warn('Logout request failed, but proceeding with local cleanup');
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const tokens = await getTokensInfo();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },
};
