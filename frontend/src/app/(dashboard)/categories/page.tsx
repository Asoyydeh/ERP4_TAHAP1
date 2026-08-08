'use client';

import React, { useState, useEffect } from 'react';
import api, { getApiBaseUrl } from '@/lib/api';
// import Cookies from 'js-cookie';
import { Project, Document, BoqHeader, PenawaranHeader, RfqHeader } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  X,
  RefreshCw,
  FolderOpen,
  Folder,
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  FileCheck
} from 'lucide-react';

const canDownloadDoc = (role: string, fileType: string) => {
  if (role === 'SUPERADMIN' || role === 'ADMIN_MONITORING' || role === 'PROCUREMENT' || role === 'FINANCE' || role === 'ENGINEERING') return true;
  if (role === 'PROYEK_ADMIN') {
    return [
      'SPK',
      'PENAWARAN_FINAL',
      'DRAWING_AS_BUILT',
      'INVOICE',
      'SUBKON_DOCS',
      'FOTO'
    ].includes(fileType);
  }
  return false;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  SPK: 'SPK (Klien)',
  PENAWARAN_FINAL: 'Penawaran Final (Klien)',
  DRAWING_AS_BUILT: 'Drawing As-Built (Klien)',
  INVOICE: 'Invoice (Klien)',
  SUBKON_DOCS: 'Subkon Docs',
  RFQ_SCAN_KOSONG: 'RFQ Scan / Kosong',
  DRAWING: 'Drawing (Internal Gambar)',
  FOTO: 'Foto (Internal)',
  RAB: 'RAB (Internal)',
  PENAWARAN_DRAFT: 'Penawaran Draft',
  BOQ: 'BOQ (Cost Material Excel)',
  FORECAST_COST: 'Forecast Cost (Excel)',
};

