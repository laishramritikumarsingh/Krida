import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, username: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await api.auth.getMe();
      setUser(u);
    } catch (err: any) {
      removeAuthToken();
      setUser(null);
      if (err?.status === 401) {
        setAuthError('Your previous session has expired. Please sign in or launch Demo Mode.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    // Watchdog to guarantee loading state clears even if network/promise stalls
    const watchdog = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(watchdog);
  }, []);

  // Listen for unauthorized 401 events dispatched from client.ts
  useEffect(() => {
    const handleUnauthorized = (event: any) => {
      removeAuthToken();
      setUser(null);
      setAuthError(event?.detail?.message || 'Authentication required. Please sign in or launch Demo Mode.');
    };
    window.addEventListener('krida:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('krida:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.auth.login({ email, password: pass });
      setAuthToken(res.access_token);
      setUser(res.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.auth.register({ email, username, password: pass });
      setAuthToken(res.access_token);
      setUser(res.user);
    } catch (err: any) {
      setAuthError(err?.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.auth.demoLogin();
      if (!res || !res.access_token) {
        throw new Error('Backend demo-login did not return a valid session token.');
      }
      setAuthToken(res.access_token);
      setUser(res.user);
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate demo session against backend.';
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
