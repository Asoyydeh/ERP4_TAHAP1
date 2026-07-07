'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = Cookies.get('user');
    const token = Cookies.get('token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Hapus jika parsing gagal
        Cookies.remove('user');
        Cookies.remove('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, passwordHash: string) => {
    try {
      const response = await api.post('/auth/login', { email, passwordHash });
      const { token, user: userData } = response.data.data;

      // Simpan credential ke cookies
      Cookies.set('token', token, { expires: 1 }); // 1 hari
      Cookies.set('user', JSON.stringify(userData), { expires: 1 });

      setUser(userData);
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login gagal, periksa email dan password Anda.';
      throw new Error(message);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdminMonitoring = user?.role === 'ADMIN_MONITORING';
  const isEngineering = user?.role === 'ENGINEERING';
  const isProyekAdmin = user?.role === 'PROYEK_ADMIN';
  const isProcurement = user?.role === 'PROCUREMENT';
  const isFinance = user?.role === 'FINANCE';
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