export default function ProjectsPage() {
  const { user, isSuperAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation Explorer State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Detail Modals State
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [boqDetails, setBoqDetails] = useState<BoqHeader | null>(null);
  const [penawaranDetails, setPenawaranDetails] = useState<PenawaranHeader | null>(null);
  const [rfqDetails, setRfqDetails] = useState<RfqHeader | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // State Modal Proyek
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentId, setCurrentId] = useState<string | null>(null);
  
  // State Form Proyek
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjectsAndDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, docsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/documents'),
      ]);
      setProjects(projRes.data.data);
      setDocuments(docsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data proyek.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndDocs();
  }, []);

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
      alert('Gagal mengunduh berkas.');
    }
  };

  const handleViewFile = (doc: Document) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();
    window.open(`${baseUrl}/documents/view/${doc.id}?token=${token}`, '_blank');
  };

  const handleFileDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus berkas "${name}"? Tindakan ini permanen.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchProjectsAndDocs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus dokumen.');
    }
  };

  const handleOpenDetails = async (doc: Document) => {
    setSelectedDoc(doc);
    setLoadingDetails(true);
    setBoqDetails(null);
    setPenawaranDetails(null);
    setRfqDetails(null);

    try {
      if (doc.fileType === 'BOQ') {
        const res = await api.get(`/documents/boq/${doc.id}`);
        setBoqDetails(res.data.data);
      } else if (doc.fileType === 'PENAWARAN_DRAFT') {
        const res = await api.get(`/documents/penawaran/${doc.id}`);
        setPenawaranDetails(res.data.data);
      } else if (doc.fileType === 'RFQ_SCAN_KOSONG') {
        const res = await api.get(`/documents/rfq/${doc.id}`);
        setRfqDetails(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengambil rincian berkas.');
      setSelectedDoc(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setName('');
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setModalMode('edit');
    setCurrentId(project.id);
    setName(project.name);
    setDescription(project.description || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama proyek wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        await api.post('/projects', { name, description });
      } else {
        await api.put(`/projects/${currentId}`, { name, description });
      }
      setModalOpen(false);
      fetchProjectsAndDocs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, projName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek "${projName}"? Seluruh dokumen di bawah proyek ini akan ikut terhapus.`)) {
      return;
    }

    try {
      await api.delete(`/projects/${id}`);
      fetchProjectsAndDocs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus proyek.');
    }
  };

  // Get documents for the selected project
  const projectDocs = selectedProject
    ? documents.filter((doc) => doc.projectId === selectedProject.id)
    : [];

  // Get active document types (subfolders) for this project
  const activeTypes = Array.from(new Set(projectDocs.map((doc) => doc.fileType)));

  // Get documents for the selected subfolder
  const subfolderDocs = selectedType
    ? projectDocs.filter((doc) => doc.fileType === selectedType)
    : [];

  if (loading && projects.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat proyek...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {(selectedProject || selectedType) && (
        <nav className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 shadow-3xs">
          <button 
            onClick={() => { setSelectedProject(null); setSelectedType(null); }}
            className="hover:text-sky-600 font-medium transition-all"
          >
            Daftar Proyek
          </button>
          {selectedProject && (
            <>
              <span className="text-slate-400">/</span>
              <button 
                onClick={() => setSelectedType(null)}
                className={`hover:text-sky-600 font-medium transition-all ${!selectedType ? 'text-sky-600 font-semibold' : ''}`}
              >
                {selectedProject.name}
              </button>
            </>
          )}
          {selectedType && (
            <>
              <span className="text-slate-400">/</span>
              <span className="text-sky-600 font-semibold">{DOC_TYPE_LABELS[selectedType] || selectedType}</span>
            </>
          )}
        </nav>
      )}

      {/* VIEW 1: PROJECT LIST (ROOT VIEW) */}
      {!selectedProject && (
        <>
          {/* Top Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Daftar Proyek Konstruksi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelompokkan berkas penawaran, BOQ, gambar teknis, dan RFQ berdasarkan proyek aktif.</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-600/20 transition-all"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Tambah Proyek
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center">
              <p className="text-sm font-semibold text-rose-800">{error}</p>
              <button
                onClick={fetchProjectsAndDocs}
                className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 transition-all shadow-sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba Lagi
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {projects.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-6 rounded-l-lg">Nama Proyek</th>
                      <th className="py-3 px-6">Deskripsi Proyek</th>
                      <th className="py-3 px-6">Tanggal Dibuat</th>
                      {isSuperAdmin && <th className="py-3 px-6 text-right rounded-r-lg">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600 dark:text-slate-300">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50 dark:bg-slate-900/30 transition-all">
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="h-4.5 w-4.5 text-sky-500" />
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-sky-600 hover:underline text-left"
                            >
                              {project.name}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-sm truncate">{project.description || '-'}</td>
                        <td className="py-4 px-6 text-slate-400 text-xs">{new Date(project.createdAt).toLocaleDateString('id-ID')}</td>
                        {isSuperAdmin && (
                          <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => openEditModal(project)}
                              className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.name)}
                              className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all shadow-2xs"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">
                  Belum ada proyek terdaftar.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: SUBFOLDER GRID (PROJECT VIEW) */}
      {selectedProject && !selectedType && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedProject.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedProject.description || 'Tidak ada deskripsi proyek.'}</p>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900 rounded-xl shadow-xs transition-all"
            >
              Kembali ke Daftar Proyek
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sub Folder Dokumen</h3>
            
            {activeTypes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeTypes.map((type) => {
                  const count = projectDocs.filter((d) => d.fileType === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/45 hover:bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs transition-all text-left group"
                    >
                      <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-all text-amber-600 mr-4 shadow-3xs">
                        <Folder className="h-5.5 w-5.5 fill-amber-500/10" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 transition-all text-sm">
                          {DOC_TYPE_LABELS[type] || type}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{count} Berkas</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-400">
                Belum ada dokumen yang diunggah untuk proyek ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: FILE LIST TABLE (SUBFOLDER VIEW) */}
      {selectedProject && selectedType && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{DOC_TYPE_LABELS[selectedType] || selectedType}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daftar berkas di dalam folder untuk proyek {selectedProject.name}</p>
            </div>
            <button
              onClick={() => setSelectedType(null)}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-900 rounded-xl shadow-xs transition-all"
            >
              Kembali ke Folder Proyek
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {subfolderDocs.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3.5 px-6 rounded-l-lg">Nama Dokumen</th>
                      <th className="py-3.5 px-6">Diunggah Oleh</th>
                      <th className="py-3.5 px-6">Ukuran</th>
                      <th className="py-3.5 px-6">Status Dokumen</th>
                      <th className="py-3.5 px-6 text-right rounded-r-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600 dark:text-slate-300">
                    {subfolderDocs.map((doc) => {
                      const isOwner = doc.uploadedById === user?.id;
                      const canDelete = isSuperAdmin || isOwner;
                      const isExcel = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls');
                      const hasDetails = isExcel && (doc.fileType === 'BOQ' || doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'RFQ_SCAN_KOSONG');

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:bg-slate-900/30 transition-all">
                          <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2.5">

                            {(doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT') && <ImageIcon className="h-5 w-5 text-sky-500 shrink-0" />}
                            {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />}
                            {(doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL') && <FileCheck className="h-5 w-5 text-purple-600 shrink-0" />}
                            {(doc.fileType === 'RFQ_SCAN_KOSONG' || doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' || doc.fileType === 'RAB' || doc.fileType === 'FORECAST_COST' || doc.fileType === 'FOTO') && <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />}
                            <span className="truncate max-w-[300px]" title={doc.fileName}>{doc.fileName}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-medium text-slate-700 dark:text-slate-200">{doc.uploadedBy?.name}</span>
                              <span className="block text-3xs text-slate-400 font-mono mt-0.5">{doc.uploadedBy?.role}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-xs">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold border ${
                              doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              doc.status === 'REVISED_BY_PROCUREMENT' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              doc.status === 'PO_PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              doc.status === 'PO_RELEASED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              doc.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700'
                            }`}>
                              {doc.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                            {hasDetails ? (
                              <button
                                onClick={() => handleOpenDetails(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 transition-all shadow-2xs"
                                title="Buka Detail Rincian Excel"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewFile(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 transition-all shadow-2xs"
                                title="Buka / Preview Berkas"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {canDownloadDoc(user?.role || '', doc.fileType) && (
                              <button
                                onClick={() => handleDownload(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 transition-all shadow-2xs"
                                title="Unduh Berkas Asli"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleFileDelete(doc.id, doc.fileName)}
                                className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all shadow-2xs"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">
                  Belum ada berkas di dalam folder ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL PANELS (EXCEL PREVIEW) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Rincian Data: {selectedDoc.fileName}</h3>
                <p className="text-3xs text-slate-400 mt-1">Tipe: <span className="font-bold">{selectedDoc.fileType}</span> | Proyek: {selectedDoc.project?.name}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {loadingDetails ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin text-sky-500 h-6 w-6" /></div>
              ) : (
                <>
                  {/* BOQ RENDER */}
                  {boqDetails && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-slate-400 font-semibold">Total Anggaran BOQ:</p>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">Rp {boqDetails.totalAmount.toLocaleString('id-ID')}</h4>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">BOQ Sheet</span>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">Kode WBS</th>
                              <th className="py-2.5 px-4">Deskripsi Pekerjaan</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4 text-right">Harga (Eng)</th>
                              <th className="py-2.5 px-4 text-right">Harga (Proc)</th>
                              <th className="py-2.5 px-4 text-right">Total Sub</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                            {boqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.wbsCode || '-'}</td>
                                <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.rateEngineering.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right text-sky-600 font-bold">Rp {item.rateProcurement.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PENAWARAN RENDER */}
                  {penawaranDetails && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{penawaranDetails.vendorName}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{penawaranDetails.quoteNumber || '-'}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                          <h4 className="font-bold text-purple-700 mt-0.5 text-sm">Rp {penawaranDetails.totalOffer.toLocaleString('id-ID')}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Masa Berlaku:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            {penawaranDetails.validityDate ? new Date(penawaranDetails.validityDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                              <th className="py-2.5 px-4 text-right">Total Sub</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                            {penawaranDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* RFQ RENDER */}
                  {rfqDetails && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor RFQ:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{rfqDetails.rfqNumber}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Batas Target Tanggal:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            {rfqDetails.targetDate ? new Date(rfqDetails.targetDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-semibold">Ketentuan Serah Terima & Syarat Pembayaran (Terms):</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{rfqDetails.terms || '-'}</h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4">Spesifikasi Detail</th>
                              <th className="py-2.5 px-4">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                            {rfqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{item.specifications || '-'}</td>
                                <td className="py-2.5 px-4 italic text-slate-400">{item.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2 text-xs">
              {canDownloadDoc(user?.role || '', selectedDoc.fileType) && (
                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Unduh Berkas Excel Fisik
                </button>
              )}
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Proyek */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {modalMode === 'create' ? 'Tambah Proyek Baru' : 'Edit Proyek'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="my-4 rounded-lg bg-rose-50 p-3 border border-rose-100">
                <p className="text-xs text-rose-800 font-semibold">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Contoh: Pembangunan Jembatan Ampera Baru"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-sky-500 focus:bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
                  placeholder="Deskripsikan lingkup kerja, lokasi, atau klien proyek..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="mr-1.5 h-4.5 w-4.5 animate-spin" />}
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
