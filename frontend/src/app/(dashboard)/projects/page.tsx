'use client';

import React, { useState, useEffect } from 'react';
import api, { getApiBaseUrl } from '@/lib/api';
// import Cookies from 'js-cookie';
import { useAuth } from '@/lib/AuthContext';
import { Project, Document, BoqHeader, BoqItem, PenawaranHeader, RfqHeader, AuditLog, DashboardStats, Role, DocType } from '@/types';
import ProyekAdminDashboard from '@/components/ProyekAdminDashboard';
import {
  Upload,
  Download,
  Trash2,
  Plus,
  Eye,
  Edit,
  Bell,
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
  FolderOpen,
  FolderPlus,
  Save,
  Clock,
  X,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';

const parseJSONString = (str: string | null | undefined) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

const parseRemarks = (remarks: string | undefined | null) => {
  if (!remarks) return {};
  try {
    const parsed = JSON.parse(remarks);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return { statusPekerjaan: remarks };
  }
};

const KLIEN_TERMIN_SLOTS = [
  { id: 'Invoice', name: 'Invoice', label: '1. Invoice', docType: 'INVOICE' },
  { id: 'Faktur', name: 'Faktur', label: '2. Faktur', docType: 'INVOICE' },
  { id: 'Drawing', name: 'Drawing', label: '3. Drawing', docType: 'DRAWING' },
  { id: 'Foto', name: 'Foto', label: '4. Foto', docType: 'FOTO' },
  { id: 'Tanda Terima', name: 'Tanda terima', label: '5. Tanda terima', docType: 'INVOICE' },
  { id: 'BAST', name: '(BAST)', label: '6. (BAST)', docType: 'INVOICE' },
];

const SUBKON_FOLDER_SLOTS = [
  { id: 'SPK', name: 'SPK', label: '1. SPK', docType: 'SPK' },
  { id: 'Payment Request T1', name: 'Payment Request T1', label: '2. Payment Request T1', docType: 'SUBKON_DOCS' },
  { id: 'Payment Request T2', name: 'Payment Request T2', label: '3. Payment Request T2', docType: 'SUBKON_DOCS' },
  { id: 'Payment Request T3', name: 'Payment Request T3', label: '4. Payment Request T3', docType: 'SUBKON_DOCS' },
  { id: 'Payment Request T4', name: 'Payment Request T4', label: '5. Payment Request T4', docType: 'SUBKON_DOCS' },
];

const getProjectDescriptionText = (desc: string | null | undefined) => {
  const parsed = parseJSONString(desc);
  if (parsed && typeof parsed === 'object') {
    return parsed.uraianPekerjaan || 'Detail Proyek';
  }
  return desc || '-';
};

const renderProjectDescription = (desc: string | null | undefined) => {
  const parsed = parseJSONString(desc);
  if (parsed && typeof parsed === 'object') {
    return (
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
        {parsed.reqBy && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Klien</span><span className="font-semibold text-slate-700 dark:text-slate-200">{parsed.reqBy}</span></div>}
        {parsed.uraianPekerjaan && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Pekerjaan</span><span className="font-semibold text-slate-700 dark:text-slate-200">{parsed.uraianPekerjaan}</span></div>}
        {parsed.progress && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Progress</span><span className="font-semibold text-slate-700 dark:text-slate-200">{parsed.progress}</span></div>}
        {parsed.subkon1 && parsed.subkon1 !== '-' && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Subkon</span><span className="font-semibold text-slate-700 dark:text-slate-200">{parsed.subkon1}</span></div>}
      </div>
    );
  }
  return <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc || 'Tidak ada deskripsi proyek.'}</p>;
};

const canDownloadDoc = (role: string, fileType: string) => {
  if (role === 'SUPERADMIN' || role === 'ADMIN_MONITORING' || role === 'PROCUREMENT' || role === 'FINANCE' || role === 'ENGINEERING') return true;
  if (role === 'PROYEK_ADMIN') {
    return [
      'SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE', 'SUBKON_DOCS',
      'RFQ_SCAN_KOSONG', 'DRAWING', 'FOTO', 'RAB', 'BOQ'
    ].includes(fileType);
  }
  return false;
};

