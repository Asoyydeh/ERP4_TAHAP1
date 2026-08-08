'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    role: user?.role || 'SUPERADMIN',
    password: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);
      if (formData.address) form.append('address', formData.address);
      if (formData.role && isSuperAdmin) form.append('role', formData.role);
      if (formData.password) form.append('password', formData.password);
      if (photo) form.append('photo', photo);

      const res = await api.put('/auth/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setMessage('Profil berhasil diperbarui! Memuat ulang...');
        // Update session storage and reload
        const oldUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        const newUser = { ...oldUser, ...res.data.data };
        sessionStorage.setItem('user', JSON.stringify(newUser));
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Gagal memperbarui profil');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Profil Saya</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola data informasi akun dan hak akses pengguna Anda.</p>
        </div>
        <span className="px-3 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-extrabold text-xs rounded-full uppercase tracking-wider">
          {user?.role}
        </span>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Nama Lengkap</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" required />
        </div>

        {/* Hak Akses Role (Super Admin can change role) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Hak Akses Role</label>
          {isSuperAdmin ? (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
            >
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ADMIN_MONITORING">ADMIN_MONITORING</option>
              <option value="PROYEK_ADMIN">PROYEK_ADMIN</option>
              <option value="ENGINEERING">ENGINEERING</option>
              <option value="FINANCE">FINANCE</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="HRD">HRD</option>
            </select>
          ) : (
            <input type="text" value={formData.role} disabled className="w-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-xl px-4 py-2.5 text-sm font-bold" />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Password Baru (Opsional)</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Kosongkan jika tidak ingin mengubah password" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Alamat Domisili</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Foto Profil (Opsional)</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none" />
        </div>

        <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl shadow-xs transition-all">
          Simpan Perubahan Profil
        </button>
      </form>
    </div>
  );
}
