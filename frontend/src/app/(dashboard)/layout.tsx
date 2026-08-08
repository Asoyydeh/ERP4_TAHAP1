'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { getBackendHostUrl } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  FileText,
  UserCircle,
  Clock,
  ClipboardList,
  BarChart,
  Menu,
  X,
  Sun,
  Moon,
  Database,
  MessageSquare,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, mounted]);

  // Tutup menu mobile ketika rute berubah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted || loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat data sesi...</p>
        </div>
      </div>
    );
  }

  const menuItems: { name: string; path: string; icon: React.ElementType }[] = [];

  // 1. Dashboard
  if (!['HRD', 'GA', 'STAFF_GA'].includes(user.role)) {
    menuItems.push({ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
  }

  // 2. Proyek
  if (!['HRD', 'GA', 'STAFF_GA'].includes(user.role)) {
    menuItems.push({ name: 'Proyek', path: '/projects', icon: Package });
  }

  // 2.5 Subkon
  if (user.role === 'PROYEK_ADMIN' || user.manager?.role === 'PROYEK_ADMIN' || user.role === 'SUPERADMIN' || user.role === 'ADMIN_MONITORING') {
    menuItems.push({ name: 'Subkon', path: '/subkon', icon: Database });
  }

  // 3. RFQ
  if (user.role === 'ENGINEERING') {
    menuItems.push({ name: 'RFQ', path: '/rfq', icon: FileText });
  }

  // 3.5 Tracking by Proyek (Procurement Only)
  if (user.role === 'PROCUREMENT' || user.manager?.role === 'PROCUREMENT') {
    menuItems.push({ name: 'Tracking by Proyek', path: '/tracking-proyek', icon: FileSpreadsheet });
  }

  // 4. Master Data & Monitoring Laporan
  if (['SUPERADMIN', 'HRD'].includes(user.role)) {
    if (user.role === 'SUPERADMIN') {
      menuItems.push({ name: 'Master Data', path: '/master-data', icon: Database });
    }
    menuItems.push({ name: 'Monitoring Laporan', path: '/admin-reports', icon: BarChart });
  }

  // 4.5 PO PROCUREMENT (SUPERADMIN, PROCUREMENT, FINANCE)
  if (['SUPERADMIN', 'PROCUREMENT', 'FINANCE'].includes(user.role) || user.manager?.role === 'PROCUREMENT' || user.manager?.role === 'FINANCE') {
    menuItems.push({ name: 'PO PROCUREMENT', path: '/company-documents', icon: FileText });
  }

  // 4.6 PO GA (SUPERADMIN, HRD, GA, STAFF_GA)
  if (['SUPERADMIN', 'HRD', 'GA', 'STAFF_GA'].includes(user.role) || ['HRD', 'GA'].includes(user.manager?.role || '')) {
    menuItems.push({ name: 'PO GA', path: '/ga-documents', icon: FileSpreadsheet });
  }

  // 4.7 PO PROYEK ADMIN (SUPERADMIN, PROYEK_ADMIN)
  if (['SUPERADMIN', 'PROYEK_ADMIN'].includes(user.role)) {
    menuItems.push({ name: 'PO PROYEK ADMIN', path: '/proyek-documents', icon: FileText });
  }

  // 4.8 Persetujuan & Tanda Tangan PO (Dapat diakses seluruh peran terotorisasi)
  menuItems.push({ name: 'Persetujuan PO', path: '/po-signatures', icon: CheckSquare });

  if (user.role === 'ENGINEERING') {
    menuItems.push({ name: 'Data Proyek', path: '/data-proyek', icon: Database });
  }

  // 5. Absensi
  if (['FINANCE', 'PROCUREMENT', 'PROYEK_ADMIN', 'ENGINEERING', 'HRD'].includes(user.role)) {
    menuItems.push({ name: 'Absensi', path: '/attendance', icon: Clock });
  }

  // 6. Laporan Kerja
  if (['FINANCE', 'PROCUREMENT', 'PROYEK_ADMIN', 'ENGINEERING', 'HRD'].includes(user.role)) {
    menuItems.push({ name: 'Laporan Kerja', path: '/work-reports', icon: ClipboardList });
  }

  // 7. Manajemen Staff / Kelola Staf
  if (['SUPERADMIN', 'HRD'].includes(user.role)) {
    if (user.role === 'SUPERADMIN') {
      menuItems.push({ name: 'Kelola Staf', path: '/users', icon: Users });
    }
  }
  if (['FINANCE', 'PROCUREMENT', 'PROYEK_ADMIN', 'ENGINEERING', 'GA'].includes(user.role)) {
    menuItems.push({ name: 'Manajemen Staf', path: '/staff', icon: Users });
  }

  // 8. Hasil Kerjaan (Unggah & Riwayat Kerja)
  if (['FINANCE', 'PROCUREMENT', 'PROYEK_ADMIN', 'SUPERADMIN', 'ADMIN_MONITORING'].includes(user.role)) {
    menuItems.push({ name: 'Hasil Kerjaan', path: '/hasil-kerjaan', icon: ClipboardList });
  }

  // 9. Pesan Chat
  menuItems.push({ name: 'Pesan Chat', path: '/chat', icon: MessageSquare });

  // 10. Profil Saya (Tersedia untuk semua role termasuk SUPERADMIN)
  menuItems.push({ name: 'Profil Saya', path: '/profile', icon: UserCircle });

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-6 space-x-3">
        <img src="/mjk_logo.png" alt="MJK Logo" className="h-9 w-auto object-contain transition-transform hover:scale-105" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">PT. MODERN JAYA</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-1 leading-none">KONSTRUKSI</span>
        </div>
      </div>

      <div className="mt-6 px-4">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 flex items-center space-x-3 shadow-xs">
          <div className="flex-shrink-0">
            {user.photoUrl && user.photoUrl !== 'null' ? (
              <img src={`${getBackendHostUrl()}${user.photoUrl}`} alt="Profile" className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-xs" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-extrabold border-2 border-white dark:border-slate-600 shadow-xs text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Pengguna</p>
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 truncate" title={user.name}>{user.name}</h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold mt-1 uppercase tracking-tight ${
              user.role === 'SUPERADMIN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
              user.role === 'ADMIN_MONITORING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
              user.role === 'PROYEK_ADMIN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
              user.role === 'FINANCE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
              user.role === 'PROCUREMENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              user.role === 'ENGINEERING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
              'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 shadow-2xs border-l-4 border-sky-600 dark:border-sky-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 hover:translate-x-1'
                }`}
            >
              <Icon className={`mr-3 h-4.5 w-4.5 transition-transform group-hover:scale-110 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-900 transition-colors duration-200 overflow-x-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-all"
            aria-label="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
        <div className="flex-shrink-0 flex p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            onClick={logout}
            className="group flex items-center w-full px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
          >
            <LogOut className="mr-3 h-4.5 w-4.5 text-rose-500 dark:text-rose-400" />
            Keluar Sistem
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-colors duration-200 z-20">
        <SidebarContent />
        <div className="flex-shrink-0 flex p-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={logout}
            className="group flex items-center w-full px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"
          >
            <LogOut className="mr-3 h-4.5 w-4.5 text-slate-400 dark:text-slate-500 group-hover:text-rose-500 dark:group-hover:text-rose-400" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 md:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/80 transition-colors duration-200">
          <div className="flex-1 px-2.5 sm:px-6 lg:px-8 flex justify-between items-center gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <button
                className="md:hidden mr-2 sm:mr-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 focus:outline-none transition-all shrink-0 active:scale-95"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Buka Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-sm sm:text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                {menuItems.find(item => item.path === pathname)?.name || 'Asset Management'}
              </h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
              <Link
                href="/chat"
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all relative"
                title="Pesan Chat Multi-Role"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
              <NotificationsDropdown />
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                title="Ganti Tema"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
              </button>
              {/* Mobile Logout Quick Icon */}
              <div className="md:hidden flex items-center border-l border-slate-200 dark:border-slate-700 pl-1">
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 transition-all"
                  title="Keluar Sistem"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Render */}
        <main className="flex-grow py-3 sm:py-6 px-2 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
