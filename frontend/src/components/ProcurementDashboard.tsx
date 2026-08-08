'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project, Document, User } from '@/types';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  RefreshCw,
  X,
  Save,
  Edit2,
  Table as TableIcon,
  FileSpreadsheet
} from 'lucide-react';
import TrackingProyekTable from '@/components/TrackingProyekTable';
import { useAuth } from '@/lib/AuthContext';

interface ProcurementDashboardProps {
  projects: Project[];
  documents?: Document[];
  onRefresh: () => Promise<any>;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string, name: string) => void;
  onOpenFolder: (project: Project, folder: 'klien' | 'subkon' | 'internal') => void;
}

const parseRemarks = (remarks: string | undefined | null) => {
  if (!remarks) return {};
  try {
    const parsed = JSON.parse(remarks);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return { statusPekerjaan: remarks };
  }
};

const extractCompanyCode = (code: string | undefined) => {
  if (!code) return 'MJK';
  const parts = code.split(' - ');
  if (parts.length >= 2) return parts[1];
  if (code.includes('DJI')) return 'DJI';
  if (code.includes('IRI')) return 'IRI';
  return 'MJK';
};

const extractClientCode = (code: string | undefined, remarksClient?: string) => {
  if (remarksClient && remarksClient.trim() !== '') return remarksClient;
  if (!code) return '-';
  const parts = code.split(' - ');
  if (parts.length >= 3) return parts[2];
  return '-';
};

const parseIndonesianMoney = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = val.toString().trim().replace(/Rp/gi, '').trim();
  
  if ((str.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(str)) {
    str = str.replace(/\./g, '');
  }
  str = str.replace(/,/g, '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (val: number | string | undefined | null) => {
  if (val === undefined || val === null || val === '') return '-';
  const num = parseIndonesianMoney(val);
  return num < 0 ? `-Rp ${Math.abs(num).toLocaleString('id-ID')}` : `Rp ${num.toLocaleString('id-ID')}`;
};


const formatPercent = (percent: number) => {
  if (isNaN(percent) || !isFinite(percent)) return '0%';
  const formatted = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2);
  return `${formatted}%`;
};

