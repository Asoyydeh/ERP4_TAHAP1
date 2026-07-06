'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AssetLog } from '@/types';
import { 
  History,
  Search, 
  Loader2, 
  RefreshCw,
  Clock
} from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assets/logs');
      setLogs(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil riwayat audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      log.asset?.name.toLowerCase().includes(term) ||
      log.asset?.skuCode.toLowerCase().includes(term) ||
      log.user?.name.toLowerCase().includes(term) ||
      log.actionType.toLowerCase().includes(term) ||
      (log.notes && log.notes.toLowerCase().includes(term))
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 font-medium">Memuat log audit...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Riwayat Audit Aset</h2>
          <p className="text-xs text-slate-500 mt-1">Lacak kronologi peminjaman, perbaikan, mutasi lokasi, dan perubahan data aset.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="mr-1.5 h-4 w-4 text-slate-500" />
          Segarkan
        </button>
      </div>

      {/* Search Logs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari log berdasarkan nama aset, SKU, eksekutor, atau tipe tindakan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <button
            onClick={fetchLogs}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6 rounded-l-lg">Tanggal & Waktu</th>
                  <th className="py-3.5 px-6">Nama Aset</th>
                  <th className="py-3.5 px-6">Tipe Tindakan</th>
                  <th className="py-3.5 px-6">Eksekutor</th>
                  <th className="py-3.5 px-6 rounded-r-lg">Catatan Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-all">
                    {/* Timestamp */}
                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-medium flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-slate-300" />
                      <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                    </td>
                    {/* Asset Name & SKU */}
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div>
                        <span>{log.asset?.name || 'Aset Terhapus'}</span>
                        <span className="font-mono text-2xs text-slate-400 block mt-0.5">{log.asset?.skuCode || '-'}</span>
                      </div>
                    </td>
                    {/* Action Badge */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                        log.actionType === 'CREATE' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        log.actionType === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        log.actionType === 'UPDATE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    {/* Executor */}
                    <td className="py-4 px-6 font-medium text-slate-700">{log.user?.name || 'Sistem'}</td>
                    {/* Notes */}
                    <td className="py-4 px-6 text-slate-500 italic max-w-sm truncate">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Tidak ada riwayat log audit yang cocok dengan pencarian.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
