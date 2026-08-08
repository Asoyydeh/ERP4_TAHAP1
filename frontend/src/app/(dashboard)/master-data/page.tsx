'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Edit3, Building2, Users, HardHat, Hash } from 'lucide-react';

interface MasterData {
  id: string;
  code: string;
  name: string;
}

export default function MasterDataPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [clients, setClients] = useState<MasterData[]>([]);
  const [subkons, setSubkons] = useState<MasterData[]>([]);
  const [numberings, setNumberings] = useState<MasterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'company' | 'client' | 'subkon' | 'numbering'>('company');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isSuperAdmin, router]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [compRes, cliRes, subRes, numRes] = await Promise.all([
        api.get('/master-data/companies'),
        api.get('/master-data/clients'),
        api.get('/master-data/subkons'),
        api.get('/master-data/numberings').catch(() => ({ data: { data: [] } }))
      ]);
      setCompanies(compRes.data.data || []);
      setClients(cliRes.data.data || []);
      setSubkons(subRes.data.data || []);
      setNumberings(numRes.data?.data || []);
    } catch (error) {
      console.error('Gagal memuat data master', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const handleOpenModal = (item?: MasterData) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ code: item.code, name: item.name });
    } else {
      setEditingId(null);
      setFormData({ code: '', name: '' });
    }
    setModalOpen(true);
  };

  const getEndpoint = () => {
    switch (activeTab) {
      case 'company': return '/master-data/companies';
      case 'client': return '/master-data/clients';
      case 'subkon': return '/master-data/subkons';
      case 'numbering': return '/master-data/numberings';
    }
  };

  const notifyDataChanged = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('app_data_changed'));
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('app_data_sync');
          channel.postMessage('refresh');
          channel.close();
        } catch (e) {}
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = getEndpoint();
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, formData);
      } else {
        await api.post(endpoint, formData);
      }
      setModalOpen(false);
      notifyDataChanged();
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) return;
    try {
      const endpoint = getEndpoint();
      await api.delete(`${endpoint}/${id}`);
      notifyDataChanged();
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const currentDataList = () => {
    switch (activeTab) {
      case 'company': return companies;
      case 'client': return clients;
      case 'subkon': return subkons;
      case 'numbering': return numberings;
    }
  };

  if (loading || !isSuperAdmin) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Tabs Nav */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 min-w-[140px] flex items-center justify-center py-4 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'company' 
                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Master Perusahaan
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex-1 min-w-[140px] flex items-center justify-center py-4 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'client' 
                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Master PT Client
          </button>
          <button
            onClick={() => setActiveTab('subkon')}
            className={`flex-1 min-w-[140px] flex items-center justify-center py-4 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'subkon' 
                ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
          >
            <HardHat className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Master Subkon
          </button>
          <button
            onClick={() => setActiveTab('numbering')}
            className={`flex-1 min-w-[140px] flex items-center justify-center py-4 text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'numbering' 
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Hash className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Penomoran Proyek
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Data {
                  activeTab === 'company' ? 'Perusahaan' : 
                  activeTab === 'client' ? 'PT Client' : 
                  activeTab === 'subkon' ? 'Subkon' : 
                  'Penomoran Proyek (Kode Proyek)'
                }
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'numbering' 
                  ? 'Kelola nomor urut dan format penomoran kode proyek (seperti 141 - MJK - PATAMA).'
                  : `Kelola daftar nama ${activeTab === 'subkon' ? 'subkon' : 'perusahaan dan PT Client'} yang akan digunakan pada form proyek.`}
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Data
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                    {activeTab === 'numbering' ? 'Nomor / Kode' : 'Kode / Singkatan'}
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                    {activeTab === 'numbering' ? 'Format Penomoran Kode Proyek' : 'Nama Lengkap'}
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">Memuat data...</td>
                  </tr>
                ) : currentDataList().length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">Belum ada data terdaftar.</td>
                  </tr>
                ) : (
                  currentDataList().map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono text-slate-800 dark:text-slate-100">{item.code}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200 font-bold">{item.name}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
                          title="Edit Data"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="inline-flex p-1.5 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 transition-all"
                          title="Hapus Data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              {editingId ? 'Edit Data Penomoran' : 'Tambah Data Penomoran Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {activeTab === 'numbering' ? 'Nomor / Kode Proyek' : 'Kode / Singkatan'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500 font-mono font-bold text-slate-800 dark:text-slate-100"
                  placeholder={
                    activeTab === 'company' ? 'MJK' : 
                    activeTab === 'client' ? 'AFI' : 
                    activeTab === 'subkon' ? 'SUB' : 
                    '141'
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {activeTab === 'numbering' ? 'Format Lengkap Kode Proyek' : 'Nama Lengkap'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500 font-semibold text-slate-800 dark:text-slate-100"
                  placeholder={
                    activeTab === 'company' ? 'PT. Modern Jaya Konstruksi' : 
                    activeTab === 'client' ? 'AFI Client' : 
                    activeTab === 'subkon' ? 'PT. Nama Subkon' : 
                    '141 - MJK - PATAMA'
                  }
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
