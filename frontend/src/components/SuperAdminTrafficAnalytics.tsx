'use client';

import React, { useMemo } from 'react';
import { Project, Document, DashboardStats, AuditLog } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Building2,
  FileText,
  Coins,
  UserCheck,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface SuperAdminTrafficAnalyticsProps {
  projects: Project[];
  documents: Document[];
  stats: DashboardStats | null;
  auditLogs?: AuditLog[];
}

function parseRemarks(remarksStr?: string): Record<string, any> {
  if (!remarksStr) return {};
  try {
    return JSON.parse(remarksStr);
  } catch {
    return {};
  }
}

function formatCurrencyShort(val: number): string {
  if (!val || val === 0) return 'Rp 0';
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
}

export default function SuperAdminTrafficAnalytics({
  projects,
  documents,
  stats,
  auditLogs = []
}: SuperAdminTrafficAnalyticsProps) {
  
  // 1. Calculations for Project Status Distribution (Pie Chart)
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'Selesai': 0,
      'On Progress': 0,
      'Pending': 0,
      'Service': 0,
      'Cancel': 0,
      'Hold': 0,
      'Drop': 0
    };

    projects.forEach((p) => {
      const remarks = parseRemarks(p.remarks);
      const st = remarks.statusPekerjaan || remarks.statusPeninjauan || (p.progress === 100 ? 'Selesai' : 'On Progress');
      if (counts[st] !== undefined) {
        counts[st]++;
      } else {
        counts['On Progress']++;
      }
    });

    const colors: Record<string, string> = {
      'Selesai': '#10b981', // Emerald
      'On Progress': '#0284c7', // Sky blue
      'Pending': '#f59e0b', // Amber
      'Service': '#6366f1', // Indigo
      'Cancel': '#f43f5e', // Rose
      'Hold': '#a855f7', // Purple
      'Drop': '#64748b'  // Slate
    };

    return Object.keys(counts)
      .filter((k) => counts[k] > 0)
      .map((k) => ({
        name: k,
        value: counts[k],
        color: colors[k] || '#0284c7'
      }));
  }, [projects]);

  // 2. Calculations for Financial Comparison (BOQ vs Penawaran per Project)
  const financeChartData = useMemo(() => {
    return projects.slice(0, 7).map((p) => {
      let boqTotal = 0;
      let penawaranTotal = 0;

      const projDocs = documents.filter((d) => d.projectId === p.id);
      projDocs.forEach((d) => {
        if (d.fileType === 'BOQ' && d.boqHeaders) {
          d.boqHeaders.forEach((b) => (boqTotal += Number(b.totalAmount || 0)));
        }
        if (d.fileType === 'PENAWARAN_DRAFT' || d.fileType === 'PENAWARAN_FINAL') {
          if (d.penawaranHeaders) {
            d.penawaranHeaders.forEach((pn) => (penawaranTotal += Number(pn.totalOffer || 0)));
          }
        }
      });

      const codeShort = p.code || p.name.slice(0, 10);

      return {
        name: codeShort.length > 12 ? codeShort.slice(0, 12) + '...' : codeShort,
        fullName: p.name,
        'Nilai BOQ': boqTotal,
        'Nilai Penawaran': penawaranTotal
      };
    });
  }, [projects, documents]);

  // 3. Calculations for Document Distribution by Type (Bar Chart)
  const docTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {
      'SPK': 0,
      'BOQ': 0,
      'PENAWARAN': 0,
      'DRAWING': 0,
      'INVOICE': 0,
      'SUBKON': 0,
      'RFQ': 0,
      'FOTO': 0,
      'RAB': 0
    };

    documents.forEach((d) => {
      let key = d.fileType as string;
      if (key.includes('PENAWARAN')) key = 'PENAWARAN';
      if (key.includes('SUBKON')) key = 'SUBKON';
      if (key.includes('DRAWING')) key = 'DRAWING';
      if (key.includes('RFQ')) key = 'RFQ';
      if (typeCounts[key] !== undefined) {
        typeCounts[key]++;
      }
    });

    return Object.keys(typeCounts).map((key) => ({
      name: key,
      'Jumlah Berkas': typeCounts[key]
    }));
  }, [documents]);

  // 4. Calculations for Document Upload Traffic over Months (Area Chart)
  const uploadTrafficData = useMemo(() => {
    const monthsMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Generate last 6 months buckets
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthsMap[key] = 0;
    }

    documents.forEach((doc) => {
      if (doc.createdAt) {
        const d = new Date(doc.createdAt);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        if (monthsMap[key] !== undefined) {
          monthsMap[key]++;
        }
      }
    });

    return Object.keys(monthsMap).map((k) => ({
      bulan: k,
      'Trafik Upload': monthsMap[k]
    }));
  }, [documents]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── KPI METRIC CARDS HEADER ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Proyek</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{projects.length}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              {statusData.find(s => s.name === 'Selesai')?.value || 0} Selesai
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Berkas</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{documents.length}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
              <FileText className="h-3 w-3 mr-1" />
              Terurai Otomatis
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Nilai BOQ</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate" title={`Rp ${stats?.totalBoqAmount?.toLocaleString('id-ID') || 0}`}>
              {formatCurrencyShort(stats?.totalBoqAmount || 0)}
            </h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Estimasi Material
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Penawaran</p>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 truncate" title={`Rp ${stats?.totalPenawaranAmount?.toLocaleString('id-ID') || 0}`}>
              {formatCurrencyShort(stats?.totalPenawaranAmount || 0)}
            </h3>
            <span className="inline-flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              Klien & Vendor
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Coins className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{stats?.userCount || projects.length}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              Staf & Admin Aktif
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── ROW 1: GRAFIK KEUANGAN & DISTRIBUSI STATUS ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Perbandingan Nilai BOQ vs Penawaran */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Perbandingan Nilai Keuangan Proyek (BOQ vs Penawaran)
                </h4>
                <p className="text-xs text-slate-400 font-medium">Monitoring estimasi biaya material vs nilai penawaran proyek.</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {financeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => formatCurrencyShort(val)} />
                  <Tooltip
                    formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Nilai BOQ" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={35} />
                  <Bar dataKey="Nilai Penawaran" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data keuangan terurai.</div>
            )}
          </div>
        </div>

        {/* Grafik 2: Pie Donut Chart Distribusi Status Proyek */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <PieIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Distribusi Status Proyek
              </h4>
              <p className="text-xs text-slate-400 font-medium">Persentase progress & status peninjauan.</p>
            </div>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Proyek`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada data proyek.</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{projects.length}</span>
              <span className="text-3xs text-slate-400 font-bold uppercase">Proyek</span>
            </div>
          </div>

          {/* Custom Legend Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            {statusData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100/80 dark:border-slate-800">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-100 ml-1">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 2: TRAFIK UPLOAD BERKAS & DISTRIBUSI TIPE DOKUMEN ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik 3: Trafik Upload Berkas (Area Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Trafik Aktivitas Upload Berkas (Tren Bulanan)
              </h4>
              <p className="text-xs text-slate-400 font-medium">Volume unggahan dokumen proyek dari waktu ke waktu.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Dokumen`, 'Trafik Upload']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Trafik Upload" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 4: Distribusi Tipe Dokumen (Bar Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Distribusi Kelengkapan Tipe Dokumen
              </h4>
              <p className="text-xs text-slate-400 font-medium">Jumlah file SPK, BOQ, Penawaran, Drawing, Invoice, dll.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Berkas`, 'Jumlah']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="Jumlah Berkas" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── LOG TRAFIK AKTIVITAS TERAKHIR ─────────────────────────────────── */}
      {auditLogs && auditLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  Trafik Aktivitas & Log Sistem Terbaru
                </h4>
                <p className="text-xs text-slate-400 font-medium">Riwayat pengerjaan staf & pembaruan dokumen real-time.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-100 dark:border-sky-800">
              Live Feed
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100/80 dark:border-slate-800 text-xs">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold flex-shrink-0 text-xs border border-white dark:border-slate-600 shadow-2xs">
                    {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {log.user?.name || 'Pengguna'}{' '}
                      <span className="font-normal text-slate-500">({log.user?.role || 'SYSTEM'})</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 truncate">{log.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-3">
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
