'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Project, Document, BoqHeader, BoqItem, PenawaranHeader, RfqHeader, AuditLog, DashboardStats, Role, DocType } from '@/types';
import { 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  Eye, 
  Edit3, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Building2, 
  UserCheck, 
  Coins, 
  Calendar, 
  HelpCircle,
  FileCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isSuperAdmin, isAdminMonitoring, isEngineering, isProyekAdmin, isProcurement, isFinance } = useAuth();
  
  // States Umum
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States Statistik (Admin/Superadmin/Finance)
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // States Upload Berkas (Engineering/Superadmin)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProject, setUploadProject] = useState('');
  const [uploadFileType, setUploadFileType] = useState<DocType>('SPK');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Custom metadata inputs based on fileType
  const [vendorName, setVendorName] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [rfqNumber, setRfqNumber] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [terms, setTerms] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // States Procurement (Edit BOQ)
  const [selectedBoqDoc, setSelectedBoqDoc] = useState<Document | null>(null);
  const [boqHeader, setBoqHeader] = useState<BoqHeader | null>(null);
  const [editingBoqItem, setEditingBoqItem] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  const [editNotesValue, setEditNotesValue] = useState('');
  const [boqSaving, setBoqSaving] = useState(false);

  // States Finance (View Penawaran Modal)
  const [viewPenawaranDoc, setViewPenawaranDoc] = useState<Document | null>(null);
  const [penawaranHeader, setPenawaranHeader] = useState<PenawaranHeader | null>(null);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // States Finance (View BOQ Total Modal)
  const [viewBoqTotalDoc, setViewBoqTotalDoc] = useState<Document | null>(null);

  // States Admin/Superadmin (Tabs & Project Management)
  const [adminTab, setAdminTab] = useState<'projects' | 'documents' | 'audit_logs'>('projects');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [projSubmitting, setProjSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load Projects & Documents
      const [projRes, docRes] = await Promise.all([
        api.get('/projects'),
        api.get('/documents'),
      ]);
      setProjects(projRes.data.data);
      setDocuments(docRes.data.data);

      // 2. Load Stats & Audit Logs for Admin/Superadmin/Finance
      if (isSuperAdmin || isAdminMonitoring || isFinance) {
        const statsRes = await api.get('/monitoring/stats');
        setStats(statsRes.data.data);
      }
      if (isSuperAdmin || isAdminMonitoring) {
        const logsRes = await api.get('/monitoring/audit-logs');
        setAuditLogs(logsRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // UPLOAD DOKUMEN (Engineering)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Pilih file terlebih dahulu');
      return;
    }
    if (!uploadProject) {
      alert('Pilih proyek terlebih dahulu');
      return;
    }

    setUploadSubmitting(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('projectId', uploadProject);

    if (uploadFileType === 'PENAWARAN_DRAFT') {
      formData.append('vendorName', vendorName);
      formData.append('quoteNumber', quoteNumber);
      formData.append('validityDate', validityDate);
    } else if (uploadFileType === 'RFQ_SCAN_KOSONG') {
      formData.append('rfqNumber', rfqNumber);
      formData.append('targetDate', targetDate);
      formData.append('terms', terms);
    }

    try {
      await api.post(`/documents/upload/${uploadFileType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Dokumen berhasil diunggah dan di-parse!');
      setUploadModalOpen(false);
      // Reset form
      setUploadFile(null);
      setVendorName('');
      setQuoteNumber('');
      setValidityDate('');
      setRfqNumber('');
      setTargetDate('');
      setTerms('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengunggah berkas.');
    } finally {
      setUploadSubmitting(false);
    }
  };

  // DOWNLOAD DOKUMEN
  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/documents/download/${doc.id}`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/octet-stream' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Gagal mengunduh berkas dari server.');
    }
  };

  // DOWNLOAD SEMUA DOKUMEN (ZIP)
  const handleDownloadAll = async () => {
    try {
      setDownloadingAll(true);
      const response = await api.get('/documents/download-all', {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/zip' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', 'semua-berkas-proyek.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Gagal mengunduh semua berkas proyek.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // RILIS PURCHASE ORDER (Finance / Superadmin)
  const handleReleasePo = async (docId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui & merilis Purchase Order (PO) ini?')) {
      return;
    }
    try {
      await api.put(`/documents/${docId}/status`, { status: 'PO_RELEASED' });
      alert('Purchase Order (PO) berhasil dirilis!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal merilis Purchase Order.');
    }
  };

  // HAPUS DOKUMEN (Owner / Superadmin)
  const handleDeleteDocument = async (id: string, fileName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${fileName}"? Seluruh data terurai terkait akan hilang.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      alert('Dokumen berhasil dihapus.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus dokumen.');
    }
  };

  // AMBIL DETAIL BOQ (Procurement / Finance)
  const handleOpenBoqDetails = async (doc: Document) => {
    setSelectedBoqDoc(doc);
    setLoadingModalData(true);
    try {
      const res = await api.get(`/documents/boq/${doc.id}`);
      setBoqHeader(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat rincian BOQ.');
      setSelectedBoqDoc(null);
    } finally {
      setLoadingModalData(false);
    }
  };

  // EDIT HARGA SATUAN BOQ ITEM (Procurement)
  const handleStartEditBoqItem = (item: BoqItem) => {
    setEditingBoqItem(item.id);
    setEditRateValue(item.rateProcurement.toString());
    setEditNotesValue(item.notes || '');
  };

  const handleSaveBoqItem = async (itemId: string) => {
    setBoqSaving(true);
    try {
      await api.put(`/documents/boq/items/${itemId}`, {
        rateProcurement: parseFloat(editRateValue),
        notes: editNotesValue,
      });
      // Refresh modal
      const res = await api.get(`/documents/boq/${selectedBoqDoc!.id}`);
      setBoqHeader(res.data.data);
      setEditingBoqItem(null);
      loadData(); // refresh parent stats
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengedit harga item.');
    } finally {
      setBoqSaving(false);
    }
  };

  // AMBIL DETAIL PENAWARAN (Finance / Proyek Admin)
  const handleOpenPenawaranDetails = async (doc: Document) => {
    setViewPenawaranDoc(doc);
    setLoadingModalData(true);
    try {
      const res = await api.get(`/documents/penawaran/${doc.id}`);
      setPenawaranHeader(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memuat rincian penawaran.');
      setViewPenawaranDoc(null);
    } finally {
      setLoadingModalData(false);
    }
  };

  // CRUD PROJECT (Superadmin)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setProjSubmitting(true);
    try {
      await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc,
      });
      alert('Proyek berhasil ditambahkan!');
      setNewProjectName('');
      setNewProjectDesc('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat proyek.');
    } finally {
      setProjSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Hapus proyek "${name}"? Seluruh berkas yang terhubung dengan proyek ini akan terhapus.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus proyek.');
    }
  };

  // Filtering Dokumen
  const filteredDocs = documents.filter((doc) => {
    const matchQuery = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       doc.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       doc.uploadedBy?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType ? doc.fileType === filterType : true;
    return matchQuery && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="bg-sky-500/30 text-sky-200 border border-sky-400/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Workspace: {user?.role.replace('_', ' ')}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Halo, {user?.name}!</h2>
          <p className="text-sky-100 text-sm max-w-xl">
            {isEngineering && 'Kelola desain gambar proyek, upload BOQ, Penawaran Vendor, dan RFQ Anda.'}
            {isProyekAdmin && 'Monitor berkas proyek dan unduh berkas untuk keperluan administrasi.'}
            {isProcurement && 'Tinjau Rincian BOQ dan edit estimasi harga satuan Procurement.'}
            {isFinance && 'Verifikasi data penawaran komersil dan awasi total anggaran BOQ.'}
            {isAdminMonitoring && 'Konsol visualisasi monitoring seluruh dokumen & riwayat aktivitas.'}
            {isSuperAdmin && 'Konsol administrasi utama: CRUD Proyek, Dokumen, dan Log audit sistem.'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 rounded-xl flex items-center text-sm font-semibold transition-all"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* METRIC CARDS FOR MONITORING/ADMIN/FINANCE */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600"><Building2 className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Proyek</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stats.projectCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><FileText className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Dokumen</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stats.documentCount}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Coins className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Nilai BOQ</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-1 truncate" title={`Rp ${stats.totalBoqAmount.toLocaleString('id-ID')}`}>
                Rp {stats.totalBoqAmount.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Coins className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Penawaran</p>
              <h3 className="text-base font-extrabold text-slate-800 mt-1 truncate" title={`Rp ${stats.totalPenawaranAmount.toLocaleString('id-ID')}`}>
                Rp {stats.totalPenawaranAmount.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600"><UserCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-bold text-slate-400 uppercase tracking-wider">Total Staf</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stats.userCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. ENGINEERING WORKSPACE */}
      {/* ---------------------------------------------------- */}
      {isEngineering && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Unggah & Riwayat Kerja Anda</h3>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
            >
              <Plus className="mr-1.5 h-4.5 w-4.5" />
              Unggah Berkas Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-700">Berkas yang Anda Unggah</h4>
              <p className="text-2xs text-slate-400 mt-0.5">Semua data berkas teknis dan komersil milik Anda.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">Nama Berkas</th>
                    <th className="py-3 px-6">Proyek</th>
                    <th className="py-3 px-6">Tipe</th>
                    <th className="py-3 px-6">Ukuran</th>
                    <th className="py-3 px-6">Tanggal Upload</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {documents.filter(d => d.uploadedById === user?.id).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="py-4 px-6 font-semibold text-slate-800">{doc.fileName}</td>
                      <td className="py-4 px-6 text-slate-500">{doc.project?.name}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold ${
                          doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT' ? 'bg-sky-50 text-sky-700' :
                          doc.fileType === 'BOQ' ? 'bg-emerald-50 text-emerald-700' :
                          doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL' ? 'bg-purple-50 text-purple-700' :
                          doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {doc.fileType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="py-4 px-6 text-slate-400 text-xs">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-2xs"
                          title="Unduh Berkas"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                          className="p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 shadow-2xs"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {documents.filter(d => d.uploadedById === user?.id).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Anda belum mengunggah berkas apapun.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. PROYEK ADMIN WORKSPACE */}
      {/* ---------------------------------------------------- */}
      {isProyekAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Direktori & Pengendali Berkas Proyek</h3>
              <p className="text-xs text-slate-500 mt-1">Anda dapat melihat dan mengunduh seluruh file proyek.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setUploadFileType('SPK');
                  setUploadModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Plus className="mr-1.5 h-4.5 w-4.5" />
                Unggah Berkas Baru
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
              >
                <Download className={`mr-1.5 h-4.5 w-4.5 ${downloadingAll ? 'animate-bounce' : ''}`} />
                {downloadingAll ? 'Mengunduh...' : 'Unduh Semua Berkas (ZIP)'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Filter */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berkas, proyek, atau uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500"
              >
                <option value="">Semua Tipe File</option>
                <option value="SPK">SPK (Klien)</option>
                <option value="PENAWARAN_FINAL">PENAWARAN FINAL (Klien)</option>
                <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                <option value="INVOICE">INVOICE (Klien)</option>
                <option value="SUBKON_DOCS">SUBKON DOCS</option>
                <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG</option>
                <option value="DRAWING">DRAWING (Internal)</option>
                <option value="FOTO">FOTO (Internal)</option>
                <option value="RAB">RAB (Internal)</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">Nama Dokumen</th>
                    <th className="py-3 px-6">Proyek</th>
                    <th className="py-3 px-6">Tipe</th>
                    <th className="py-3 px-6">Diunggah Oleh</th>
                    <th className="py-3 px-6">Tanggal Upload</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="py-4 px-6 font-semibold text-slate-800">{doc.fileName}</td>
                      <td className="py-4 px-6 text-slate-500">{doc.project?.name}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold ${
                          doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT' ? 'bg-sky-50 text-sky-700' :
                          doc.fileType === 'BOQ' ? 'bg-emerald-50 text-emerald-700' :
                          doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL' ? 'bg-purple-50 text-purple-700' :
                          doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {doc.fileType}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium">{doc.uploadedBy?.name}</td>
                      <td className="py-4 px-6 text-slate-400 text-xs">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-semibold shadow-2xs transition-all"
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Unduh
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada dokumen proyek ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. PROCUREMENT WORKSPACE */}
      {/* ---------------------------------------------------- */}
      {isProcurement && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Evaluasi Harga Satuan BOQ</h3>
              <p className="text-xs text-slate-500">Anda dapat mengubah harga satuan item BOQ yang diupload oleh Engineering.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Daftar File BOQ */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 h-fit">
              <h4 className="text-sm font-bold text-slate-700">Daftar Dokumen BOQ</h4>
              <div className="space-y-2">
                {documents.filter(d => d.fileType === 'BOQ').map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleOpenBoqDetails(doc)}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-start space-x-3 ${
                      selectedBoqDoc?.id === doc.id
                        ? 'border-sky-500 bg-sky-50/40 text-sky-800 shadow-xs'
                        : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold truncate">{doc.fileName}</h5>
                      <p className="text-3xs text-slate-400 mt-1">Proyek: {doc.project?.name}</p>
                      <p className="text-3xs text-slate-400 mt-0.5">Uploader: {doc.uploadedBy?.name}</p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-3xs font-semibold mt-2 ${
                        doc.status === 'REVISED_BY_PROCUREMENT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </button>
                ))}
                {documents.filter(d => d.fileType === 'BOQ').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada dokumen BOQ diupload.</p>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Rincian Item BOQ & Form Edit */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-700">Rincian Item BOQ</h4>
              
              {loadingModalData ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin text-sky-500 h-6 w-6" /></div>
              ) : boqHeader ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold">Total Nilai BOQ saat ini:</p>
                      <h4 className="text-lg font-bold text-slate-800 mt-1">Rp {boqHeader.totalAmount.toLocaleString('id-ID')}</h4>
                    </div>
                    <button
                      onClick={() => handleDownload(selectedBoqDoc!)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg font-semibold"
                    >
                      Unduh Excel Fisik
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                      <thead className="bg-slate-50/50 text-left font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Pos / WBS</th>
                          <th className="py-2.5 px-4">Deskripsi Pekerjaan</th>
                          <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                          <th className="py-2.5 px-4 text-right">Harga (Eng)</th>
                          <th className="py-2.5 px-4 text-right">Harga (Proc)</th>
                          <th className="py-2.5 px-4 text-right">Subtotal</th>
                          <th className="py-2.5 px-4 text-center">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {boqHeader.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/20">
                            <td className="py-3 px-4 font-mono font-bold">{item.wbsCode || '-'}</td>
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4 text-center">{item.quantity} {item.unit}</td>
                            <td className="py-3 px-4 text-right">Rp {item.rateEngineering.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-4 text-right font-bold text-sky-600">Rp {item.rateProcurement.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-800">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                            <td className="py-3 px-4 text-center">
                              {editingBoqItem === item.id ? (
                                <button
                                  onClick={() => setEditingBoqItem(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  Batal
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEditBoqItem(item)}
                                  className="p-1 rounded-lg hover:bg-slate-50 text-sky-600"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MODAL IN-LINE FORM EDIT HARGA ITEM */}
                  {editingBoqItem && (
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
                      <h5 className="text-xs font-bold text-sky-800">Ubah Harga Satuan Item Pekerjaan</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-500 mb-1">Harga Satuan Baru (Procurement)</label>
                          <input
                            type="number"
                            value={editRateValue}
                            onChange={(e) => setEditRateValue(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-500 mb-1">Catatan Negosiasi</label>
                          <input
                            type="text"
                            value={editNotesValue}
                            onChange={(e) => setEditNotesValue(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                            placeholder="e.g. Hasil deal diskon 10% dengan vendor"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingBoqItem(null)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveBoqItem(editingBoqItem)}
                          disabled={boqSaving}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold disabled:opacity-50"
                        >
                          {boqSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Pilih dokumen BOQ di kolom sebelah kiri untuk mengedit rincian harga satuan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. FINANCE WORKSPACE */}
      {/* ---------------------------------------------------- */}
      {isFinance && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Verifikasi Anggaran Keuangan</h3>
            <p className="text-xs text-slate-500">Tinjau penawaran vendor (modal) dan awasi total anggaran BOQ.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Penawaran Vendor Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <FileCheck className="text-purple-600 h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-700">Daftar Penawaran Vendor</h4>
              </div>
              <div className="space-y-2">
                {documents.filter(d => d.fileType === 'PENAWARAN_FINAL' || d.fileType === 'PENAWARAN_DRAFT').map((doc) => (
                  <div key={doc.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-slate-700">{doc.fileName}</h5>
                      <p className="text-3xs text-slate-400 mt-1">Proyek: {doc.project?.name}</p>
                      <p className="text-3xs text-slate-400 mt-0.5">Pengunggah: {doc.uploadedBy?.name}</p>
                    </div>
                    <button
                      onClick={() => handleOpenPenawaranDetails(doc)}
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-lg text-xs font-bold transition-all flex items-center"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Buka Rincian
                    </button>
                  </div>
                ))}
                 {documents.filter(d => d.fileType === 'PENAWARAN_FINAL' || d.fileType === 'PENAWARAN_DRAFT').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Tidak ada penawaran vendor yang diunggah.</p>
                )}
              </div>
            </div>

            {/* BOQ Total Monitoring Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <FileSpreadsheet className="text-emerald-600 h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-700">Monitor Total Anggaran BOQ</h4>
              </div>
              <div className="space-y-2">
                {documents.filter(d => d.fileType === 'BOQ').map((doc) => {
                  const hasRevision = doc.status === 'REVISED_BY_PROCUREMENT';
                  return (
                    <div key={doc.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-slate-700">{doc.fileName}</h5>
                        <p className="text-3xs text-slate-400 mt-1">Proyek: {doc.project?.name}</p>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-3xs font-semibold mt-2 ${
                          hasRevision ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hasRevision ? 'Sudah Direvisi Procurement' : 'Draft / Baru'}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <button
                          onClick={() => handleOpenBoqDetails(doc)}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center mb-1"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Lihat Total
                        </button>
                      </div>
                    </div>
                  );
                })}
                {documents.filter(d => d.fileType === 'BOQ').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Tidak ada dokumen BOQ diupload.</p>
                )}
              </div>
            </div>

            {/* Purchase Order (PO) Release Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <FileCheck className="text-indigo-600 h-5 w-5" />
                <h4 className="text-sm font-bold text-slate-700">Pelepasan Purchase Order (PO)</h4>
              </div>
              <div className="space-y-2">
                 {documents.filter(d => d.fileType === 'SUBKON_DOCS').map((doc) => {
                  const isPending = doc.status === 'PO_PENDING';
                  return (
                    <div key={doc.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-xs font-bold text-slate-700 truncate max-w-[140px]" title={doc.fileName}>{doc.fileName}</h5>
                          <p className="text-3xs text-slate-400 mt-1">Proyek: {doc.project?.name}</p>
                          <p className="text-3xs text-slate-400 mt-0.5 font-semibold text-indigo-600">Uploader: {doc.uploadedBy?.name}</p>
                        </div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded border text-3xs font-semibold ${
                          isPending ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {doc.status === 'PO_PENDING' ? 'PO Pending' : 'PO Dirilis'}
                        </span>
                      </div>
                      <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-50">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-3xs font-semibold flex items-center transition-all"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Unduh
                        </button>
                        {isPending && (
                          <button
                            onClick={() => handleReleasePo(doc.id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-3xs font-bold flex items-center transition-all shadow-sm shadow-indigo-600/10"
                          >
                            Rilis PO
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                 {documents.filter(d => d.fileType === 'SUBKON_DOCS').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada dokumen PO diupload.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. ADMIN / SUPERADMIN MONITORING CONSOLE */}
      {/* ---------------------------------------------------- */}
      {(isSuperAdmin || isAdminMonitoring) && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Konsol Manajemen & Monitoring</h3>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold bg-white">
              <button
                onClick={() => setAdminTab('projects')}
                className={`px-4 py-2 ${adminTab === 'projects' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Manajemen Proyek
              </button>
              <button
                onClick={() => setAdminTab('documents')}
                className={`px-4 py-2 ${adminTab === 'documents' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Monitoring Dokumen
              </button>
              <button
                onClick={() => setAdminTab('audit_logs')}
                className={`px-4 py-2 ${adminTab === 'audit_logs' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Riwayat Log Audit
              </button>
            </div>
          </div>

          {/* TAB 1: MANAJEMEN PROYEK */}
          {adminTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Tambah Proyek (Hanya Superadmin) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 h-fit">
                <h4 className="text-sm font-bold text-slate-700">
                  {isSuperAdmin ? 'Daftarkan Proyek Baru' : 'Info Akses Tambah Proyek'}
                </h4>
                {isSuperAdmin ? (
                  <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Nama Proyek</label>
                      <input
                        type="text"
                        required
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                        placeholder="Contoh: Pembangunan Kantor Cabang C"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Deskripsi Proyek</label>
                      <textarea
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 h-20 resize-none"
                        placeholder="Detail lingkup pengerjaan proyek..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={projSubmitting}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold disabled:opacity-50 transition-all"
                    >
                      {projSubmitting ? 'Mendaftarkan...' : 'Daftarkan Proyek'}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-400">
                    Sebagai **Admin Monitoring**, Anda hanya dapat melihat daftar proyek. Penambahan proyek baru dibatasi hanya untuk Superadmin.
                  </p>
                )}
              </div>

              {/* Daftar Proyek */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Daftar Proyek Aktif</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-xs text-slate-600">
                    <thead className="bg-slate-50/50 text-left font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Nama Proyek</th>
                        <th className="py-2.5 px-4">Deskripsi</th>
                        <th className="py-2.5 px-4">Tanggal Buat</th>
                        {isSuperAdmin && <th className="py-2.5 px-4 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projects.map((proj) => (
                        <tr key={proj.id} className="hover:bg-slate-50/20">
                          <td className="py-3 px-4 font-bold text-slate-700">{proj.name}</td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{proj.description || '-'}</td>
                          <td className="py-3 px-4 text-slate-400">{new Date(proj.createdAt).toLocaleDateString('id-ID')}</td>
                          {isSuperAdmin && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteProject(proj.id, proj.name)}
                                className="p-1 rounded bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                title="Hapus Proyek"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {projects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada proyek terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONITORING DOKUMEN */}
          {adminTab === 'documents' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari berkas, proyek, atau uploader..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Semua Tipe File</option>
                  <option value="SPK">SPK (Klien)</option>
                  <option value="PENAWARAN_FINAL">PENAWARAN FINAL (Klien)</option>
                  <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                  <option value="INVOICE">INVOICE (Klien)</option>
                  <option value="SUBKON_DOCS">SUBKON DOCS</option>
                  <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG</option>
                  <option value="DRAWING">DRAWING (Internal)</option>
                  <option value="FOTO">FOTO (Internal)</option>
                  <option value="RAB">RAB (Internal)</option>
                  <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT (Excel)</option>
                  <option value="BOQ">BOQ (Cost Material Excel)</option>
                  <option value="FORECAST_COST">FORECAST COST (Excel)</option>
                </select>
                <button
                  onClick={handleDownloadAll}
                  disabled={downloadingAll}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Download className={`mr-1.5 h-4 w-4 ${downloadingAll ? 'animate-bounce' : ''}`} />
                  {downloadingAll ? 'Mengunduh...' : 'Unduh Semua (ZIP)'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600">
                  <thead>
                    <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">Nama Dokumen</th>
                      <th className="py-3 px-6">Proyek</th>
                      <th className="py-3 px-6">Tipe</th>
                      <th className="py-3 px-6">Uploader</th>
                      <th className="py-3 px-6">Ukuran</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="py-4 px-6 font-semibold text-slate-800">{doc.fileName}</td>
                        <td className="py-4 px-6 text-slate-500">{doc.project?.name}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-bold ${
                            doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT' ? 'bg-sky-50 text-sky-700' :
                            doc.fileType === 'BOQ' ? 'bg-emerald-50 text-emerald-700' :
                            doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL' ? 'bg-purple-50 text-purple-700' :
                            doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {doc.fileType}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium">{doc.uploadedBy?.name}</td>
                        <td className="py-4 px-6 text-slate-400 text-xs">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-3xs font-semibold ${
                            doc.status === 'REVISED_BY_PROCUREMENT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {doc.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-2xs"
                            title="Unduh Berkas"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                              className="p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 shadow-2xs"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {adminTab === 'audit_logs' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-700">Jejak Audit Aktivitas Pengguna (Audit Trail)</h4>
                <p className="text-3xs text-slate-400 font-semibold flex items-center">
                  <Activity className="mr-1 text-sky-500 h-3.5 w-3.5" />
                  Diperbarui secara real-time
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-xs text-slate-600">
                  <thead className="bg-slate-50/50 font-semibold text-slate-400 uppercase tracking-wider text-left">
                    <tr>
                      <th className="py-2.5 px-4">Tanggal & Waktu</th>
                      <th className="py-2.5 px-4">Pengguna</th>
                      <th className="py-2.5 px-4">Aksi</th>
                      <th className="py-2.5 px-4">Tabel / Record ID</th>
                      <th className="py-2.5 px-4">Deskripsi Aktivitas</th>
                      <th className="py-2.5 px-4">Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/20">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {log.user?.name || 'Sistem'}
                          <span className="block text-3xs text-slate-400 font-mono mt-0.5">{log.user?.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-3xs text-slate-700">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-3xs text-slate-400">
                          {log.tableName} <span className="block mt-0.5 truncate max-w-[120px]">{log.recordId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{log.description}</td>
                        <td className="py-3 px-4 text-slate-400">{log.ipAddress || '-'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada log aktivitas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALS SECTION */}
      {/* ---------------------------------------------------- */}

      {/* 1. MODAL UPLOAD DOKUMEN (Engineering / Superadmin) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Unggah Dokumen Proyek Baru</h3>
            
            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Pilih Proyek</label>
                  <select
                    required
                    value={uploadProject}
                    onChange={(e) => setUploadProject(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Type Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Tipe Berkas</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as DocType)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {isEngineering && (
                      <>
                        <option value="DRAWING">DRAWING (Internal Gambar)</option>
                        <option value="RAB">RAB (Internal)</option>
                        <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT (Excel)</option>
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                        <option value="FORECAST_COST">FORECAST COST (Excel Estimasi)</option>
                        <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                        <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG</option>
                      </>
                    )}
                    {isProyekAdmin && (
                      <>
                        <option value="SPK">SPK (Klien)</option>
                        <option value="PENAWARAN_FINAL">PENAWARAN FINAL (Scan, PDF)</option>
                        <option value="INVOICE">INVOICE (Klien)</option>
                        <option value="SUBKON_DOCS">SUBKON DOCS (SPK, Invoice, RFQ Final)</option>
                        <option value="FOTO">FOTO (Internal)</option>
                      </>
                    )}
                    {isSuperAdmin && (
                      <>
                        <option value="SPK">SPK (Klien)</option>
                        <option value="PENAWARAN_FINAL">PENAWARAN FINAL (Scan, PDF)</option>
                        <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                        <option value="INVOICE">INVOICE (Klien)</option>
                        <option value="SUBKON_DOCS">SUBKON DOCS (SPK, Invoice, RFQ Final)</option>
                        <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG</option>
                        <option value="DRAWING">DRAWING (Internal Gambar)</option>
                        <option value="FOTO">FOTO (Internal)</option>
                        <option value="RAB">RAB (Internal)</option>
                        <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT (Excel)</option>
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                        <option value="FORECAST_COST">FORECAST COST (Excel Estimasi)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* File Upload */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-500 mb-1">Pilih File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                  />
                  <p className="text-3xs text-slate-400 mt-1">Gunakan format Excel (.xlsx, .xls) untuk dokumen BOQ, Penawaran, dan RFQ agar dapat di-parse otomatis.</p>
                </div>

                {/* Dynamic Fields for PENAWARAN_DRAFT */}
                {uploadFileType === 'PENAWARAN_DRAFT' && (
                  <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
                    <p className="font-bold text-sky-700">Metadata Tambahan Penawaran Vendor</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Nama Vendor</label>
                        <input
                          type="text"
                          required
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. PT. Semen Padang Tbk"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Nomor Penawaran</label>
                        <input
                          type="text"
                          value={quoteNumber}
                          onChange={(e) => setQuoteNumber(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. QTE/2026/07-115"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 mb-1">Masa Berlaku Penawaran</label>
                        <input
                          type="date"
                          value={validityDate}
                          onChange={(e) => setValidityDate(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for RFQ_SCAN_KOSONG */}
                {uploadFileType === 'RFQ_SCAN_KOSONG' && (
                  <div className="sm:col-span-2 border-t border-slate-100 pt-3 space-y-3">
                    <p className="font-bold text-sky-700">Metadata Tambahan RFQ</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Nomor RFQ</label>
                        <input
                          type="text"
                          required
                          value={rfqNumber}
                          onChange={(e) => setRfqNumber(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. RFQ-IT-004-2026"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 mb-1">Batas Target Tanggal</label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 mb-1">Ketentuan Penyerahan & Pembayaran (Terms)</label>
                        <input
                          type="text"
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. Franco Jakarta, TOP 30 Days"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold disabled:opacity-50 transition-all"
                >
                  {uploadSubmitting ? 'Mengunggah & Mengurai...' : 'Mulai Unggah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL VIEW PENAWARAN (Modal Excel + PDF - Finance) */}
      {viewPenawaranDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Detail Penawaran Vendor</h3>
                <p className="text-3xs text-slate-400 mt-1 font-mono">ID Dokumen: {viewPenawaranDoc.id}</p>
              </div>
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {loadingModalData ? (
                <div className="py-8 flex justify-center"><RefreshCw className="animate-spin text-sky-500 h-6 w-6" /></div>
              ) : penawaranHeader ? (
                <div className="space-y-4">
                  {/* Info Ringkas Vendor */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                      <h4 className="font-bold text-slate-700 mt-0.5">{penawaranHeader.vendorName}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                      <h4 className="font-bold text-slate-700 mt-0.5">{penawaranHeader.quoteNumber || '-'}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                      <h4 className="font-bold text-sky-700 mt-0.5 text-sm">Rp {penawaranHeader.totalOffer.toLocaleString('id-ID')}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Berlaku Hingga:</p>
                      <h4 className="font-bold text-slate-700 mt-0.5">
                        {penawaranHeader.validityDate ? new Date(penawaranHeader.validityDate).toLocaleDateString('id-ID') : '-'}
                      </h4>
                    </div>
                  </div>

                  {/* List Item Penawaran */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                      <thead className="bg-slate-50/50 text-left font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Deskripsi Barang / Jasa</th>
                          <th className="py-2 px-3 text-center">Qty / Satuan</th>
                          <th className="py-2 px-3 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {penawaranHeader.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/10">
                            <td className="py-2 px-3 font-mono">{item.itemNo}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700">{item.description}</td>
                            <td className="py-2 px-3 text-center">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-center">Rincian data tidak dapat diurai.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => handleDownload(viewPenawaranDoc)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
              >
                Unduh File Asli
              </button>
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold"
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
