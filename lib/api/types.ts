export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken?: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
}