export default function ProcurementDashboard({
  projects,
  onRefresh,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onOpenFolder,
}: ProcurementDashboardProps) {
  const { user, isSuperAdmin, isAdminMonitoring } = useAuth();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [manualEditProject, setManualEditProject] = useState<Project | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [staffs, setStaffs] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'ppn' | 'non_ppn' | 'tracking' | 'termin'>('main');
  const [companyForms, setCompanyForms] = useState<any[]>([]);

  const loadExtraData = () => {
    api.get('/company-documents/forms').then(res => setCompanyForms(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (user) {
      const endpoint = (user.role === 'SUPERADMIN' || user.role === 'ADMIN_MONITORING') ? '/auth/users' : '/staff';
      api.get(endpoint).then(res => {
        let list = res.data.data || [];
        if (user && !list.some((s: any) => s.id === user.id)) {
          list = [user, ...list];
        }
        setStaffs(list);
      }).catch(() => {
        api.get('/auth/users').then(res => setStaffs(res.data.data || [])).catch(() => {});
      });

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

  const getProjectMaterialPoTotal = (projId: string, projCode: string) => {
    if (!projId && !projCode) return 0;
    return companyForms
      .filter(f => {
        if (f.documentData?.type === 'PROYEK_ADMIN') return false;
        if (f.company?.startsWith('GA') || f.documentNo?.startsWith('GA')) return false;

        const data = f.documentData || {};
        const fProjId = data.selectedProjectId || f.projectId;
        if (fProjId && projId && fProjId === projId) return true;

        const fCode = (data.kodeProyek || data.kategori || f.poNo || '').trim().toLowerCase();
        const pCode = (projCode || '').trim().toLowerCase();
        
        if (pCode && fCode && (fCode === pCode || fCode.startsWith(pCode + ' ') || fCode.startsWith(pCode + '-'))) return true;

        return false;
      })
      .reduce((sum, f) => {
        const total = f.documentData?.grandTotal || f.documentData?.subtotal || f.totalAmount || 0;
        return sum + Number(total);
      }, 0);
  };

  const getProjectNilaiJasaTotal = (projId: string, projCode: string, remarksObj: any) => {
    if (!projId && !projCode) return 0;
    const formsTotal = companyForms
      .filter(f => {
        if (f.documentData?.type !== 'PROYEK_ADMIN') return false;
        const data = f.documentData || {};
        const fProjId = data.selectedProjectId || f.projectId;
        if (fProjId && projId && fProjId === projId) return true;

        const fCode = (data.kodeProyek || data.kategori || f.poNo || '').trim().toLowerCase();
        const pCode = (projCode || '').trim().toLowerCase();
        
        if (pCode && fCode && (fCode === pCode || fCode.startsWith(pCode + ' ') || fCode.startsWith(pCode + '-'))) return true;

        return false;
      })
      .reduce((sum, f) => {
        const total = f.documentData?.grandTotal || f.documentData?.subtotal || f.totalAmount || 0;
        return sum + Number(total);
      }, 0);

    // Prioritas: form PROYEK_ADMIN yang sudah disubmit
    if (formsTotal > 0) return formsTotal;

    // Fallback: nilai jasa yang diinput manual di ProyekAdmin (subconNilaiJasa)
    const manualNilaiJasa = parseFloat((remarksObj.subconNilaiJasa || '').toString().replace(/[^0-9.-]/g, '')) || 0;
    return manualNilaiJasa;
  };






  const handlePicChange = async (project: Project, field: 'progressPicId', newValue: string) => {
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
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
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

  // ── Export Excel dengan rumus otomatis ──────────────────────────────────────
  const handleExportExcel = () => {
    const headers = [
      'No', 'Kode Proyek', 'PT', 'Nama Client', 'Nama Pekerjaan', 'No SPK',
      'Modal BOQ (Rp)', 'Total PO BOQ Material (Rp)', 'Nilai Jasa Proyek Admin (Rp)',
      'Total Pengeluaran (Rp)', '% Pengeluaran', 'Sisa Modal (Rp)', '% Sisa Modal'
    ];

    // Baris data mulai dari baris ke-2 (baris 1 = header)
    const dataRows = filteredProjects.map((proj, idx) => {
      const remarksObj = parseRemarks(proj.remarks);
      const poMaterial = getProjectMaterialPoTotal(proj.id, proj.code);
      const nilaiJasa = getProjectNilaiJasaTotal(proj.id, proj.code, remarksObj);
      const rawModal = parseIndonesianMoney(
        remarksObj.procurementModalBoq !== undefined ? remarksObj.procurementModalBoq : remarksObj.nilaiKontrak
      );
      const modalBoq = rawModal > 0 ? rawModal : (poMaterial > 0 ? poMaterial : 0);
      const ptVal = remarksObj.procurementPt || extractCompanyCode(proj.code);
      const clientVal = remarksObj.procurementClient || extractClientCode(proj.code, remarksObj.reqBy);
      const totalPengeluaran = poMaterial + nilaiJasa;
      const baseModal = nilaiJasa > 0 ? nilaiJasa : modalBoq;
      const sisaModal = baseModal > 0 ? (baseModal - totalPengeluaran) : (modalBoq - totalPengeluaran);
      const pctPengeluaran = baseModal > 0 ? (totalPengeluaran / baseModal) * 100 : 0;
      const pctSisa = modalBoq > 0 ? (sisaModal / modalBoq) * 100 : 0;

      return [
        idx + 1,
        proj.code || '',
        ptVal || '',
        clientVal || '',
        proj.name || '',
        remarksObj.procurementNoSpk || '',
        modalBoq,          // Col G = Modal BOQ
        poMaterial,        // Col H = Total PO BOQ Material
        nilaiJasa,         // Col I = Nilai Jasa
        totalPengeluaran,  // Col J = Total Pengeluaran
        pctPengeluaran,    // Col K = % Pengeluaran
        sisaModal,         // Col L = Sisa Modal
        pctSisa,           // Col M = % Sisa Modal
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Inject formula Excel untuk setiap baris data
    filteredProjects.forEach((_, idx) => {
      const rowNum = idx + 2;
      // Total Pengeluaran = H + I
      ws[`J${rowNum}`] = { t: 'n', f: `H${rowNum}+I${rowNum}` };
      // % Pengeluaran = Total Pengeluaran / Nilai Jasa (atau Modal BOQ)
      ws[`K${rowNum}`] = { t: 'n', f: `IF(I${rowNum}>0, J${rowNum}/I${rowNum}, IF(G${rowNum}>0, J${rowNum}/G${rowNum}, 0))`, z: '0.00%' };
      // Sisa Modal = Nilai Jasa - Total Pengeluaran (atau Modal BOQ - Total Pengeluaran)
      ws[`L${rowNum}`] = { t: 'n', f: `IF(I${rowNum}>0, I${rowNum}-J${rowNum}, G${rowNum}-J${rowNum})` };
      // % Sisa Modal = Sisa Modal / Modal BOQ × 100%
      ws[`M${rowNum}`] = { t: 'n', f: `IF(G${rowNum}>0, L${rowNum}/G${rowNum}, 0)`, z: '0.00%' };
    });

    // Format angka sebagai currency (tidak ada simbol Rp di Excel agar formula bisa dikalkulasi)
    const currencyCols = ['G', 'H', 'I', 'J', 'K'];
    filteredProjects.forEach((_, idx) => {
      const rowNum = idx + 2;
      currencyCols.forEach(col => {
        if (ws[`${col}${rowNum}`]) {
          ws[`${col}${rowNum}`].z = '#,##0';
        }
      });
    });

    // Header styling + column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 18 }, // Kode Proyek
      { wch: 8 },  // PT
      { wch: 16 }, // Nama Client
      { wch: 40 }, // Nama Pekerjaan
      { wch: 24 }, // No SPK
      { wch: 20 }, // Modal BOQ
      { wch: 22 }, // Total PO
      { wch: 22 }, // Nilai Jasa
      { wch: 22 }, // Total Pengeluaran
      { wch: 20 }, // Sisa Modal
      { wch: 14 }, // %
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Procurement Monitoring');

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Procurement_Monitoring_${today}.xlsx`);
  };

  // Instant update for inline cell edit
  const handleInlineSave = async (project: Project, fieldKey: string, newValue: string) => {
    try {
      setUpdatingId(project.id);
      if (fieldKey === 'code') {
        await api.put(`/projects/${project.id}`, { code: newValue });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('app_data_changed'));
          if ('BroadcastChannel' in window) {
            try {
              const ch = new BroadcastChannel('app_data_sync');
              ch.postMessage('refresh');
              ch.close();
            } catch (e) {}
          }
        }
      } else {
        const currentRemarks = parseRemarks(project.remarks);
        const updatedRemarks = {
          ...currentRemarks,
          [fieldKey]: newValue
        };

        await api.put(`/projects/${project.id}`, {
          remarks: JSON.stringify(updatedRemarks)
        });
      }
      await onRefresh();
    } catch (err) {
      console.error('Gagal memperbarui data procurement:', err);
      alert('Gagal memperbarui data.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 relative">
      {/* ── Header Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>📦 Dashboard Monitoring Procurement (Modal & Pengeluaran)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Kolom <span className="font-bold text-emerald-600 dark:text-emerald-400">Modal BoQ</span> & <span className="font-bold text-amber-600 dark:text-amber-400">Pengeluaran Proyek</span> diisi manual. Kolom <span className="font-bold text-sky-600 dark:text-sky-400">Sisa Modal</span> dan <span className="font-bold text-sky-600 dark:text-sky-400">%</span> terhitung otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Selection */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'main'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-950 dark:text-emerald-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Modal & Pengeluaran</span>
            </button>

            <button
              onClick={() => setActiveTab('ppn')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ppn'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tabel PO PPN</span>
            </button>

            <button
              onClick={() => setActiveTab('non_ppn')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'non_ppn'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tabel PO Non-PPN</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-[#fce4d6] text-[#843c0c] dark:bg-[#4a2810] dark:text-amber-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tracking by Proyek</span>
            </button>

            <button
              onClick={() => setActiveTab('termin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'termin'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Tabel Termin (Otomatis)</span>
            </button>
          </div>

          {activeTab === 'main' && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari proyek / client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-52 shadow-xs"
              />
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

          {activeTab === 'main' && (isSuperAdmin || isAdminMonitoring) && (
            <button
              onClick={onAddProject}
              className="inline-flex items-center px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Proyek
            </button>
          )}

          {activeTab === 'main' && (
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#1b7a4a] hover:bg-[#155c38] text-white rounded-xl shadow-xs transition-all"
              title="Export ke Excel dengan rumus otomatis"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Export Excel
            </button>
          )}
        </div>
      </div>

      {/* ── Tab PO PPN View ───────────────────────────────────────────────────── */}
      {activeTab === 'ppn' && (
        <AutoCompanyDocTable
          docs={companyForms.filter(f => {
            if (f.documentData?.type === 'PROYEK_ADMIN') return false;
            if (f.company?.startsWith('GA') || f.documentNo?.startsWith('GA')) return false;
            return Boolean(f.documentData?.isPpnActive);
          })}
          title="Tabel PO PPN"
          isPpn={true}
        />
      )}

      {/* ── Tab PO Non-PPN View ────────────────────────────────────────────────── */}
      {activeTab === 'non_ppn' && (
        <AutoCompanyDocTable
          docs={companyForms.filter(f => {
            if (f.documentData?.type === 'PROYEK_ADMIN') return false;
            if (f.company?.startsWith('GA') || f.documentNo?.startsWith('GA')) return false;
            return !Boolean(f.documentData?.isPpnActive);
          })}
          title="Tabel PO Non-PPN"
          isPpn={false}
        />
      )}

      {/* ── Tab Tracking View: Tracking by Proyek ────────────────────────────── */}
      {activeTab === 'tracking' && (
        <TrackingProyekTable projects={projects} onRefresh={onRefresh} />
      )}

      {/* ── Tab Termin View: Tabel Termin (Otomatis) ─────────────────────────── */}
      {activeTab === 'termin' && (
        <AutoTerminTable docs={companyForms} />
      )}

      {/* ── Tab 1 View: Excel-Format Table (Modal & Pengeluaran) ───────────────── */}
      {activeTab === 'main' && (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl pb-16">
        <div className="overflow-x-auto excel-container smooth-scroll scroll-smooth pb-4">
          <table className="w-full text-[11px] border-separate border-spacing-0" style={{ minWidth: '1600px' }}>
            {/* Header */}
            <thead>
              <tr className="bg-[#1b4332] text-white dark:bg-slate-900">
                <th className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-30 bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  No
                </th>
                <th className="w-[130px] min-w-[130px] max-w-[130px] sticky left-[48px] z-30 bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  Proyek Code
                </th>
                <th className="w-[70px] min-w-[70px] max-w-[70px] sticky left-[178px] z-30 bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  PT
                </th>
                <th className="w-[110px] min-w-[110px] max-w-[110px] sticky left-[248px] z-30 bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  Nama Client
                </th>
                <th className="w-[240px] min-w-[240px] max-w-[240px] sticky left-[358px] z-30 bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold shadow-[4px_0_8px_-2px_rgba(0,0,0,0.25)]">
                  Nama Pekerjaan
                </th>
                <th className="w-[120px] min-w-[120px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  PIC
                </th>
                <th className="w-[140px] min-w-[140px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  No SPK
                </th>
                <th className="w-[150px] min-w-[150px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  Modal BOQ
                </th>
                <th className="w-[150px] min-w-[150px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold text-sky-200">
                  Total PO (BOQ Material)
                </th>
                <th className="w-[160px] min-w-[160px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold text-amber-200">
                  Nilai Jasa (Proyek Admin)
                </th>
                <th className="w-[160px] min-w-[160px] bg-[#0d2818] dark:bg-slate-950 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-extrabold text-emerald-300">
                  Total Pengeluaran
                </th>
                <th className="w-[100px] min-w-[100px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold text-amber-200">
                  % Pengeluaran
                </th>
                <th className="w-[150px] min-w-[150px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  Sisa Modal
                </th>
                <th className="w-[90px] min-w-[90px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  % Sisa Modal
                </th>
                <th className="w-[80px] min-w-[80px] bg-[#1b4332] dark:bg-slate-900 border-r border-b border-emerald-950 py-2.5 px-2 text-center font-bold">
                  Aksi
                </th>

              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                    Tidak ada data proyek.
                  </td>
                </tr>
              )}

              {filteredProjects.map((proj, idx) => {
                const remarksObj = parseRemarks(proj.remarks);

                // Values
                const ptVal = remarksObj.procurementPt || extractCompanyCode(proj.code);
                const clientVal = remarksObj.procurementClient || extractClientCode(proj.code, remarksObj.reqBy);
                const poMaterialTotal = getProjectMaterialPoTotal(proj.id, proj.code);
                const nilaiJasaTotal = getProjectNilaiJasaTotal(proj.id, proj.code, remarksObj);
                
                // Total Pengeluaran = Total PO (BOQ Material) + Nilai Jasa (Proyek Admin)
                const totalPengeluaran = poMaterialTotal + nilaiJasaTotal;

                const rawModalBoqParsed = parseIndonesianMoney(remarksObj.procurementModalBoq !== undefined ? remarksObj.procurementModalBoq : remarksObj.nilaiKontrak);
                const modalBoqNum = rawModalBoqParsed > 0 ? rawModalBoqParsed : (poMaterialTotal > 0 ? poMaterialTotal : 0);

                // 1. Sisa Modal = Nilai Jasa - Total Pengeluaran (jika Nilai Jasa > 0), else Modal BOQ - Total Pengeluaran
                const baseModal = nilaiJasaTotal > 0 ? nilaiJasaTotal : modalBoqNum;
                const sisaModal = baseModal > 0 ? (baseModal - totalPengeluaran) : (modalBoqNum - totalPengeluaran);

                // 2. % Pengeluaran = Total Pengeluaran / Nilai Jasa × 100% (atau / Modal BOQ)
                const denomPengeluaran = nilaiJasaTotal > 0 ? nilaiJasaTotal : modalBoqNum;
                let percentPengeluaran = denomPengeluaran > 0 ? (totalPengeluaran / denomPengeluaran) * 100 : 0;
                if (isNaN(percentPengeluaran) || !isFinite(percentPengeluaran)) percentPengeluaran = 0;

                // 3. % Sisa Modal = Sisa Modal / Modal BOQ × 100%
                let percentSisa = modalBoqNum > 0 ? (sisaModal / modalBoqNum) * 100 : 0;
                if (isNaN(percentSisa) || !isFinite(percentSisa)) percentSisa = 0;








                return (
                  <tr key={proj.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 group relative ${actionMenuOpen === proj.id ? 'z-40' : ''}`}>
                    {/* NO */}
                    <td className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </td>

                    {/* Proyek Code */}
                    <td className="w-[130px] min-w-[130px] max-w-[130px] sticky left-[48px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-1.5 px-1.5 font-mono text-center text-slate-600 dark:text-slate-400">
                      {(isSuperAdmin || isAdminMonitoring) ? (
                        <input
                          type="text"
                          defaultValue={proj.code || ''}
                          key={`${proj.id}_${proj.code}`}
                          onBlur={(e) => {
                            if (e.target.value !== (proj.code || '')) {
                              handleInlineSave(proj, 'code', e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full text-center font-mono font-bold text-[11px] py-1 px-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                          title="Klik untuk ubah Kode Proyek (Super Admin)"
                        />
                      ) : (
                        <span className="truncate font-bold" title={proj.code}>{proj.code}</span>
                      )}
                    </td>

                    {/* PT */}
                    <td className="w-[70px] min-w-[70px] max-w-[70px] sticky left-[178px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200 uppercase">
                      {ptVal}
                    </td>

                    {/* Nama Client */}
                    <td className="w-[110px] min-w-[110px] max-w-[110px] sticky left-[248px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-300 truncate" title={clientVal}>
                      {clientVal}
                    </td>

                    {/* Nama Pekerjaan */}
                    <td className="w-[240px] min-w-[240px] max-w-[240px] sticky left-[358px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100 truncate shadow-[4px_0_8px_-2px_rgba(0,0,0,0.15)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]" title={proj.name}>
                      {proj.name}
                    </td>

                    {/* PIC Dropdown */}
                    <td className="w-[120px] min-w-[120px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-center">
                      <select
                        disabled={updatingId === proj.id}
                        value={proj.progressPicId || ''}
                        onChange={(e) => handlePicChange(proj, 'progressPicId', e.target.value)}
                        className="w-full text-[10px] font-medium py-1 px-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">-</option>
                        {(() => {
                          const roleStaffs = staffs.filter(s => {
                            if (s.id === proj.progressPicId) return true;
                            if (s.role === 'PROCUREMENT') return true;
                            if ((isSuperAdmin || isAdminMonitoring) && s.role === 'SUPERADMIN') return true;
                            return false;
                          });
                          const displayStaffs = roleStaffs.length > 0 ? roleStaffs : staffs.filter(s => s.role !== 'SUPERADMIN' || isSuperAdmin || isAdminMonitoring);
                          return displayStaffs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}{(isSuperAdmin || isAdminMonitoring) ? ` (${s.role}${s.managerId ? ' Staff' : ''})` : (s.managerId ? ' (Staff)' : ' (Procurement)')}
                            </option>
                          ));
                        })()}

                      </select>

                    </td>

                    {/* No SPK (manual) */}
                    <td className="w-[140px] min-w-[140px] border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 font-mono text-center text-slate-700 dark:text-slate-300 truncate" title={remarksObj.procurementNoSpk || '-'}>
                      {remarksObj.procurementNoSpk || '-'}
                    </td>

                    {/* ── MODAL BOQ ──────────────────────────── */}
                    <td className="w-[150px] min-w-[150px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(modalBoqNum)}
                    </td>

                    {/* ── TOTAL PO (BOQ MATERIAL) ────────────── */}
                    <td className="w-[150px] min-w-[150px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right font-semibold text-sky-700 dark:text-sky-300">
                      {formatCurrency(poMaterialTotal)}
                    </td>

                    {/* ── NILAI JASA (PROYEK ADMIN) ───────────── */}
                    <td className="w-[160px] min-w-[160px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right font-semibold text-amber-700 dark:text-amber-300">
                      {formatCurrency(nilaiJasaTotal)}
                    </td>

                    {/* ── TOTAL PENGELUARAN (PO MATERIAL + JASA) ── */}
                    <td className="w-[160px] min-w-[160px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {formatCurrency(totalPengeluaran)}
                    </td>

                    {/* ── % PENGELUARAN ── */}
                    <td className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-2 px-2 text-right font-bold text-amber-700 dark:text-amber-300">
                      {formatPercent(percentPengeluaran)}
                    </td>

                    {/* ── SISA MODAL (RUMUS FORMULA) ───────────────────────── */}
                    <td className={`w-[150px] min-w-[150px] border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-right font-extrabold ${sisaModal < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {formatCurrency(sisaModal)}
                    </td>

                    {/* ── % SISA MODAL = Sisa Modal / Modal BOQ × 100% ── */}
                    <td className={`w-[90px] min-w-[90px] border-r border-b border-slate-300 dark:border-slate-700 py-2.5 px-2 text-right font-bold ${
                      percentSisa < 0 ? 'text-rose-600 dark:text-rose-400' :
                      percentSisa < 15 ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-800 dark:text-slate-200'
                    }`}>
                      {formatPercent(percentSisa)}
                    </td>

                    {/* Aksi */}
                    <td className="w-[80px] min-w-[80px] border-r border-b border-slate-300 dark:border-slate-700 py-1 px-2 text-center bg-white dark:bg-slate-800">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: rect.bottom, left: rect.right });
                          setActionMenuOpen(actionMenuOpen === proj.id ? null : proj.id);
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </button>

                      {actionMenuOpen === proj.id && (
                        <>
                          <div className="fixed inset-0 z-[90]" onClick={() => setActionMenuOpen(null)} />
                          <div 
                            className="fixed z-[100] w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl overflow-hidden text-left py-1"
                            style={{
                              top: `${Math.min(window.innerHeight - 180, (menuPos?.top || 0) + 4)}px`,
                              left: `${Math.max(10, (menuPos?.left || 0) - 180)}px`,
                            }}
                          >
                            <button
                              onClick={() => {
                                setManualEditProject(proj);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              Edit Modal & Pengeluaran
                            </button>
                            <button
                              onClick={() => {
                                onEditProject(proj);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-100 dark:border-slate-700 transition-colors"
                            >
                              Edit Identitas Proyek
                            </button>
                            <button
                              onClick={() => {
                                onOpenFolder(proj, 'internal');
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              Unggah Dokumen BOQ
                            </button>
                            <button
                              onClick={() => {
                                onDeleteProject(proj.id, proj.name);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-t border-slate-100 dark:border-slate-700 transition-colors"
                            >
                              Hapus Proyek
                            </button>
                          </div>
                        </>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── Procurement Edit Modal ─────────────────────────────────────────────── */}
      {manualEditProject && (() => {
          const editRemarks = parseRemarks(manualEditProject.remarks);
          const editPoTotal = getProjectMaterialPoTotal(manualEditProject.id, manualEditProject.code);
          const editJasaTotal = getProjectNilaiJasaTotal(manualEditProject.id, manualEditProject.code, editRemarks);
          return (
            <ProcurementManualEditModal
              project={manualEditProject}
              poMaterialTotal={editPoTotal}
              nilaiJasaTotal={editJasaTotal}
              onClose={() => setManualEditProject(null)}
              onSave={async (data) => {
                try {
                  const current = parseRemarks(manualEditProject.remarks);
                  const { name, ...remarksData } = data;
                  const merged = { ...current, ...remarksData };
                  await api.put(`/projects/${manualEditProject.id}`, {
                    ...(name ? { name } : {}),
                    remarks: JSON.stringify(merged)
                  });
                  await onRefresh();
                  setManualEditProject(null);
                } catch (err) {
                  console.error('Gagal menyimpan data procurement:', err);
                  alert('Gagal menyimpan data.');
                }
              }}
            />
          );
        })()}

    </div>
  );
}

// ── Modal Edit Data Procurement ─────────────────────────────────────────────

function ProcurementManualEditModal({
  project,
  onClose,
  onSave,
  poMaterialTotal,
  nilaiJasaTotal,
}: {
  project: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  poMaterialTotal: number;
  nilaiJasaTotal: number;
}) {
  const existing = parseRemarks(project.remarks);

  const [formData, setFormData] = useState({
    name: project.name || '',
    procurementPt: existing.procurementPt || extractCompanyCode(project.code),
    procurementClient: existing.procurementClient || extractClientCode(project.code, existing.reqBy),
    procurementNoSpk: existing.procurementNoSpk || '',
    procurementModalBoq: existing.procurementModalBoq !== undefined ? existing.procurementModalBoq.toString() : (existing.nilaiKontrak || ''),
  });

  const [saving, setSaving] = useState(false);

  const modalNum = parseIndonesianMoney(formData.procurementModalBoq);

  // Total Pengeluaran = Total PO (BOQ Material) + Nilai Jasa — 100% OTOMATIS
  const totalPengeluaranCalc = poMaterialTotal + nilaiJasaTotal;

  // Sisa Modal = Modal BOQ - Total Pengeluaran
  const sisaModalCalc = modalNum > 0 ? (modalNum - totalPengeluaranCalc) : 0;

  // % Sisa Modal = Sisa Modal / Modal BOQ × 100%
  let percentCalc = 0;
  if (modalNum > 0) {
    percentCalc = (sisaModalCalc / modalNum) * 100;
    if (isNaN(percentCalc) || !isFinite(percentCalc)) percentCalc = 0;
  }

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanData = {
      ...formData,
      procurementModalBoq: modalNum > 0 ? modalNum.toString() : formData.procurementModalBoq,
    };
    await onSave(cleanData);
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              ✏️ Edit Data Proyek & Modal BoQ
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {project.name} ({project.code})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Nama Pekerjaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Pekerjaan / Nama Proyek
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              placeholder="e.g. PEKERJAAN PARTISI..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">PT</label>
              <input
                type="text"
                value={formData.procurementPt}
                onChange={(e) => handleChange('procurementPt', e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. DJI / MJK / IRI"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Client</label>
              <input
                type="text"
                value={formData.procurementClient}
                onChange={(e) => handleChange('procurementClient', e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. SSI"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No SPK</label>
              <input
                type="text"
                value={formData.procurementNoSpk}
                onChange={(e) => handleChange('procurementNoSpk', e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="e.g. SPK/MJK/2026/001"
              />
            </div>
          </div>

          {/* Modal BOQ — input manual */}
          <div>
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Modal BoQ (input manual)</label>
            <input
              type="text"
              value={formData.procurementModalBoq}
              onChange={(e) => handleChange('procurementModalBoq', e.target.value)}
              className="w-full text-xs p-2.5 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-emerald-50/30 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              placeholder="Contoh: 2337800000 atau 2.337.800.000"
            />
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
              Nilai Terbaca: {formatCurrency(modalNum)}
            </span>
          </div>

          {/* Auto-calculated preview */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kalkulasi Otomatis (Real-time)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-bold text-sky-500 uppercase mb-1">Total PO (BOQ Material)</span>
                <span className="text-sm font-extrabold text-sky-700 dark:text-sky-300">{formatCurrency(poMaterialTotal)}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-bold text-amber-500 uppercase mb-1">Nilai Jasa (Admin)</span>
                <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{formatCurrency(nilaiJasaTotal)}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Total Pengeluaran</span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPengeluaranCalc)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sisa Modal</span>
                <span className={`text-sm font-extrabold ${sisaModalCalc < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(sisaModalCalc)}
                </span>
              </div>
              <div className="rounded-xl p-3 text-center border border-slate-200 dark:border-slate-700">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">% Sisa Modal</span>
                <span className={`text-lg font-extrabold ${
                  percentCalc < 0 ? 'text-rose-600' :
                  percentCalc < 15 ? 'text-amber-600' :
                  'text-emerald-700'
                }`}>
                  {formatPercent(percentCalc)}
                </span>
              </div>
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
            className="inline-flex items-center px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </>
  );
}

// ── Auto Company Document Table Component (PPN & Non-PPN) ────────────────────
function AutoCompanyDocTable({
  docs,
  title,
  isPpn
}: {
  docs: any[];
  title: string;
  isPpn: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocs = docs.filter(f => {
    const data = f.documentData || {};
    const text = `${f.documentNo || ''} ${f.poNo || ''} ${f.vendorName || ''} ${data.kodeProyek || ''} ${data.kategori || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
        <div>
          <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isPpn ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
            <span>📋</span> {title}
          </h3>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari PO / PR / Kode Proyek..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className={`${isPpn ? 'bg-emerald-900 text-white' : 'bg-slate-800 text-white'} text-[11px]`}>
              <th className="py-2.5 px-3 text-center border-r border-emerald-950/40 w-10">No</th>
              <th className="py-2.5 px-3 text-left border-r border-emerald-950/40 w-32">Kode Proyek</th>
              <th className="py-2.5 px-3 text-center border-r border-emerald-950/40 w-16">PT</th>
              <th className="py-2.5 px-3 text-left border-r border-emerald-950/40 w-36">No Dokumen / PR</th>
              <th className="py-2.5 px-3 text-left border-r border-emerald-950/40 w-36">No PO</th>
              <th className="py-2.5 px-3 text-left border-r border-emerald-950/40 w-44">Vendor / Supplier</th>
              <th className="py-2.5 px-3 text-left border-r border-emerald-950/40">Deskripsi Item</th>
              <th className="py-2.5 px-3 text-right border-r border-emerald-950/40 w-28">Subtotal (Rp)</th>
              {isPpn && <th className="py-2.5 px-3 text-right border-r border-emerald-950/40 w-24">PPN 11% (Rp)</th>}
              <th className="py-2.5 px-3 text-right border-r border-emerald-950/40 w-32">Grand Total (Rp)</th>
              <th className="py-2.5 px-3 text-center border-r border-emerald-950/40 w-24">DP</th>
              <th className="py-2.5 px-3 text-center w-24">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={isPpn ? 12 : 11} className="py-8 text-center text-slate-400 font-medium">
                  Belum ada data formulir PO {isPpn ? 'PPN' : 'Non-PPN'} tersimpan.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc, idx) => {
                const data = doc.documentData || {};
                const itemsCount = (data.items || []).length;
                const firstItemDesc = data.items?.[0]?.item || data.kategori || '-';
                const itemSummary = itemsCount > 1 ? `${firstItemDesc} (+${itemsCount - 1} item lainnya)` : firstItemDesc;
                const grandTotalVal = data.grandTotal || data.subtotal || doc.totalAmount || 0;
                const subtotalVal = data.subtotal || grandTotalVal;
                const ppnVal = data.ppn || 0;
                const dpVal = (data.hasDp || data.dpPercent > 0) ? `${data.dpPercent}% (${formatCurrency(data.dpAmount)})` : '-';

                return (
                  <tr key={doc.id || idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">{data.kodeProyek || data.kategori || '-'}</td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{doc.company}</td>
                    <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">{doc.documentNo || data.docNo || '-'}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{doc.poNo || data.poNo || '-'}</td>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{doc.vendorName || data.vendorName || '-'}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 truncate max-w-xs" title={firstItemDesc}>{itemSummary}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatCurrency(subtotalVal)}</td>
                    {isPpn && <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(ppnVal)}</td>}
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(grandTotalVal)}</td>
                    <td className="py-2 px-3 text-center text-[10px] font-bold text-amber-600 dark:text-amber-400">{dpVal}</td>
                    <td className="py-2 px-3 text-center text-[11px] text-slate-500">{data.tanggal || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID') : '-')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Automated Termin & DP Table Component ─────────────────────────────────────
function AutoTerminTable({ docs }: { docs: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'ALL' | 'MJK' | 'DJI' | 'IRI'>('ALL');

  // Filter docs that have DP or Termin stages configured
  const terminDocs = docs.filter((f) => {
    if (f.documentData?.type === 'PROYEK_ADMIN') return false;
    if (f.company?.startsWith('GA') || f.documentNo?.startsWith('GA')) return false;

    const compMatch = companyFilter === 'ALL' || f.company === companyFilter;
    if (!compMatch) return false;

    const data = f.documentData || {};
    const text = `${f.documentNo || ''} ${f.poNo || ''} ${f.vendorName || ''} ${data.kodeProyek || ''} ${data.kategori || ''}`.toLowerCase();
    const searchMatch = text.includes(searchTerm.toLowerCase());

    const hasTerminData = Boolean(
      data.hasDp ||
      (data.dpPercent && data.dpPercent > 0) ||
      (data.terminItems && data.terminItems.length > 0)
    );

    return searchMatch && hasTerminData;
  });

  const handleExportExcel = () => {
    const headers = [
      'No', 'Tanggal', 'PT / Perusahaan', 'Kode Proyek', 'No PR / Dokumen',
      'No PO', 'Vendor / Supplier', 'Total Nilai PO (Rp)', 'Tahapan Termin / DP',
      'Persentase (%)', 'Nominal Termin (Rp)', 'Catatan / Description'
    ];

    const rows: any[] = [];
    let noCounter = 1;

    terminDocs.forEach((doc) => {
      const data = doc.documentData || {};
      const grandTotalVal = data.grandTotal || data.subtotal || doc.totalAmount || 0;
      const tItems: any[] = data.terminItems && data.terminItems.length > 0
        ? data.terminItems
        : [
            {
              stageName: `Uang Muka (DP ${data.dpPercent || 50}%)`,
              percent: data.dpPercent || 50,
              amount: data.dpAmount || Math.round((grandTotalVal * (data.dpPercent || 50)) / 100),
              notes: 'Uang Muka / Down Payment'
            },
            {
              stageName: `Pelunasan (${100 - (data.dpPercent || 50)}%)`,
              percent: 100 - (data.dpPercent || 50),
              amount: grandTotalVal - (data.dpAmount || Math.round((grandTotalVal * (data.dpPercent || 50)) / 100)),
              notes: 'Pelunasan Pekerjaan'
            }
          ];

      tItems.forEach((t) => {
        const nominal = t.amount > 0 ? t.amount : Math.round((grandTotalVal * (t.percent || 0)) / 100);
        rows.push([
          noCounter++,
          data.tanggal || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID') : '-'),
          doc.company || 'MJK',
          data.kodeProyek || data.kategori || '-',
          doc.documentNo || data.docNo || '-',
          doc.poNo || data.poNo || '-',
          doc.vendorName || data.vendorName || '-',
          grandTotalVal,
          t.stageName || 'Termin',
          t.percent || 0,
          nominal,
          t.notes || '-'
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 22 },
      { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 22 }, { wch: 12 },
      { wch: 18 }, { wch: 30 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tabel_Termin_Otomatis');
    XLSX.writeFile(wb, `Tabel_Termin_Procurement_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-extrabold flex items-center gap-2 text-sky-700 dark:text-sky-400">
            <span>💳</span> Tabel Termin & DP Otomatis (Company Documents)
          </h3>
          <p className="text-[11px] text-slate-500">Rincian otomatis tahapan pembayaran Termin & DP dari Formulir Dokumen MJK, DJI, IRI</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={companyFilter}
            onChange={(e: any) => setCompanyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer"
          >
            <option value="ALL">Semua PT (ALL)</option>
            <option value="MJK">MJK</option>
            <option value="DJI">DJI</option>
            <option value="IRI">IRI</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari PO / PR / Vendor / Proyek..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-sky-900 text-white text-[11px]">
              <th className="py-2.5 px-3 text-center border-r border-sky-950/40 w-10">No</th>
              <th className="py-2.5 px-3 text-center border-r border-sky-950/40 w-16">PT</th>
              <th className="py-2.5 px-3 text-left border-r border-sky-950/40 w-32">Kode Proyek</th>
              <th className="py-2.5 px-3 text-left border-r border-sky-950/40 w-36">No Dokumen / PR</th>
              <th className="py-2.5 px-3 text-left border-r border-sky-950/40 w-36">No PO</th>
              <th className="py-2.5 px-3 text-left border-r border-sky-950/40 w-44">Vendor / Supplier</th>
              <th className="py-2.5 px-3 text-right border-r border-sky-950/40 w-32">Total Nilai PO</th>
              <th className="py-2.5 px-3 text-left border-r border-sky-950/40">Tahapan Termin / DP</th>
              <th className="py-2.5 px-3 text-right border-r border-sky-950/40 w-28">Nominal (Rp)</th>
              <th className="py-2.5 px-3 text-center w-24">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {terminDocs.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                  Belum ada data formulir dokumen dengan tahapan Termin / DP tersimpan.
                </td>
              </tr>
            ) : (
              terminDocs.map((doc, idx) => {
                const data = doc.documentData || {};
                const grandTotalVal = data.grandTotal || data.subtotal || doc.totalAmount || 0;
                const tItems: any[] = data.terminItems && data.terminItems.length > 0
                  ? data.terminItems
                  : [
                      {
                        stageName: `Uang Muka (DP ${data.dpPercent || 50}%)`,
                        percent: data.dpPercent || 50,
                        amount: data.dpAmount || Math.round((grandTotalVal * (data.dpPercent || 50)) / 100),
                        notes: 'Uang Muka / Down Payment'
                      },
                      {
                        stageName: `Pelunasan (${100 - (data.dpPercent || 50)}%)`,
                        percent: 100 - (data.dpPercent || 50),
                        amount: grandTotalVal - (data.dpAmount || Math.round((grandTotalVal * (data.dpPercent || 50)) / 100)),
                        notes: 'Pelunasan Pekerjaan'
                      }
                    ];

                return (
                  <tr key={doc.id || idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-sky-700 dark:text-sky-400">{doc.company}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">{data.kodeProyek || data.kategori || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{doc.documentNo || data.docNo || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{doc.poNo || data.poNo || '-'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{doc.vendorName || data.vendorName || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(grandTotalVal)}</td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        {tItems.map((t, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between text-[11px] bg-slate-100 dark:bg-slate-900/60 px-2 py-1 rounded">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{t.stageName} {t.notes ? `(${t.notes})` : ''}</span>
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 ml-2">
                              {t.percent ? `${t.percent}%` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="space-y-1">
                        {tItems.map((t, tIdx) => {
                          const nominal = t.amount > 0 ? t.amount : Math.round((grandTotalVal * (t.percent || 0)) / 100);
                          return (
                            <div key={tIdx} className="font-bold text-slate-800 dark:text-slate-100 py-1">
                              {formatCurrency(nominal)}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[11px] text-slate-500">{data.tanggal || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID') : '-')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

