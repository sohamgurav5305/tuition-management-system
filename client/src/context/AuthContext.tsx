import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { User, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tuition_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('tuition_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const refreshProfile = async () => {
    const savedToken = localStorage.getItem('tuition_token');
    if (savedToken) {
      try {
        const res = await authApi.getProfile();
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('tuition_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        // ignore
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('tuition_token');
      if (savedToken) {
        try {
          const res = await authApi.getProfile();
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('tuition_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Profile refresh failed, clearing token');
          localStorage.removeItem('tuition_token');
          localStorage.removeItem('tuition_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await authApi.login({ identifier, password });
      const { token: receivedToken, user: receivedUser } = res.data.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('tuition_token', receivedToken);
      localStorage.setItem('tuition_user', JSON.stringify(receivedUser));

      success('Welcome back!', `Signed in as ${receivedUser.role}`);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      error('Authentication Error', message);
      throw err;
    }
  };

  const quickLogin = async (role: UserRole) => {
    const credentials: Record<UserRole, { id: string; pass: string }> = {
      ADMINISTRATOR: { id: 'admin', pass: 'Admin@123' },
      ACCOUNTANT: { id: 'accountant', pass: 'Accountant@123' },
      TEACHER: { id: 'teacher', pass: 'Teacher@123' },
      STUDENT: { id: 'student', pass: 'Student@123' },
    };

    const target = credentials[role];
    if (target) {
      await login(target.id, target.pass);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tuition_token');
    localStorage.removeItem('tuition_user');
    success('Signed out', 'You have been logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        quickLogin,
        logout,
        refreshProfile,
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