export default function ProjectsPage() {
  const { user, isSuperAdmin, isAdminMonitoring, isEngineering, isProyekAdmin, isProcurement, isFinance } = useAuth();

  const effectiveRole = isSuperAdmin ? 'SUPERADMIN' : isEngineering ? 'ENGINEERING' : isProyekAdmin ? 'PROYEK_ADMIN' : isProcurement ? 'PROCUREMENT' : isFinance ? 'FINANCE' : (user?.role || '');

  // Real-time Clock and Greeting states
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

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
  const [subFolderName, setSubFolderName] = useState('');
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

  // View Mode for Menu Proyek (Default 'explorer' so PROYEK_ADMIN sees Project File Explorer & Upload/Edit/Delete controls)
  const [proyekViewMode, setProyekViewMode] = useState<'explorer' | 'excel'>('explorer');

  // States Admin/Superadmin (Tabs & Project Management)
  const [adminTab, setAdminTab] = useState<'projects' | 'documents' | 'audit_logs'>('projects');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [projSubmitting, setProjSubmitting] = useState(false);

  // States Project Form (Create & Edit)
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null); // null means create, otherwise edit
  const [projectFormCode, setProjectFormCode] = useState('MJK');
  const [projectFormClient, setProjectFormClient] = useState('');
  const [projectFormName, setProjectFormName] = useState('');
  const [projectFormDesc, setProjectFormDesc] = useState('');
  const [projectFormProgress, setProjectFormProgress] = useState(0);
  const [projectFormStartDate, setProjectFormStartDate] = useState('');
  const [projectFormEndDate, setProjectFormEndDate] = useState('');
  const [projectFormRemarks, setProjectFormRemarks] = useState('');

  // States Master Data untuk Form Proyek
  const [masterCompanies, setMasterCompanies] = useState<{ code: string, name: string }[]>([]);
  const [masterClients, setMasterClients] = useState<{ code: string, name: string }[]>([]);

  // States for Master Directory (data.txt)
  const [showMasterDirectory, setShowMasterDirectory] = useState(false);
  const [masterSubFolders, setMasterSubFolders] = useState<string[]>([]);
  const [selectedSubFolder, setSelectedSubFolder] = useState<string | null>(null);
  const [selectedSubFolderCategory, setSelectedSubFolderCategory] = useState<'klien' | 'subkon' | 'internal' | null>(null);
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // States Folder Explorer
  const [explorerProject, setExplorerProject] = useState<Project | null>(null);
  const [explorerFolder, setExplorerFolder] = useState<'klien' | 'subkon' | 'internal' | null>(null);
  const [subExplorerFolder, setSubExplorerFolder] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // States Create Custom Folder (Klien Termin / Subkon)
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [createFolderType, setCreateFolderType] = useState<'klien' | 'subkon'>('klien');
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderNameInput.trim() || !explorerProject) return;

    const newFolderName = newFolderNameInput.trim();
    setFolderSubmitting(true);
    try {
      const parsedRemarks = parseRemarks(explorerProject.remarks);
      const key = createFolderType === 'klien' ? 'klienTerminFolders' : 'subkonFolders';
      const existingFolders: string[] = parsedRemarks[key] || [];

      const updatedFolders = Array.from(new Set([...existingFolders, newFolderName]));
      const updatedRemarks = {
        ...parsedRemarks,
        [key]: updatedFolders,
      };

      const remarksStr = JSON.stringify(updatedRemarks);

      // Instant local state update for zero latency
      const updatedProject = {
        ...explorerProject,
        remarks: remarksStr,
      };

      setExplorerProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));

      setCreateFolderModalOpen(false);
      setNewFolderNameInput('');

      // Background API sync
      await api.put(`/projects/${explorerProject.id}`, {
        remarks: remarksStr,
      });

      loadData();
    } catch (err: any) {
      alert('Gagal membuat folder baru.');
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleDeleteCreatedFolder = async (folderName: string, type: 'klien' | 'subkon') => {
    if (!confirm(`Hapus folder "${folderName}" beserta seluruh berkas di dalamnya dari proyek ini?`)) return;
    try {
      if (!explorerProject) return;

      // 1. Delete associated documents from DB & local state
      const matchingDocs = documents.filter(
        (d) =>
          d.projectId === explorerProject.id &&
          d.subFolderName &&
          (d.subFolderName === folderName ||
            d.subFolderName.startsWith(`${folderName} - `) ||
            d.subFolderName.startsWith(`${folderName}::`) ||
            d.subFolderName.startsWith(folderName))
      );

      for (const doc of matchingDocs) {
        try {
          await api.delete(`/documents/${doc.id}`);
        } catch (e) {
          console.error(`Gagal menghapus berkas ${doc.id}:`, e);
        }
      }

      setDocuments((prev) => prev.filter((d) => !matchingDocs.some((m) => m.id === d.id)));

      // 2. Update remarks JSON in project
      const parsedRemarks = parseRemarks(explorerProject.remarks);
      const key = type === 'klien' ? 'klienTerminFolders' : 'subkonFolders';
      const existingFolders: string[] = parsedRemarks[key] || [];

      const updatedFolders = existingFolders.filter((f) => f !== folderName);
      const updatedRemarks = {
        ...parsedRemarks,
        [key]: updatedFolders,
      };

      const remarksStr = JSON.stringify(updatedRemarks);

      // 3. Instant local state update
      const updatedProject = {
        ...explorerProject,
        remarks: remarksStr,
      };
      setExplorerProject(updatedProject);
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));

      if (subExplorerFolder?.includes(folderName)) {
        setSubExplorerFolder(null);
      }

      // 4. Background API sync
      await api.put(`/projects/${explorerProject.id}`, {
        remarks: remarksStr,
      });

      await loadDataBackground();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus folder.');
    }
  };

  // States Explorer Doc Details
  const [selectedExplorerDoc, setSelectedExplorerDoc] = useState<Document | null>(null);
  const [explorerBoqDetails, setExplorerBoqDetails] = useState<BoqHeader | null>(null);
  const [explorerPenawaranDetails, setExplorerPenawaranDetails] = useState<PenawaranHeader | null>(null);
  const [explorerRfqDetails, setExplorerRfqDetails] = useState<RfqHeader | null>(null);
  const [loadingExplorerDetails, setLoadingExplorerDetails] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load Projects, Documents, Stats, Logs, data.txt list, & Master Data
      const [projRes, docRes, statsRes, logsRes, dataTxtRes, compRes, cliRes] = await Promise.all([
        api.get('/projects'),
        api.get('/documents'),
        api.get('/monitoring/stats'),
        api.get('/monitoring/audit-logs'),
        api.get('/projects/data-txt').catch(() => ({ data: { data: [] } })),
        api.get('/master-data/companies').catch(() => ({ data: { data: [] } })),
        api.get('/master-data/clients').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(projRes.data.data);
      setDocuments(docRes.data.data);
      setStats(statsRes.data.data);
      setAuditLogs(logsRes.data.data);

      setMasterCompanies(compRes.data?.data || []);
      setMasterClients(cliRes.data?.data || []);

      const txtFolders = dataTxtRes.data?.data || [];
      const dbFolders = projRes.data.data.map((p: any) => p.name);
      const allFolders = Array.from(new Set([...txtFolders, ...dbFolders]));
      setMasterSubFolders(allFolders);

      return { projects: projRes.data.data, documents: docRes.data.data };
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadDataBackground = async () => {
    try {
      const [projRes, docRes, statsRes, logsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/documents'),
        api.get('/monitoring/stats'),
        api.get('/monitoring/audit-logs')
      ]);
      setProjects(projRes.data.data);
      setDocuments(docRes.data.data);
      setStats(statsRes.data.data);
      setAuditLogs(logsRes.data.data);
    } catch (err) {
      // Ignore background errors
    }
  };

  useEffect(() => {
    loadData().then((data) => {
      // Auto open from URL query params
      const searchParams = new URLSearchParams(window.location.search);
      const projectId = searchParams.get('projectId');
      const docId = searchParams.get('docId');

      if (projectId && data?.projects) {
        const proj = data.projects.find((p: Project) => p.id === projectId);
        if (proj) setExplorerProject(proj);
      }

      if (docId && data?.documents && data?.projects) {
        const doc = data.documents.find((d: Document) => d.id === docId);
        if (doc) {
          const proj = data.projects.find((p: Project) => p.id === doc.projectId);
          if (proj) {
            setExplorerProject(proj);
            // We can also auto-open the folder based on doc fileType
            let folder: 'klien' | 'subkon' | 'internal' | null = null;
            if (['SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE'].includes(doc.fileType)) folder = 'klien';
            else if (['SUBKON_DOCS', 'RFQ_SCAN_KOSONG'].includes(doc.fileType)) folder = 'subkon';
            else folder = 'internal';

            setExplorerFolder(folder);

            // Highlight or auto-open doc details if needed
            handleOpenExplorerDetails(doc);
          }
        }
      }
    });

    // 1. Instant event listener untuk perubahan data instan di tab ini
    const handleDataChanged = () => {
      loadDataBackground();
    };
    window.addEventListener('app_data_changed', handleDataChanged);

    // 2. BroadcastChannel listener untuk sinkronisasi instan lintas tab browser
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('app_data_sync');
      channel.onmessage = () => {
        loadDataBackground();
      };
    }

    // 3. Background polling interval 10000ms (10 detik) sebagai fallback
    const interval = setInterval(() => {
      loadDataBackground();
    }, 10000);

    return () => {
      window.removeEventListener('app_data_changed', handleDataChanged);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openUploadModal = () => {
    if (isEngineering) {
      setUploadFileType('DRAWING');
    } else if (isProcurement) {
      setUploadFileType('BOQ');
    } else if (isFinance) {
      setUploadFileType('INVOICE');
    } else {
      setUploadFileType('SPK');
    }
    setUploadModalOpen(true);
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
    formData.append('projectId', uploadProject);

    if (uploadFileType === 'SUBKON_DOCS') {
      formData.append('subFolderName', subFolderName);
    }

    if (uploadFileType === 'PENAWARAN_DRAFT') {
      formData.append('vendorName', vendorName);
      formData.append('quoteNumber', quoteNumber);
      formData.append('validityDate', validityDate);
    } else if (uploadFileType === 'RFQ_SCAN_KOSONG') {
      formData.append('rfqNumber', rfqNumber);
      formData.append('targetDate', targetDate);
      formData.append('terms', terms);
    }

    formData.append('file', uploadFile);

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
      await loadData();
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
    } catch (err: any) {
      let serverMsg = '';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) serverMsg = json.message;
        } catch (e) { }
      } else if (err?.response?.data?.message) {
        serverMsg = err.response.data.message;
      }
      alert(serverMsg ? `Gagal mengunduh berkas: ${serverMsg}` : 'Gagal mengunduh berkas dari server.');
    }
  };

  // VIEW DOKUMEN INLINE (TAB BARU)
  const handleViewFile = (doc: Document) => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();
    window.open(`${baseUrl}/documents/view/${doc.id}?token=${token}`, '_blank');
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

  // SETUJUI DOKUMEN (Procurement / Superadmin)
  const handleApproveDocument = async (docId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui (APPROVED) dokumen ini?')) {
      return;
    }
    try {
      await api.put(`/documents/${docId}/status`, { status: 'APPROVED' });
      alert('Dokumen berhasil disetujui (APPROVED)!');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui dokumen.');
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
      await loadData();
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
      await loadData();
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
      await loadData(); // refresh parent stats
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



  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Hapus proyek "${name}"? Seluruh berkas yang terhubung dengan proyek ini akan terhapus.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${id}`);
      await loadData();
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

  const getProjectCode = (projectName: string | Project) => {
    if (projectName && typeof projectName === 'object') {
      if (projectName.code) return projectName.code;
      projectName = projectName.name;
    }
    if (!projectName) return '-';
    const initials = projectName
      .split(' ')
      .map(word => word[0])
      .join('')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase();
    return `PRJ-${initials.slice(0, 4)}`;
  };

  const GROUP_FILE_TYPES = {
    klien: ['SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE'],
    subkon: ['SUBKON_DOCS', 'RFQ_SCAN_KOSONG'],
    internal: ['DRAWING', 'FOTO', 'RAB', 'PENAWARAN_DRAFT', 'BOQ', 'FORECAST_COST']
  };

  const GROUP_LABELS = {
    klien: 'Klien',
    subkon: 'Subkon',
    internal: 'Internal'
  };

  const DOC_TYPE_LABELS: Record<string, string> = {
    SPK: 'SPK (Klien)',
    PENAWARAN_FINAL: 'Penawaran Final (Klien)',
    DRAWING_AS_BUILT: 'Drawing As-Built (Klien)',
    INVOICE: 'Invoice (Klien)',
    SUBKON_DOCS: 'Subkon Docs',
    RFQ_SCAN_KOSONG: 'RFQ Scan / Kosong',
    DRAWING: 'Drawing (Internal)',
    FOTO: 'Foto (Internal)',
    RAB: 'RAB (Internal)',
    PENAWARAN_DRAFT: 'Penawaran Draft',
    BOQ: 'BOQ (Cost Material Excel)',
    FORECAST_COST: 'Forecast Cost (Excel)',
  };

  const getAllowedUploadTypesForGroup = (role: string, group: 'klien' | 'subkon' | 'internal') => {
    const groupTypes = GROUP_FILE_TYPES[group];
    let roleTypes: string[] = [];
    if (role === 'SUPERADMIN') {
      roleTypes = ['SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE', 'SUBKON_DOCS', 'RFQ_SCAN_KOSONG', 'DRAWING', 'FOTO', 'RAB', 'PENAWARAN_DRAFT', 'BOQ', 'FORECAST_COST'];
    } else if (role === 'ENGINEERING') {
      roleTypes = ['DRAWING', 'RAB', 'PENAWARAN_DRAFT', 'FORECAST_COST', 'DRAWING_AS_BUILT', 'RFQ_SCAN_KOSONG', 'SUBKON_DOCS', 'BOQ'];
    } else if (role === 'PROYEK_ADMIN') {
      roleTypes = ['SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE', 'SUBKON_DOCS', 'RFQ_SCAN_KOSONG', 'DRAWING', 'FOTO', 'RAB', 'BOQ'];
    } else if (role === 'PROCUREMENT') {
      roleTypes = ['BOQ'];
    } else if (role === 'FINANCE') {
      roleTypes = [];
    }
    return groupTypes.filter(t => roleTypes.includes(t));
  };

  const filteredExplorerDocs = documents.filter((doc) => {
    if (!explorerProject || !explorerFolder) return false;
    const isProjMatch = doc.projectId === explorerProject.id;
    const isGroupMatch = GROUP_FILE_TYPES[explorerFolder].includes(doc.fileType);
    const matchQuery = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subFolderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType ? doc.fileType === filterType : true;
    return isProjMatch && isGroupMatch && matchQuery && matchType;
  });

  const filteredMasterDocs = documents.filter((doc) => {
    if (!selectedSubFolder || !selectedSubFolderCategory) return false;
    const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
    if (!realProj) return false;
    const isProjMatch = doc.projectId === realProj.id;
    const isGroupMatch = GROUP_FILE_TYPES[selectedSubFolderCategory].includes(doc.fileType);
    const matchQuery = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subFolderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType ? doc.fileType === filterType : true;
    return isProjMatch && isGroupMatch && matchQuery && matchType;
  });

  const ensureProjectExists = async (projectName: string) => {
    const existing = projects.find(p => p.name === projectName || p.code === projectName);
    if (existing) return existing.id;
    const res = await api.post('/projects', {
      name: projectName,
      code: projectName,
      description: `Proyek otomatis dari Direktori Utama data.txt`
    });
    // refresh list
    const projRes = await api.get('/projects');
    setProjects(projRes.data.data);
    return res.data.data.id;
  };

  const handleUploadToMasterSubFolder = async () => {
    try {
      setLoading(true);
      const realProjId = await ensureProjectExists(selectedSubFolder!);
      setUploadProject(realProjId);
      const allowed = getAllowedUploadTypesForGroup(effectiveRole, selectedSubFolderCategory!);
      if (allowed.length === 0) {
        alert('Peran Anda tidak diperbolehkan mengunggah berkas di folder ini.');
        return;
      }
      setUploadFileType(allowed[0] as DocType);
      setUploadModalOpen(true);
    } catch (err) {
      alert('Gagal menginisialisasi proyek di database.');
    } finally {
      setLoading(false);
    }
  };

  const extractCompanyCode = (code: string) => {
    if (!code) return 'MJK';
    if (code.includes('MJK')) return 'MJK';
    if (code.includes('DJI')) return 'DJI';
    if (code.includes('IRI')) return 'IRI';
    return 'MJK';
  };

  const handleOpenProjectForm = (project?: Project) => {
    if (project) {
      setEditingProjectId(project.id);
      setProjectFormCode(extractCompanyCode(project.code));
      setProjectFormClient('');
      setProjectFormName(project.name);
      setProjectFormDesc(project.description || '');
      setProjectFormProgress(project.progress || 0);
      setProjectFormStartDate(project.startDate ? project.startDate.split('T')[0] : '');
      setProjectFormEndDate(project.endDate ? project.endDate.split('T')[0] : '');
      setProjectFormRemarks(project.remarks || '');
    } else {
      setEditingProjectId(null);
      setProjectFormCode('MJK');
      setProjectFormClient('');
      setProjectFormName('');
      setProjectFormDesc('');
      setProjectFormProgress(0);
      setProjectFormStartDate('');
      setProjectFormEndDate('');
      setProjectFormRemarks('');
    }
    setProjectFormOpen(true);
  };

  const handleSaveProjectForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjSubmitting(true);
    try {
      const payload = {
        name: projectFormName,
        client: projectFormClient,
        description: projectFormDesc,
        code: projectFormCode,
        progress: Number(projectFormProgress),
        startDate: projectFormStartDate || null,
        endDate: projectFormEndDate || null,
        remarks: projectFormRemarks
      };

      if (editingProjectId) {
        await api.put(`/projects/${editingProjectId}`, payload);
        alert('Proyek berhasil diperbarui!');
      } else {
        await api.post('/projects', payload);
        alert('Proyek berhasil ditambahkan!');
      }

      setProjectFormOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setProjSubmitting(false);
    }
  };

  const handleOpenExplorerDetails = async (doc: Document) => {
    setSelectedExplorerDoc(doc);
    setLoadingExplorerDetails(true);
    setExplorerBoqDetails(null);
    setExplorerPenawaranDetails(null);
    setExplorerRfqDetails(null);

    try {
      if (doc.fileType === 'BOQ') {
        const res = await api.get(`/documents/boq/${doc.id}`);
        setExplorerBoqDetails(res.data.data);
      } else if (doc.fileType === 'PENAWARAN_DRAFT') {
        const res = await api.get(`/documents/penawaran/${doc.id}`);
        setExplorerPenawaranDetails(res.data.data);
      } else if (doc.fileType === 'RFQ_SCAN_KOSONG') {
        const res = await api.get(`/documents/rfq/${doc.id}`);
        setExplorerRfqDetails(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengambil rincian berkas.');
      setSelectedExplorerDoc(null);
    } finally {
      setLoadingExplorerDetails(false);
    }
  };

  const handleSaveBoqItemExplorer = async (itemId: string) => {
    setBoqSaving(true);
    try {
      await api.put(`/documents/boq/items/${itemId}`, {
        rateProcurement: parseFloat(editRateValue),
        notes: editNotesValue,
      });
      const res = await api.get(`/documents/boq/${selectedExplorerDoc!.id}`);
      setExplorerBoqDetails(res.data.data);
      setEditingBoqItem(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengedit harga item.');
    } finally {
      setBoqSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ---------------------------------------------------- */}
      {/* PROJECT FILE EXPLORER (Main View for Menu Proyek)   */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
        {/* Breadcrumbs & Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <button
              onClick={() => {
                setExplorerProject(null);
                setExplorerFolder(null);
                setShowMasterDirectory(false);
                setSelectedSubFolder(null);
                setSelectedSubFolderCategory(null);
              }}
              className="hover:text-sky-600 font-bold transition-all flex items-center"
            >
              <Building2 className="h-4 w-4 mr-1.5 text-slate-400" />
              Proyek
            </button>

            {/* Path for Master Directory */}
            {showMasterDirectory && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => {
                    setSelectedSubFolder(null);
                    setSelectedSubFolderCategory(null);
                  }}
                  className={`hover:text-sky-600 font-semibold transition-all ${!selectedSubFolder ? 'text-sky-600 font-extrabold' : ''}`}
                >
                  Direktori Utama
                </button>
              </>
            )}

            {showMasterDirectory && selectedSubFolder && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setSelectedSubFolderCategory(null)}
                  className={`hover:text-sky-600 font-semibold transition-all ${!selectedSubFolderCategory ? 'text-sky-600 font-extrabold' : ''}`}
                >
                  {selectedSubFolder}
                </button>
              </>
            )}

            {showMasterDirectory && selectedSubFolder && selectedSubFolderCategory && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-sky-600 font-extrabold capitalize">
                  {GROUP_LABELS[selectedSubFolderCategory]}
                </span>
              </>
            )}

            {/* Path for Database Projects */}
            {!showMasterDirectory && explorerProject && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setExplorerFolder(null)}
                  className={`hover:text-sky-600 font-semibold transition-all ${!explorerFolder ? 'text-sky-600 font-extrabold' : ''}`}
                >
                  [{getProjectCode(explorerProject.name)}] {explorerProject.name}
                </button>
              </>
            )}

            {!showMasterDirectory && explorerProject && explorerFolder && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setSubExplorerFolder(null)}
                  className={`hover:text-sky-600 font-semibold transition-all ${!subExplorerFolder ? 'text-sky-600 font-extrabold' : ''}`}
                >
                  {GROUP_LABELS[explorerFolder]}
                </button>
              </>
            )}

            {!showMasterDirectory && explorerProject && explorerFolder && subExplorerFolder && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-sky-600 font-extrabold truncate max-w-[200px]">
                  {DOC_TYPE_LABELS[subExplorerFolder] ||
                    subExplorerFolder
                      .replace('KLIEN_TERMIN::', '')
                      .replace('SUBKON_FOLDER::', '')
                      .replace('::SLOT::', ' / ')}
                </span>
              </>
            )}
          </nav>

          {/* Actions at current level */}
          <div className="flex items-center gap-2">
            {/* Segarkan Data (Only at Root level) */}
            {!explorerProject && (
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Segarkan Data
              </button>
            )}
            {/* Hanya Superadmin yang dapat menambah proyek baru (Only at Root level) */}
            {!explorerProject && !showMasterDirectory && isSuperAdmin && (
              <button
                onClick={() => handleOpenProjectForm()}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Tambah Proyek
              </button>
            )}
            {/* Upload document button (Only at Folder level) */}
            {explorerProject && explorerFolder && getAllowedUploadTypesForGroup(effectiveRole, explorerFolder).length > 0 && (
              <button
                onClick={() => {
                  setUploadProject(explorerProject.id);
                  const allowed = getAllowedUploadTypesForGroup(effectiveRole, explorerFolder);
                  setUploadFileType(allowed[0] as DocType);
                  setUploadModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Unggah Berkas
              </button>
            )}
            {/* Upload document button for Master Directory virtual categories */}
            {showMasterDirectory && selectedSubFolder && selectedSubFolderCategory && getAllowedUploadTypesForGroup(effectiveRole, selectedSubFolderCategory).length > 0 && (
              <button
                onClick={handleUploadToMasterSubFolder}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Unggah Berkas
              </button>
            )}
            {(explorerProject || showMasterDirectory) && (
              <button
                onClick={() => {
                  if (explorerFolder) {
                    setExplorerFolder(null);
                  } else if (explorerProject) {
                    setExplorerProject(null);
                  } else if (selectedSubFolderCategory) {
                    setSelectedSubFolderCategory(null);
                  } else if (selectedSubFolder) {
                    setSelectedSubFolder(null);
                  } else if (showMasterDirectory) {
                    setShowMasterDirectory(false);
                  }
                }}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all"
              >
                Kembali
              </button>
            )}
          </div>
        </div>
        {/* VIEW 1: PROJECTS TABLE (ROOT VIEW) */}
        {!explorerProject && !showMasterDirectory && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Projects Table */}
            <div className="space-y-4">
              {/* MASTER DIRECTORY FOLDER CARD */}
              <div
                onClick={() => {
                  setShowMasterDirectory(true);
                  setSelectedSubFolder(null);
                  setSelectedSubFolderCategory(null);
                }}
                className="group bg-gradient-to-br from-amber-50 to-orange-50/40 hover:from-sky-50 hover:to-sky-50/30 border border-amber-200/50 hover:border-sky-300 rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-3xs hover:shadow-2xs"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-500 group-hover:bg-sky-600 rounded-xl text-white shadow-2xs transition-all">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 transition-all">
                      📁 DIREKTORI UTAMA DATA PROYEK
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">
                      Menampilkan subfolder proyek secara dinamis ({masterSubFolders.length} subfolder)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-600 group-hover:text-sky-600 transition-all">
                  <span>Buka Direktori</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider pt-2">Direktori Proyek Lapangan</h4>
              {projects.length > 0 ? (
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                    <thead>
                      <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                        <th className="py-2.5 px-4">Kode Proyek</th>
                        <th className="py-2.5 px-4">Nama Proyek</th>
                        <th className="py-2.5 px-4">Progress</th>
                        <th className="py-2.5 px-4 text-center">Mulai / Selesai</th>
                        <th className="py-2.5 px-4">Keterangan</th>
                        <th className="py-2.5 px-4 text-center">Jalan Pintas</th>
                        {(isSuperAdmin || isProyekAdmin) && <th className="py-2.5 px-4 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                      {projects.map((proj) => {
                        const code = proj.code || getProjectCode(proj.name);
                        return (
                          <tr key={proj.id} className="hover:bg-slate-50 dark:bg-slate-900/20">
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{code}</td>
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{proj.name}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-700 dark:text-slate-200 min-w-[30px]">
                                  {proj.progress ?? 0}%
                                </span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${proj.progress ?? 0}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {proj.startDate ? new Date(proj.startDate).toLocaleDateString('id-ID') : '-'}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                                s.d. {proj.endDate ? new Date(proj.endDate).toLocaleDateString('id-ID') : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-[200px] truncate text-slate-500 dark:text-slate-400" title={getProjectDescriptionText(proj.description)}>
                              {getProjectDescriptionText(proj.description)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setExplorerProject(proj);
                                    setExplorerFolder('klien');
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-100 rounded-md shadow-3xs transition-all"
                                >
                                  Klien
                                </button>
                                <button
                                  onClick={() => {
                                    setExplorerProject(proj);
                                    setExplorerFolder('subkon');
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-md shadow-3xs transition-all"
                                >
                                  Subkon
                                </button>
                                {!isProyekAdmin && (
                                  <button
                                    onClick={() => {
                                      setExplorerProject(proj);
                                      setExplorerFolder('internal');
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-md shadow-3xs transition-all"
                                  >
                                    Internal
                                  </button>
                                )}
                              </div>
                            </td>
                            {(isSuperAdmin || isProyekAdmin) && (
                              <td className="py-3 px-4 text-right space-x-1.5">
                                <button
                                  onClick={() => handleOpenProjectForm(proj)}
                                  className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-3xs transition-all"
                                  title="Edit Informasi Proyek"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteProject(proj.id, proj.name)}
                                    className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 shadow-3xs transition-all"
                                    title="Hapus Proyek"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center text-slate-400 font-semibold text-xs bg-slate-50 dark:bg-slate-900/30">
                  Belum ada proyek terdaftar. Silakan tambah proyek baru.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MASTER DIRECTORY VIEW 1: SUBFOLDERS LIST (data.txt) */}
        {/* ==================================================== */}
        {showMasterDirectory && !selectedSubFolder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Direktori Utama</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Menampilkan subfolder proyek dinamis.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama subfolder..."
                  value={masterSearchQuery}
                  onChange={(e) => setMasterSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-[520px] overflow-y-auto pr-1 pt-2">
              {masterSubFolders
                .filter(folderName => folderName.toLowerCase().includes(masterSearchQuery.toLowerCase()))
                .map((subFolder, index) => {
                  const realProj = projects.find(p => p.name === subFolder || p.code === subFolder);
                  const docsCount = realProj ? documents.filter(d => d.projectId === realProj.id).length : 0;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedSubFolder(subFolder);
                        setSelectedSubFolderCategory(null);
                      }}
                      className="group p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center space-y-2"
                    >
                      <FolderOpen className="h-10 w-10 text-amber-500 group-hover:text-sky-500 transition-all fill-amber-500/10" />
                      <span className="text-xs font-bold text-slate-700 dark:border-slate-200 group-hover:text-sky-600 transition-all truncate w-full" title={subFolder}>
                        {subFolder}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        {docsCount} Berkas
                      </span>
                    </div>
                  );
                })}
              {masterSubFolders.filter(folderName => folderName.toLowerCase().includes(masterSearchQuery.toLowerCase())).length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs font-bold">
                  Tidak ada subfolder yang cocok dengan kata kunci "{masterSearchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MASTER DIRECTORY VIEW 2: CATEGORY SUBFOLDERS (Klien, Subkon, Internal) */}
        {/* ==================================================== */}
        {showMasterDirectory && selectedSubFolder && !selectedSubFolderCategory && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">📁 {selectedSubFolder}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Silakan pilih direktori dokumen di bawah ini.</p>
            </div>

            <div className={`grid grid-cols-1 ${isProyekAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-6 pt-2`}>
              {/* Klien folder */}
              <div
                onClick={() => setSelectedSubFolderCategory('klien')}
                className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
              >
                <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                  <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Klien</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                    {(() => {
                      const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
                      return realProj ? documents.filter(d => d.projectId === realProj.id && GROUP_FILE_TYPES.klien.includes(d.fileType)).length : 0;
                    })()} Berkas
                  </p>
                </div>
              </div>

              {/* Subkon folder */}
              <div
                onClick={() => setSelectedSubFolderCategory('subkon')}
                className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
              >
                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 text-amber-500 mr-4 shadow-3xs transition-all">
                  <FolderOpen className="h-6 w-6 fill-amber-500/10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Subkon</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                    {(() => {
                      const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
                      return realProj ? documents.filter(d => d.projectId === realProj.id && GROUP_FILE_TYPES.subkon.includes(d.fileType)).length : 0;
                    })()} Berkas
                  </p>
                </div>
              </div>

              {/* Internal folder */}
              {!isProyekAdmin && (
                <div
                  onClick={() => setSelectedSubFolderCategory('internal')}
                  className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                >
                  <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 text-emerald-500 mr-4 shadow-3xs transition-all">
                    <FolderOpen className="h-6 w-6 fill-emerald-500/10" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Internal</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                      {(() => {
                        const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
                        return realProj ? documents.filter(d => d.projectId === realProj.id && GROUP_FILE_TYPES.internal.includes(d.fileType)).length : 0;
                      })()} Berkas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MASTER DIRECTORY VIEW 3: FILES LIST INSIDE VIRTUAL CATEGORY */}
        {/* ==================================================== */}
        {showMasterDirectory && selectedSubFolder && selectedSubFolderCategory && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Search & filters inside folder */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama berkas, uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none text-xs cursor-pointer"
                >
                  <option value="">Semua Tipe</option>
                  {GROUP_FILE_TYPES[selectedSubFolderCategory].map((type) => (
                    <option key={type} value={type}>{DOC_TYPE_LABELS[type] || type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Files table */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
              {filteredMasterDocs.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                  <thead>
                    <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-6">Nama Dokumen</th>
                      <th className="py-3 px-6">Tipe</th>
                      <th className="py-3 px-6">Diunggah Oleh</th>
                      <th className="py-3 px-6">Ukuran</th>
                      <th className="py-3 px-6">Tanggal Upload</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                    {filteredMasterDocs.map((doc) => {
                      const isOwner = doc.uploadedById === user?.id;
                      const isProcurementDeletingBoq = isProcurement && doc.fileType === 'BOQ';
                      const canDelete = isSuperAdmin || isProyekAdmin || isOwner || isProcurementDeletingBoq;
                      const isExcel = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls');
                      const hasDetails = isExcel && (doc.fileType === 'BOQ' || doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'RFQ_SCAN_KOSONG');

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:bg-slate-900/20">
                          <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2.5">
                            {(doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT') && <ImageIcon className="h-4.5 w-4.5 text-sky-500 shrink-0" />}
                            {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
                            {(doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL') && <FileCheck className="h-4.5 w-4.5 text-purple-600 shrink-0" />}
                            {(doc.fileType === 'RFQ_SCAN_KOSONG' || doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' || doc.fileType === 'RAB' || doc.fileType === 'FOTO' || doc.fileType === 'FORECAST_COST') && <FileText className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400 shrink-0" />}
                            <div className="flex flex-col">
                              <span className="truncate max-w-[220px]" title={doc.fileName}>{doc.fileName}</span>
                              {doc.fileType === 'SUBKON_DOCS' && doc.subFolderName && (
                                <span className="text-2xs text-sky-500 font-medium">Folder: {doc.subFolderName}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{doc.fileType}</td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.uploadedBy?.name}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{doc.uploadedBy?.role}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                          <td className="py-4 px-6 text-slate-400">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold border ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
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
                                onClick={() => handleOpenExplorerDetails(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 shadow-3xs"
                                title="Buka Detail Rincian Excel"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewFile(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 shadow-3xs"
                                title="Buka / Preview Berkas"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDownloadDoc(effectiveRole, doc.fileType) && (
                              <button
                                onClick={() => handleDownload(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 shadow-3xs"
                                title="Unduh Berkas Asli"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {(isProcurement || isSuperAdmin) && doc.status !== 'APPROVED' && doc.status !== 'PO_RELEASED' && (
                              <button
                                onClick={() => handleApproveDocument(doc.id)}
                                className="inline-flex p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 shadow-3xs"
                                title="Setujui Dokumen (APPROVED)"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {(isFinance || isSuperAdmin) && doc.fileType === 'SUBKON_DOCS' && doc.status === 'PO_PENDING' && (
                              <button
                                onClick={() => handleReleasePo(doc.id)}
                                className="inline-flex p-1.5 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 shadow-3xs"
                                title="Rilis Purchase Order"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                                className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 shadow-3xs"
                                title="Hapus Dokumen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                  Belum ada berkas terdaftar di kategori folder ini. Silakan unggah berkas baru.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: CATEGORY SUBFOLDERS GRID (PROJECT VIEW) */}
        {explorerProject && !explorerFolder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">[{getProjectCode(explorerProject.name)}] {explorerProject.name}</h3>
              {renderProjectDescription(explorerProject.description)}
            </div>

            <div className={`grid grid-cols-1 ${isProyekAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-6 pt-2`}>
              {/* Klien folder */}
              <div
                onClick={() => setExplorerFolder('klien')}
                className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
              >
                <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                  <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Klien</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {documents.filter(d => d.projectId === explorerProject.id && GROUP_FILE_TYPES.klien.includes(d.fileType)).length} Berkas
                  </p>
                </div>
              </div>

              {/* Subkon folder */}
              <div
                onClick={() => setExplorerFolder('subkon')}
                className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
              >
                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 text-amber-500 mr-4 shadow-3xs transition-all">
                  <FolderOpen className="h-6 w-6 fill-amber-500/10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Subkon</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {documents.filter(d => d.projectId === explorerProject.id && GROUP_FILE_TYPES.subkon.includes(d.fileType)).length} Berkas
                  </p>
                </div>
              </div>

              {/* Internal folder */}
              {!isProyekAdmin && (
                <div
                  onClick={() => setExplorerFolder('internal')}
                  className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                >
                  <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 text-emerald-500 mr-4 shadow-3xs transition-all">
                    <FolderOpen className="h-6 w-6 fill-emerald-500/10" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">Internal</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {documents.filter(d => d.projectId === explorerProject.id && GROUP_FILE_TYPES.internal.includes(d.fileType)).length} Berkas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SUB-FOLDERS GRID (KLIEN / SUBCON) */}
        {explorerProject && explorerFolder && !subExplorerFolder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{GROUP_LABELS[explorerFolder]}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                  {explorerFolder === 'klien' ? 'Daftar sub-direktori dan folder termin penagihan klien.' : 'Daftar subfolder vendor subkon dan RFQ penawaran.'}
                </p>
              </div>

              {(explorerFolder === 'klien' || explorerFolder === 'subkon') && (
                <button
                  onClick={() => {
                    setCreateFolderType(explorerFolder as 'klien' | 'subkon');
                    setNewFolderNameInput('');
                    setCreateFolderModalOpen(true);
                  }}
                  className={`inline-flex items-center px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${explorerFolder === 'klien' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  <FolderPlus className="h-4 w-4 mr-1.5" />
                  {explorerFolder === 'klien' ? '+ Buat Folder Klien Baru' : '+ Buat Folder Subkon Baru'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
              {explorerFolder === 'klien' ? (
                <>
                  {/* Default Klien folders */}
                  <div
                    onClick={() => setSubExplorerFolder('SPK')}
                    className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                  >
                    <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                      <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">1. SPK</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                        {documents.filter(d => d.projectId === explorerProject.id && d.fileType === 'SPK').length} Berkas
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSubExplorerFolder('PENAWARAN_FINAL')}
                    className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                  >
                    <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                      <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">2. Penawaran Final (Scan PDF)</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                        {documents.filter(d => d.projectId === explorerProject.id && d.fileType === 'PENAWARAN_FINAL').length} Berkas
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSubExplorerFolder('DRAWING_AS_BUILT')}
                    className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                  >
                    <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                      <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">3. Drawing Gambar (As-Built)</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                        {documents.filter(d => d.projectId === explorerProject.id && d.fileType === 'DRAWING_AS_BUILT').length} Berkas
                      </p>
                    </div>
                  </div>

                  {/* Created Klien Termin Folders */}
                  {(() => {
                    const parsedRemarks = parseRemarks(explorerProject.remarks);
                    const savedFolders: string[] = parsedRemarks.klienTerminFolders || [];
                    const docFolders = documents
                      .filter(d => d.projectId === explorerProject.id && d.subFolderName && GROUP_FILE_TYPES.klien.includes(d.fileType))
                      .map(d => d.subFolderName!.split(' - ')[0])
                      .filter(Boolean);

                    const allKlienFolders = Array.from(new Set([...savedFolders, ...docFolders]));

                    return allKlienFolders.map((termName) => {
                      const count = documents.filter(d => d.projectId === explorerProject.id && d.subFolderName?.startsWith(termName)).length;

                      return (
                        <div
                          key={termName}
                          className="group relative flex items-center p-5 bg-sky-50/40 dark:bg-sky-950/20 hover:bg-white dark:bg-slate-800 rounded-3xl border border-sky-100 dark:border-sky-900 hover:border-sky-400 hover:shadow-xs cursor-pointer transition-all"
                        >
                          <div
                            onClick={() => setSubExplorerFolder(`KLIEN_TERMIN::${termName}`)}
                            className="flex items-center flex-1 min-w-0"
                          >
                            <div className="p-3 bg-sky-500 rounded-2xl text-white mr-4 shadow-2xs group-hover:scale-105 transition-transform">
                              <FolderOpen className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm truncate" title={termName}>
                                📁 {termName}
                              </h4>
                              <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5 font-bold">
                                {count} Berkas
                              </p>
                            </div>
                          </div>
                          {(isProyekAdmin || isSuperAdmin) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCreatedFolder(termName, 'klien');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus Folder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </>
              ) : (
                <>
                  {/* Default Subkon item */}
                  <div
                    onClick={() => setSubExplorerFolder('RFQ_SCAN_KOSONG')}
                    className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-amber-300 hover:shadow-xs cursor-pointer transition-all"
                  >
                    <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 text-amber-500 mr-4 shadow-3xs transition-all">
                      <FolderOpen className="h-6 w-6 fill-amber-500/10" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">RFQ SCAN / KOSONG</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                        {documents.filter(d => d.projectId === explorerProject.id && d.fileType === 'RFQ_SCAN_KOSONG').length} Berkas
                      </p>
                    </div>
                  </div>

                  {/* Created Subkon Folders */}
                  {(() => {
                    const parsedRemarks = parseRemarks(explorerProject.remarks);
                    const savedFolders: string[] = parsedRemarks.subkonFolders || [];
                    const docFolders = documents
                      .filter(d => d.projectId === explorerProject.id && d.fileType === 'SUBKON_DOCS' && d.subFolderName)
                      .map(d => d.subFolderName!.split(' - ')[0])
                      .filter(Boolean);

                    const allSubkonFolders = Array.from(new Set([...savedFolders, ...docFolders]));

                    return allSubkonFolders.map((subconName) => {
                      const count = documents.filter(d => d.projectId === explorerProject.id && d.subFolderName?.startsWith(subconName)).length;

                      return (
                        <div
                          key={subconName}
                          className="group relative flex items-center p-5 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-white dark:bg-slate-800 rounded-3xl border border-amber-200 dark:border-amber-900 hover:border-amber-400 hover:shadow-xs cursor-pointer transition-all"
                        >
                          <div
                            onClick={() => setSubExplorerFolder(`SUBKON_FOLDER::${subconName}`)}
                            className="flex items-center flex-1 min-w-0"
                          >
                            <div className="p-3 bg-amber-500 rounded-2xl text-white mr-4 shadow-2xs group-hover:scale-105 transition-transform">
                              <FolderOpen className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 text-sm truncate" title={subconName}>
                                📁 {subconName}
                              </h4>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-bold">
                                {count} Berkas
                              </p>
                            </div>
                          </div>
                          {(isProyekAdmin || isSuperAdmin) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCreatedFolder(subconName, 'subkon');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Hapus Folder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: INSIDE CREATED TERMIN / SUBKON FOLDER OR FILE LIST */}
        {explorerProject && explorerFolder && subExplorerFolder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Case A: Inside Klien Termin Folder */}
            {subExplorerFolder.startsWith('KLIEN_TERMIN::') && !subExplorerFolder.includes('::SLOT::') && (() => {
              const termFolder = subExplorerFolder.replace('KLIEN_TERMIN::', '');

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-sky-50/50 dark:bg-sky-950/30 p-4 rounded-2xl border border-sky-100 dark:border-sky-900">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center">
                        <FolderOpen className="h-5 w-5 text-sky-600 mr-2" />
                        Folder Termin: {termFolder}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Pilih salah satu kategori dokumen di bawah ini untuk melihat atau mengunggah berkas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {KLIEN_TERMIN_SLOTS.map((slot) => {
                      const fullSlotName = `${termFolder} - ${slot.name}`;
                      const count = documents.filter(d => d.projectId === explorerProject.id && (d.subFolderName === fullSlotName || d.subFolderName === termFolder)).length;

                      return (
                        <div
                          key={slot.id}
                          className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400">
                                {count} Berkas
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-1">
                              {slot.label}
                            </h4>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSubExplorerFolder(`KLIEN_TERMIN::${termFolder}::SLOT::${slot.name}`)}
                              className="px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 rounded-lg transition-all"
                            >
                              Buka Berkas →
                            </button>
                            {(!user?.role || user?.role !== 'HRD') && (
                              <button
                                onClick={() => {
                                  setUploadProject(explorerProject.id);
                                  setSubFolderName(fullSlotName);
                                  setUploadFileType(slot.docType as DocType);
                                  setUploadModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all flex items-center"
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Unggah
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Case B: Inside Subkon Folder */}
            {subExplorerFolder.startsWith('SUBKON_FOLDER::') && !subExplorerFolder.includes('::SLOT::') && (() => {
              const subconFolder = subExplorerFolder.replace('SUBKON_FOLDER::', '');

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-amber-50/50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center">
                        <FolderOpen className="h-5 w-5 text-amber-600 mr-2" />
                        Folder Subkon: {subconFolder}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        Pilih salah satu kategori dokumen di bawah ini untuk melihat atau mengunggah berkas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {SUBKON_FOLDER_SLOTS.map((slot) => {
                      const fullSlotName = `${subconFolder} - ${slot.name}`;
                      const count = documents.filter(d => d.projectId === explorerProject.id && (d.subFolderName === fullSlotName || d.subFolderName === subconFolder)).length;

                      return (
                        <div
                          key={slot.id}
                          className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400">
                                {count} Berkas
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-1">
                              {slot.label}
                            </h4>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSubExplorerFolder(`SUBKON_FOLDER::${subconFolder}::SLOT::${slot.name}`)}
                              className="px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              Buka Berkas →
                            </button>
                            {(!user?.role || user?.role !== 'HRD') && (
                              <button
                                onClick={() => {
                                  setUploadProject(explorerProject.id);
                                  setSubFolderName(fullSlotName);
                                  setUploadFileType(slot.docType as DocType);
                                  setUploadModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all flex items-center"
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Unggah
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Case C: Files Table (Standard Files or Specific Slot Files) */}
            {(!subExplorerFolder.startsWith('KLIEN_TERMIN::') || subExplorerFolder.includes('::SLOT::')) &&
              (!subExplorerFolder.startsWith('SUBKON_FOLDER::') || subExplorerFolder.includes('::SLOT::')) && (
                <div className="space-y-4">
                  {/* Search & filters inside folder */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama berkas, uploader..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>

                    <div className="w-full sm:w-48">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none text-xs cursor-pointer"
                      >
                        <option value="">Semua Tipe</option>
                        {GROUP_FILE_TYPES[explorerFolder].map((type) => (
                          <option key={type} value={type}>{DOC_TYPE_LABELS[type] || type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Files table */}
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
                    {filteredExplorerDocs.length > 0 ? (
                      <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead>
                          <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                            <th className="py-3 px-6">Nama Dokumen</th>
                            <th className="py-3 px-6">Tipe</th>
                            <th className="py-3 px-6">Diunggah Oleh</th>
                            <th className="py-3 px-6">Ukuran</th>
                            <th className="py-3 px-6">Tanggal Upload</th>
                            <th className="py-3 px-6">Status</th>
                            <th className="py-3 px-6 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                          {filteredExplorerDocs.map((doc) => {
                            const isOwner = doc.uploadedById === user?.id;
                            const canDelete = isSuperAdmin || isOwner;
                            const isExcel = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls');
                            const hasDetails = isExcel && (doc.fileType === 'BOQ' || doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'RFQ_SCAN_KOSONG');

                            return (
                              <tr key={doc.id} className="hover:bg-slate-50 dark:bg-slate-900/20">
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2.5">
                                  {(doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT') && <ImageIcon className="h-4.5 w-4.5 text-sky-500 shrink-0" />}
                                  {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
                                  {(doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL') && <FileCheck className="h-4.5 w-4.5 text-purple-600 shrink-0" />}
                                  {(doc.fileType === 'RFQ_SCAN_KOSONG' || doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' || doc.fileType === 'RAB' || doc.fileType === 'FORECAST_COST' || doc.fileType === 'FOTO') && <FileText className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400 shrink-0" />}
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[220px]" title={doc.fileName}>{doc.fileName}</span>
                                    {doc.subFolderName && (
                                      <span className="text-2xs text-sky-500 font-medium">Folder: {doc.subFolderName}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{doc.fileType}</td>
                                <td className="py-4 px-6">
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{doc.uploadedBy?.name}</span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">{doc.uploadedBy?.role}</span>
                                </td>
                                <td className="py-4 px-6 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                                <td className="py-4 px-6 text-slate-400">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold border ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
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
                                      onClick={() => handleOpenExplorerDetails(doc)}
                                      className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 shadow-3xs"
                                      title="Buka Detail Rincian Excel"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleViewFile(doc)}
                                      className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 hover:text-sky-700 shadow-3xs"
                                      title="Buka / Preview Berkas"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {canDownloadDoc(effectiveRole, doc.fileType) && (
                                    <button
                                      onClick={() => handleDownload(doc)}
                                      className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 shadow-3xs"
                                      title="Unduh Berkas Asli"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {(isProcurement || isSuperAdmin) && doc.status !== 'APPROVED' && doc.status !== 'PO_RELEASED' && (
                                    <button
                                      onClick={() => handleApproveDocument(doc.id)}
                                      className="inline-flex p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 shadow-3xs"
                                      title="Setujui Dokumen (APPROVED)"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {(isFinance || isSuperAdmin) && doc.fileType === 'SUBKON_DOCS' && doc.status === 'PO_PENDING' && (
                                    <button
                                      onClick={() => handleReleasePo(doc.id)}
                                      className="inline-flex p-1.5 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 shadow-3xs"
                                      title="Rilis Purchase Order"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                                      className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 hover:text-rose-600 shadow-3xs"
                                      title="Hapus Dokumen"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-16 text-center text-slate-400">Tidak ada berkas ditemukan di folder ini.</div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS SECTION */}
      {/* ---------------------------------------------------- */}

      {/* 1. MODAL UPLOAD DOKUMEN (Engineering / Superadmin) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-700">Unggah Dokumen Proyek Baru</h3>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Pilih Proyek</label>
                  <select
                    required
                    value={uploadProject}
                    onChange={(e) => setUploadProject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Type Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Tipe Berkas</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as DocType)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {isEngineering && (
                      <>
                        <option value="DRAWING">DRAWING (Internal Gambar)</option>
                        <option value="RAB">RAB (Internal)</option>
                        <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT</option>
                        <option value="FORECAST_COST">FORECAST COST (Excel Estimasi)</option>
                        <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                        <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG (Subkon)</option>
                        <option value="SUBKON_DOCS">SUBKON DOCS / SPK (Subkon)</option>
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                      </>
                    )}
                    {isProyekAdmin && (
                      <>
                        <option value="SPK">SPK (Klien)</option>
                        <option value="PENAWARAN_FINAL">PENAWARAN FINAL (Scan, PDF)</option>
                        <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                        <option value="INVOICE">INVOICE (Klien)</option>
                        <option value="SUBKON_DOCS">SUBKON DOCS (SPK, Invoice, RFQ Final)</option>
                        <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG (Subkon)</option>
                        <option value="FOTO">FOTO (Internal)</option>
                      </>
                    )}
                    {isProcurement && (
                      <>
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                      </>
                    )}
                    {isFinance && (
                      <>
                        <option value="INVOICE">INVOICE (Klien)</option>
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
                        <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT</option>
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                        <option value="FORECAST_COST">FORECAST COST (Excel Estimasi)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* File Upload */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Pilih File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                  />
                  <p className="text-3xs text-slate-400 mt-1">Gunakan format Excel (.xlsx, .xls) untuk dokumen BOQ, Penawaran, dan RFQ agar dapat di-parse otomatis.</p>
                </div>

                {/* Dynamic Fields for SUBKON_DOCS */}
                {uploadFileType === 'SUBKON_DOCS' && (
                  <div className="mb-4 sm:col-span-2">
                    <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Nama Folder Subkon / Vendor <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={subFolderName}
                      onChange={(e) => setSubFolderName(e.target.value)}
                      placeholder="Contoh: Subkon 1, PT. MPI, Subkon 2"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Nama ini akan menjadi nama folder di dalam direktori Subkon (mencakup unggah berkas SPK, Invoice, maupun RFQ Final Subkon).</p>
                  </div>
                )}

                {/* Dynamic Fields for PENAWARAN_DRAFT */}
                {uploadFileType === 'PENAWARAN_DRAFT' && (
                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                    <p className="font-bold text-sky-700">Metadata Tambahan Penawaran Client</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Nama PT Client</label>
                        <input
                          type="text"
                          required
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. PT. Cikarang Metalindo"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Nomor Penawaran</label>
                        <input
                          type="text"
                          value={quoteNumber}
                          onChange={(e) => setQuoteNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. QTE/2026/07-115"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Masa Berlaku Penawaran</label>
                        <input
                          type="date"
                          value={validityDate}
                          onChange={(e) => setValidityDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for RFQ_SCAN_KOSONG */}
                {uploadFileType === 'RFQ_SCAN_KOSONG' && (
                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                    <p className="font-bold text-sky-700">Metadata Tambahan RFQ</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Nomor RFQ</label>
                        <input
                          type="text"
                          required
                          value={rfqNumber}
                          onChange={(e) => setRfqNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. RFQ-IT-004-2026"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Batas Target Tanggal</label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Ketentuan Penyerahan & Pembayaran (Terms)</label>
                        <input
                          type="text"
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. Franco Jakarta, TOP 30 Days"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
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

      {/* 3. MODAL DETIL DOKUMEN EXPLORER (BOQ, Penawaran, RFQ) */}
      {selectedExplorerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Rincian Data: {selectedExplorerDoc.fileName}</h3>
                <p className="text-3xs text-slate-400 mt-1">Tipe: <span className="font-bold">{selectedExplorerDoc.fileType}</span> | Proyek: {selectedExplorerDoc.project?.name}</p>
              </div>
              <button onClick={() => setSelectedExplorerDoc(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {loadingExplorerDetails ? (
                <div className="py-12 flex justify-center"><RefreshCw className="animate-spin text-sky-500 h-6 w-6" /></div>
              ) : (
                <>
                  {/* BOQ RENDER */}
                  {explorerBoqDetails && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-slate-400 font-semibold">Total Anggaran BOQ:</p>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">Rp {explorerBoqDetails.totalAmount.toLocaleString('id-ID')}</h4>
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
                              {(isProcurement || isSuperAdmin) && <th className="py-2.5 px-4 text-center">Aksi</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                            {explorerBoqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.wbsCode || '-'}</td>
                                <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.rateEngineering.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right text-sky-600 font-bold">Rp {item.rateProcurement.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                                {(isProcurement || isSuperAdmin) && (
                                  <td className="py-2.5 px-4 text-center">
                                    {editingBoqItem === item.id ? (
                                      <button onClick={() => setEditingBoqItem(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">Batal</button>
                                    ) : (
                                      <button onClick={() => handleStartEditBoqItem(item)} className="p-1 rounded bg-sky-50 text-sky-600 hover:bg-sky-100"><Edit3 className="h-3.5 w-3.5" /></button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {editingBoqItem && (
                        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
                          <h5 className="text-xs font-bold text-sky-800">Ubah Harga Satuan Item Pekerjaan</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Harga Satuan Baru (Procurement)</label>
                              <input
                                type="number"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Catatan Negosiasi</label>
                              <input
                                type="text"
                                value={editNotesValue}
                                onChange={(e) => setEditNotesValue(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleSaveBoqItemExplorer(editingBoqItem)}
                            disabled={boqSaving}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold disabled:opacity-50"
                          >
                            {boqSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PENAWARAN RENDER */}
                  {explorerPenawaranDetails && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{explorerPenawaranDetails.vendorName}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{explorerPenawaranDetails.quoteNumber || '-'}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                          <h4 className="font-bold text-purple-700 mt-0.5 text-sm">Rp {explorerPenawaranDetails.totalOffer.toLocaleString('id-ID')}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Masa Berlaku:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            {explorerPenawaranDetails.validityDate ? new Date(explorerPenawaranDetails.validityDate).toLocaleDateString('id-ID') : '-'}
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
                            {explorerPenawaranDetails.items?.map((item) => (
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
                  {explorerRfqDetails && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor RFQ:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{explorerRfqDetails.rfqNumber}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Batas Target Tanggal:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            {explorerRfqDetails.targetDate ? new Date(explorerRfqDetails.targetDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-semibold">Ketentuan Serah Terima & Syarat Pembayaran (Terms):</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{explorerRfqDetails.terms || '-'}</h4>
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
                            {explorerRfqDetails.items?.map((item) => (
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
              {canDownloadDoc(effectiveRole, selectedExplorerDoc.fileType) && (
                <button
                  onClick={() => handleDownload(selectedExplorerDoc)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Unduh Berkas Excel Fisik
                </button>
              )}
              <button
                onClick={() => setSelectedExplorerDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL FORM PROYEK (CREATE & EDIT) */}
      {projectFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-700">
              {editingProjectId ? 'Edit Detail Proyek' : 'Daftarkan Proyek Baru'}
            </h3>
            <form onSubmit={handleSaveProjectForm} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Nama Perusahaan</label>
                  <select
                    required
                    value={projectFormCode}
                    onChange={(e) => setProjectFormCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="">-- Pilih Perusahaan --</option>
                    {masterCompanies.map((c, i) => (
                      <option key={i} value={c.code}>{c.code}</option>
                    ))}
                    {masterCompanies.length === 0 && (
                      <>
                        <option value="MJK">MJK</option>
                        <option value="DJI">DJI</option>
                        <option value="IRI">IRI</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">PT Client</label>
                  <select
                    required
                    value={projectFormClient}
                    onChange={(e) => {
                      setProjectFormClient(e.target.value);
                      if (!editingProjectId) {
                        setProjectFormName(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="">-- Pilih Client --</option>
                    {masterClients.map((c, i) => (
                      <option key={i} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Nama Proyek
                  </label>
                  <input
                    type="text"
                    required
                    value={projectFormName}
                    onChange={(e) => setProjectFormName(e.target.value)}
                    placeholder="Masukkan nama proyek..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Deskripsi Proyek</label>
                <textarea
                  value={projectFormDesc}
                  onChange={(e) => setProjectFormDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 h-16 resize-none"
                  placeholder="Deskripsi singkat mengenai proyek..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={projectFormProgress}
                    onChange={(e) => setProjectFormProgress(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={projectFormStartDate}
                    onChange={(e) => setProjectFormStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={projectFormEndDate}
                    onChange={(e) => setProjectFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 mb-1">Remarks / Catatan</label>
                <textarea
                  value={projectFormRemarks}
                  onChange={(e) => setProjectFormRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 h-16 resize-none"
                  placeholder="Remarks atau catatan tambahan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setProjectFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={projSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {projSubmitting ? 'Menyimpan...' : 'Simpan Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL VIEW PENAWARAN (Modal Excel + PDF - Finance) */}
      {viewPenawaranDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Detail Penawaran Vendor</h3>
                <p className="text-3xs text-slate-400 mt-1 font-mono">ID Dokumen: {viewPenawaranDoc.id}</p>
              </div>
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300"
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
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{penawaranHeader.vendorName}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{penawaranHeader.quoteNumber || '-'}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                      <h4 className="font-bold text-sky-700 mt-0.5 text-sm">Rp {penawaranHeader.totalOffer.toLocaleString('id-ID')}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Berlaku Hingga:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                        {penawaranHeader.validityDate ? new Date(penawaranHeader.validityDate).toLocaleDateString('id-ID') : '-'}
                      </h4>
                    </div>
                  </div>

                  {/* List Item Penawaran */}
                  <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-left font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Deskripsi Barang / Jasa</th>
                          <th className="py-2 px-3 text-center">Qty / Satuan</th>
                          <th className="py-2 px-3 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                        {penawaranHeader.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                            <td className="py-2 px-3 font-mono">{item.itemNo}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-200">{item.description}</td>
                            <td className="py-2 px-3 text-center">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2 text-xs">
              {canDownloadDoc(effectiveRole, viewPenawaranDoc?.fileType || '') && (
                <button
                  onClick={() => handleDownload(viewPenawaranDoc)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Unduh File Asli
                </button>
              )}
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL BUAT FOLDER BARU (Klien / Subkon) ───────────────────────── */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <FolderPlus className="h-4.5 w-4.5 mr-2 text-sky-600" />
                {createFolderType === 'klien' ? 'Buat Folder Termin Klien Baru' : 'Buat Folder Subkon Baru'}
              </h3>
              <button onClick={() => setCreateFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Folder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  placeholder={createFolderType === 'klien' ? 'Contoh: INV DP 50%, INV Termin 1 45%' : 'Contoh: 1. Subcon 001, PT Jaya Konstruksi'}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {createFolderType === 'klien'
                    ? 'Folder ini akan berisi 6 slot: Invoice, Faktur, Drawing, Foto, Tanda terima, dan (BAST).'
                    : 'Folder ini akan berisi 5 slot: SPK, Payment Request T1, T2, T3, dan T4.'}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCreateFolderModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={folderSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all flex items-center"
                >
                  {folderSubmitting ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Simpan Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
