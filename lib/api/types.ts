export interface FileEntity {
  id: string;
  path: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photo?: FileEntity;
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

export interface AppleAuthRequest {
  idToken?: string;
  code?: string;
  redirectUri?: string;
  user?: string;
  firstName?: string;
  lastName?: string;
}
