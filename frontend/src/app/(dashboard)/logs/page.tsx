'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AuditLog } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  History,
  Search, 
  Loader2, 
  RefreshCw,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function LogsPage() {
  const { user, isSuperAdmin, isAdminMonitoring } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/monitoring/audit-logs');
      setLogs(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil riwayat audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin || isAdminMonitoring) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin, isAdminMonitoring]);

  // Proteksi Halaman di Sisi Klien
  if (!isSuperAdmin && !isAdminMonitoring) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Akses Ditolak</h3>
          <p className="text-xs text-slate-400 mt-1">Halaman Log Audit ini hanya dapat diakses oleh Admin Monitoring atau Superadmin untuk pengawasan.</p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      log.user?.name.toLowerCase().includes(term) ||
      log.actionType.toLowerCase().includes(term) ||
      log.tableName.toLowerCase().includes(term) ||
      log.description.toLowerCase().includes(term) ||
      (log.ipAddress && log.ipAddress.includes(term))
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat log audit...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Jejak Audit Aktivitas Pengguna</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lacak kronologi unggah berkas, unduh berkas, perubahan data BOQ, dan manipulasi data proyek.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="mr-1.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          Segarkan
        </button>
      </div>

      {/* Search Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari log berdasarkan nama pengguna, jenis tindakan, nama tabel, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 pl-10 pr-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchLogs}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                  <th className="py-3.5 px-6 rounded-l-lg">Tanggal & Waktu</th>
                  <th className="py-3.5 px-6">Pengguna</th>
                  <th className="py-3.5 px-6">Tipe Tindakan</th>
                  <th className="py-3.5 px-6">Tabel Terkait</th>
                  <th className="py-3.5 px-6">Deskripsi Aktivitas</th>
                  <th className="py-3.5 px-6 rounded-r-lg">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600 dark:text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-900/30 transition-all">
                    {/* Timestamp */}
                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-slate-300" />
                      <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    </td>
                    {/* User */}
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-100">
                      <div>
                        <span>{log.user?.name || 'Sistem'}</span>
                        <span className="font-mono text-3xs text-slate-400 block mt-0.5">{log.user?.role || 'SYSTEM'}</span>
                      </div>
                    </td>
                    {/* Action Type */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:text-slate-200 font-mono font-bold text-3xs border border-slate-200 dark:border-slate-700">
                        {log.actionType}
                      </span>
                    </td>
                    {/* Table Name */}
                    <td className="py-4 px-6 font-mono text-2xs text-slate-500 dark:text-slate-400">{log.tableName}</td>
                    {/* Description */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">{log.description}</td>
                    {/* IP Address */}
                    <td className="py-4 px-6 text-slate-400 text-xs">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Tidak ada riwayat log audit yang ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
