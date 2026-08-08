'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project, ProcurementTrackingItem } from '@/types';
import {
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Save,
  X,
  FileSpreadsheet
} from 'lucide-react';

export type TrackingItem = ProcurementTrackingItem;

interface TrackingProyekTableProps {
  projects: Project[];
  onRefresh?: () => Promise<void> | void;
}

const parseRemarks = (remarks: string | undefined | null) => {
  if (!remarks) return {};
  try {
    const parsed = JSON.parse(remarks);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

// Seed sample data matching user screenshot (ONLY if never initialized before)
const INITIAL_SEED_ITEMS: TrackingItem[] = [
  {
    id: 'trk_1',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'Repair pemipaan toilet WS dan kebutuhan team surveyor',
    reqBy: 'Mahmud',
    description: '1. Stop Kran 3/4" - 1 Lusin (12) pcs\n2. benang kenur - 1 Pack',
    tanggalDiminta: '16/7/2025',
    tanggalDibutuhkan: '23/7/2025',
    tanggalPoDibuat: '17/7/2025',
    tanggalTibaDiLokasi: '17/7/2025',
    remarks: ''
  },
  {
    id: 'trk_2',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'Project Repair Pemipaan Toilet WS',
    reqBy: 'Mahmud',
    description: '1. Sok Ukuran 3/4" inch - 50 pcs\n2. Claim Pipa 3/4" inch - 2 pack\n3. Pipa Ukuran 3/4" inch - 6 btg\n4. Stop Kran 3/4" inch - 12 pcs',
    tanggalDiminta: '18/7/2025',
    tanggalDibutuhkan: '22/7/2025',
    tanggalPoDibuat: '28/7/2025',
    tanggalTibaDiLokasi: '17/7/2025',
    remarks: ''
  },
  {
    id: 'trk_3',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'PENGURUGAN TANAH MERAH',
    reqBy: 'Mahmud',
    description: 'Sollar utk Exa PC75UU - 150 liter',
    tanggalDiminta: '19/7/2025',
    tanggalDibutuhkan: 'Urgent',
    tanggalPoDibuat: '26/7/2025',
    tanggalTibaDiLokasi: '22/07/2025\n25/07/2025\n26/07/2025',
    remarks: 'Pengisian 90 Liter\nPengisian ke 4 - 30 Liter\nPengisian ke 5 - 30 Liter'
  },
  {
    id: 'trk_4',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'Partisi Workshop',
    reqBy: 'Mahmud',
    description: '1. Plat Tebal 3mm - 5 lembar\n2. Besi Siku 4*4 , Tebal 3mm - 8 batang',
    tanggalDiminta: '21/7/2025',
    tanggalDibutuhkan: 'Urgent',
    tanggalPoDibuat: '21/7/2025',
    tanggalTibaDiLokasi: '24/7/2025',
    remarks: ''
  },
  {
    id: 'trk_5',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'PEKERJAAN AKSES PINTU MASUK DAN POS SATPAM',
    reqBy: 'Aji',
    description: '1. ACP Warna Biru - 4 Lbr\n2. Siku 3x 3 - 15 Btg',
    tanggalDiminta: '22/7/2025',
    tanggalDibutuhkan: '25/7/2025',
    tanggalPoDibuat: '24/7/2025',
    tanggalTibaDiLokasi: '25/7/2025',
    remarks: ''
  },
  {
    id: 'trk_6',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'Parkiran Sementara 3 & 4',
    reqBy: 'Mahmud',
    description: '1. Cat Besi Kansai Paint Warna Putih - 20 kg\n2. kuas 3" inch - 10 pcs',
    tanggalDiminta: '22/7/2025',
    tanggalDibutuhkan: '25/7/2025',
    tanggalPoDibuat: '24/7/2025',
    tanggalTibaDiLokasi: '25/7/2025',
    remarks: ''
  },
  {
    id: 'trk_7',
    projectId: '',
    projectCode: 'F12-MJK-AFI 1-KEM',
    projectName: 'Pembangunan Kanopi Area Bongkar Muat Untuk Gudang Barang Jadi dan Gudang Bahan Baku',
    reqBy: 'Baing',
    description: '1. Pipa 4" 3.5mm - 25 Btg\n2. Pipa 2" 1.5mm - 15 btg\n3. Siku 40 x 40 4mm - 50 Btg\n4. Grinda Potong 4" - 10 Pak\n5. Grinda Poles 4" - 50 Pcs\n6. Mata Cutting 14" - 1 Pak\n7. Cat Kansai - 3 Pak\n8. Tiner - 2 Galon\n9. Plat 5 mm - 1 Lbr\n10. Poli Carbonat\n11. Kawat Las 2.6 - 4 PAK\n12. Kawat Las 2.0 - 15 PAK',
    tanggalDiminta: '22/7/2025',
    tanggalDibutuhkan: '28/7/2025',
    tanggalPoDibuat: '23/7/2025',
    tanggalTibaDiLokasi: '25/7/2025',
    remarks: 'Barang no. 1,2,3,9,10 sampai tanggal 29/07/2025\nBarang no. 11 dan 12 sampai tanggal 31/07/2025'
  }
];

export default function TrackingProyekTable({ projects, onRefresh }: TrackingProyekTableProps) {
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [trackingList, setTrackingList] = useState<TrackingItem[]>([]);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrackingItem | null>(null);
  const [formData, setFormData] = useState<Partial<TrackingItem>>({});
  const [saving, setSaving] = useState(false);

  // Load and parse tracking items from projects list
  useEffect(() => {
    if (!projects || projects.length === 0) {
      setTrackingList([]);
      return;
    }

    let allItems: TrackingItem[] = [];
    let hasAnyArrayDefined = false;

    projects.forEach((proj) => {
      const remarksObj = parseRemarks(proj.remarks);
      if (Array.isArray(remarksObj.procurementTrackingList)) {
        hasAnyArrayDefined = true;
        const items = remarksObj.procurementTrackingList.map((item: any, idx: number) => ({
          ...item,
          id: item.id || `trk_${proj.id}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
          projectId: proj.id,
          projectCode: proj.code,
          projectName: proj.name,
        }));
        allItems.push(...items);
      }
    });

    // Deduplicate items to guarantee unique list
    const uniqueMap = new Map<string, TrackingItem>();
    allItems.forEach((item, idx) => {
      const key = item.id || `trk_gen_${idx}_${Math.random().toString(36).substr(2, 6)}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { ...item, id: key });
      }
    });

    setTrackingList(Array.from(uniqueMap.values()));
  }, [projects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  };

  // Filter items by Selected Project Code & Search Query
  const filteredList = trackingList.filter((item) => {
    if (selectedProjectCode !== 'ALL' && item.projectCode !== selectedProjectCode) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const code = (item.projectCode || '').toLowerCase();
      const name = (item.projectName || '').toLowerCase();
      const req = (item.reqBy || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const rem = (item.remarks || '').toLowerCase();
      return (
        code.includes(q) ||
        name.includes(q) ||
        req.includes(q) ||
        desc.includes(q) ||
        rem.includes(q)
      );
    }
    return true;
  });

  // Open Modal
  const handleOpenModal = (item?: TrackingItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      const defaultProj = projects.find(p => p.code === selectedProjectCode) || projects[0];
      setFormData({
        projectId: defaultProj?.id || '',
        projectCode: defaultProj?.code || '',
        projectName: defaultProj?.name || '',
        reqBy: '',
        description: '',
        tanggalDiminta: '',
        tanggalDibutuhkan: '',
        tanggalPoDibuat: '',
        tanggalTibaDiLokasi: '',
        remarks: ''
      });
    }
    setModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async () => {
    if (!formData.projectId && !formData.projectCode) {
      alert('Pilih Kode Proyek terlebih dahulu.');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      alert('Deskripsi / Uraian barang tidak boleh kosong.');
      return;
    }

    setSaving(true);
    try {
      const targetProj = projects.find(p => p.id === formData.projectId || p.code === formData.projectCode) || projects[0];
      if (!targetProj) {
        alert('Proyek tidak ditemukan.');
        setSaving(false);
        return;
      }

      const projRemarks = parseRemarks(targetProj.remarks);
      const existingItems: TrackingItem[] = Array.isArray(projRemarks.procurementTrackingList) ? projRemarks.procurementTrackingList : [];

      let updatedProjectItems: TrackingItem[] = [];

      if (editingItem) {
        const newItemObj: TrackingItem = {
          ...editingItem,
          ...(formData as TrackingItem),
          projectId: targetProj.id,
          projectCode: targetProj.code,
          projectName: targetProj.name,
        };

        // If project changed, remove from old project list
        if (editingItem.projectId !== targetProj.id) {
          const oldProj = projects.find(p => p.id === editingItem.projectId);
          if (oldProj) {
            const oldRemarks = parseRemarks(oldProj.remarks);
            const oldList: TrackingItem[] = Array.isArray(oldRemarks.procurementTrackingList) ? oldRemarks.procurementTrackingList : [];
            await api.put(`/projects/${oldProj.id}`, {
              remarks: JSON.stringify({
                ...oldRemarks,
                procurementTrackingList: oldList.filter(i => i.id !== editingItem.id)
              })
            });
          }
        }

        updatedProjectItems = existingItems.map(i => i.id === newItemObj.id ? newItemObj : i);
        if (!updatedProjectItems.some(i => i.id === newItemObj.id)) {
          updatedProjectItems.push(newItemObj);
        }
      } else {
        const newItemObj: TrackingItem = {
          id: `trk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          projectId: targetProj.id,
          projectCode: targetProj.code,
          projectName: targetProj.name,
          reqBy: formData.reqBy || '',
          description: formData.description || '',
          tanggalDiminta: formData.tanggalDiminta || '',
          tanggalDibutuhkan: formData.tanggalDibutuhkan || '',
          tanggalPoDibuat: formData.tanggalPoDibuat || '',
          tanggalTibaDiLokasi: formData.tanggalTibaDiLokasi || '',
          remarks: formData.remarks || '',
        };

        updatedProjectItems = [newItemObj, ...existingItems];
      }

      // Save to project backend
      await api.put(`/projects/${targetProj.id}`, {
        remarks: JSON.stringify({
          ...projRemarks,
          procurementTrackingList: updatedProjectItems
        })
      });

      setModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to save tracking item:', err);
      alert('Gagal menyimpan data tracking.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Item (STAYS DELETED PERMANENTLY)
  const handleDeleteItem = async (item: TrackingItem) => {
    if (!confirm(`Hapus data tracking untuk "${item.projectName}"?`)) return;

    try {
      const targetProj = projects.find(p => p.id === item.projectId || p.code === item.projectCode);
      if (targetProj) {
        const projRemarks = parseRemarks(targetProj.remarks);
        const existingItems: TrackingItem[] = Array.isArray(projRemarks.procurementTrackingList) ? projRemarks.procurementTrackingList : [];
        const updatedItems = existingItems.filter(i => i.id !== item.id);

        // Immediate state update
        setTrackingList(prev => prev.filter(i => i.id !== item.id));

        // Save empty array [] to backend remarks so it stays explicitly initialized and never re-seeds!
        await api.put(`/projects/${targetProj.id}`, {
          remarks: JSON.stringify({
            ...projRemarks,
            procurementTrackingList: updatedItems
          })
        });
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Failed to delete tracking item:', err);
      alert('Gagal menghapus data tracking.');
    }
  };

  // Unique Project Codes for filter dropdown
  const uniqueProjectCodes = Array.from(new Set(projects.map(p => p.code).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* ── Controls Bar (Dropdown User Procurement & Search) ────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Dropdown User Procurement (Proyek Kode Selector) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Pilih Proyek Kode:</span>
          </label>
          <select
            value={selectedProjectCode}
            onChange={(e) => setSelectedProjectCode(e.target.value)}
            className="w-full sm:w-72 text-xs font-bold p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">-- Semua Kode Proyek ({filteredList.length} Items) --</option>
            {uniqueProjectCodes.map(code => {
              const proj = projects.find(p => p.code === code);
              return (
                <option key={code} value={code}>
                  {code} - {proj?.name || ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari proyek, req by, barang, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Data Tracking
          </button>
        </div>
      </div>

      {/* ── Main Tracking Table (Exact Excel Design) ────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh] relative smooth-scroll table-scroll-container">
          <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
            <thead className="sticky top-0 z-30 uppercase tracking-wider text-[11px] shadow-xs">
              {/* Row 1: Super Headers */}
              <tr>
                <th rowSpan={2} className="w-[45px] min-w-[45px] sticky left-0 z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  NO.
                </th>
                <th rowSpan={2} className="w-[150px] min-w-[150px] sticky left-[45px] z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  PROYEK KODE
                </th>
                <th rowSpan={2} className="w-[220px] min-w-[220px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  NAMA PROYEK
                </th>
                <th rowSpan={2} className="w-[110px] min-w-[110px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  REQ BY
                </th>
                <th rowSpan={2} className="w-[280px] min-w-[280px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  DESC
                </th>

                {/* Multi-column header: Tanggal */}
                <th colSpan={4} className="bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-1.5 px-2 text-center font-extrabold">
                  TANGGAL
                </th>

                <th rowSpan={2} className="w-[220px] min-w-[220px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold">
                  REMARKS
                </th>

                <th rowSpan={2} className="w-[85px] min-w-[85px] sticky right-0 z-30 bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-l border-r border-b border-slate-400 dark:border-slate-600 py-3 px-2 text-center font-extrabold shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                  AKSI
                </th>
              </tr>

              {/* Row 2: Sub-headers under Tanggal */}
              <tr>
                <th className="w-[100px] min-w-[100px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-1.5 px-2 text-center font-bold">
                  DIMINTA
                </th>
                <th className="w-[100px] min-w-[100px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-1.5 px-2 text-center font-bold">
                  DIBUTUHKAN
                </th>
                <th className="w-[100px] min-w-[100px] bg-[#fce4d6] dark:bg-[#4a2810] text-[#843c0c] dark:text-amber-200 border-r border-b border-slate-400 dark:border-slate-600 py-1.5 px-2 text-center font-bold">
                  PO DIBUAT
                </th>
                {/* Highlighted column header: Tiba di Lokasi */}
                <th className="w-[110px] min-w-[110px] bg-[#a3f4ae] dark:bg-[#20693a] text-[#155724] dark:text-emerald-100 border-r border-b border-slate-400 dark:border-slate-600 py-1.5 px-2 text-center font-extrabold">
                  TIBA DI LOKASI
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold border-b border-slate-300 dark:border-slate-700">
                    Tidak ada data tracking procurement.
                  </td>
                </tr>
              )}

              {filteredList.map((item, idx) => (
                <tr key={`${item.id}_${item.projectId || 'p'}_${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group">
                  {/* 1. No */}
                  <td className="w-[45px] min-w-[45px] sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                    {idx + 1}
                  </td>

                  {/* 2. Proyek Kode */}
                  <td className="w-[150px] min-w-[150px] sticky left-[45px] z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 font-mono font-bold text-center text-slate-800 dark:text-slate-100 truncate" title={item.projectCode}>
                    {item.projectCode}
                  </td>

                  {/* 3. Nama Proyek */}
                  <td className="w-[220px] min-w-[220px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {item.projectName}
                  </td>

                  {/* 4. Req by */}
                  <td className="w-[110px] min-w-[110px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                    {item.reqBy || '-'}
                  </td>

                  {/* 5. Desc (Uraian Material / Barang) */}
                  <td className="w-[280px] min-w-[280px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed text-[11px]">
                    {item.description || '-'}
                  </td>

                  {/* 6. Tanggal Diminta */}
                  <td className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-medium text-slate-700 dark:text-slate-300">
                    {item.tanggalDiminta || '-'}
                  </td>

                  {/* 7. Tanggal Dibutuhkan */}
                  <td className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-medium">
                    {item.tanggalDibutuhkan?.toLowerCase() === 'urgent' ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded border border-rose-300 dark:border-rose-800 uppercase tracking-wide">
                        Urgent
                      </span>
                    ) : (
                      item.tanggalDibutuhkan || '-'
                    )}
                  </td>

                  {/* 8. Tanggal PO dibuat */}
                  <td className="w-[100px] min-w-[100px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-medium text-slate-700 dark:text-slate-300">
                    {item.tanggalPoDibuat || '-'}
                  </td>

                  {/* 9. Tanggal Tiba di Lokasi (HIGHLIGHT GREEN #c6efce / #a3f4ae) */}
                  <td className="w-[110px] min-w-[110px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-center font-bold bg-[#c6efce] dark:bg-[#1b4332] text-[#1e4620] dark:text-emerald-200 whitespace-pre-line leading-snug">
                    {item.tanggalTibaDiLokasi || '-'}
                  </td>

                  {/* 10. Remarks */}
                  <td className="w-[220px] min-w-[220px] border-r border-b border-slate-300 dark:border-slate-700 py-3 px-2 text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-snug text-[11px]">
                    {item.remarks || '-'}
                  </td>

                  {/* 11. Aksi */}
                  <td className="w-[85px] min-w-[85px] sticky right-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/80 border-l border-r border-b border-slate-300 dark:border-slate-700 py-3 px-1 text-center shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: TAMBAH / EDIT DATA TRACKING ───────────────────────────────── */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={() => setModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{editingItem ? '✏️ Edit Data Tracking' : '➕ Tambah Data Tracking Baru'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Lengkapi informasi permintaan &amp; kedatangan material proyek.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Select Project */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Proyek Kode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => {
                    const selProj = projects.find(p => p.id === e.target.value);
                    if (selProj) {
                      setFormData(prev => ({
                        ...prev,
                        projectId: selProj.id,
                        projectCode: selProj.code,
                        projectName: selProj.name
                      }));
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Proyek --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Pekerjaan / Nama Proyek */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pekerjaan / Proyek
                </label>
                <input
                  type="text"
                  value={formData.projectName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Repair pemipaan toilet WS..."
                />
              </div>

              {/* Req by */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Req by (Peminta)
                </label>
                <input
                  type="text"
                  value={formData.reqBy || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reqBy: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Mahmud / Aji / Baing"
                />
              </div>

              {/* Desc / Material List */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Desc / Uraian Material <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder={`Contoh:\n1. Stop Kran 3/4" - 1 Lusin\n2. Benang kenur - 1 Pack`}
                />
              </div>

              {/* Tanggal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Diminta
                  </label>
                  <input
                    type="text"
                    value={formData.tanggalDiminta || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalDiminta: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 16/7/2025"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Dibutuhkan
                  </label>
                  <input
                    type="text"
                    value={formData.tanggalDibutuhkan || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalDibutuhkan: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 23/7/2025 atau Urgent"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal PO Dibuat
                  </label>
                  <input
                    type="text"
                    value={formData.tanggalPoDibuat || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalPoDibuat: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 17/7/2025"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Tanggal Tiba di Lokasi (Hijau)
                  </label>
                  <input
                    type="text"
                    value={formData.tanggalTibaDiLokasi || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalTibaDiLokasi: e.target.value }))}
                    className="w-full p-2.5 border border-emerald-400 dark:border-emerald-700 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 17/7/2025"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Keterangan
                </label>
                <textarea
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder="e.g. Pengisian 90 Liter..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveItem}
                disabled={saving}
                className="inline-flex items-center px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Data Tracking
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
