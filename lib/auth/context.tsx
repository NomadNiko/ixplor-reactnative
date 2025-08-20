import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authApi } from "../api/auth";
import { getTokensInfo, setTokensInfo, clearTokens } from "../api/storage";
import type { User, LoginRequest, RegisterRequest, AuthResponse } from "../api/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleSignIn: (authData: string | { code: string; redirectUri: string; codeVerifier: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const tokens = await getTokensInfo();
      if (!tokens?.token) {
        setUser(null);
        return;
      }

      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      await clearTokens();
      setUser(null);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
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

  const googleSignIn = async (authData: string | { code: string; redirectUri: string; codeVerifier: string }) => {
    try {
      let authRequest: GoogleAuthRequest;
      
      if (typeof authData === 'string') {
        // Handle backward compatibility - string could be ID token
        const isIdToken = authData.includes('.') && authData.split('.').length === 3;
        
        console.log('Received string token:', {
          token: authData.substring(0, 20) + '...',
          isIdToken
        });
        
        authRequest = { idToken: authData };
      } else {
        // Handle new format with code, redirectUri, and codeVerifier for PKCE
        console.log('Received auth code with PKCE data:', {
          code: authData.code.substring(0, 20) + '...',
          redirectUri: authData.redirectUri,
          codeVerifier: authData.codeVerifier?.substring(0, 20) + '...'
        });
        
        authRequest = { 
          code: authData.code,
          redirectUri: authData.redirectUri,
          codeVerifier: authData.codeVerifier
        };
      }
        
      console.log('Sending to backend:', authRequest);
      
      const response = await authApi.googleAuth(authRequest);
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
      await authApi.logout();
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      await clearTokens();
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    googleSignIn,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};