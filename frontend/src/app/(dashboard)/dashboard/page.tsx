'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { DashboardMetrics } from '@/types';
import { 
  Package, 
  CircleDollarSign, 
  Wrench, 
  CheckCircle,
  FileDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assets/dashboard');
      setMetrics(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat metrik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await api.get('/assets/export-pdf', {
        responseType: 'blob',
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `laporan-aset-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Gagal mengunduh laporan PDF.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 font-medium">Memuat data dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  const { totalAssets, totalValue, statusCounts, categoryDistribution, recentLogs } = metrics!;

  // Data untuk Pie Chart Status
  const statusData = [
    { name: 'Tersedia', value: statusCounts.AVAILABLE, color: '#0ea5e9' },
    { name: 'Digunakan', value: statusCounts.IN_USE, color: '#10b981' },
    { name: 'Perbaikan', value: statusCounts.MAINTENANCE, color: '#f59e0b' },
    { name: 'Diarsipkan', value: statusCounts.RETIRED, color: '#64748b' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ikhtisar Aset</h2>
          <p className="text-xs text-slate-500 mt-1">Status dan pemantauan distribusi aset real-time.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4 text-slate-500" />
            )}
            Ekspor PDF
          </button>
        )}
      </div>

      {/* Grid Kartu Metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-sky-50 text-sky-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total Aset</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalAssets}</h3>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total Nilai Aset</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 truncate">
              Rp {totalValue.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Dalam Perbaikan</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{statusCounts.MAINTENANCE}</h3>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-sky-50 text-sky-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Tersedia / Ready</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{statusCounts.AVAILABLE}</h3>
          </div>
        </div>
      </div>

      {/* Grid Grafik Visualisasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribusi Kategori (Bar Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Distribusi Aset per Kategori</h3>
          <div className="h-64">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Belum ada data kategori aset
              </div>
            )}
          </div>
        </div>

        {/* Status Aset (Pie Chart) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Status Kondisi Aset</h3>
          <div className="h-64 flex flex-col justify-center items-center">
            {statusData.length > 0 ? (
              <>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 mt-2 w-full text-center">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-2xs font-semibold text-slate-500">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400">Belum ada data status aset</div>
            )}
          </div>
        </div>
      </div>

      {/* Log Aktivitas Terbaru */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-700">Histori Audit & Log Aktivitas</h3>
          <button
            onClick={() => window.location.href = '/logs'}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            Lihat Semua
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentLogs.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3 rounded-l-lg">Tanggal</th>
                  <th className="py-2.5 px-3">Aset</th>
                  <th className="py-2.5 px-3">Aktivitas</th>
                  <th className="py-2.5 px-3">Oleh</th>
                  <th className="py-2.5 px-3 rounded-r-lg">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-all">
                    <td className="py-3 px-3 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {log.asset?.name || 'Aset Terhapus'} <span className="font-mono text-2xs text-slate-400 block mt-0.5">{log.asset?.skuCode}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                        log.actionType === 'CREATE' ? 'bg-sky-50 text-sky-700' :
                        log.actionType === 'STATUS_CHANGE' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{log.user?.name || 'Sistem'}</td>
                    <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">{log.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              Belum ada log aktivitas tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
