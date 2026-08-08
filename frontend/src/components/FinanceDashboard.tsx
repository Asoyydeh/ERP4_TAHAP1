'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project, Document, User } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import {
  Search,
  Plus,
  RefreshCw,
  X,
  Save,
  ChevronDown,
  Trash2,
  ListPlus
} from 'lucide-react';

interface FinanceDashboardProps {
  projects: Project[];
  documents?: Document[];
  onRefresh: () => Promise<any>;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string, name: string) => void;
  onOpenFolder: (project: Project, folder: 'klien' | 'subkon' | 'internal') => void;
}

export interface FinanceTerminItem {
  id: string;
  termin: string;
  nilaiInvoice: number | string;
  ppnOverride?: number | string;
  pphType: '2.65' | '1.75' | 'manual';
  pphCustomRate?: number | string;
  pphCustomAmount?: number | string;
  statusPenagihan?: string;
  penagihanRemarks?: string;
  issue?: string;
  remark?: string;
}

export const STATUS_OPTIONS = [
  { value: 'Berjalan', label: 'Berjalan', bg: 'bg-[#e2f9e5] text-[#1e7e34] border-[#b1dfbb] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { value: 'Cancel', label: 'Cancel', bg: 'bg-[#f8d7da] text-[#721c24] border-[#f5c6cb] dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
  { value: 'On Hold', label: 'On Hold', bg: 'bg-[#e2e3e5] text-[#383d41] border-[#d6d8db] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'Opname/Revisi SPK', label: 'Opname/Revisi SPK', bg: 'bg-[#e2e3e5] text-[#383d41] border-[#d6d8db] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'PO Pending', label: 'PO Pending', bg: 'bg-[#e2e3e5] text-[#383d41] border-[#d6d8db] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { value: 'Retensi/100%', label: 'Retensi/100%', bg: 'bg-[#fff3cd] text-[#856404] border-[#ffeeba] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  { value: 'Selesai', label: 'Selesai', bg: 'bg-[#cce5ff] text-[#004085] border-[#b8daff] dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  { value: 'Service', label: 'Service', bg: 'bg-[#e2d9f3] text-[#4a235a] border-[#d2b4de] dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { value: 'Tender', label: 'Tender', bg: 'bg-[#d1ecf1] text-[#0c5460] border-[#bee5eb] dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
];

export const TERMIN_OPTIONS = [
  { value: 'T1', label: 'T1', bg: 'bg-[#cce5ff] text-[#004085] border-[#b8daff] dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  { value: 'T2', label: 'T2', bg: 'bg-[#e2d9f3] text-[#4a235a] border-[#d2b4de] dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  { value: 'T3', label: 'T3', bg: 'bg-[#d4edda] text-[#155724] border-[#c3e6cb] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  { value: 'T4', label: 'T4', bg: 'bg-[#e2f0d9] text-[#385723] border-[#c5e0b4] dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800' },
  { value: 'T5', label: 'T5', bg: 'bg-[#b4c6e7] text-[#1f4e78] border-[#8ea9db] dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  { value: 'T6', label: 'T6', bg: 'bg-[#ddebf7] text-[#1f4e78] border-[#bdd7ee] dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  { value: 'T7', label: 'T7', bg: 'bg-[#ead1dc] text-[#4c1130] border-[#d9d2e9] dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-800' },
  { value: 'T8', label: 'T8', bg: 'bg-[#fce4d6] text-[#c65911] border-[#f8cbad] dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  { value: 'Retensi', label: 'Retensi', bg: 'bg-[#fff3cd] text-[#856404] border-[#ffeeba] dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
  { value: 'Belum saatnya penagihan', label: 'Belum saatnya penagihan', bg: 'bg-[#e2f9e5] text-[#1e7e34] border-[#b1dfbb] dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
];

export const PPH_OPTIONS = [
  { value: '2.65', label: '2,65% PPh', rate: 0.0265, bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' },
  { value: '1.75', label: '1,75% PPh', rate: 0.0175, bg: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' },
  { value: 'manual', label: 'Manual PPh', rate: 0, bg: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300' },
];

const parseRemarks = (remarks: string | undefined | null) => {
  if (!remarks) return {};
  try {
    const parsed = JSON.parse(remarks);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return { statusPekerjaan: remarks };
  }
};

const parseNum = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  const str = val.toString().replace(/\./g, '').replace(/[^0-9-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatNumberDots = (val: any) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'number' ? val : parseNum(val);
  if (num === 0 && val !== 0 && val !== '0') return val.toString();
  return num < 0 ? `-Rp ${Math.abs(num).toLocaleString('id-ID')}` : `Rp ${num.toLocaleString('id-ID')}`;
};

const extractClientCode = (code: string | undefined, remarksClient?: string) => {
  if (remarksClient && remarksClient.trim() !== '') return remarksClient;
  if (!code) return '-';
  const parts = code.split(' - ');
  if (parts.length >= 3) return parts[2];
  return '-';
};

export const getTerminListFromProject = (proj: Project): FinanceTerminItem[] => {
  const remarksObj = parseRemarks(proj.remarks);
  if (Array.isArray(remarksObj.financeTerminList) && remarksObj.financeTerminList.length > 0) {
    return remarksObj.financeTerminList.map((item: any, idx: number) => ({
      id: item.id || `t_${idx}_${Date.now()}`,
      termin: item.termin || 'Belum saatnya penagihan',
      nilaiInvoice: item.nilaiInvoice !== undefined ? item.nilaiInvoice : (remarksObj.financeNilai || 0),
      ppnOverride: item.ppnOverride,
      pphType: (item.pphType === '2.65' || item.pphType === '1.75' || item.pphType === 'manual') ? item.pphType : '1.75',
      pphCustomRate: item.pphCustomRate !== undefined ? item.pphCustomRate : '',
      pphCustomAmount: item.pphCustomAmount !== undefined ? item.pphCustomAmount : '',
      statusPenagihan: item.statusPenagihan || '',
      penagihanRemarks: item.penagihanRemarks || '',
      issue: item.issue || '',
      remark: item.remark || '',
    }));
  }

  // Fallback single termin from legacy remarks fields
  return [{
    id: 't_default',
    termin: remarksObj.financeTermin || 'Belum saatnya penagihan',
    nilaiInvoice: remarksObj.financeNilai || remarksObj.nilaiPekerjaan || 0,
    ppnOverride: remarksObj.financePpn,
    pphType: (remarksObj.financePphType === '2.65' || remarksObj.financePphType === 'manual') ? remarksObj.financePphType : '1.75',
    pphCustomRate: remarksObj.financePphRate || '',
    pphCustomAmount: remarksObj.financePph,
    statusPenagihan: remarksObj.financeStatusPenagihan || '',
    penagihanRemarks: remarksObj.financePenagihanRemarks || '',
    issue: remarksObj.financeIssue || '',
    remark: remarksObj.financeRemark || '',
  }];
};

export const calculateTerminValues = (item: FinanceTerminItem) => {
  const nilaiInvoiceNum = parseNum(item.nilaiInvoice);
  
  // PPN calculation (Default 11%)
  const ppnCalc = nilaiInvoiceNum > 0 ? (nilaiInvoiceNum * 0.11) : 0;
  const ppnNum = item.ppnOverride !== undefined && item.ppnOverride !== '' ? parseNum(item.ppnOverride) : ppnCalc;

  // PPH calculation based on PPh mode
  let pphNum = 0;
  if (item.pphType === '2.65') {
    pphNum = nilaiInvoiceNum > 0 ? (nilaiInvoiceNum * 0.0265) : 0;
  } else if (item.pphType === '1.75') {
    pphNum = nilaiInvoiceNum > 0 ? (nilaiInvoiceNum * 0.0175) : 0;
  } else if (item.pphType === 'manual') {
    if (item.pphCustomRate !== undefined && item.pphCustomRate !== '' && !isNaN(parseFloat(String(item.pphCustomRate)))) {
      const ratePct = parseFloat(String(item.pphCustomRate)) / 100;
      pphNum = nilaiInvoiceNum > 0 ? (nilaiInvoiceNum * ratePct) : 0;
    } else if (item.pphCustomAmount !== undefined && item.pphCustomAmount !== '') {
      pphNum = parseNum(item.pphCustomAmount);
    }
  }

  // GRAND TOTAL Formula: NILAI INVOICE + PPN - PPH
  const grandTotalNum = (nilaiInvoiceNum > 0 || ppnNum > 0 || pphNum > 0) ? (nilaiInvoiceNum + ppnNum - pphNum) : 0;

  return {
    nilaiInvoiceNum,
    ppnNum,
    pphNum,
    grandTotalNum
  };
};

export default function FinanceDashboard({
  projects,
  documents = [],
  onRefresh,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onOpenFolder,
}: FinanceDashboardProps) {
  const { user, isSuperAdmin, isAdminMonitoring } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [manualEditProject, setManualEditProject] = useState<Project | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [staffs, setStaffs] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      api.get('/auth/users').then(res => {
        let list = res.data.data || [];
        if (user && !list.some((s: any) => s.id === user.id)) {
          list = [user, ...list];
        }
        setStaffs(list);
      }).catch(() => {});

      const handleSync = () => {
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

  const handlePicChange = async (project: Project, field: 'invoicePicId', newValue: string) => {
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

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const remarksObj = parseRemarks(p.remarks);
    const client = (remarksObj.financeClient || p.client || extractClientCode(p.code, remarksObj.reqBy)).toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      client.includes(q)
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

  // Instant update for status dropdown directly from table
  const handleStatusChange = async (project: Project, newStatus: string) => {
    try {
      setUpdatingId(project.id);
      const currentRemarks = parseRemarks(project.remarks);
      const updatedRemarks = {
        ...currentRemarks,
        financeStatus: newStatus
      };

      await api.put(`/projects/${project.id}`, {
        remarks: JSON.stringify(updatedRemarks)
      });
      await onRefresh();
    } catch (err) {
      console.error('Gagal memperbarui status proyek:', err);
      alert('Gagal memperbarui status proyek.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDateChange = async (project: Project, field: 'startDate' | 'endDate', value: string) => {
    try {
      setUpdatingId(project.id);
      await api.put(`/projects/${project.id}`, {
        [field]: value ? value : null
      });
      await onRefresh();
    } catch (err) {
      console.error(`Gagal memperbarui ${field}:`, err);
      alert(`Gagal memperbarui ${field}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInlineCellSave = async (project: Project, fieldKey: string, newValue: string) => {
    try {
      setUpdatingId(project.id);
      const currentRemarks = parseRemarks(project.remarks);
      const updatedRemarks = {
        ...currentRemarks,
        [fieldKey]: newValue
      };

      await api.put(`/projects/${project.id}`, {
        remarks: JSON.stringify(updatedRemarks)
      });
      await onRefresh();
    } catch (err) {
      console.error('Gagal memperbarui data:', err);
      alert('Gagal memperbarui data.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to save termin list to project
  const saveProjectTerminList = async (project: Project, updatedList: FinanceTerminItem[]) => {
    try {
      setUpdatingId(project.id);
      const currentRemarks = parseRemarks(project.remarks);
      const firstItem = updatedList[0] || {};
      const firstCalc = firstItem ? calculateTerminValues(firstItem) : { nilaiInvoiceNum: 0, ppnNum: 0, pphNum: 0, grandTotalNum: 0 };

      const updatedRemarks = {
        ...currentRemarks,
        financeTerminList: updatedList,
        // Legacy fallback fields for general compatibility
        financeTermin: firstItem.termin || 'Belum saatnya penagihan',
        financeNilai: firstItem.nilaiInvoice || 0,
        financePpn: firstCalc.ppnNum,
        financePphType: firstItem.pphType,
        financePphRate: firstItem.pphCustomRate,
        financePph: firstCalc.pphNum,
        financeGrandTotal: firstCalc.grandTotalNum,
        financeStatusPenagihan: firstItem.statusPenagihan || '',
        financePenagihanRemarks: firstItem.penagihanRemarks || '',
        financeIssue: firstItem.issue || '',
        financeRemark: firstItem.remark || '',
      };

      await api.put(`/projects/${project.id}`, {
        remarks: JSON.stringify(updatedRemarks)
      });
      await onRefresh();
    } catch (err) {
      console.error('Gagal menyimpan daftar termin:', err);
      alert('Gagal menyimpan daftar termin.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick inline update for a specific termin item inside a project
  const handleTerminItemChange = async (project: Project, itemIndex: number, field: keyof FinanceTerminItem, value: any) => {
    const list = getTerminListFromProject(project);
    if (!list[itemIndex]) return;
    list[itemIndex] = {
      ...list[itemIndex],
      [field]: value
    };
    await saveProjectTerminList(project, list);
  };

  // Add new termin row (List Baru) directly from table
  const handleAddTerminRow = async (project: Project) => {
    const list = getTerminListFromProject(project);
    const nextTerminLabel = `T${list.length + 1}`;
    const newItem: FinanceTerminItem = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      termin: TERMIN_OPTIONS.some(t => t.value === nextTerminLabel) ? nextTerminLabel : 'T1',
      nilaiInvoice: 0,
      pphType: '1.75',
      statusPenagihan: 'Belum Lunas',
      penagihanRemarks: '',
      issue: '',
      remark: ''
    };
    await saveProjectTerminList(project, [...list, newItem]);
  };

  // Delete a termin row
  const handleDeleteTerminRow = async (project: Project, itemIndex: number) => {
    const list = getTerminListFromProject(project);
    if (list.length <= 1) {
      alert('Satu proyek minimal harus memiliki 1 data termin/invoice penagihan.');
      return;
    }
    if (!confirm(`Hapus termin ${list[itemIndex].termin} dari proyek ini?`)) return;
    const updated = list.filter((_, idx) => idx !== itemIndex);
    await saveProjectTerminList(project, updated);
  };

  return (
    <div className="space-y-4 relative">
      {/* ── Header Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>📊 Dashboard Monitoring Keuangan (Finance)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Rekapitulasi data penagihan &amp; pembayaran proyek multi-termin &amp; PPh.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari proyek / client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 w-56 shadow-xs"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

          {(isSuperAdmin || isAdminMonitoring) && (
            <button
              onClick={onAddProject}
              className="inline-flex items-center px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Proyek
            </button>
          )}
        </div>
      </div>

      {/* ── Excel-Format Table ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl pb-16">
        <div className="overflow-x-auto excel-container smooth-scroll scroll-smooth pb-4">
          <table className="w-full text-[11px] border-separate border-spacing-0" style={{ minWidth: '2350px' }}>
            {/* ── Header Rows ─────────────────────────────────────────────────── */}
            <thead>
              {/* Row 1 */}
              <tr>
                <th rowSpan={2} className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-30 bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  No
                </th>
                <th rowSpan={2} className="w-[130px] min-w-[130px] max-w-[130px] sticky left-[48px] z-30 bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Kode Proyek
                </th>
                <th rowSpan={2} className="w-[120px] min-w-[120px] max-w-[120px] sticky left-[178px] z-30 bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Nama Client
                </th>
                <th rowSpan={2} className="w-[210px] min-w-[210px] max-w-[210px] sticky left-[298px] z-30 bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)]">
                  Nama Proyek
                </th>
                <th rowSpan={2} className="w-[120px] min-w-[120px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  PIC
                </th>
                <th rowSpan={2} className="w-[130px] min-w-[130px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Nilai Kontrak
                </th>
                <th rowSpan={2} className="w-[110px] min-w-[110px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Awal Kontrak
                </th>
                <th rowSpan={2} className="w-[110px] min-w-[110px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Akhir Kontrak
                </th>
                <th rowSpan={2} className="w-[140px] min-w-[140px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Status
                </th>
                <th rowSpan={2} className="w-[80px] min-w-[80px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Progress
                </th>
                <th rowSpan={2} className="w-[100px] min-w-[100px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  BOQ
                </th>
                <th rowSpan={2} className="w-[100px] min-w-[100px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Invoice
                </th>

                {/* Orange header group: NILAI PENAGIHAN */}
                <th colSpan={8} className="bg-[#c55a11] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-extrabold uppercase tracking-wider text-xs">
                  NILAI PENAGIHAN (TERMIN &amp; INVOICE)
                </th>

                {/* Blue header: Remark */}
                <th rowSpan={2} className="w-[140px] min-w-[140px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Remark
                </th>

                {/* Aksi */}
                <th rowSpan={2} className="w-[110px] min-w-[110px] bg-[#2f5597] text-white border-r border-b border-blue-900 py-2 px-2 text-center font-bold">
                  Aksi
                </th>
              </tr>

              {/* Row 2 (Subheaders under NILAI PENAGIHAN) */}
              <tr>
                <th className="w-[160px] min-w-[160px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  TERMIN
                </th>
                <th className="w-[140px] min-w-[140px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  NILAI INVOICE
                </th>
                <th className="w-[120px] min-w-[120px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  PPN (11%)
                </th>
                <th className="w-[170px] min-w-[170px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  PPH (2,65% / 1,75% / Manual)
                </th>
                <th className="w-[140px] min-w-[140px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  GRAND TOTAL
                </th>
                <th className="w-[130px] min-w-[130px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  Status Penagihan
                </th>
                <th className="w-[140px] min-w-[140px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  Remarks
                </th>
                <th className="w-[140px] min-w-[140px] bg-[#d66011] text-white border-r border-b border-amber-900 py-1.5 px-2 text-center font-bold">
                  Issue
                </th>
              </tr>
            </thead>

            {/* ── Table Body ─────────────────────────────────────────────────── */}
            <tbody>
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={21} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                    Tidak ada data proyek.
                  </td>
                </tr>
              )}

              {filteredProjects.map((proj, projIdx) => {
                const remarksObj = parseRemarks(proj.remarks);
                const clientVal = remarksObj.financeClient || extractClientCode(proj.code, remarksObj.reqBy);
                const currentStatus = remarksObj.financeStatus || remarksObj.statusPekerjaan || 'Berjalan';
                const progressVal = remarksObj.progressManual || (proj.progress ? `${proj.progress}%` : '0%');
                const nilaiKontrakVal = remarksObj.nilaiKontrak || remarksObj.nilaiPekerjaan || '';
                const statusObj = STATUS_OPTIONS.find(o => o.value === currentStatus) || STATUS_OPTIONS[0];

                const hasBoq = documents?.some(d => d.projectId === proj.id && d.fileType === 'BOQ');
                const hasInvoice = documents?.some(d => d.projectId === proj.id && d.fileType === 'INVOICE');
                const isUpdating = updatingId === proj.id;

                const terminList = getTerminListFromProject(proj);
                const rowSpan = terminList.length;

                return terminList.map((tItem, tIdx) => {
                  const isFirstRow = tIdx === 0;
                  const calc = calculateTerminValues(tItem);
                  const terminObj = TERMIN_OPTIONS.find(o => o.value === tItem.termin) || TERMIN_OPTIONS[9];
                  const pphOpt = PPH_OPTIONS.find(o => o.value === tItem.pphType) || PPH_OPTIONS[1];

                  return (
                    <tr key={`${proj.id}_${tItem.id}_${tIdx}`} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 group relative ${actionMenuOpen === proj.id ? 'z-40' : ''}`}>
                      {/* NO (Sticky Left) */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-20 bg-white dark:bg-slate-800 border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center font-semibold text-slate-700 dark:text-slate-300 align-top">
                          {projIdx + 1}
                        </td>
                      )}

                      {/* Kode Proyek (Sticky Left) */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[130px] min-w-[130px] max-w-[130px] sticky left-[48px] z-20 bg-white dark:bg-slate-800 border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 font-mono text-center text-slate-600 dark:text-slate-400 align-top">
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
                              className="w-full text-center font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                              title="Klik untuk ubah Kode Proyek (Super Admin)"
                            />
                          ) : (
                            <span className="truncate font-bold" title={proj.code}>{proj.code}</span>
                          )}
                        </td>
                      )}

                      {/* Nama Client (Sticky Left) */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[120px] min-w-[120px] max-w-[120px] sticky left-[178px] z-20 bg-white dark:bg-slate-800 border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 font-semibold text-slate-700 dark:text-slate-300 truncate align-top" title={clientVal}>
                          {clientVal}
                        </td>
                      )}

                      {/* Nama Proyek (Sticky Left) */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[210px] min-w-[210px] max-w-[210px] sticky left-[298px] z-20 bg-white dark:bg-slate-800 border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 font-bold text-slate-800 dark:text-slate-100 truncate shadow-[4px_0_8px_-2px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] align-top" title={proj.name}>
                          {proj.name}
                        </td>
                      )}

                      {/* PIC DROPDOWN CELL */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[120px] min-w-[120px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center align-top">
                          <select
                            disabled={updatingId === proj.id}
                            value={proj.invoicePicId || ''}
                            onChange={(e) => handlePicChange(proj, 'invoicePicId', e.target.value)}
                            className="w-full text-[10px] font-medium py-1 px-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                          >
                            <option value="">-</option>
                            {(() => {
                              const roleStaffs = staffs.filter(s => {
                                if (s.id === proj.invoicePicId) return true;
                                if (s.role === 'FINANCE') return true;
                                if ((isSuperAdmin || isAdminMonitoring) && s.role === 'SUPERADMIN') return true;
                                return false;
                              });
                              const displayStaffs = roleStaffs.length > 0 ? roleStaffs : staffs.filter(s => s.role !== 'SUPERADMIN' || isSuperAdmin || isAdminMonitoring);
                              return displayStaffs.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} (Finance)
                                </option>
                              ));
                            })()}

                          </select>

                        </td>
                      )}

                      {/* Nilai Kontrak */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[130px] min-w-[130px] border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-right font-mono align-top">
                          <input
                            type="text"
                            defaultValue={formatNumberDots(nilaiKontrakVal) === '-' ? '' : formatNumberDots(nilaiKontrakVal)}
                            key={`${proj.id}_nk_${nilaiKontrakVal}`}
                            onBlur={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              if (val !== String(parseNum(nilaiKontrakVal))) {
                                handleInlineCellSave(proj, 'nilaiKontrak', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-full text-right font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                            placeholder="e.g. 100.000.000"
                            title="Ketik untuk ubah Nilai Kontrak (Finance)"
                          />
                        </td>
                      )}

                      {/* Awal Kontrak */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[110px] min-w-[110px] border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-center align-top">
                          <input
                            type="date"
                            defaultValue={proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : ''}
                            key={`${proj.id}_sd_${proj.startDate}`}
                            onChange={(e) => handleDateChange(proj, 'startDate', e.target.value)}
                            className="w-full text-center text-[10px] font-medium py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                            title="Pilih Tanggal Awal Kontrak"
                          />
                        </td>
                      )}

                      {/* Akhir Kontrak */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[110px] min-w-[110px] border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-center align-top">
                          <input
                            type="date"
                            defaultValue={proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : ''}
                            key={`${proj.id}_ed_${proj.endDate}`}
                            onChange={(e) => handleDateChange(proj, 'endDate', e.target.value)}
                            className="w-full text-center text-[10px] font-medium py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100 cursor-pointer"
                            title="Pilih Tanggal Akhir Kontrak"
                          />
                        </td>
                      )}

                      {/* STATUS PROYEK DROPDOWN CELL */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 p-1.5 text-center relative align-top">
                          <div className="relative flex items-center justify-center">
                            <select
                              value={currentStatus}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(proj, e.target.value)}
                              className={`w-full appearance-none rounded-lg px-2.5 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-center ${statusObj.bg}`}
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-left">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none opacity-60" />
                          </div>
                        </td>
                      )}

                      {/* Progress */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[80px] min-w-[80px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300 align-top">
                          {progressVal}
                        </td>
                      )}

                      {/* BOQ */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center align-top">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${hasBoq ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                            {hasBoq ? 'Ada File' : '-'}
                          </span>
                        </td>
                      )}

                      {/* Invoice */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center align-top">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${hasInvoice ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                            {hasInvoice ? 'Ada File' : '-'}
                          </span>
                        </td>
                      )}

                      {/* TERMIN DROPDOWN CELL */}
                      <td className="w-[160px] min-w-[160px] border-r border-b border-slate-300 dark:border-slate-700 p-1.5 text-center relative">
                        <div className="relative flex items-center justify-center">
                          <select
                            value={tItem.termin}
                            disabled={isUpdating}
                            onChange={(e) => handleTerminItemChange(proj, tIdx, 'termin', e.target.value)}
                            className={`w-full appearance-none rounded-lg px-2.5 py-1 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-center ${terminObj.bg}`}
                          >
                            {TERMIN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-left">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* NILAI INVOICE */}
                      <td className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right text-slate-800 dark:text-slate-200 font-mono font-semibold">
                        {formatNumberDots(calc.nilaiInvoiceNum)}
                      </td>

                      {/* PPN (11%) */}
                      <td className="w-[120px] min-w-[120px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right text-sky-600 dark:text-sky-400 font-mono font-semibold">
                        {formatNumberDots(calc.ppnNum)}
                      </td>

                      {/* PPH CELL (MARKDOWN DROPDOWN: 2,65% / 1,75% / MANUAL) */}
                      <td className="w-[170px] min-w-[170px] border-r border-b border-slate-300 dark:border-slate-700 p-1.5 text-right relative">
                        <div className="flex flex-col gap-1">
                          <div className="relative flex items-center justify-center">
                            <select
                              value={tItem.pphType || '1.75'}
                              disabled={isUpdating}
                              onChange={(e) => handleTerminItemChange(proj, tIdx, 'pphType', e.target.value as any)}
                              className={`w-full appearance-none rounded-lg px-2 py-0.5 text-[10px] font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all text-center ${pphOpt.bg}`}
                            >
                              {PPH_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium text-left">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-3 w-3 absolute right-1.5 pointer-events-none opacity-60" />
                          </div>

                          {tItem.pphType === 'manual' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="text"
                                placeholder="% Rate"
                                value={tItem.pphCustomRate || ''}
                                onChange={(e) => handleTerminItemChange(proj, tIdx, 'pphCustomRate', e.target.value)}
                                className="w-12 text-[10px] p-0.5 border border-purple-300 rounded text-center font-mono font-bold bg-purple-50 dark:bg-purple-950/50"
                                title="Ketik manual persentase PPh (contoh: 2)"
                              />
                              <span className="text-[10px] font-bold text-slate-400">%</span>
                            </div>
                          )}

                          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 text-right pr-1">
                            {formatNumberDots(calc.pphNum)}
                          </span>
                        </div>
                      </td>

                      {/* GRAND TOTAL */}
                      <td className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right text-emerald-600 dark:text-emerald-400 font-mono font-extrabold">
                        {formatNumberDots(calc.grandTotalNum)}
                      </td>

                      {/* Status Penagihan */}
                      <td className="w-[130px] min-w-[130px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center text-slate-700 dark:text-slate-300 truncate" title={tItem.statusPenagihan || '-'}>
                        {tItem.statusPenagihan || '-'}
                      </td>

                      {/* Remarks Penagihan */}
                      <td className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center text-slate-700 dark:text-slate-300 truncate" title={tItem.penagihanRemarks || '-'}>
                        {tItem.penagihanRemarks || '-'}
                      </td>

                      {/* Issue */}
                      <td className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center text-slate-700 dark:text-slate-300 truncate" title={tItem.issue || '-'}>
                        {tItem.issue || '-'}
                      </td>

                      {/* Remark */}
                      {isFirstRow && (
                        <td rowSpan={rowSpan} className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 text-center align-top">
                          <input
                            type="text"
                            defaultValue={tItem.remark || remarksObj.financeRemark || ''}
                            key={`${proj.id}_rem_${tItem.remark || remarksObj.financeRemark}`}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== (tItem.remark || remarksObj.financeRemark || '')) {
                                handleTerminItemChange(proj, tIdx, 'remark', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-full text-left text-[10px] py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                            placeholder="Remark..."
                            title="Ketik Catatan / Remark"
                          />
                        </td>
                      )}

                      {/* AKSI CELL (TOMBOL LIST BARU & ACTIONS) */}
                      <td className="w-[110px] min-w-[110px] border-r border-b border-slate-300 dark:border-slate-700 py-1 px-1.5 text-center bg-white dark:bg-slate-800 relative">
                        <div className="flex flex-col items-center gap-1">
                          {/* Tombol List Baru (Tambah Termin) */}
                          <button
                            onClick={() => handleAddTerminRow(proj)}
                            disabled={isUpdating}
                            className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-md border border-amber-300 dark:border-amber-800 transition-all"
                            title="Tambah list termin/invoice baru untuk proyek ini"
                          >
                            <ListPlus className="h-3 w-3 mr-1" />
                            + List Baru
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === `${proj.id}_${tIdx}` ? null : `${proj.id}_${tIdx}`)}
                              className="px-1.5 py-0.5 text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-700 rounded transition-colors"
                            >
                              Edit •••
                            </button>

                            {terminList.length > 1 && (
                              <button
                                onClick={() => handleDeleteTerminRow(proj, tIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus baris termin ini"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {actionMenuOpen === `${proj.id}_${tIdx}` && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)} />
                            <div className={`absolute right-2 ${projIdx >= filteredProjects.length - 2 && filteredProjects.length > 1 ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 overflow-hidden text-left py-1`}>
                              <button
                                onClick={() => {
                                  setManualEditProject(proj);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                Edit Data Finance &amp; List Termin
                              </button>
                              <button
                                onClick={() => {
                                  onEditProject(proj);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700"
                              >
                                Edit Identitas Proyek
                              </button>
                              <button
                                onClick={() => {
                                  onOpenFolder(proj, 'klien');
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700"
                              >
                                Buka Folder Dokumen
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    onDeleteProject(proj.id, proj.name);
                                    setActionMenuOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700 font-bold"
                                >
                                  Hapus Proyek
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Manual Edit Modal ──────────────────────────────────────────────────── */}
      {manualEditProject && (
        <ManualEditModal
          project={manualEditProject}
          onClose={() => setManualEditProject(null)}
          onSave={async (updatedData) => {
            try {
              const { startDate, endDate, ...remarksOnly } = updatedData;
              await api.put(`/projects/${manualEditProject.id}`, {
                startDate: startDate ? startDate : null,
                endDate: endDate ? endDate : null,
                remarks: JSON.stringify(remarksOnly)
              });
              await onRefresh();
              setManualEditProject(null);
            } catch (err) {
              console.error('Gagal menyimpan data finance manual', err);
              alert('Gagal menyimpan data finance manual.');
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Component for Finance Data & Multi-Termin List Edit ─────────────────
function ManualEditModal({ project, onClose, onSave }: { project: Project, onClose: () => void, onSave: (data: any) => Promise<void> }) {
  const existingRemarks = parseRemarks(project.remarks);
  const [formData, setFormData] = useState<Record<string, any>>({
    ...existingRemarks,
    nilaiKontrak: existingRemarks.nilaiKontrak || (project as any).nilaiPekerjaan || '',
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    financeRemark: existingRemarks.financeRemark || existingRemarks.remark || '',
  });
  const [terminList, setTerminList] = useState<FinanceTerminItem[]>(getTerminListFromProject(project));
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleTerminItemFieldChange = (index: number, field: keyof FinanceTerminItem, value: any) => {
    setTerminList(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const handleAddTermin = () => {
    const nextTerminLabel = `T${terminList.length + 1}`;
    const newItem: FinanceTerminItem = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      termin: TERMIN_OPTIONS.some(t => t.value === nextTerminLabel) ? nextTerminLabel : 'T1',
      nilaiInvoice: 0,
      pphType: '1.75',
      statusPenagihan: 'Belum Lunas',
      penagihanRemarks: '',
      issue: '',
      remark: ''
    };
    setTerminList(prev => [...prev, newItem]);
  };

  const handleRemoveTermin = (index: number) => {
    if (terminList.length <= 1) {
      alert('Satu proyek minimal harus memiliki 1 data termin.');
      return;
    }
    setTerminList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    const firstItem = terminList[0] || {};
    const firstCalc = firstItem ? calculateTerminValues(firstItem) : { nilaiInvoiceNum: 0, ppnNum: 0, pphNum: 0, grandTotalNum: 0 };

    const payload = {
      ...formData,
      financeTerminList: terminList,
      // Synced legacy fallback fields
      financeTermin: firstItem.termin || 'Belum saatnya penagihan',
      financeNilai: firstItem.nilaiInvoice || 0,
      financePpn: firstCalc.ppnNum,
      financePphType: firstItem.pphType,
      financePphRate: firstItem.pphCustomRate,
      financePph: firstCalc.pphNum,
      financeGrandTotal: firstCalc.grandTotalNum,
      financeStatusPenagihan: firstItem.statusPenagihan || '',
      financePenagihanRemarks: firstItem.penagihanRemarks || '',
      financeIssue: firstItem.issue || '',
      financeRemark: formData.financeRemark || firstItem.remark || '',
    };

    await onSave(payload);
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              ✏️ Edit Data Finance &amp; List Termin/Invoice
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
          {/* Section 1: Identitas Dasar & Kontrak Proyek */}
          <div>
            <h4 className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-3">Identitas &amp; Nilai/Masa Kontrak Proyek</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Client</label>
                <input
                  type="text"
                  value={formData.financeClient || project.client || ''}
                  onChange={(e) => handleChange('financeClient', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  placeholder="e.g. SSI"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Proyek</label>
                <select
                  value={formData.financeStatus || 'Berjalan'}
                  onChange={(e) => handleChange('financeStatus', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Progress (%)</label>
                <input
                  type="text"
                  value={formData.progressManual || ''}
                  onChange={(e) => handleChange('progressManual', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  placeholder="e.g. 100%"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Nilai Kontrak (Rp)</label>
                <input
                  type="text"
                  value={formData.nilaiKontrak || ''}
                  onChange={(e) => handleChange('nilaiKontrak', e.target.value)}
                  className="w-full text-xs p-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-emerald-50/40 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 150000000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Awal Kontrak (Tanggal)</label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Akhir Kontrak (Tanggal)</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Remark Proyek</label>
                <input
                  type="text"
                  value={formData.financeRemark || ''}
                  onChange={(e) => handleChange('financeRemark', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-medium"
                  placeholder="Catatan Remark..."
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Daftar List Termin & Invoice Multi-Row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Daftar List Termin &amp; Invoice Penagihan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tambahkan termin/invoice baru jika dalam 1 proyek terdapat lebih dari 1 kali penagihan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddTermin}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-all"
              >
                <ListPlus className="h-4 w-4 mr-1.5" />
                + List Baru (Tambah Termin)
              </button>
            </div>

            <div className="space-y-4">
              {terminList.map((tItem, idx) => {
                const calc = calculateTerminValues(tItem);
                return (
                  <div key={tItem.id || idx} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 relative space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Termin #{idx + 1}
                        </span>
                        <select
                          value={tItem.termin}
                          onChange={(e) => handleTerminItemFieldChange(idx, 'termin', e.target.value)}
                          className="text-xs font-bold px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        >
                          {TERMIN_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {terminList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTermin(idx)}
                          className="inline-flex items-center px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Hapus List Ini
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">NILAI INVOICE (Rp)</label>
                        <input
                          type="text"
                          value={formatNumberDots(tItem.nilaiInvoice) === '-' ? '' : formatNumberDots(tItem.nilaiInvoice)}
                          onChange={(e) => handleTerminItemFieldChange(idx, 'nilaiInvoice', parseNum(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono font-semibold"
                          placeholder="e.g. 100.000.000"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">PPN (11%)</label>
                        <input
                          type="text"
                          value={formatNumberDots(calc.ppnNum)}
                          disabled
                          className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-mono font-bold cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">PPH (Pilihan &amp; Mode)</label>
                        <div className="space-y-1">
                          <select
                            value={tItem.pphType || '1.75'}
                            onChange={(e) => handleTerminItemFieldChange(idx, 'pphType', e.target.value as any)}
                            className="w-full text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                          >
                            {PPH_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>

                          {tItem.pphType === 'manual' && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Persen %"
                                value={tItem.pphCustomRate || ''}
                                onChange={(e) => handleTerminItemFieldChange(idx, 'pphCustomRate', e.target.value)}
                                className="w-24 text-xs p-1.5 border border-purple-300 rounded-lg bg-purple-50 dark:bg-purple-950/50 font-mono font-bold"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">GRAND TOTAL</label>
                        <input
                          type="text"
                          value={formatNumberDots(calc.grandTotalNum)}
                          disabled
                          className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono font-extrabold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Status Penagihan</label>
                        <input
                          type="text"
                          value={tItem.statusPenagihan || ''}
                          onChange={(e) => handleTerminItemFieldChange(idx, 'statusPenagihan', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          placeholder="e.g. Lunas / Retensi"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks Penagihan</label>
                        <input
                          type="text"
                          value={tItem.penagihanRemarks || ''}
                          onChange={(e) => handleTerminItemFieldChange(idx, 'penagihanRemarks', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          placeholder="Catatan..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Issue</label>
                        <input
                          type="text"
                          value={tItem.issue || ''}
                          onChange={(e) => handleTerminItemFieldChange(idx, 'issue', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          placeholder="Kendala..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan Multi-Termin
          </button>
        </div>

      </div>
    </>
  );
}
