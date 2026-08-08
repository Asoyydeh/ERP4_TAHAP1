'use client';

import React, { useState, useEffect } from 'react';
import { Project, User } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import {
  Search,
  RefreshCw,
  Edit,
  Save,
  X,
  ChevronDown,
  Table as TableIcon,
  Users
} from 'lucide-react';
import api from '@/lib/api';

interface ProyekAdminDashboardProps {
  projects: Project[];
  documents?: any[];
  loading?: boolean;
  onRefresh: () => Promise<void> | Promise<any>;
  onAddProject?: () => void;
  onEditProject?: (proj: any) => void;
  onDeleteProject?: (id: string, name: string) => Promise<void>;
  onOpenFolder?: (proj: any, folder: any) => void;
}

// Status options for inline dropdown
const STATUS_OPTIONS = [
  { value: 'Selesai', label: 'Selesai', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { value: 'On Progress', label: 'On Progress', bg: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  { value: 'Pending', label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  { value: 'Service', label: 'Service', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' },
  { value: 'Cancel', label: 'Cancel', bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
  { value: 'Hold', label: 'Hold', bg: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { value: 'Drop', label: 'Drop', bg: 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
];

function parseNum(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(val: number): string {
  if (val === 0) return 'Rp 0';
  return `Rp ${val.toLocaleString('id-ID')}`;
}

function formatNumberWithDots(rawVal: string | number): string {
  if (rawVal === undefined || rawVal === null || rawVal === '') return '';
  const strVal = String(rawVal);
  const numericOnly = strVal.replace(/\D/g, '');
  if (!numericOnly) return '';
  const num = parseInt(numericOnly, 10);
  return num.toLocaleString('id-ID');
}

function parseRemarks(remarksStr?: string): Record<string, any> {
  if (!remarksStr) return {};
  try {
    return JSON.parse(remarksStr);
  } catch {
    return {};
  }
}

export default function ProyekAdminDashboard({ projects, loading, onRefresh }: ProyekAdminDashboardProps) {
  const { user, isSuperAdmin, isAdminMonitoring } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'utama' | 'subcon'>('utama');
  const [staffs, setStaffs] = useState<User[]>([]);
  const [masterSubkons, setMasterSubkons] = useState<{ id: string; name: string }[]>([]);
  const [companyForms, setCompanyForms] = useState<any[]>([]);

  const loadExtraData = () => {
    api.get('/master-data/subkons').then(res => setMasterSubkons(res.data?.data || [])).catch(() => {});
    api.get('/company-documents/forms').then(res => setCompanyForms(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (user) {
      api.get('/auth/users').then(res => {
        let list = res.data.data || [];
        if (user && !list.some((s: any) => s.id === user.id)) {
          list = [user, ...list];
        }
        setStaffs(list);
      }).catch(() => {});

      loadExtraData();

      const handleSync = () => {
        loadExtraData();
        onRefresh();
      };

      window.addEventListener('app_data_changed', handleSync);

      let channel: BroadcastChannel | null = null;
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('app_data_sync');
        channel.onmessage = () => {
          handleSync();
        };
      }

      return () => {
        window.removeEventListener('app_data_changed', handleSync);
        if (channel) channel.close();
      };
    }
  }, [user]);

  const getProjectCompanyFormsTotal = (projId: string, projCode: string) => {
    return companyForms
      .filter(f => {
        const data = f.documentData || {};
        return f.projectId === projId || data.selectedProjectId === projId || data.kodeProyek === projCode || f.poNo === projCode || (data.poNo && data.poNo.includes(projCode));
      })
      .reduce((sum, f) => {
        const total = f.documentData?.grandTotal || f.documentData?.subtotal || f.totalAmount || 0;
        return sum + Number(total);
      }, 0);
  };


  const handlePicChange = async (project: Project, field: 'spkPicId', newValue: string) => {
    try {
      setUpdatingId(project.id);
      await api.put(`/projects/${project.id}`, {
        [field]: newValue || null
      });
      await onRefresh();
    } catch (err) {
      console.error('Failed to update PIC:', err);
      alert('Gagal memperbarui PIC.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Subcon data state
  const [projectSubkons, setProjectSubkons] = useState<any[]>([]);
  const [loadingSubkons, setLoadingSubkons] = useState(false);

  // Memoized key to prevent unnecessary effect triggers when projects array reference changes but IDs remain identical
  const projectIdsKey = projects.map(p => p.id).join(',');

  // Fetch subcon data across projects smoothly without full screen flicker
  useEffect(() => {
    let isMounted = true;
    const fetchAllSubkons = async () => {
      if (projects.length === 0) return;
      
      // Only show full loading spinner on initial fetch if we have no cached subcon data
      if (projectSubkons.length === 0) {
        setLoadingSubkons(true);
      }

      try {
        const promises = projects.map(async (p) => {
          try {
            const res = await api.get(`/project-subkons/${p.id}`);
            return {
              project: p,
              subkons: res.data?.data || []
            };
          } catch {
            return { project: p, subkons: [] };
          }
        });
        const resList = await Promise.all(promises);
        if (isMounted) {
          setProjectSubkons(resList);
        }
      } catch (err) {
        console.error('Error fetching subkons:', err);
      } finally {
        if (isMounted) {
          setLoadingSubkons(false);
        }
      }
    };

    fetchAllSubkons();

    return () => {
      isMounted = false;
    };
  }, [projectIdsKey]);

  // Filter and sort projects numerically by code
  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const remarks = parseRemarks(p.remarks);
    const pemberi = (remarks.pemberiKerja || remarks.reqBy || p.client || '').toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      pemberi.includes(q)
    );
  }).sort((a, b) => {
    const numA = parseInt((a.code || '').match(/^\d+/)?.[0] || '0', 10);
    const numB = parseInt((b.code || '').match(/^\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Instant update for status dropdown directly from table row
  const handleStatusChange = async (project: Project, newStatus: string) => {
    try {
      setUpdatingId(project.id);
      const currentRemarks = parseRemarks(project.remarks);
      const updatedRemarks = {
        ...currentRemarks,
        statusPeninjauan: newStatus,
        statusPekerjaan: newStatus
      };

      await api.put(`/projects/${project.id}`, {
        remarks: JSON.stringify(updatedRemarks)
      });
      await onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderDocBadge = (val?: string) => {
    if (!val) return <span className="text-slate-400">-</span>;
    const valLower = val.toLowerCase().trim();
    if (valLower === 'ada' || (valLower.includes('ada') && !valLower.includes('tidak'))) {
      return <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#a3f4ae] dark:bg-[#20693a] text-[#155724] dark:text-emerald-200 rounded">{val}</span>;
    }
    if (valLower === 'tidak ada' || valLower === '-' || valLower.includes('tidak') || valLower.includes('belum')) {
      return <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{val}</span>;
    }
    return <span>{val}</span>;
  };

  return (
    <div className="space-y-4 relative">
      {/* ── Header Bar & Tab Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>📋 Dashboard Monitoring PROYEK_ADMIN</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Tampilan urutan persis format Excel Rekapitulasi Proyek & Subcon.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Selection */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('utama')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'utama'
                  ? 'bg-[#fce4d6] text-[#843c0c] dark:bg-[#5c3014] dark:text-amber-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Tabel Utama (Peach)</span>
            </button>
            <button
              onClick={() => setActiveTab('subcon')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'subcon'
                  ? 'bg-[#d9e1f2] text-[#1f4e78] dark:bg-[#1e3a5f] dark:text-sky-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Tabel Subcon (Biru)</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, proyek, subcon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-52 shadow-xs"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── TAB 1: TABEL UTAMA PROYEK (Peach Header - 31 Columns) ───────────────── */}
      {activeTab === 'utama' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="md:hidden px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/50 dark:border-amber-900/50 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>👈 Geser tabel ke kanan/kiri untuk melihat seluruh 31 kolom</span>
            <span className="text-[10px] opacity-75">Touch Scroll</span>
          </div>
          <div className="overflow-x-auto max-h-[72vh] relative smooth-scroll table-scroll-container">
            <table className="w-full text-xs text-left border-collapse min-w-[3600px]">
              {/* Header Peach `#fce4d6` with exact 31 columns matching Image 1 */}
              <thead className="sticky top-0 z-30 shadow-xs uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="w-[50px] min-w-[50px] sticky left-0 z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    NO <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] sticky left-[50px] z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Project Code <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[200px] min-w-[200px] sticky left-[190px] z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)]">
                    Nama Pekerjaan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    PIC <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[90px] min-w-[90px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Progress <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[80px] min-w-[80px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Flow <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[150px] min-w-[150px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Status Peninjauan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[200px] min-w-[200px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Catatan Pemeriksaan Penyelesaian Proyek <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[200px] min-w-[200px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Lembar Catatan Patroli di Tempat <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[170px] min-w-[170px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Catatan Perubahan Desain <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[110px] min-w-[110px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Kronologi <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[130px] min-w-[130px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanggal Penagihan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[130px] min-w-[130px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanggal Dibayar <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[110px] min-w-[110px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    SPK <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    BOQ / Penawaran <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Shop Drawing <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[130px] min-w-[130px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    As Built Drawing <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[150px] min-w-[150px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Nilai Kontrak <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Nilai Tagihan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Pembayaran (%) <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Prosedur Penagihan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[110px] min-w-[110px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Invoice <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[130px] min-w-[130px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Proforma Invoice <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Faktur Pajak <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[100px] min-w-[100px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    BAST <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[100px] min-w-[100px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Surat Jalan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[110px] min-w-[110px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Foto Progress <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[130px] min-w-[130px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Laporan Progress <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanda Terima <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[160px] min-w-[160px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Permintaan Pembayaran <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[150px] min-w-[150px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Progres Pembayaran <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[180px] min-w-[180px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Remarks / Keterangan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[90px] min-w-[90px] sticky right-0 z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-l border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={33} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                      Tidak ada data proyek.
                    </td>
                  </tr>
                )}

                {filteredProjects.map((proj, idx) => {
                  const remarksObj = parseRemarks(proj.remarks);
                  const currentStatus = remarksObj.statusPeninjauan || remarksObj.statusPekerjaan || 'On Progress';
                  const statusBadge = STATUS_OPTIONS.find(s => s.value === currentStatus) || STATUS_OPTIONS[1];

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 group">
                      {/* 1. NO */}
                      <td className="w-[50px] min-w-[50px] sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </td>

                      {/* 2. Project Code */}
                      <td className="w-[140px] min-w-[140px] sticky left-[50px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 font-mono text-center text-slate-600 dark:text-slate-400">
                        {(isSuperAdmin || isAdminMonitoring) ? (
                          <input
                            type="text"
                            defaultValue={proj.code || ''}
                            key={`${proj.id}_${proj.code}`}
                            onBlur={async (e) => {
                              const newCode = e.target.value;
                              if (newCode !== (proj.code || '')) {
                                setUpdatingId(proj.id);
                                await api.put(`/projects/${proj.id}`, { code: newCode });
                                if (typeof window !== 'undefined') {
                                  window.dispatchEvent(new Event('app_data_changed'));
                                  if ('BroadcastChannel' in window) {
                                    try {
                                      const ch = new BroadcastChannel('app_data_sync');
                                      ch.postMessage('refresh');
                                      ch.close();
                                    } catch (err) {}
                                  }
                                }
                                await onRefresh();
                                setUpdatingId(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-full text-center font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                            title="Klik untuk ubah Kode Proyek (Super Admin)"
                          />
                        ) : (
                          <span className="truncate font-bold" title={proj.code}>{proj.code}</span>
                        )}
                      </td>

                      {/* 3. Nama Pekerjaan */}
                      <td className="w-[200px] min-w-[200px] sticky left-[190px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100 truncate shadow-[4px_0_8px_-2px_rgba(0,0,0,0.15)]" title={proj.name}>
                        {proj.name}
                      </td>

                      {/* PIC Dropdown */}
                      <td className="w-[120px] min-w-[120px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center">
                        <select
                          disabled={updatingId === proj.id}
                          value={proj.spkPicId || ''}
                          onChange={(e) => handlePicChange(proj, 'spkPicId', e.target.value)}
                          className="w-full text-[10px] font-medium py-1 px-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                        >
                          <option value="">-</option>
                          {(() => {
                            const roleStaffs = staffs.filter(s => {
                              if (s.id === proj.spkPicId) return true;
                              if (s.role === 'PROYEK_ADMIN') return true;
                              if ((isSuperAdmin || isAdminMonitoring) && s.role === 'SUPERADMIN') return true;
                              return false;
                            });
                            const displayStaffs = roleStaffs.length > 0 ? roleStaffs : staffs.filter(s => s.role !== 'SUPERADMIN' || isSuperAdmin || isAdminMonitoring);
                            return displayStaffs.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}{(isSuperAdmin || isAdminMonitoring) ? ` (${s.role}${s.managerId ? ' Staff' : ''})` : (s.managerId ? ' (Staff)' : ' (Proyek Admin)')}
                              </option>
                            ));
                          })()}
                        </select>
                      </td>

                      {/* 4. Progress */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-center text-slate-800 dark:text-slate-200">
                        {remarksObj.progress || (proj.progress ? `${proj.progress}%` : '0%')}
                      </td>

                      {/* 5. Flow */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-medium text-slate-700 dark:text-slate-300">
                        {remarksObj.flow || '-'}
                      </td>

                      {/* 6. Status Peninjauan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center">
                        <div className="relative inline-block w-full">
                          <select
                            disabled={updatingId === proj.id}
                            value={currentStatus}
                            onChange={(e) => handleStatusChange(proj, e.target.value)}
                            className={`w-full appearance-none cursor-pointer text-center text-[10px] font-bold py-1 px-2 pr-5 rounded-lg border ${statusBadge.bg} focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* 7. Catatan Pemeriksaan Penyelesaian Proyek */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.catatanPemeriksaanPenyelesaianProyek || remarksObj.catatanPemeriksaanProyek || remarksObj.lembarPemeriksaanMasuk || 'Ada')}
                      </td>

                      {/* 8. Lembar Catatan Patroli di Tempat */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.lembarCatatanPatroliDiTempat || remarksObj.gambarCatatanRevisi || 'Ada')}
                      </td>

                      {/* 9. Catatan Perubahan Desain */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.catatanPerubahanDesain || remarksObj.catatanPerbaikanKendala || 'Ada')}
                      </td>

                      {/* 10. Kronologi */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.kronologi || remarksObj.eskalasi || 'Ada')}
                      </td>

                      {/* 11. Tanggal Penagihan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 text-xs">
                        {remarksObj.tglPenagihan || '-'}
                      </td>

                      {/* 12. Tanggal Dibayar */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 text-xs">
                        {remarksObj.tglDibayar || remarksObj.tglDiterima || '-'}
                      </td>

                      {/* 13. SPK */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.spk || 'Ada')}
                      </td>

                      {/* 14. BOQ / Penawaran */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.boqPenawaran || remarksObj.dibuatPenawaran || 'Ada')}
                      </td>

                      {/* 15. Shop Drawing */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.shopDrawing || 'Ada')}
                      </td>

                      {/* 16. As Built Drawing */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.asBuiltDrawing || 'Ada')}
                      </td>

                      {/* 17. Nilai Kontrak */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-right text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(parseNum(remarksObj.nilaiKontrak || (proj as any).nilaiPekerjaan))}
                      </td>

                      {/* 18. Nilai Tagihan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-right text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(parseNum(remarksObj.nilaiTagihan || remarksObj.nilaiKontrak || (proj as any).nilaiPekerjaan))}
                      </td>

                      {/* 19. Pembayaran (%) */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {remarksObj.pembayaranPersen || '-'}
                      </td>

                      {/* 20. Prosedur Penagihan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 truncate" title={remarksObj.prosedurPenagihan}>
                        {remarksObj.prosedurPenagihan || '-'}
                      </td>

                      {/* 21. Invoice */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                        {remarksObj.invoice || '-'}
                      </td>

                      {/* 22. Proforma Invoice */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.proformaInvoice || 'Ada')}
                      </td>

                      {/* 23. Faktur Pajak */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.fakturPajak || 'Ada')}
                      </td>

                      {/* 24. BAST */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.bast || 'Ada')}
                      </td>

                      {/* 25. Surat Jalan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.suratJalan || 'Ada')}
                      </td>

                      {/* 26. Foto Progress */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.fotoProgress || remarksObj.fotoProyek || 'Ada')}
                      </td>

                      {/* 27. Laporan Progress */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.laporanProgress || 'Ada')}
                      </td>

                      {/* 28. Tanda Terima */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                        {remarksObj.tandaTerima || remarksObj.beritaTerima || '-'}
                      </td>

                      {/* 29. Permintaan Pembayaran */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                        {remarksObj.permintaanPembayaran || '-'}
                      </td>

                      {/* 30. Progres Pembayaran */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                        {renderDocBadge(remarksObj.progresPembayaran || remarksObj.diterimaPembayaran || 'Ada')}
                      </td>

                      {/* 31. Remarks / Keterangan */}
                      <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={remarksObj.remarksKeterangan || remarksObj.keterangan || (typeof proj.description === 'string' ? proj.description : '')}>
                        {remarksObj.remarksKeterangan || remarksObj.keterangan || (typeof proj.description === 'string' ? proj.description : '') || '-'}
                      </td>

                      {/* Sticky Aksi */}
                      <td className="w-[90px] min-w-[90px] sticky right-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-l border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                        <button
                          onClick={() => setEditingProject(proj)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 dark:hover:bg-sky-900 rounded-lg transition-all flex items-center justify-center mx-auto"
                          title="Edit Data Excel"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: TABEL SUBCON (Blue Header - 13 Columns) ────────────────────── */}
      {activeTab === 'subcon' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[72vh] relative smooth-scroll table-scroll-container">
            <table className="w-full text-xs text-left border-collapse min-w-[1800px]">
              {/* Header Light Blue `#d9e1f2` matching Tabel Subcon */}
              <thead className="sticky top-0 z-30 shadow-xs uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="w-[50px] min-w-[50px] sticky left-0 z-30 bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    NO
                  </th>
                  <th className="w-[140px] min-w-[140px] sticky left-[50px] z-30 bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    PROJECT CODE <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[180px] min-w-[180px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    SUBCON <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[200px] min-w-[200px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Nama Pekerjaan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    SPK <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Nilai Kontrak <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Nilai Jasa <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Pembayaran % <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[150px] min-w-[150px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Pekerjaan Progress % <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Proforma Invoice <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Invoice <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[120px] min-w-[120px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Kwitansi <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanggal Pengajuan <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[190px] min-w-[190px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanda Terima HO ke Finance <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[140px] min-w-[140px] bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold">
                    Tanggal Dibayar <span className="text-[9px]">▼</span>
                  </th>
                  <th className="w-[90px] min-w-[90px] sticky right-0 z-30 bg-[#d9e1f2] dark:bg-[#1e293b] text-[#1f4e78] dark:text-sky-200 border-l border-r border-b border-slate-400 dark:border-slate-600 py-2.5 px-2 text-center font-bold shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {loadingSubkons && projectSubkons.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-sky-500" />
                      Memuat data subcon...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                      Tidak ada data subcon proyek.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((proj, idx) => {
                    const remarksObj = parseRemarks(proj.remarks);
                    const subItem = projectSubkons.find(item => item.project.id === proj.id);
                    const subkonList = subItem?.subkons || [];

                    if (subkonList.length === 0) {
                      // Display subcon name if available, otherwise '-'
                      const subconName = remarksObj.subconNama || remarksObj.subkon1 || '-';
                      return (
                        <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 group">
                          {/* NO */}
                          <td className="w-[50px] min-w-[50px] sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </td>
                          {/* PROJECT CODE */}
                          <td className="w-[140px] min-w-[140px] sticky left-[50px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 font-mono text-center text-slate-600 dark:text-slate-400">
                            {(isSuperAdmin || isAdminMonitoring) ? (
                              <input
                                type="text"
                                defaultValue={proj.code || ''}
                                key={`${proj.id}_${proj.code}`}
                                onBlur={async (e) => {
                                  const newCode = e.target.value;
                                  if (newCode !== (proj.code || '')) {
                                    setUpdatingId(proj.id);
                                    await api.put(`/projects/${proj.id}`, { code: newCode });
                                    if (typeof window !== 'undefined') {
                                      window.dispatchEvent(new Event('app_data_changed'));
                                      if ('BroadcastChannel' in window) {
                                        try {
                                          const ch = new BroadcastChannel('app_data_sync');
                                          ch.postMessage('refresh');
                                          ch.close();
                                        } catch (err) {}
                                      }
                                    }
                                    await onRefresh();
                                    setUpdatingId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-full text-center font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                                title="Klik untuk ubah Kode Proyek (Super Admin)"
                              />
                            ) : (
                              <span className="truncate font-bold" title={proj.code}>{proj.code}</span>
                            )}
                          </td>
                          {/* SUBCON (Dropdown dari Master Subcon) */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-1 px-1 text-center">
                            <select
                              value={subconName !== '-' ? subconName : ''}
                              onChange={async (e) => {
                                const newSubconName = e.target.value;
                                setUpdatingId(proj.id);
                                const currentRemarks = parseRemarks(proj.remarks);
                                const updatedRemarks = {
                                  ...currentRemarks,
                                  subconNama: newSubconName,
                                  subkon1: newSubconName
                                };
                                await api.put(`/projects/${proj.id}`, {
                                  remarks: JSON.stringify(updatedRemarks)
                                });
                                await onRefresh();
                                setUpdatingId(null);
                              }}
                              className="w-full text-xs font-bold py-1 px-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                              <option value="">-- Pilih Master Subcon --</option>
                              {masterSubkons.map(sub => (
                                <option key={sub.id} value={sub.name}>{sub.name}</option>
                              ))}
                            </select>
                          </td>
                          {/* 2. Nama Pekerjaan */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200 truncate" title={proj.name}>
                            {proj.name}
                          </td>
                          {/* 3. SPK */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(remarksObj.subconSpk || 'Ada')}
                          </td>
                          {/* 4. Nilai Kontrak */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatCurrency(parseNum(remarksObj.subconNilaiKontrak || remarksObj.nilaiKontrak || (proj as any).nilaiPekerjaan))}
                          </td>
                          {/* 5. Nilai Jasa (Otomatis dari Formulir Dokumen / PO) */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-mono text-right text-emerald-700 dark:text-emerald-300 font-extrabold">
                            <div className="text-xs">{formatCurrency(parseNum(remarksObj.subconNilaiJasa) || getProjectCompanyFormsTotal(proj.id, proj.code))}</div>
                            <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                              Tot: {formatCurrency((parseNum(remarksObj.subconNilaiJasa) || getProjectCompanyFormsTotal(proj.id, proj.code)) + (parseNum(remarksObj.procurementModalBoq) || getProjectCompanyFormsTotal(proj.id, proj.code)))}
                            </div>
                          </td>
                          {/* 6. Pembayaran % */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                            {remarksObj.subconPembayaranPersen || '-'}
                          </td>
                          {/* 7. Pekerjaan Progress % */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                            {remarksObj.subconProgressPersen || (proj.progress ? `${proj.progress}%` : '0%')}
                          </td>
                          {/* 8. Proforma Invoice */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(remarksObj.subconProformaInvoice)}
                          </td>
                          {/* 9. Invoice */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(remarksObj.subconInvoice)}
                          </td>
                          {/* 10. Kwitansi */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(remarksObj.subconKwitansi)}
                          </td>
                          {/* 11. Tanggal Pengajuan */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {remarksObj.subconTglPengajuan || '-'}
                          </td>
                          {/* 12. Tanda Terima HO ke Finance */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {remarksObj.subconTandaTerimaHO || '-'}
                          </td>
                          {/* 13. Tanggal Dibayar */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {remarksObj.subconTglDibayar || '-'}
                          </td>
                          {/* Sticky Aksi */}
                          <td className="w-[90px] min-w-[90px] sticky right-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-l border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                            <button
                              onClick={() => setEditingProject(proj)}
                              className="px-2.5 py-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 dark:hover:bg-sky-900 rounded-lg transition-all flex items-center justify-center mx-auto"
                              title="Edit Data Excel"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return subkonList.map((sk: any, skIdx: number) => {
                      const masterName = sk.masterSubkon?.name || sk.namaPekerjaan || remarksObj.subconNama || '-';
                      const termins = sk.termins || [];
                      const firstTermin = termins[0] || {};

                      return (
                        <tr key={`${proj.id}-${sk.id || skIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 group">
                          {/* NO */}
                          <td className="w-[50px] min-w-[50px] sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </td>
                          {/* PROJECT CODE */}
                          <td className="w-[140px] min-w-[140px] sticky left-[50px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 font-mono text-center text-slate-600 dark:text-slate-400">
                            {(isSuperAdmin || isAdminMonitoring) ? (
                              <input
                                type="text"
                                defaultValue={proj.code || ''}
                                key={`${proj.id}_${proj.code}`}
                                onBlur={async (e) => {
                                  const newCode = e.target.value;
                                  if (newCode !== (proj.code || '')) {
                                    setUpdatingId(proj.id);
                                    await api.put(`/projects/${proj.id}`, { code: newCode });
                                    if (typeof window !== 'undefined') {
                                      window.dispatchEvent(new Event('app_data_changed'));
                                      if ('BroadcastChannel' in window) {
                                        try {
                                          const ch = new BroadcastChannel('app_data_sync');
                                          ch.postMessage('refresh');
                                          ch.close();
                                        } catch (err) {}
                                      }
                                    }
                                    await onRefresh();
                                    setUpdatingId(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-full text-center font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                                title="Klik untuk ubah Kode Proyek (Super Admin)"
                              />
                            ) : (
                              <span className="truncate font-bold" title={proj.code}>{proj.code}</span>
                            )}
                          </td>
                          {/* SUBCON */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-center text-slate-800 dark:text-slate-100 truncate" title={masterName}>
                            {masterName}
                          </td>
                          {/* 2. Nama Pekerjaan */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200 truncate" title={sk.namaPekerjaan || proj.name}>
                            {sk.namaPekerjaan || proj.name}
                          </td>
                          {/* 3. SPK */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(firstTermin.autoSpk ? 'Ada' : 'Ada')}
                          </td>
                          {/* 4. Nilai Kontrak */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatCurrency(parseNum(sk.nilaiKontrak || (proj as any).nilaiPekerjaan))}
                          </td>
                          {/* 5. Nilai Jasa */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-mono text-right text-slate-700 dark:text-slate-300">
                            {formatCurrency(parseNum(firstTermin.nilaiJasa))}
                          </td>
                          {/* 6. Pembayaran % */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-800 dark:text-slate-200">
                            {firstTermin.pembayaranPersen ? `${firstTermin.pembayaranPersen}%` : '-'}
                          </td>
                          {/* 7. Pekerjaan Progress % */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                            {proj.progress ? `${proj.progress}%` : '0%'}
                          </td>
                          {/* 8. Proforma Invoice */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(firstTermin.proformaInvoice ? 'Ada' : '-')}
                          </td>
                          {/* 9. Invoice */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(firstTermin.invoice ? 'Ada' : '-')}
                          </td>
                          {/* 10. Kwitansi */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center">
                            {renderDocBadge(firstTermin.kwitansi ? 'Ada' : '-')}
                          </td>
                          {/* 11. Tanggal Pengajuan */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {firstTermin.tanggalPengajuan ? new Date(firstTermin.tanggalPengajuan).toLocaleDateString('id-ID') : '-'}
                          </td>
                          {/* 12. Tanda Terima HO ke Finance */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {firstTermin.tandaTerimaTukarFaktur || '-'}
                          </td>
                          {/* 13. Tanggal Dibayar */}
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {firstTermin.tanggalDibayar ? new Date(firstTermin.tanggalDibayar).toLocaleDateString('id-ID') : '-'}
                          </td>
                          {/* Sticky Aksi */}
                          <td className="w-[90px] min-w-[90px] sticky right-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-l border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                            <button
                              onClick={() => setEditingProject(proj)}
                              className="px-2.5 py-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 dark:hover:bg-sky-900 rounded-lg transition-all flex items-center justify-center mx-auto"
                              title="Edit Data Excel"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editingProject && (
        <ManualEditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={async (updatedRemarks) => {
            try {
              await api.put(`/projects/${editingProject.id}`, {
                remarks: JSON.stringify(updatedRemarks)
              });
              setEditingProject(null);
              await onRefresh();
            } catch (err) {
              console.error('Failed to update project data:', err);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Component for Complete Excel Data Edit ─────────────────────────────
function ManualEditModal({ project, onClose, onSave }: { project: Project, onClose: () => void, onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState<Record<string, string>>(parseRemarks(project.remarks));
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleMoneyChange = (key: string, rawVal: string) => {
    const formatted = formatNumberWithDots(rawVal);
    setFormData(prev => ({ ...prev, [key]: formatted }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const renderStatusSelect = (label: string, fieldKey: string, defaultValue = 'Ada') => {
    const currentVal = formData[fieldKey] || defaultValue;
    const standardOptions = ['Ada', 'Tidak Ada', 'Proses'];
    const isCustom = currentVal && !standardOptions.includes(currentVal);

    return (
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
        <select
          value={currentVal}
          onChange={(e) => handleChange(fieldKey, e.target.value)}
          className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium cursor-pointer"
        >
          <option value="Ada">Ada</option>
          <option value="Tidak Ada">Tidak Ada</option>
          <option value="Proses">Proses</option>
          {isCustom && <option value={currentVal}>{currentVal}</option>}
        </select>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl z-[101] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Edit Data Rekapitulasi Proyek & Subcon
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {project.name} ({project.code})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Tabel Utama (Peach Area - 31 Kolom) */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-[#843c0c] bg-[#fce4d6] dark:bg-[#4a2810] dark:text-amber-200 p-2.5 rounded-xl uppercase tracking-wider border border-amber-200 dark:border-amber-900/50">
              1. Tabel Utama Proyek (31 Kolom - Area Peach)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Code
                </label>
                <input
                  type="text"
                  value={formData.projectCode || project.code || ''}
                  onChange={(e) => handleChange('projectCode', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Progress
                </label>
                <input
                  type="text"
                  value={formData.progress || ''}
                  onChange={(e) => handleChange('progress', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="e.g. 100%"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Flow
                </label>
                <input
                  type="text"
                  value={formData.flow || ''}
                  onChange={(e) => handleChange('flow', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Peninjauan
                </label>
                <select
                  value={formData.statusPeninjauan || formData.statusPekerjaan || 'On Progress'}
                  onChange={(e) => {
                    handleChange('statusPeninjauan', e.target.value);
                    handleChange('statusPekerjaan', e.target.value);
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {renderStatusSelect('Catatan Pemeriksaan Penyelesaian Proyek', 'catatanPemeriksaanPenyelesaianProyek')}

              {renderStatusSelect('Lembar Catatan Patroli di Tempat', 'lembarCatatanPatroliDiTempat')}

              {renderStatusSelect('Catatan Perubahan Desain', 'catatanPerubahanDesain')}

              {renderStatusSelect('Kronologi', 'kronologi')}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Penagihan
                </label>
                <input
                  type="text"
                  value={formData.tglPenagihan || ''}
                  onChange={(e) => handleChange('tglPenagihan', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Dibayar
                </label>
                <input
                  type="text"
                  value={formData.tglDibayar || formData.tglDiterima || ''}
                  onChange={(e) => handleChange('tglDibayar', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {renderStatusSelect('SPK', 'spk')}

              {renderStatusSelect('BOQ / Penawaran', 'boqPenawaran')}

              {renderStatusSelect('Shop Drawing', 'shopDrawing')}

              {renderStatusSelect('As Built Drawing', 'asBuiltDrawing')}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Kontrak (Rp)
                </label>
                <input
                  type="text"
                  value={formatNumberWithDots(formData.nilaiKontrak || '')}
                  onChange={(e) => handleMoneyChange('nilaiKontrak', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  placeholder="e.g. 500.000.000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Tagihan (Rp)
                </label>
                <input
                  type="text"
                  value={formatNumberWithDots(formData.nilaiTagihan || formData.nilaiKontrak || '')}
                  onChange={(e) => handleMoneyChange('nilaiTagihan', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  placeholder="e.g. 45.000.000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pembayaran (%)
                </label>
                <input
                  type="text"
                  value={formData.pembayaranPersen || ''}
                  onChange={(e) => handleChange('pembayaranPersen', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prosedur Penagihan
                </label>
                <input
                  type="text"
                  value={formData.prosedurPenagihan || ''}
                  onChange={(e) => handleChange('prosedurPenagihan', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="Isi prosedur penagihan..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice
                </label>
                <input
                  type="text"
                  value={formData.invoice || ''}
                  onChange={(e) => handleChange('invoice', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {renderStatusSelect('Proforma Invoice', 'proformaInvoice')}

              {renderStatusSelect('Faktur Pajak', 'fakturPajak')}

              {renderStatusSelect('BAST', 'bast')}

              {renderStatusSelect('Surat Jalan', 'suratJalan')}

              {renderStatusSelect('Foto Progress', 'fotoProgress')}

              {renderStatusSelect('Laporan Progress', 'laporanProgress')}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanda Terima
                </label>
                <input
                  type="text"
                  value={formData.tandaTerima || formData.beritaTerima || ''}
                  onChange={(e) => handleChange('tandaTerima', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Permintaan Pembayaran
                </label>
                <input
                  type="text"
                  value={formData.permintaanPembayaran || ''}
                  onChange={(e) => handleChange('permintaanPembayaran', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {renderStatusSelect('Progres Pembayaran', 'progresPembayaran')}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Keterangan
                </label>
                <input
                  type="text"
                  value={formData.remarksKeterangan || formData.keterangan || ''}
                  onChange={(e) => handleChange('remarksKeterangan', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="Catatan / Keterangan tambahan..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Subcon (13 Kolom Area Biru) */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-extrabold text-[#1f4e78] bg-[#d9e1f2] dark:bg-[#1e293b] dark:text-sky-200 p-2.5 rounded-xl uppercase tracking-wider border border-sky-200 dark:border-sky-900/50">
              2. Data Subcon (13 Kolom - Area Biru)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SUBCON
                </label>
                <input
                  type="text"
                  value={formData.subconNama || ''}
                  onChange={(e) => handleChange('subconNama', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="Nama / Kode Subcon"
                />
              </div>

              {renderStatusSelect('Subcon - SPK', 'subconSpk')}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Nilai Kontrak (Rp)
                </label>
                <input
                  type="text"
                  value={formatNumberWithDots(formData.subconNilaiKontrak || '')}
                  onChange={(e) => handleMoneyChange('subconNilaiKontrak', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Nilai Jasa (Rp)
                </label>
                <input
                  type="text"
                  value={formatNumberWithDots(formData.subconNilaiJasa || '')}
                  onChange={(e) => handleMoneyChange('subconNilaiJasa', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Pembayaran %
                </label>
                <input
                  type="text"
                  value={formData.subconPembayaranPersen || ''}
                  onChange={(e) => handleChange('subconPembayaranPersen', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Pekerjaan Progress %
                </label>
                <input
                  type="text"
                  value={formData.subconProgressPersen || ''}
                  onChange={(e) => handleChange('subconProgressPersen', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Proforma Invoice
                </label>
                <input
                  type="text"
                  value={formData.subconProformaInvoice || ''}
                  onChange={(e) => handleChange('subconProformaInvoice', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Invoice
                </label>
                <input
                  type="text"
                  value={formData.subconInvoice || ''}
                  onChange={(e) => handleChange('subconInvoice', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Kwitansi
                </label>
                <input
                  type="text"
                  value={formData.subconKwitansi || ''}
                  onChange={(e) => handleChange('subconKwitansi', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Tanggal Pengajuan
                </label>
                <input
                  type="text"
                  value={formData.subconTglPengajuan || ''}
                  onChange={(e) => handleChange('subconTglPengajuan', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Tanda Terima HO ke Finance
                </label>
                <input
                  type="text"
                  value={formData.subconTandaTerimaHO || ''}
                  onChange={(e) => handleChange('subconTandaTerimaHO', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcon - Tanggal Dibayar
                </label>
                <input
                  type="text"
                  value={formData.subconTglDibayar || ''}
                  onChange={(e) => handleChange('subconTglDibayar', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan Excel
          </button>
        </div>

      </div>
    </>
  );
}
