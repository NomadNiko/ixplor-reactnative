import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { getTokensInfo, setTokensInfo, clearTokens } from '../api/storage';
import { vendorCrudApi, VendorStatus } from '../api/vendors-crud';
import type { User, LoginRequest, RegisterRequest, GoogleAuthRequest, AppleAuthRequest } from '../api/types';

interface AuthContextType {
  user: User | null;
  vendorStatus: VendorStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleSignIn: (
    authData: string | { code: string; redirectUri: string; codeVerifier: string }
  ) => Promise<void>;
  appleSignIn: (authData: {
    user: string;
    identityToken: string | null;
    authorizationCode: string | null;
    email: string | null;
    fullName: any;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkVendorStatus: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkVendorStatus = async () => {
    if (!user?.id) {
      setVendorStatus(null);
      return;
    }

    try {
      const vendorResponse = await vendorCrudApi.getUserVendors(user.id);
      if (vendorResponse.data && vendorResponse.data.length > 0) {
        setVendorStatus(vendorResponse.data[0]);
        console.log('Vendor status found:', vendorResponse.data[0].businessName);
      } else {
        setVendorStatus(null);
        console.log('No vendor profile found for user');
      }
    } catch (error) {
      console.error('Failed to check vendor status:', error);
      setVendorStatus(null);
    }
  };

  const checkAuth = async () => {
    try {
      const tokens = await getTokensInfo();
      console.log('Auth check - tokens:', tokens ? 'Found' : 'None');

      if (!tokens?.token) {
        console.log('Auth check - no token found');
        setUser(null);
        setVendorStatus(null);
        return;
      }

      const userData = await authApi.getMe();
      console.log('Auth check - user data received:', {
        id: userData?.id,
        email: userData?.email,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        photo: userData?.photo
          ? {
              id: userData.photo.id,
              path: userData.photo.path,
            }
          : 'No photo',
      });
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearTokens();
      setUser(null);
      setVendorStatus(null);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      console.log('Login response - user data:', {
        id: response.user?.id,
        email: response.user?.email,
        firstName: response.user?.firstName,
        lastName: response.user?.lastName,
        photo: response.user?.photo
          ? {
              id: response.user.photo.id,
              path: response.user.photo.path,
            }
          : 'No photo',
      });

      await setTokensInfo({
        token: response.token,
        refreshToken: response.refreshToken,
        tokenExpires: response.tokenExpires,
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      await authApi.register(data);
    } catch (error) {
      throw error;
    }
  };

  const googleSignIn = async (
    authData: string | { code: string; redirectUri: string; codeVerifier: string }
  ) => {
    try {
      let authRequest: GoogleAuthRequest;

      if (typeof authData === 'string') {
        // Handle backward compatibility - string could be ID token
        const isIdToken = authData.includes('.') && authData.split('.').length === 3;

        console.log('Received string token:', {
          token: authData.substring(0, 20) + '...',
          isIdToken,
        });

        authRequest = { idToken: authData };
      } else {
        // Handle new format with code, redirectUri, and codeVerifier for PKCE
        console.log('Received auth code with PKCE data:', {
          code: authData.code.substring(0, 20) + '...',
          redirectUri: authData.redirectUri,
          codeVerifier: authData.codeVerifier?.substring(0, 20) + '...',
        });

        authRequest = {
          code: authData.code,
          redirectUri: authData.redirectUri,
          codeVerifier: authData.codeVerifier,
        };
      }

      console.log('Sending to backend:', authRequest);

      const response = await authApi.googleAuth(authRequest);
      console.log('Google sign-in response - user data:', {
        id: response.user?.id,
        email: response.user?.email,
        firstName: response.user?.firstName,
        lastName: response.user?.lastName,
        photo: response.user?.photo
          ? {
              id: response.user.photo.id,
              path: response.user.photo.path,
            }
          : 'No photo',
      });

      await setTokensInfo({
        token: response.token,
        refreshToken: response.refreshToken,
        tokenExpires: response.tokenExpires,
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const appleSignIn = async (authData: {
    user: string;
    identityToken: string | null;
    authorizationCode: string | null;
    email: string | null;
    fullName: any;
  }) => {
    try {
      const authRequest: AppleAuthRequest = {};

      // Send identity token (this is what the server expects, similar to web's idToken)
      if (authData.identityToken) {
        authRequest.idToken = authData.identityToken;
      }

      // Send authorization code if available
      if (authData.authorizationCode) {
        authRequest.code = authData.authorizationCode;
      }

      // Include user info for first-time sign-ins
      if (authData.fullName) {
        if (authData.fullName.givenName) {
          authRequest.firstName = authData.fullName.givenName;
        }
        if (authData.fullName.familyName) {
          authRequest.lastName = authData.fullName.familyName;
        }
      }

      // Include user object if needed
      if (authData.email || authData.fullName) {
        authRequest.user = JSON.stringify({
          email: authData.email,
          name: authData.fullName,
        });
      }

      console.log('🍎 Sending Apple auth to backend:', authRequest);

      const response = await authApi.appleAuth(authRequest);
      console.log('🍎 Apple sign-in response - user data:', {
        id: response.user?.id,
        email: response.user?.email,
        firstName: response.user?.firstName,
        lastName: response.user?.lastName,
      });

      await setTokensInfo({
        token: response.token,
        refreshToken: response.refreshToken,
        tokenExpires: response.tokenExpires,
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      console.log('Clearing tokens and user data');
      await clearTokens();
      setUser(null);
      setVendorStatus(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // Check vendor status when user changes
  useEffect(() => {
    if (user?.id) {
      checkVendorStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value: AuthContextType = {
    user,
    vendorStatus,
    isLoading,
    isAuthenticated: !!user,
    isVendor: !!vendorStatus,
    login,
    register,
    googleSignIn,
    appleSignIn,
    logout,
    checkAuth,
    checkVendorStatus,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
