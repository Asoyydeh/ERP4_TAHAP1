'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff, Sparkles, FileText, X, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('email') || '';
    }
    return '';
  });

  const [password, setPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('password') || '';
    }
    return '';
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    // Redirect ke dashboard jika sudah login
    if (user && typeof window !== 'undefined') {
      window.location.href = ['HRD', 'GA', 'STAFF_GA'].includes(user.role) ? '/ga-documents' : '/dashboard';
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap masukkan email dan password.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/login');
      }
      await login(email.trim(), password);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('network error') || errMsg.toLowerCase().includes('failed to fetch')) {
        setError('Gagal terhubung ke Server (Port 5000). Pastikan BUKA_AKSES_FIREWALL_LAN.bat telah dijalankan sebagai Administrator di laptop server.');
      } else {
        setError(errMsg || 'Login gagal, periksa email & password.');
      }
      setSubmitting(false);
    }
  };

  const handleSelectDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('network error') || errMsg.toLowerCase().includes('failed to fetch')) {
        setError('Gagal terhubung ke Server (Port 5000). Pastikan BUKA_AKSES_FIREWALL_LAN.bat telah dijalankan sebagai Administrator di laptop server.');
      } else {
        setError(errMsg || 'Login gagal, periksa email & password.');
      }
      setSubmitting(false);
    }
  };

  const handleFocusEmail = () => {
    setError(null);
    if (emailInputRef.current) {
      emailInputRef.current.focus();
      emailInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#e7e5df] dark:bg-slate-950 p-2 sm:p-4 lg:p-5 flex items-center justify-center font-sans">
      {/* Outer Card Container (Full Screen Responsive) */}
      <div className="w-full h-full min-h-[calc(100dvh-1rem)] sm:min-h-[calc(100vh-2.5rem)] bg-[#edebe5] dark:bg-slate-900 rounded-[24px] sm:rounded-[36px] p-3 sm:p-5 lg:p-6 shadow-2xl border border-white/60 dark:border-slate-800 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch w-full h-full my-auto">
          
          {/* ── LEFT SIDE: LOGIN FORM ── */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between bg-[#f8f7f2] dark:bg-slate-800/90 rounded-[20px] sm:rounded-[30px] p-4 sm:p-8 lg:p-10 shadow-sm border border-stone-200/50 dark:border-slate-700/60 min-h-0 sm:min-h-[540px]">
            <div>
              {/* Prominent Header Logo & PT Name */}
              <div className="flex items-center gap-3.5 mb-4 sm:mb-6 bg-white/90 dark:bg-slate-700/80 p-3 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-slate-600 shadow-sm">
                <div className="p-2 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-100 flex items-center justify-center shrink-0">
                  <img src="/mjk_logo.png" alt="MJK Logo" className="h-8 sm:h-11 w-auto object-contain" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                    PT. MODERN JAYA KONSTRUKSI
                  </h2>
                </div>
              </div>

              {/* Mobile Hero Visual Image Banner (Visible on mobile/tablet < lg) */}
              <div className="block lg:hidden rounded-2xl overflow-hidden relative h-36 xs:h-44 sm:h-52 mb-4 shadow-md border border-stone-200/80 dark:border-slate-700">
                <img
                  src="/login_hero_bg.png"
                  alt="Corporate Hero Workspace"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 p-3.5 sm:p-4 border border-rose-200 text-xs font-semibold text-rose-800 dark:text-rose-300">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1.5 ml-2">
                    Alamat Email
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@asset.com atau staff@asset.com"
                    className="w-full rounded-full bg-white/90 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-sm text-stone-800 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-slate-300 mb-1.5 ml-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-full bg-white/90 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 px-4 sm:px-5 py-3 sm:py-3.5 text-base sm:text-sm text-stone-800 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all shadow-xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 p-1 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Pill Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#fbd45c] hover:bg-[#f5cb4a] active:bg-[#eabf3d] py-3.5 text-sm font-extrabold text-stone-900 shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-stone-900" />
                  ) : (
                    'Masuk ke Sistem'
                  )}
                </button>
              </form>

              {/* Demo Account Grid */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-stone-200/70 dark:border-slate-700">
                <p className="text-[11px] font-bold text-stone-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Pilih Akun Demo (Klik untuk Masuk Otomatis):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { role: 'Super Admin', email: 'superadmin@project.com', pass: 'super123' },
                    { role: 'Engineering', email: 'engineering@project.com', pass: 'eng123' },
                    { role: 'Proyek Admin', email: 'proyekadmin@project.com', pass: 'proyek123' },
                    { role: 'Procurement', email: 'procurement@project.com', pass: 'proc123' },
                    { role: 'Finance', email: 'finance@project.com', pass: 'fin123' },
                    { role: 'Admin Monitoring', email: 'adminmon@project.com', pass: 'mon123' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSelectDemo(acc.email, acc.pass)}
                      className="px-3 py-2 bg-white/90 hover:bg-amber-50 dark:bg-slate-900/80 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 rounded-2xl text-left transition-all hover:border-amber-300 group shadow-2xs cursor-pointer touch-manipulation active:scale-95"
                    >
                      <span className="font-extrabold text-[11px] text-stone-800 dark:text-slate-200 group-hover:text-amber-700 block truncate">
                        {acc.role}
                      </span>
                      <span className="text-[10px] text-stone-400 block truncate">{acc.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Links (Masuk & Syarat & Ketentuan) */}
            <div className="mt-6 sm:mt-8 flex items-center justify-between text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-200/40 dark:border-slate-800">
              <button 
                type="button"
                onClick={handleFocusEmail} 
                className="text-left hover:text-stone-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Sudah terdaftar? <span className="font-bold text-stone-700 dark:text-slate-200 underline decoration-amber-400 underline-offset-2">Masuk</span>
              </button>
              <button 
                type="button" 
                onClick={() => setShowTermsModal(true)} 
                className="hover:underline hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
              >
                Syarat & Ketentuan
              </button>
            </div>
          </div>

          {/* ── RIGHT SIDE: VISUAL HERO COLUMN ── */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 rounded-[24px] sm:rounded-[30px] overflow-hidden relative min-h-[600px] lg:min-h-[calc(100vh-5rem)] h-full shadow-lg border border-stone-200/50">
            {/* Background Image */}
            <img
              src="/login_hero_bg.png"
              alt="Corporate Hero Workspace"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-stone-900/10 to-transparent" />
          </div>
        </div>
      </div>

      {/* ── MODAL SYARAT & KETENTUAN ── */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    Syarat & Ketentuan
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    Sistem Manajemen Aset PT. Modern Jaya Konstruksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-stone-600 dark:text-slate-300 leading-relaxed pr-1">
              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-stone-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  1. Keamanan & Rahasia Perusahaan
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Seluruh dokumen proyek, BOQ, RAB, SPK, Invoice, dan data finansial adalah berkas rahasia milik <strong>PT. Modern Jaya Konstruksi</strong>. Pengguna dilarang menyebarluaskan dokumen tanpa izin tertulis dari manajemen.
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-stone-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  2. Tanggung Jawab Akun & Peran
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Setiap pengguna wajib menjaga kerahasiaan password. Aktivitas yang dilakukan melalui akun terdaftar (Superadmin, Engineering, Proyek Admin, Procurement, Finance, HRD, GA) merupakan tanggung jawab pemilik akun.
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-stone-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  3. Audit Log & Audit Jejak Digital
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Sistem mencatat jejak aktivitas (*audit log*) otomatis mencakup unggah dokumen, persetujuan PO, perubahan status proyek, dan absensi staf untuk keperluan validasi & audit internal.
                </p>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-slate-800/60 rounded-2xl border border-stone-200/60 dark:border-slate-700/60 space-y-2">
                <h4 className="font-extrabold text-stone-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  4. Bantuan & Registrasi Akun Staf Baru
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Pendaftaran akun staf baru atau pemulihan kata sandi dilakukan secara terpusat oleh Superadmin / HRD PT. Modern Jaya Konstruksi.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#fbd45c] hover:bg-[#f5cb4a] active:bg-[#eabf3d] text-stone-900 rounded-full font-extrabold text-xs shadow-sm transition-all cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

