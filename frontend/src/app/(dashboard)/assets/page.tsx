'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Asset, Category, AssetStatus, AssetLog } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  X,
  Search,
  RefreshCw,
  AlertTriangle,
  History
} from 'lucide-react';

export default function AssetsPage() {
  const { user, isAdmin } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States Pencarian & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // States Modal Form Aset
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form Fields
  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<AssetStatus>('AVAILABLE');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().substring(0, 10));

  // States Modal Log Audit Aset
  const [logOpen, setLogOpen] = useState(false);
  const [selectedAssetLogs, setSelectedAssetLogs] = useState<AssetLog[]>([]);
  const [selectedAssetName, setSelectedAssetName] = useState('');
  const [selectedAssetSku, setSelectedAssetSku] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAssetsAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetsRes, categoriesRes] = await Promise.all([
        api.get('/assets', {
          params: {
            search: search || undefined,
            categoryId: filterCategory || undefined,
            status: filterStatus || undefined,
          }
        }),
        api.get('/categories'),
      ]);
      setAssets(assetsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data aset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsAndCategories();
  }, [search, filterCategory, filterStatus]);

  const openCreateForm = () => {
    setFormMode('create');
    setSkuCode('');
    setName('');
    setCategoryId(categories[0]?.id || '');
    setStatus('AVAILABLE');
    setLocation('');
    setPrice(0);
    setPurchaseDate(new Date().toISOString().substring(0, 10));
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (asset: Asset) => {
    setFormMode('edit');
    setCurrentAssetId(asset.id);
    setSkuCode(asset.skuCode);
    setName(asset.name);
    setCategoryId(asset.categoryId);
    setStatus(asset.status);
    setLocation(asset.location);
    setPrice(asset.price);
    setPurchaseDate(new Date(asset.purchaseDate).toISOString().substring(0, 10));
    setFormError(null);
    setFormOpen(true);
  };

  const openLogsModal = async (asset: Asset) => {
    setSelectedAssetName(asset.name);
    setSelectedAssetSku(asset.skuCode);
    setLoadingLogs(true);
    setLogOpen(true);
    try {
      const response = await api.get(`/assets/${asset.id}`);
      setSelectedAssetLogs(response.data.data.logs || []);
    } catch (err) {
      alert('Gagal mengambil logs aset');
      setLogOpen(false);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      name,
      skuCode,
      categoryId,
      status,
      location,
      price: Number(price),
      purchaseDate: new Date(purchaseDate).toISOString(),
    };

    try {
      if (formMode === 'create') {
        await api.post('/assets', payload);
      } else {
        // Jika STAFF, batasi payload di frontend hanya status & location
        const updatePayload = isAdmin ? payload : { status, location };
        await api.put(`/assets/${currentAssetId}`, updatePayload);
      }
      setFormOpen(false);
      fetchAssetsAndCategories();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan aset.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, assetName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aset "${assetName}"? Seluruh log audit terkait aset ini akan dihapus permanen.`)) {
      return;
    }

    try {
      await api.delete(`/assets/${id}`);
      fetchAssetsAndCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus aset.');
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'IN_USE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'RETIRED':
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const translateStatus = (status: AssetStatus) => {
    switch (status) {
      case 'AVAILABLE': return 'Tersedia';
      case 'IN_USE': return 'Digunakan';
      case 'MAINTENANCE': return 'Pemeliharaan';
      case 'RETIRED': return 'Diarsipkan';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Aset</h2>
          <p className="text-xs text-slate-500 mt-1">Daftar inventori barang, lokasi, status operasional, dan nilai penyusutan aset.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Daftarkan Aset
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari SKU, nama aset, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="AVAILABLE">Tersedia</option>
            <option value="IN_USE">Digunakan</option>
            <option value="MAINTENANCE">Pemeliharaan</option>
            <option value="RETIRED">Diarsipkan</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchAssetsAndCategories}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {assets.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-6 rounded-l-lg">Kode SKU / Aset</th>
                  <th className="py-3 px-6">Kategori</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Lokasi</th>
                  <th className="py-3 px-6">Nilai Beli</th>
                  <th className="py-3 px-6">Tanggal Beli</th>
                  <th className="py-3 px-6 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/30 transition-all">
                    {/* SKU & Name */}
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div>
                        <span className="text-slate-800">{asset.name}</span>
                        <span className="font-mono text-2xs text-slate-400 block mt-0.5">{asset.skuCode}</span>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="py-4 px-6 text-slate-500">{asset.category?.name}</td>
                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border ${getStatusBadge(asset.status)}`}>
                        {translateStatus(asset.status)}
                      </span>
                    </td>
                    {/* Location */}
                    <td className="py-4 px-6 text-slate-500">{asset.location}</td>
                    {/* Price */}
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      Rp {asset.price.toLocaleString('id-ID')}
                    </td>
                    {/* Purchase Date */}
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(asset.purchaseDate).toLocaleDateString('id-ID')}
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openLogsModal(asset)}
                        className="inline-flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-2xs"
                        title="Riwayat Audit Aset"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditForm(asset)}
                        className="inline-flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-2xs"
                        title={isAdmin ? "Edit Aset" : "Update Status"}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all shadow-2xs"
                          title="Hapus Aset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              {loading ? 'Sedang mengambil data...' : 'Aset tidak ditemukan atau belum didaftarkan.'}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM ASET */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {formMode === 'create' ? 'Daftarkan Aset Baru' : (isAdmin ? 'Edit Detail Aset' : 'Update Status Operasional')}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="my-4 rounded-lg bg-rose-50 p-3 border border-rose-100">
                <p className="text-xs text-rose-800 font-semibold">{formError}</p>
              </div>
            )}

            {!isAdmin && formMode === 'edit' && (
              <div className="my-3 rounded-lg bg-amber-50 p-3 border border-amber-100 text-xs text-amber-800 flex items-start gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Sebagai <b>Staff</b>, Anda hanya diizinkan memperbarui status operasional dan lokasi aset untuk log perbaikan/peminjaman.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* SKU Code (Hanya Admin / Create) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kode SKU / Serial Number</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin && formMode === 'edit'}
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm disabled:opacity-60"
                    placeholder="Contoh: HW-MACBOOK-001"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Aset</label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin && formMode === 'edit'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm disabled:opacity-60"
                    placeholder="Contoh: MacBook Pro M3 16 inch"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                  <select
                    disabled={!isAdmin && formMode === 'edit'}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm disabled:opacity-60 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status Operasional</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssetStatus)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm cursor-pointer"
                  >
                    <option value="AVAILABLE">Tersedia / Ready</option>
                    <option value="IN_USE">Sedang Digunakan</option>
                    <option value="MAINTENANCE">Dalam Perbaikan</option>
                    <option value="RETIRED">Diarsipkan / Rusak</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Lokasi Penyimpanan</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                    placeholder="Contoh: Ruang Server, R. IT Lantai 3"
                  />
                </div>

                {/* Price (Hanya Admin / Create) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nilai Beli (Rp)</label>
                  <input
                    type="number"
                    required
                    disabled={!isAdmin && formMode === 'edit'}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm disabled:opacity-60"
                    placeholder="25000000"
                  />
                </div>

                {/* Purchase Date */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    required
                    disabled={!isAdmin && formMode === 'edit'}
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm disabled:opacity-60 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
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
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG AUDIT ASET */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedAssetName}</h3>
                <p className="text-3xs text-slate-400 font-mono mt-0.5">{selectedAssetSku}</p>
              </div>
              <button onClick={() => setLogOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                </div>
              ) : selectedAssetLogs.length > 0 ? (
                <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-5">
                  {selectedAssetLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Bullet node on timeline */}
                      <span className="absolute -left-[21px] top-1 flex h-2 w-2 rounded-full bg-sky-500 ring-4 ring-white" />
                      
                      <div className="text-3xs text-slate-400 font-semibold">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        Aktivitas: <span className="text-sky-600 font-semibold">{log.actionType}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 italic">{log.notes || 'Perubahan data'}</p>
                      <div className="text-3xs text-slate-400 mt-1">
                        Eksekutor: <span className="font-semibold">{log.user?.name || 'Sistem'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat aktivitas tercatat.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
