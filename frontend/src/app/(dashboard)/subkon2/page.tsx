'use client';

import React, { useState, useEffect } from 'react';
import api, { getApiBaseUrl } from '@/lib/api';
import { Plus, Save, Trash2, Link as LinkIcon } from 'lucide-react';

interface ProjectSubkonTermin {
  id?: string;
  nilaiJasa?: number | string;
  pembayaranPersen?: number | string;
  prosedurPenagihan?: string;
  autoRfq?: string;
  autoBoq?: string;
  autoSpk?: string;
  autoFotoProgress?: string;
  bapp?: string;
  laporanProgress?: string;
  suratJalan?: string;
  spfkpKtp?: string;
  npwp?: string;
  ceklist?: string;
  bastBasT2?: string;
  proformaInvoice?: string;
  tandaTerimaTukarFaktur?: string;
  invoice?: string;
  kwitansi?: string;
  tanggalPengajuan?: string;
  tanggalDibayar?: string;
}

interface ProjectSubkon {
  id?: string;
  projectId: string;
  masterSubkonId?: string;
  namaPekerjaan?: string;
  kategori?: string;
  nilaiKontrak?: number | string;
  type?: string;
  termins: ProjectSubkonTermin[];
}

// Helper component for input fields
const CellInput = ({ value, onChange, placeholder = "", type = "text", className = "" }: any) => (
  <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full h-full min-w-[80px] px-2 py-1.5 text-xs text-center border-0 bg-transparent focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-700 outline-none ${className}`}
  />
);

const DocumentCell = ({ value, onChange, docType, projectId, projectDocuments, onUploadSuccess, isEditing = true }: any) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    
    try {
      const res = await api.post(`/documents/upload/${docType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newDoc = res.data.data.document;
      onUploadSuccess(newDoc);
      onChange(newDoc.id);
    } catch (error) {
      console.error(error);
      alert('Gagal mengupload dokumen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = (documentId: string, fileName?: string) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();
    window.open(`${baseUrl}/documents/view/${documentId}?token=${token}`, '_blank');
  };

  const selectedDoc = projectDocuments.find((d: any) => d.id === value);
  const options = projectDocuments.filter((d: any) => d.fileType === docType);

  if (!isEditing) {
    if (value && selectedDoc) {
      return (
        <div className="flex items-center justify-center p-2">
          <button onClick={() => handleView(selectedDoc.id, selectedDoc.fileName)} className="text-sky-600 dark:text-sky-400 hover:underline text-[10px] text-center max-w-[100px] truncate" title={selectedDoc.fileName}>
            <LinkIcon className="w-3 h-3 inline mr-1" />{selectedDoc.fileName}
          </button>
        </div>
      );
    }
    return <div className="p-2 text-center text-xs text-slate-400">-</div>;
  }
  
  if (value && selectedDoc) {
    return (
      <div className="flex flex-col items-center justify-center space-y-1 py-1 w-full min-w-[120px]">
        <button 
          onClick={() => handleView(value, selectedDoc.fileName)}
          className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center text-center px-2 truncate max-w-[120px] bg-transparent border-0 cursor-pointer"
          title={selectedDoc.fileName}
        >
          <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{selectedDoc.fileName}</span>
        </button>
        <div className="flex space-x-2">
          <button onClick={() => onChange('')} className="text-red-500 hover:text-red-700 p-0.5 bg-red-50 dark:bg-red-900/20 rounded" title="Lepas Tautan Dokumen">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1.5 w-full min-w-[120px] px-2 py-1.5">
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[10px] p-1 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
      >
        <option value="">-- Pilih Dokumen --</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>{o.fileName}</option>
        ))}
      </select>
      <div className="relative w-full">
        <label className={`w-full flex items-center justify-center px-2 py-1 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded text-[10px] font-medium cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Plus className="w-3 h-3 mr-1" />
          {isUploading ? 'Uploading...' : 'Upload Baru'}
          <input 
            type="file" 
            className="hidden" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
};

export default function Subkon2Page() {
  const [projects, setProjects] = useState<any[]>([]);
  const [masterSubkons, setMasterSubkons] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [subkonData, setSubkonData] = useState<ProjectSubkon[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSubIdx, setEditingSubIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchMasterSubkons();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSubkonData(selectedProjectId);
      fetchProjectDocuments(selectedProjectId);
    } else {
      setSubkonData([]);
      setProjectDocuments([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedProjectId(res.data.data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterSubkons = async () => {
    try {
      const res = await api.get('/master-data/subkons');
      setMasterSubkons(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProjectDocuments = async (projectId: string) => {
    try {
      const res = await api.get(`/documents?projectId=${projectId}`);
      setProjectDocuments(res.data.data || []);
    } catch (error) {
      console.error("Error fetching project documents", error);
    }
  };

  const fetchSubkonData = async (projectId: string) => {
    try {
      const res = await api.get(`/project-subkons/${projectId}?type=SUBKON2`);
      setSubkonData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddSubkon = () => {
    setSubkonData([
      ...subkonData,
      {
        projectId: selectedProjectId,
        masterSubkonId: '',
        namaPekerjaan: '',
        kategori: '',
        nilaiKontrak: '',
        type: 'SUBKON2',
        termins: [{}]
      }
    ]);
    setEditingSubIdx(subkonData.length);
  };

  const handleAddTermin = (subkonIndex: number) => {
    const newData = [...subkonData];
    newData[subkonIndex].termins.push({});
    setSubkonData(newData);
  };

  const handleRemoveSubkon = (subkonIndex: number) => {
    const newData = [...subkonData];
    newData.splice(subkonIndex, 1);
    setSubkonData(newData);
  };

  const handleRemoveTermin = (subkonIndex: number, terminIndex: number) => {
    const newData = [...subkonData];
    newData[subkonIndex].termins.splice(terminIndex, 1);
    if (newData[subkonIndex].termins.length === 0) {
      newData.splice(subkonIndex, 1);
    }
    setSubkonData(newData);
  };

  const handleChangeSubkon = (subIdx: number, field: keyof ProjectSubkon, value: any) => {
    const newData = [...subkonData];
    newData[subIdx] = { ...newData[subIdx], [field]: value };
    setSubkonData(newData);
  };

  const handleChangeTermin = (subIdx: number, termIdx: number, field: keyof ProjectSubkonTermin, value: any) => {
    const newData = [...subkonData];
    newData[subIdx].termins[termIdx] = { ...newData[subIdx].termins[termIdx], [field]: value };
    setSubkonData(newData);
  };

  const handleUploadSuccess = (newDoc: any) => {
    setProjectDocuments(prev => [newDoc, ...prev]);
  };

  const handleSaveRow = async (subIdx: number) => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      const subkon = { ...subkonData[subIdx], type: 'SUBKON2' };
      if (subkon.id) {
        await api.put(`/project-subkons/${subkon.id}`, subkon);
      } else {
        await api.post(`/project-subkons/${selectedProjectId}`, subkon);
      }
      setEditingSubIdx(null);
      fetchSubkonData(selectedProjectId);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      const promises = subkonData.map(async (subkon) => {
        const payload = { ...subkon, type: 'SUBKON2' };
        if (payload.id) {
          return api.put(`/project-subkons/${payload.id}`, payload);
        } else {
          return api.post(`/project-subkons/${selectedProjectId}`, payload);
        }
      });
      await Promise.all(promises);
      alert('Data Subkon 2 berhasil disimpan!');
      fetchSubkonData(selectedProjectId);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Data Subkon 2</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola data dan dokumen terkait subkontraktor 2 (Parent-Child)</p>
        </div>
        <div className="flex space-x-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <select 
            className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- Pilih Proyek --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddSubkon}
            disabled={!selectedProjectId}
            className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Subkon 2 Baru
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedProjectId || saving}
            className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto smooth-scroll scroll-smooth border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-sm text-left whitespace-nowrap border-separate border-spacing-0">
          <thead className="text-[10px] text-center uppercase bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
            <tr>
              {/* Induk Header */}
              <th className="border-l border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 align-middle">Subcon</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 align-middle">Nama Pekerjaan</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 align-middle">Kategori (JASA/MAT)</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 align-middle">Nilai Kontrak</th>
              
              {/* Termin Header */}
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-blue-50 dark:bg-blue-900/20 align-middle">Nilai Jasa</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-blue-50 dark:bg-blue-900/20 align-middle">Pembayaran %</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-blue-50 dark:bg-blue-900/20 align-middle">Prosedur Penagihan</th>
              
              {/* Document Fields */}
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle min-w-[150px]">RFQ</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle min-w-[150px]">BOQ</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle min-w-[150px]">SPK</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">BAPP</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle min-w-[150px]">Foto Progress</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Laporan Progress</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Surat Jalan</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">SPFKP/KTP</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">NPWP</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Ceklist</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">BAST/BAS T2</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Proforma Invoice</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Tanda Terima Tukar Faktur</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Invoice</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Kwitansi</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Tanggal Pengajuan</th>
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 bg-slate-200 dark:bg-slate-700 align-middle">Tanggal Dibayar</th>
              
              <th className="border-r border-t border-b border-slate-400 dark:border-slate-600 p-2 align-middle min-w-[80px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {subkonData.length === 0 ? (
              <tr>
                <td colSpan={26} className="p-8 text-center text-slate-500">
                  {selectedProjectId ? 'Belum ada data Subkon 2. Klik "Tambah Subkon 2 Baru" untuk memulai.' : 'Silakan pilih proyek terlebih dahulu.'}
                </td>
              </tr>
            ) : (
              subkonData.map((subkon, subIdx) => {
                const termins = subkon.termins || [];
                const rowSpan = termins.length || 1;

                return termins.map((termin, termIdx) => {
                  const isFirstRow = termIdx === 0;

                  return (
                    <tr key={`${subIdx}-${termIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      {/* --- INDUK COLUMNS (RowSpan jika multiple termin) --- */}
                      {isFirstRow && (
                        <td className="border border-slate-300 dark:border-slate-600 p-0 align-top bg-white dark:bg-slate-900" rowSpan={rowSpan}>
                          {editingSubIdx === subIdx ? (
                            <select 
                              className="w-full text-xs p-2 border-0 bg-transparent font-semibold"
                              value={subkon.masterSubkonId || ''}
                              onChange={(e) => handleChangeSubkon(subIdx, 'masterSubkonId', e.target.value)}
                            >
                              <option value="">-- Pilih Subkon --</option>
                              {masterSubkons.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="p-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {subkon.masterSubkonId 
                                ? masterSubkons.find(m => m.id === subkon.masterSubkonId)?.name || subkon.masterSubkonId
                                : '-'}
                            </div>
                          )}
                        </td>
                      )}
                      {isFirstRow && (
                        <td className="border border-slate-300 dark:border-slate-600 p-0 align-top bg-white dark:bg-slate-900" rowSpan={rowSpan}>
                          {editingSubIdx === subIdx ? (
                            <CellInput value={subkon.namaPekerjaan} onChange={(val: any) => handleChangeSubkon(subIdx, 'namaPekerjaan', val)} placeholder="Uraian pekerjaan..." />
                          ) : (
                            <div className="p-2 text-xs text-slate-800 dark:text-slate-200">{subkon.namaPekerjaan || '-'}</div>
                          )}
                        </td>
                      )}
                      {isFirstRow && (
                        <td className="border border-slate-300 dark:border-slate-600 p-0 align-top bg-white dark:bg-slate-900" rowSpan={rowSpan}>
                          {editingSubIdx === subIdx ? (
                            <CellInput value={subkon.kategori} onChange={(val: any) => handleChangeSubkon(subIdx, 'kategori', val)} placeholder="Kategori/Folder Link..." />
                          ) : (
                            <div className="p-2 text-xs font-mono text-slate-800 dark:text-slate-200">{subkon.kategori || '-'}</div>
                          )}
                        </td>
                      )}
                      {isFirstRow && (
                        <td className="border border-slate-300 dark:border-slate-600 p-0 align-top bg-white dark:bg-slate-900" rowSpan={rowSpan}>
                          {editingSubIdx === subIdx ? (
                            <CellInput value={subkon.nilaiKontrak} onChange={(val: any) => handleChangeSubkon(subIdx, 'nilaiKontrak', val)} placeholder="0" type="number" />
                          ) : (
                            <div className="p-2 text-xs text-right whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">{subkon.nilaiKontrak ? Number(subkon.nilaiKontrak).toLocaleString('id-ID') : '-'}</div>
                          )}
                        </td>
                      )}

                      {/* --- TERMIN COLUMNS (Muncul di setiap baris termin) --- */}
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-blue-50/30 dark:bg-blue-900/10">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.nilaiJasa} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'nilaiJasa', val)} placeholder="0" type="number" />
                        ) : (
                          <div className="p-2 text-xs text-right whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.nilaiJasa ? Number(termin.nilaiJasa).toLocaleString('id-ID') : '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-blue-50/30 dark:bg-blue-900/10">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.pembayaranPersen} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'pembayaranPersen', val)} placeholder="0%" />
                        ) : (
                          <div className="p-2 text-xs text-center text-slate-800 dark:text-slate-200">{termin.pembayaranPersen ? termin.pembayaranPersen + '%' : '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-blue-50/30 dark:bg-blue-900/10">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.prosedurPenagihan} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'prosedurPenagihan', val)} placeholder="DP/Termin..." />
                        ) : (
                          <div className="p-2 text-xs text-center text-slate-800 dark:text-slate-200">{termin.prosedurPenagihan || '-'}</div>
                        )}
                      </td>

                      {/* Document Upload/Select Cells */}
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        <DocumentCell 
                          value={termin.autoRfq} 
                          onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'autoRfq', val)} 
                          docType="RFQ_SCAN_KOSONG"
                          projectId={selectedProjectId}
                          projectDocuments={projectDocuments}
                          onUploadSuccess={handleUploadSuccess}
                          isEditing={editingSubIdx === subIdx}
                        />
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        <DocumentCell 
                          value={termin.autoBoq} 
                          onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'autoBoq', val)} 
                          docType="BOQ"
                          projectId={selectedProjectId}
                          projectDocuments={projectDocuments}
                          onUploadSuccess={handleUploadSuccess}
                          isEditing={editingSubIdx === subIdx}
                        />
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        <DocumentCell 
                          value={termin.autoSpk} 
                          onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'autoSpk', val)} 
                          docType="SPK"
                          projectId={selectedProjectId}
                          projectDocuments={projectDocuments}
                          onUploadSuccess={handleUploadSuccess}
                          isEditing={editingSubIdx === subIdx}
                        />
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.bapp} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'bapp', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.bapp || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        <DocumentCell 
                          value={termin.autoFotoProgress} 
                          onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'autoFotoProgress', val)} 
                          docType="FOTO"
                          projectId={selectedProjectId}
                          projectDocuments={projectDocuments}
                          onUploadSuccess={handleUploadSuccess}
                          isEditing={editingSubIdx === subIdx}
                        />
                      </td>

                      {/* Manual Fields */}
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.laporanProgress} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'laporanProgress', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.laporanProgress || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.suratJalan} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'suratJalan', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.suratJalan || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.spfkpKtp} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'spfkpKtp', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.spfkpKtp || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.npwp} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'npwp', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.npwp || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.ceklist} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'ceklist', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.ceklist || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.bastBasT2} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'bastBasT2', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.bastBasT2 || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.proformaInvoice} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'proformaInvoice', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.proformaInvoice || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.tandaTerimaTukarFaktur} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'tandaTerimaTukarFaktur', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.tandaTerimaTukarFaktur || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.invoice} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'invoice', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.invoice || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput value={termin.kwitansi} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'kwitansi', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.kwitansi || '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput type="date" value={termin.tanggalPengajuan ? new Date(termin.tanggalPengajuan).toISOString().split('T')[0] : ''} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'tanggalPengajuan', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.tanggalPengajuan ? new Date(termin.tanggalPengajuan).toLocaleDateString('id-ID') : '-'}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 p-0 bg-white dark:bg-slate-900">
                        {editingSubIdx === subIdx ? (
                          <CellInput type="date" value={termin.tanggalDibayar ? new Date(termin.tanggalDibayar).toISOString().split('T')[0] : ''} onChange={(val: any) => handleChangeTermin(subIdx, termIdx, 'tanggalDibayar', val)} />
                        ) : (
                          <div className="p-2 text-[10px] text-center whitespace-nowrap text-slate-800 dark:text-slate-200">{termin.tanggalDibayar ? new Date(termin.tanggalDibayar).toLocaleDateString('id-ID') : '-'}</div>
                        )}
                      </td>
                      
                      <td className="border border-slate-300 dark:border-slate-600 p-2 text-center bg-slate-50 dark:bg-slate-800 align-middle">
                        {editingSubIdx === subIdx ? (
                          <div className="flex flex-col space-y-2 items-center">
                            {isFirstRow && (
                              <>
                                <button onClick={() => handleSaveRow(subIdx)} className="text-emerald-600 hover:text-emerald-700 font-medium text-[10px] bg-emerald-50 py-1 px-2 w-full rounded border border-emerald-200">Simpan</button>
                                <button onClick={() => { setEditingSubIdx(null); fetchSubkonData(selectedProjectId); }} className="text-slate-500 hover:text-slate-700 font-medium text-[10px] bg-slate-100 py-1 px-2 w-full rounded border border-slate-200">Batal</button>
                                <button onClick={() => handleAddTermin(subIdx)} className="text-sky-600 hover:text-sky-700 bg-sky-100 dark:bg-sky-900/30 px-2 py-1 rounded text-[10px] font-bold w-full" title="Tambah Termin">
                                  + Termin
                                </button>
                                <div className="border-t border-slate-200 dark:border-slate-700 w-full my-1"></div>
                              </>
                            )}
                            <button onClick={() => handleRemoveTermin(subIdx, termIdx)} className="text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-[10px] font-bold w-full" title="Hapus Termin">
                              Hapus
                            </button>
                            {isFirstRow && (
                              <button onClick={() => handleRemoveSubkon(subIdx)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded w-full flex justify-center" title="Hapus Seluruh Subkon">
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-2 items-center justify-center">
                            {isFirstRow ? (
                              <button onClick={() => setEditingSubIdx(subIdx)} className="text-sky-600 hover:text-sky-700 font-medium text-xs hover:underline">Edit</button>
                            ) : (
                              <div className="text-slate-400 text-[10px]">-</div>
                            )}
                          </div>
                        )}
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
  );
}
