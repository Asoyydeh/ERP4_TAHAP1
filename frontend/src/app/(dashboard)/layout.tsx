'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  History, 
  Users, 
  LogOut, 
  ShieldCheck
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 font-medium">Memuat data sesi...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Dokumen Proyek', path: '/assets', icon: Package },
    { name: 'Daftar Proyek', path: '/categories', icon: Tags },
    { name: 'Log Audit', path: '/logs', icon: History },
  ];

  // Tambahkan menu manajemen user jika Superadmin
  if (user.role === 'SUPERADMIN') {
    menuItems.push({ name: 'Kelola Staf', path: '/users', icon: Users });
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-100">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo Brand */}
          <div className="flex items-center flex-shrink-0 px-6 space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">ProyekDoc</span>
          </div>

          {/* User Profile Summary */}
          <div className="mt-6 px-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengguna</p>
              <h4 className="text-sm font-bold text-slate-700 mt-1 truncate">{user.name}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold mt-2 ${
                user.role === 'SUPERADMIN' ? 'bg-rose-100 text-rose-800' :
                user.role === 'ADMIN_MONITORING' ? 'bg-amber-100 text-amber-800' :
                'bg-sky-100 text-sky-800'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 px-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar (Logout) */}
        <div className="flex-shrink-0 flex p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="group flex items-center w-full px-4 py-3 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-rose-500" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-slate-100">
          <div className="flex-1 px-4 flex justify-between items-center sm:px-6 lg:px-8">
            <h1 className="text-lg font-bold text-slate-800 md:text-xl">
              {menuItems.find(item => item.path === pathname)?.name || 'Asset Management'}
            </h1>
            
            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">{user.name}</span>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Render */}
        <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
