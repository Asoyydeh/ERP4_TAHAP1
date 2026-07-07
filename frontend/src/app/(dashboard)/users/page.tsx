'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, Role } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Plus, 
  Users, 
  Loader2, 
  X,
  RefreshCw,
  Mail,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function UsersPage() {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ENGINEERING');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSuperAdmin]);

  // Proteksi Tampilan Client jika user selain Superadmin memaksa akses URL
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <div className="p-4 rounded-full bg-rose-50 text-rose-500 border border-rose-100 mb-4 shadow-sm">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Akses Ditolak</h3>
        <p className="text-xs text-slate-500 mt-2">
          Maaf, halaman manajemen pengguna hanya dapat diakses oleh Super Administrator dengan kredensial Superadmin penuh.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-6 px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('ENGINEERING');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setFormError('Harap isi semua kolom wajib.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      await api.post('/auth/register', { 
        name, 
        email, 
        passwordHash: password,
        role 
      });
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal mendaftarkan pengguna baru.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 font-medium">Memuat data staf...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna & Staf</h2>
          <p className="text-xs text-slate-500 mt-1">Daftarkan pengguna baru dan atur hak akses operasional (RBAC) mereka.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
        >
          <Plus className="mr-1.5 h-4.5 w-4.5" />
          Daftarkan Staf Baru
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Daftar Users */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {users.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6 rounded-l-lg">Nama Lengkap</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Hak Akses Role</th>
                  <th className="py-3.5 px-6 rounded-r-lg">Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-all">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="h-4 w-4 text-slate-300" />
                        <span>{item.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                        item.role === 'SUPERADMIN' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        item.role === 'ADMIN_MONITORING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-sky-50 text-sky-700 border-sky-100'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Belum ada staf terdaftar selain Anda.
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Tambah Staf */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Daftarkan Anggota Staf Baru
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="my-4 rounded-lg bg-rose-50 p-3 border border-rose-100">
                <p className="text-xs text-rose-800 font-semibold">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Nama Lengkap Staf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="staf@perusahaan.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Password Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Min. 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Hak Akses Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm cursor-pointer"
                >
                  <option value="ENGINEERING">ENGINEERING (Upload Dokumen, Penawaran, BOQ, RFQ)</option>
                  <option value="PROYEK_ADMIN">PROYEK ADMIN (View & Download Berkas)</option>
                  <option value="PROCUREMENT">PROCUREMENT (View Berkas & Edit Harga BOQ)</option>
                  <option value="FINANCE">FINANCE (View Penawaran & BOQ Total)</option>
                  <option value="ADMIN_MONITORING">ADMIN MONITORING (Hanya Pengawasan / Read-Only)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Akses Penuh / Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="mr-1.5 h-4.5 w-4.5 animate-spin" />}
                  Daftarkan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
