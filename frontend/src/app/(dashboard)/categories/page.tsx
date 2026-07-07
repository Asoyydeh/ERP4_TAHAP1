'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function ProjectsPage() {
  const { isSuperAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // State Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data proyek.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setModalMode('edit');
    setCurrentId(project.id);
    setName(project.name);
    setDescription(project.description || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama proyek wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        await api.post('/projects', { name, description });
      } else {
        await api.put(`/projects/${currentId}`, { name, description });
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek "${projName}"? Seluruh dokumen di bawah proyek ini akan ikut terhapus.`)) {
      return;
    }

    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus proyek.');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 font-medium">Memuat proyek...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Proyek Konstruksi</h2>
          <p className="text-xs text-slate-500 mt-1">Kelompokkan berkas penawaran, BOQ, gambar teknis, dan RFQ berdasarkan proyek aktif.</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Proyek
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Daftar Proyek */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {projects.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6 rounded-l-lg">Nama Proyek</th>
                  <th className="py-3 px-6">Deskripsi Proyek</th>
                  <th className="py-3 px-6">Tanggal Dibuat</th>
                  {isSuperAdmin && <th className="py-3 px-6 text-right rounded-r-lg">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/30 transition-all">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4.5 w-4.5 text-sky-500" />
                        <span>{project.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 max-w-sm truncate">{project.description || '-'}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{new Date(project.createdAt).toLocaleDateString('id-ID')}</td>
                    {isSuperAdmin && (
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(project)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-2xs"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all shadow-2xs"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Belum ada proyek terdaftar.
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Proyek */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'create' ? 'Tambah Proyek Baru' : 'Edit Proyek'}
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
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Contoh: Pembangunan Jembatan Ampera Baru"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Deskripsikan lingkup kerja, lokasi, atau klien proyek..."
                />
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
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
