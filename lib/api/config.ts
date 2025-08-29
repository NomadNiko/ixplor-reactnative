import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiConfig?.baseUrl ?? 'https://server.ixplor.app/api';

export const AUTH_ENDPOINTS = {
  SIGN_UP: '/v1/auth/email/register',
  SIGN_IN: '/v1/auth/email/login',
  GOOGLE_AUTH: '/v1/auth/google/login',
  APPLE_AUTH: '/v1/auth/apple/login',
  LOGOUT: '/v1/auth/logout',
  ME: '/v1/auth/me',
  REFRESH: '/v1/auth/refresh',
};
