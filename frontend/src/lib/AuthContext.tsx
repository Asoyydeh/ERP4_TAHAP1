'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
// import Cookies from 'js-cookie';
import api from './api';
import { User } from '../types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAdminMonitoring: boolean;
  isEngineering: boolean;
  isProyekAdmin: boolean;
  isProcurement: boolean;
  isFinance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('token');
      if (savedUser && token) {
        try {
          return JSON.parse(savedUser);
        } catch {
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
        }
      }
    }
    return null;
  });
  const [loading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleAuthLogout = () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setUser(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth_logout', handleAuthLogout);

      const token = sessionStorage.getItem('token');
      if (token) {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.success && res.data?.data) {
              setUser(res.data.data);
              sessionStorage.setItem('user', JSON.stringify(res.data.data));
            }
          })
          .catch(() => {});
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth_logout', handleAuthLogout);
      }
    };
  }, []);

  const login = async (email: string, passwordHash: string) => {
    try {
      const response = await api.post('/auth/login', { email, passwordHash });
      const { token, user: userData } = response.data.data;

      // Simpan credential ke sessionStorage
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      const targetPath = ['HRD', 'GA', 'STAFF_GA'].includes(userData.role) ? '/ga-documents' : '/dashboard';
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
      } else {
        router.push(targetPath);
      }
    } catch (error: any) {
      console.error('Login error detail:', error);
      const message = 
        error.response?.data?.message || 
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        error.message || 
        'Login gagal, periksa email dan password Anda.';
      throw new Error(message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdminMonitoring = user?.role === 'ADMIN_MONITORING';
  const isProyekAdmin = user?.role === 'PROYEK_ADMIN' || user?.manager?.role === 'PROYEK_ADMIN';
  const isEngineering = (user?.role === 'ENGINEERING' || user?.manager?.role === 'ENGINEERING') && !isProyekAdmin;
  const isProcurement = user?.role === 'PROCUREMENT' || user?.manager?.role === 'PROCUREMENT';
  const isFinance = user?.role === 'FINANCE' || user?.manager?.role === 'FINANCE';
  const isAdmin = isSuperAdmin || isAdminMonitoring;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isSuperAdmin,
        isAdminMonitoring,
        isEngineering,
        isProyekAdmin,
        isProcurement,
        isFinance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
