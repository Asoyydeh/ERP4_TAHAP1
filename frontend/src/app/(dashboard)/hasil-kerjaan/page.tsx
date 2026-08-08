'use client';

import React, { useState, useEffect } from 'react';
import api, { getBackendHostUrl, getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Project, Document } from '@/types';
import { 
  FileText, 
  FileSpreadsheet, 
  ImageIcon, 
  FileCheck, 
  Download, 
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';

export default function HasilKerjaanPage() {
  const { user, isSuperAdmin, isProyekAdmin, isProcurement, isFinance, isEngineering } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, projRes] = await Promise.all([
        api.get('/documents'),
        api.get('/projects')
      ]);
      setDocuments(docRes.data.data);
      setProjects(projRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!confirm(`Hapus berkas "${name}"?`)) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus berkas.');
    }
  };

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
    } catch (err: any) {
      let serverMsg = '';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) serverMsg = json.message;
        } catch (e) {}
      } else if (err?.response?.data?.message) {
        serverMsg = err.response.data.message;
      }
      alert(serverMsg ? `Gagal mengunduh berkas: ${serverMsg}` : 'Gagal mengunduh berkas dari server.');
    }
  };

  const handleViewFile = (doc: Document) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();
    window.open(`${baseUrl}/documents/view/${doc.id}?token=${token}`, '_blank');
  };

  const canDownloadDoc = (role: string, fileType: string) => {
    return true;
  };

  const getFullProjectCode = (doc: any) => {
    const realProj = projects.find(p => p.id === doc.projectId || (doc.project?.name && p.name === doc.project.name));
    if (realProj && realProj.code && realProj.code.trim() !== '') {
      return realProj.code;
    }
    if (doc.project && (doc.project as any).code && (doc.project as any).code.trim() !== '') {
      return (doc.project as any).code;
    }
    return doc.project?.name || '-';
  };

  const filteredDocuments = documents.filter((doc: any) => {
    const term = searchQuery.toLowerCase();
    const fullCode = getFullProjectCode(doc).toLowerCase();
    const matchSearch =
      doc.fileName.toLowerCase().includes(term) ||
      fullCode.includes(term) ||
      (doc.project?.code && (doc.project as any).code.toLowerCase().includes(term)) ||
      (doc.project?.name && doc.project.name.toLowerCase().includes(term)) ||
      (doc.uploadedBy?.name && doc.uploadedBy.name.toLowerCase().includes(term)) ||
      (doc.uploadedBy?.role && doc.uploadedBy.role.toLowerCase().includes(term)) ||
      doc.fileType.toLowerCase().includes(term);

    const matchProject = filterProject ? doc.projectId === filterProject : true;
    const matchType = filterType ? doc.fileType === filterType : true;

    return matchSearch && matchProject && matchType;
  });

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Memuat Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Hasil Kerjaan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Semua data berkas teknis dan komersil dari semua role & staf (Riwayat Kerja).
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berkas, kode, pengunggah, proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">Semua Proyek</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="">Semua Tipe Berkas</option>
            <option value="SPK">SPK</option>
            <option value="BOQ">BOQ</option>
            <option value="PENAWARAN_FINAL">Penawaran Final</option>
            <option value="PENAWARAN_DRAFT">Penawaran Draft</option>
            <option value="DRAWING">Drawing</option>
            <option value="DRAWING_AS_BUILT">Drawing As Built</option>
            <option value="INVOICE">Invoice</option>
            <option value="SUBKON_DOCS">Subkon Docs</option>
            <option value="RFQ_SCAN_KOSONG">RFQ</option>
            <option value="RAB">RAB</option>
            <option value="FORECAST_COST">Forecast Cost</option>
            <option value="FOTO">Foto</option>
          </select>

          <button
            onClick={fetchData}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl font-semibold border border-rose-100">
          {error}
        </div>
      )}

      {/* Table Data */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-xs text-left">
            <thead>
              <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-5">Kode Proyek</th>
                <th className="py-3 px-5">Proyek</th>
                <th className="py-3 px-5">Nama Berkas</th>
                <th className="py-3 px-5">Tipe</th>
                <th className="py-3 px-5">Diunggah Oleh</th>
                <th className="py-3 px-5">Ukuran</th>
                <th className="py-3 px-5">Tanggal Upload</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-300">
              {filteredDocuments.map((doc) => {
                const projectCode = getFullProjectCode(doc);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all">
                    <td className="py-3 px-5 font-mono text-sky-600 dark:text-sky-400 font-bold">{projectCode}</td>
                    <td className="py-3 px-5 text-slate-700 dark:text-slate-200 font-semibold">{doc.project?.name || '-'}</td>
                    <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      {(doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT') && <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />}
                      {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />}
                      {(doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL') && <FileCheck className="h-4 w-4 text-purple-600 shrink-0" />}
                      {(doc.fileType === 'RFQ_SCAN_KOSONG' || doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' || doc.fileType === 'RAB' || doc.fileType === 'FORECAST_COST' || doc.fileType === 'FOTO') && <FileText className="h-4 w-4 text-slate-500 shrink-0" />}
                      <span className="truncate max-w-[250px]" title={doc.fileName}>{doc.fileName}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{doc.fileType}</span>
                    </td>
                    <td className="py-3 px-5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.uploadedBy?.name || 'Unknown'}</span>
                        <br />
                        <span className="text-[10px] text-slate-400 font-mono">{doc.uploadedBy?.role || '-'}</span>
                    </td>
                    <td className="py-3 px-5 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-5 text-slate-400">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleViewFile(doc)}
                        className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sky-600 shadow-sm"
                        title="Buka / Preview Berkas"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canDownloadDoc(user?.role || '', doc.fileType) && (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-sm"
                          title="Unduh Berkas Asli"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {(isSuperAdmin || isProyekAdmin || doc.uploadedById === user?.id) && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                          className="inline-flex p-1.5 rounded-lg border border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-900/50 text-rose-500 shadow-sm"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium text-sm">
                    {searchQuery || filterProject || filterType ? 'Tidak ada berkas yang sesuai dengan pencarian/filter Anda.' : 'Belum ada berkas hasil kerjaan yang diunggah.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
