'use client';

import React, { useState, useEffect } from 'react';
import api, { getApiBaseUrl } from '@/lib/api';
// import Cookies from 'js-cookie';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Project, Document, BoqHeader, BoqItem, PenawaranHeader, RfqHeader, AuditLog, DashboardStats, Role, DocType } from '@/types';
import AllProyekTable from './AllProyekTable';
import RfqTable from '@/components/RfqTable';
import ProyekAdminDashboard from '@/components/ProyekAdminDashboard';
import FinanceDashboard from '@/components/FinanceDashboard';
import ProcurementDashboard from '@/components/ProcurementDashboard';
import TrackingProyekTable from '@/components/TrackingProyekTable';
import SuperAdminTrafficAnalytics from '@/components/SuperAdminTrafficAnalytics';
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
  Clock,
  X,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Save,
  LayoutDashboard,
  Layers
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
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 dark:border-slate-700">
        {parsed.reqBy && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Klien</span><span className="font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{parsed.reqBy}</span></div>}
        {parsed.uraianPekerjaan && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Pekerjaan</span><span className="font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{parsed.uraianPekerjaan}</span></div>}
        {parsed.progress && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Progress</span><span className="font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{parsed.progress}</span></div>}
        {parsed.subkon1 && parsed.subkon1 !== '-' && <div><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Subkon</span><span className="font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{parsed.subkon1}</span></div>}
      </div>
    );
  }
  return <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">{desc || 'Tidak ada deskripsi proyek.'}</p>;
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

export default function DashboardPage() {
  const { user, isSuperAdmin, isAdminMonitoring, isEngineering, isProyekAdmin, isProcurement, isFinance } = useAuth();

  const effectiveRole = isProyekAdmin ? 'PROYEK_ADMIN' : (user?.role || '');

  // Real-time Clock and Greeting states
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  const router = useRouter();
  useEffect(() => {
    if (user?.role === 'HRD') {
      router.push('/admin-reports');
      return;
    }
    if (user?.role === 'GA' || user?.role === 'STAFF_GA') {
      router.push('/ga-documents');
      return;
    }
    setMounted(true);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [user, router]);

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

  // States Admin/Superadmin (Tabs & Project Management)
  const [superAdminTab, setSuperAdminTab] = useState<'all' | 'engineering' | 'proyek_admin' | 'finance' | 'procurement' | 'rfq' | 'tracking_proyek'>('all');
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
  const [masterNumberings, setMasterNumberings] = useState<{ code: string, name: string }[]>([]);

  // States for Master Directory (data.txt)
  const [showMasterDirectory, setShowMasterDirectory] = useState(false);
  const [masterSubFolders, setMasterSubFolders] = useState<string[]>([]);
  const [selectedSubFolder, setSelectedSubFolder] = useState<string | null>(null);
  const [selectedSubFolderCategory, setSelectedSubFolderCategory] = useState<'klien' | 'subkon' | 'internal' | null>(null);
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  // States Engineering Dashboard
  const [editingEngProject, setEditingEngProject] = useState<Project | null>(null);
  const [engForm, setEngForm] = useState({
    reqBy: '',
    reqDate: '',
    penawaranReqDate: '',
    penawaranSelesai: '',
    boqReqDate: '',
    boqSelesai: '',
    rfqReqDate: '',
    rfqSelesai: ''
  });
  const [engSaving, setEngSaving] = useState(false);

  const parseEngData = (description: string | null | undefined) => {
    if (!description) return {};
    try {
      return JSON.parse(description);
    } catch {
      return {};
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

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
      const [projRes, docRes, statsRes, logsRes, dataTxtRes, compRes, cliRes, numRes] = await Promise.all([
        api.get('/projects'),
        api.get('/documents'),
        api.get('/monitoring/stats'),
        api.get('/monitoring/audit-logs'),
        api.get('/projects/data-txt').catch(() => ({ data: { data: [] } })),
        api.get('/master-data/companies').catch(() => ({ data: { data: [] } })),
        api.get('/master-data/clients').catch(() => ({ data: { data: [] } })),
        api.get('/master-data/numberings').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(projRes.data.data);
      setDocuments(docRes.data.data);
      setStats(statsRes.data.data);
      setAuditLogs(logsRes.data.data);

      setMasterCompanies(compRes.data?.data || []);
      setMasterClients(cliRes.data?.data || []);
      setMasterNumberings(numRes.data?.data || []);

      setMasterSubFolders(dataTxtRes.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard.');
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
      // Ignore background errors so it doesn't interrupt UI
    }
  };

  useEffect(() => {
    loadData();

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
    } else if (isProyekAdmin) {
      setUploadFileType('SPK');
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
      doc.subFolderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    SPK: '1. SPK',
    PENAWARAN_FINAL: '2. Penawaran Final. (Scan PDF)',
    DRAWING_AS_BUILT: '3. Drawing Gambar. (As-Built)',
    INVOICE: '4. Invoice - TI',
    SUBKON_DOCS: '1. Subkon (SPK, Invoice, RFQ Final)',
    RFQ_SCAN_KOSONG: '2. RFQ Scan / Kosong',
    DRAWING: '1. Drawing',
    FOTO: '2. Foto',
    RAB: '3. RAB',
    PENAWARAN_DRAFT: '4. Penawaran Draft',
    BOQ: '5. BOQ. (Cost Material)',
    FORECAST_COST: '6. Forecast Cost. (Excel / Estimasi)',
  };

  const getAllowedUploadTypesForGroup = (role: string, group: 'klien' | 'subkon' | 'internal') => {
    const groupTypes = GROUP_FILE_TYPES[group];
    let roleTypes: string[] = [];
    if (role === 'SUPERADMIN') {
      roleTypes = ['SPK', 'PENAWARAN_FINAL', 'DRAWING_AS_BUILT', 'INVOICE', 'SUBKON_DOCS', 'RFQ_SCAN_KOSONG', 'DRAWING', 'FOTO', 'RAB', 'PENAWARAN_DRAFT', 'BOQ', 'FORECAST_COST'];
    } else if (role === 'ENGINEERING') {
      roleTypes = ['DRAWING', 'RAB', 'PENAWARAN_DRAFT', 'FORECAST_COST', 'DRAWING_AS_BUILT', 'RFQ_SCAN_KOSONG', 'SUBKON_DOCS', 'BOQ'];
    } else if (role === 'PROYEK_ADMIN') {
      roleTypes = ['SPK', 'PENAWARAN_FINAL', 'SUBKON_DOCS', 'FOTO', 'INVOICE', 'DRAWING_AS_BUILT'];
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
    let isGroupMatch = false;
    if (subExplorerFolder) {
      if (subExplorerFolder.startsWith('KLIEN_TERMIN::')) {
        const parts = subExplorerFolder.replace('KLIEN_TERMIN::', '').split('::SLOT::');
        const termFolder = parts[0];
        const slotName = parts[1];
        if (slotName) {
          isGroupMatch = (doc.subFolderName === `${termFolder} - ${slotName}` || doc.subFolderName === termFolder);
        } else {
          isGroupMatch = (doc.subFolderName?.startsWith(termFolder) || false);
        }
      } else if (subExplorerFolder.startsWith('SUBKON_FOLDER::')) {
        const parts = subExplorerFolder.replace('SUBKON_FOLDER::', '').split('::SLOT::');
        const subconFolder = parts[0];
        const slotName = parts[1];
        if (slotName) {
          isGroupMatch = (doc.subFolderName === `${subconFolder} - ${slotName}` || doc.subFolderName === subconFolder);
        } else {
          isGroupMatch = (doc.subFolderName?.startsWith(subconFolder) || false);
        }
      } else if (subExplorerFolder.startsWith('SUBKON_DOCS::')) {
        const subName = subExplorerFolder.split('::')[1];
        isGroupMatch = doc.fileType === 'SUBKON_DOCS' && (doc.subFolderName || 'Umum') === subName;
      } else {
        isGroupMatch = doc.fileType === subExplorerFolder;
      }
    } else {
      isGroupMatch = GROUP_FILE_TYPES[explorerFolder as keyof typeof GROUP_FILE_TYPES]?.includes(doc.fileType);
    }

    const searchStr = searchQuery.toLowerCase();
    const typeLabel = (DOC_TYPE_LABELS[doc.fileType] || '').toLowerCase();
    const matchQuery = doc.fileName.toLowerCase().includes(searchStr) ||
      doc.uploadedBy?.name.toLowerCase().includes(searchStr) ||
      doc.subFolderName?.toLowerCase().includes(searchStr) ||
      typeLabel.includes(searchStr);

    const matchType = filterType ? doc.fileType === filterType : true;
    return isProjMatch && isGroupMatch && matchQuery && matchType;
  });

  const filteredMasterDocs = documents.filter((doc) => {
    if (!selectedSubFolder || !selectedSubFolderCategory) return false;
    const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
    if (!realProj) return false;
    const isProjMatch = doc.projectId === realProj.id;
    const isGroupMatch = subExplorerFolder ? doc.fileType === subExplorerFolder : GROUP_FILE_TYPES[selectedSubFolderCategory].includes(doc.fileType);

    const searchStr = masterSearchQuery.toLowerCase() || searchQuery.toLowerCase();
    const typeLabel = (DOC_TYPE_LABELS[doc.fileType] || '').toLowerCase();
    const matchQuery = doc.fileName.toLowerCase().includes(searchStr) ||
      doc.uploadedBy?.name.toLowerCase().includes(searchStr) ||
      doc.subFolderName?.toLowerCase().includes(searchStr) ||
      typeLabel.includes(searchStr);

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

  const handleOpenEngForm = (project: Project) => {
    setEditingEngProject(project);
    const data = parseEngData(project.description);
    setEngForm({
      reqBy: data.reqBy || '',
      reqDate: data.reqDate || '',
      penawaranReqDate: data.penawaranReqDate || '',
      penawaranSelesai: data.penawaranSelesai || '',
      boqReqDate: data.boqReqDate || '',
      boqSelesai: data.boqSelesai || '',
      rfqReqDate: data.rfqReqDate || '',
      rfqSelesai: data.rfqSelesai || ''
    });
  };

  const handleSaveEngData = async () => {
    if (!editingEngProject) return;
    try {
      setEngSaving(true);
      const descJson = JSON.stringify(engForm);
      await api.put(`/projects/${editingEngProject.id}`, {
        name: editingEngProject.name, // required fields
        description: descJson
      });
      // Refresh local projects
      setProjects(projects.map(p => p.id === editingEngProject.id ? { ...p, description: descJson } : p));
      setEditingEngProject(null);
    } catch (err) {
      alert('Gagal menyimpan data Engineering.');
    } finally {
      setEngSaving(false);
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
      setProjectFormCode(project.code || '');
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

      {/* METRIC CARDS FOR MONITORING/ADMIN/FINANCE (Tidak ditampilkan untuk SUPERADMIN) */}
      {stats && !isSuperAdmin && user?.role !== 'SUPERADMIN' && effectiveRole !== 'ENGINEERING' && effectiveRole !== 'PROYEK_ADMIN' && !isProyekAdmin && !isAdminMonitoring && user?.role !== 'ADMIN_MONITORING' && !isFinance && !isProcurement && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400"><Building2 className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Proyek</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.projectCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"><FileText className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Dokumen</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.documentCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"><Coins className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Nilai BOQ</p>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate" title={`Rp ${stats.totalBoqAmount.toLocaleString('id-ID')}`}>
                Rp {stats.totalBoqAmount.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"><Coins className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Penawaran</p>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 truncate" title={`Rp ${stats.totalPenawaranAmount.toLocaleString('id-ID')}`}>
                Rp {stats.totalPenawaranAmount.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"><UserCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Staf</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.userCount}</h3>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MENU NAVIGASI PEMANTAUAN DASHBOARD USER ROLE (SUPERADMIN) */}
      {/* ---------------------------------------------------- */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <span>Menu Dashboard Role</span>
                  <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-full font-bold">
                    SUPERADMIN
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih dashboard role yang ingin dipantau agar tampilan rapih dan terstruktur.
                </p>
              </div>
            </div>

            {/* Menu Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <button
                onClick={() => setSuperAdminTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
              >
                <Layers className="h-4 w-4" />
                <span>Semua Dashboard</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('engineering')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'engineering'
                  ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-400 dark:text-indigo-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-indigo-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <Activity className="h-4 w-4" />
                <span>Engineering</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('proyek_admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'proyek_admin'
                  ? 'bg-[#843c0c] text-white shadow-xs dark:bg-[#fce4d6] dark:text-[#843c0c]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-amber-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <FileText className="h-4 w-4" />
                <span>Proyek Admin</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('finance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'finance'
                  ? 'bg-[#1b365d] text-white shadow-xs dark:bg-[#d9e1f2] dark:text-[#1b365d]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-blue-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <Coins className="h-4 w-4" />
                <span>Finance</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('procurement')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'procurement'
                  ? 'bg-[#0f5132] text-white shadow-xs dark:bg-[#d1e7dd] dark:text-[#0f5132]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-emerald-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Procurement</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('rfq')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'rfq'
                  ? 'bg-purple-700 text-white shadow-xs dark:bg-purple-200 dark:text-purple-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-purple-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <Clock className="h-4 w-4" />
                <span>RFQ Monitoring</span>
              </button>

              <button
                onClick={() => setSuperAdminTab('tracking_proyek')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${superAdminTab === 'tracking_proyek'
                  ? 'bg-amber-600 text-white shadow-xs dark:bg-amber-400 dark:text-amber-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-amber-100/50 dark:hover:bg-slate-800'
                  }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Tracking by Proyek</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PROJECT FILE EXPLORER */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs p-6 space-y-6">
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
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Segarkan Data
              </button>
            )}
            {/* Superadmin & Admin Monitoring project creation (Only at Root level) */}
            {!explorerProject && !showMasterDirectory && (isSuperAdmin || isAdminMonitoring) && (
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
                  const typeToSet = subExplorerFolder && allowed.includes(subExplorerFolder) ? subExplorerFolder : allowed[0];
                  setUploadFileType(typeToSet as DocType);
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
                  if (subExplorerFolder) {
                    setSubExplorerFolder(null);
                  } else if (explorerFolder) {
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
                className="inline-flex items-center px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all"
              >
                Kembali
              </button>
            )}
          </div>
        </div>

        {/* VIEW 1: PROJECTS TABLE (ROOT VIEW) - USED FOR ALL ROLES */}
        {!explorerProject && !showMasterDirectory && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Projects Table */}
            <div className="space-y-4">
              {!isProyekAdmin && !isAdminMonitoring && !isFinance && !isProcurement && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Aktivitas Proyek Terbaru</h4>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        placeholder="Cari Proyek..."
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                      />
                    </div>
                    {!isEngineering && (
                      <button
                        onClick={() => handleOpenProjectForm()}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all w-full sm:w-auto justify-center"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Tambah Laporan
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(() => {
                const isStaffUser = Boolean(
                  user?.managerId ||
                  user?.manager ||
                  (user as any)?.isStaff ||
                  (user?.role && user.role.includes('STAFF'))
                );
                const uId = user?.id || '';
                const uName = (user?.name || '').toLowerCase();

                const staffAssignedProjects = isStaffUser
                  ? projects.filter(p => {
                      const pStr = JSON.stringify(p).toLowerCase();
                      return (
                        p.penawaranPicId === uId ||
                        p.boqPicId === uId ||
                        p.rfqPicId === uId ||
                        p.spkPicId === uId ||
                        p.progressPicId === uId ||
                        p.invoicePicId === uId ||
                        (uName && pStr.includes(uName))
                      );
                    })
                  : projects;

                if (isStaffUser && staffAssignedProjects.length === 0) {
                  return (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-10 text-center max-w-2xl mx-auto my-12 shadow-sm">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        Belum Ada Penugasan
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-medium">
                        Saat ini Divisi Utama belum memberikan penugasan proyek atau tanggung jawab kerja kepada Anda. Tampilan dashboard dan lembar kerja staf Anda akan aktif secara otomatis setelah Divisi Utama mendaftarkan penugasan untuk akun Anda.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold">
                        <Clock className="w-4 h-4" /> Menunggu Penugasan Resmi dari Divisi Utama
                      </div>
                    </div>
                  );
                }

                const activeProjects = staffAssignedProjects;

                return activeProjects.length > 0 ? (
                  isProcurement ? (
                    <ProcurementDashboard
                      projects={activeProjects.filter(p => {
                        if (!projectSearchQuery) return true;
                        const term = projectSearchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                      })}
                    documents={documents}
                    onRefresh={loadData}
                    onAddProject={() => handleOpenProjectForm()}
                    onEditProject={(proj) => handleOpenProjectForm(proj)}
                    onDeleteProject={handleDeleteProject}
                    onOpenFolder={(proj, folder) => {
                      setExplorerProject(proj);
                      setExplorerFolder(folder);
                    }}
                  />
                ) : isFinance ? (
                  <FinanceDashboard
                    projects={projects.filter(p => {
                      if (!projectSearchQuery) return true;
                      const term = projectSearchQuery.toLowerCase();
                      return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                    })}
                    documents={documents}
                    onRefresh={loadData}
                    onAddProject={() => handleOpenProjectForm()}
                    onEditProject={(proj) => handleOpenProjectForm(proj)}
                    onDeleteProject={handleDeleteProject}
                    onOpenFolder={(proj, folder) => {
                      setExplorerProject(proj);
                      setExplorerFolder(folder);
                    }}
                  />
                ) : (isProyekAdmin || isAdminMonitoring) ? (
                  <ProyekAdminDashboard
                    projects={projects.filter(p => {
                      if (!projectSearchQuery) return true;
                      const term = projectSearchQuery.toLowerCase();
                      return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                    })}
                    documents={documents}
                    onRefresh={loadData}
                    onAddProject={() => handleOpenProjectForm()}
                    onEditProject={(proj) => handleOpenProjectForm(proj)}
                    onDeleteProject={handleDeleteProject}
                    onOpenFolder={(proj, folder) => {
                      setExplorerProject(proj);
                      setExplorerFolder(folder);
                    }}
                  />
                ) : (
                  <>
                    {/* Tampilan 1: Semua Dashboard (Grafik & Trafik Monitoring Overview) */}
                    {isSuperAdmin && superAdminTab === 'all' && (
                      <SuperAdminTrafficAnalytics
                        projects={projects}
                        documents={documents}
                        stats={stats}
                        auditLogs={auditLogs}
                      />
                    )}

                    {/* Tampilan 2: Dashboard Engineering */}
                    {((isSuperAdmin && superAdminTab === 'engineering') || (!isSuperAdmin && (effectiveRole === 'ENGINEERING' || isEngineering || (!isFinance && !isProcurement && !isProyekAdmin && !isAdminMonitoring)))) && (
                      <AllProyekTable
                        projects={projects.filter(p => {
                          if (!projectSearchQuery) return true;
                          const term = projectSearchQuery.toLowerCase();
                          return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                        }).map(p => {
                          const projectDocs = documents.filter(d => d.projectId === p.id);
                          const latestDoc = [...projectDocs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                          const lastUpdated = latestDoc ? new Date(Math.max(new Date(p.createdAt).getTime(), new Date(latestDoc.createdAt).getTime())) : new Date(p.createdAt);
                          return { ...p, projectDocs, lastUpdated } as any;
                        }).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())}
                        documents={documents}
                        onUpdateProject={(updated: Project) => setProjects(projects.map(p => p.id === updated.id ? updated : p))}
                        setExplorerProject={setExplorerProject}
                        setExplorerFolder={setExplorerFolder}
                      />
                    )}

                    {/* Tampilan 3: Dashboard Proyek Admin */}
                    {((isSuperAdmin && superAdminTab === 'proyek_admin') || (!isSuperAdmin && (isProyekAdmin || isAdminMonitoring))) && (
                      <ProyekAdminDashboard
                        projects={projects.filter(p => {
                          if (!projectSearchQuery) return true;
                          const term = projectSearchQuery.toLowerCase();
                          return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                        })}
                        documents={documents}
                        onRefresh={loadData}
                        onAddProject={() => handleOpenProjectForm()}
                        onEditProject={(proj) => handleOpenProjectForm(proj)}
                        onDeleteProject={handleDeleteProject}
                        onOpenFolder={(proj, folder) => {
                          setExplorerProject(proj);
                          setExplorerFolder(folder);
                        }}
                      />
                    )}

                    {/* Tampilan 3: Dashboard Finance */}
                    {isSuperAdmin && superAdminTab === 'finance' && (
                      <FinanceDashboard
                        projects={projects.filter(p => {
                          if (!projectSearchQuery) return true;
                          const term = projectSearchQuery.toLowerCase();
                          return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                        })}
                        documents={documents}
                        onRefresh={loadData}
                        onAddProject={() => handleOpenProjectForm()}
                        onEditProject={(proj) => handleOpenProjectForm(proj)}
                        onDeleteProject={handleDeleteProject}
                        onOpenFolder={(proj, folder) => {
                          setExplorerProject(proj);
                          setExplorerFolder(folder);
                        }}
                      />
                    )}

                    {/* Tampilan 4: Dashboard Procurement */}
                    {isSuperAdmin && superAdminTab === 'procurement' && (
                      <ProcurementDashboard
                        projects={projects.filter(p => {
                          if (!projectSearchQuery) return true;
                          const term = projectSearchQuery.toLowerCase();
                          return p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
                        })}
                        documents={documents}
                        onRefresh={loadData}
                        onAddProject={() => handleOpenProjectForm()}
                        onEditProject={(proj) => handleOpenProjectForm(proj)}
                        onDeleteProject={handleDeleteProject}
                        onOpenFolder={(proj, folder) => {
                          setExplorerProject(proj);
                          setExplorerFolder(folder);
                        }}
                      />
                    )}
                  </>
                )
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">Belum ada proyek terdaftar.</div>
              );
            })()}

              {/* Tampilan 5: RFQ Monitoring for Super Admin */}
              {isSuperAdmin && superAdminTab === 'rfq' && (
                <RfqTable />
              )}

              {/* Tampilan 6: Tracking by Proyek for Super Admin */}
              {isSuperAdmin && superAdminTab === 'tracking_proyek' && (
                <TrackingProyekTable projects={projects} onRefresh={loadData} />
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
                <h3 className="text-lg font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">Direktori Utama</h3>
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
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 transition-all truncate w-full" title={subFolder}>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
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
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MASTER DIRECTORY VIEW 3: SUBFOLDERS GRID */}
        {/* ==================================================== */}
        {showMasterDirectory && selectedSubFolder && selectedSubFolderCategory && !subExplorerFolder && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{GROUP_LABELS[selectedSubFolderCategory]}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Silakan pilih sub-direktori dokumen.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
              {GROUP_FILE_TYPES[selectedSubFolderCategory].map((type) => {
                const typeLabel = DOC_TYPE_LABELS[type] || type;
                const realProj = projects.find(p => p.name === selectedSubFolder || p.code === selectedSubFolder);
                const docsCount = realProj ? documents.filter(d => d.projectId === realProj.id && d.fileType === type).length : 0;
                return (
                  <div
                    key={type}
                    onClick={() => setSubExplorerFolder(type)}
                    className="group flex items-center p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-sky-300 hover:shadow-xs cursor-pointer transition-all"
                  >
                    <div className="p-3 bg-sky-50 rounded-2xl group-hover:bg-sky-100 text-sky-500 mr-4 shadow-3xs transition-all">
                      <FolderOpen className="h-6 w-6 fill-sky-500/10" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 text-sm">{typeLabel}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {docsCount} Berkas
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MASTER DIRECTORY VIEW 4: FILES LIST INSIDE VIRTUAL CATEGORY */}
        {/* ==================================================== */}
        {showMasterDirectory && selectedSubFolder && selectedSubFolderCategory && subExplorerFolder && (
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
                      const canDelete = isSuperAdmin || isOwner || isProcurementDeletingBoq;
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
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 shadow-3xs"
                                title="Unduh Berkas Asli"
                              >
                                <Download className="h-3.5 w-3.5" />
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

            {/* Global File Search input from outside folder */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="🔍 Cari berkas/isi file langsung di seluruh folder proyek ini..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs font-medium"
                />
              </div>
            </div>

            {searchQuery.trim() !== '' && (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Hasil Pencarian File ({documents.filter(d => d.projectId === explorerProject.id && (d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || (d.subFolderName && d.subFolderName.toLowerCase().includes(searchQuery.toLowerCase())))).length} Berkas Found):</h4>
                <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                  <thead>
                    <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Nama Dokumen</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Folder</th>
                      <th className="py-3 px-4">Tanggal Upload</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                    {documents.filter(d => d.projectId === explorerProject.id && (d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || (d.subFolderName && d.subFolderName.toLowerCase().includes(searchQuery.toLowerCase())))).map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{doc.fileName}</td>
                        <td className="py-3 px-4 font-mono text-[10px]">{DOC_TYPE_LABELS[doc.fileType] || doc.fileType}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300 font-medium text-[10px]">{doc.subFolderName || 'Umum'}</span></td>
                        <td className="py-3 px-4">{new Date(doc.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => handleViewFile(doc)} className="px-2.5 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg font-semibold text-[10px]">Lihat</button>
                          {canDownloadDoc(effectiveRole, doc.fileType) && (
                            <button onClick={() => handleDownload(doc)} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg font-semibold text-[10px]">Unduh</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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

              {(isProyekAdmin || isSuperAdmin) && (explorerFolder === 'klien' || explorerFolder === 'subkon') && (
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
                  {explorerFolder === 'klien' ? '+ Buat Folder Termin Klien' : '+ Buat Folder Subkon Baru'}
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
                            {(isProyekAdmin || isSuperAdmin) && (
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
                            {(isProyekAdmin || isSuperAdmin) && (
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
                                      className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-700 shadow-3xs"
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
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-700 dark:border-slate-700">Unggah Dokumen Proyek Baru</h3>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Pilih Proyek</label>
                  <select
                    required
                    value={uploadProject}
                    onChange={(e) => setUploadProject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* File Type Selection */}
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Tipe Berkas</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as DocType)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {isEngineering && (
                      <>
                        <option value="SPK">SPK (Klien)</option>
                        <option value="DRAWING">DRAWING (Internal Gambar)</option>
                        <option value="RAB">RAB (Internal)</option>
                        <option value="PENAWARAN_DRAFT">PENAWARAN DRAFT</option>
                        <option value="FORECAST_COST">FORECAST COST (Excel Estimasi)</option>
                        <option value="DRAWING_AS_BUILT">DRAWING AS-BUILT (Klien)</option>
                        <option value="RFQ_SCAN_KOSONG">RFQ SCAN / KOSONG</option>
                        <option value="SUBKON_DOCS">SUBKON DOCS (SPK, Invoice, RFQ Final)</option>
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
                        <option value="BOQ">BOQ (Cost Material Excel)</option>
                        <option value="DRAWING">DRAWING (Internal Gambar)</option>
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
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Pilih File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                  />
                  <p className="text-3xs text-slate-400 mt-1">Gunakan format Excel (.xlsx, .xls) untuk dokumen BOQ, Penawaran, dan RFQ agar dapat di-parse otomatis.</p>
                </div>

                {/* Dynamic Fields for SUBKON_DOCS */}
                {uploadFileType === 'SUBKON_DOCS' && (
                  <div className="mb-4 sm:col-span-2">
                    <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nama Folder Subkon / Vendor <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={subFolderName}
                      onChange={(e) => setSubFolderName(e.target.value)}
                      placeholder="Contoh: Subkon 1, PT. MPI, Subkon 2"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
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
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. PT. Cikarang Metalindo"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nomor Penawaran</label>
                        <input
                          type="text"
                          value={quoteNumber}
                          onChange={(e) => setQuoteNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. QTE/2026/07-115"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Masa Berlaku Penawaran</label>
                        <input
                          type="date"
                          value={validityDate}
                          onChange={(e) => setValidityDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for RFQ_SCAN_KOSONG */}
                {uploadFileType === 'RFQ_SCAN_KOSONG' && (
                  <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-700 dark:border-slate-700 pt-3 space-y-3">
                    <p className="font-bold text-sky-700">Metadata Tambahan RFQ</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nomor RFQ</label>
                        <input
                          type="text"
                          required
                          value={rfqNumber}
                          onChange={(e) => setRfqNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. RFQ-IT-004-2026"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Batas Target Tanggal</label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Ketentuan Penyerahan & Pembayaran (Terms)</label>
                        <input
                          type="text"
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                          placeholder="e.g. Franco Jakarta, TOP 30 Days"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
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
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 dark:border-slate-700 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">Rincian Data: {selectedExplorerDoc.fileName}</h3>
                <p className="text-3xs text-slate-400 mt-1">Tipe: <span className="font-bold">{selectedExplorerDoc.fileType}</span> | Proyek: {selectedExplorerDoc.project?.name}</p>
              </div>
              <button onClick={() => setSelectedExplorerDoc(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-300">
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
                      <div className="bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <p className="text-slate-400 font-semibold">Total Anggaran BOQ:</p>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100 mt-1">Rp {explorerBoqDetails.totalAmount.toLocaleString('id-ID')}</h4>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">BOQ Sheet</span>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
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
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {explorerBoqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.wbsCode || '-'}</td>
                                <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-200 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.rateEngineering.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right text-sky-600 font-bold">Rp {item.rateProcurement.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                                {(isProcurement || isSuperAdmin) && (
                                  <td className="py-2.5 px-4 text-center">
                                    {editingBoqItem === item.id ? (
                                      <button onClick={() => setEditingBoqItem(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-300">Batal</button>
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
                              <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Harga Satuan Baru (Procurement)</label>
                              <input
                                type="number"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Catatan Negosiasi</label>
                              <input
                                type="text"
                                value={editNotesValue}
                                onChange={(e) => setEditNotesValue(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none"
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
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{explorerPenawaranDetails.vendorName}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{explorerPenawaranDetails.quoteNumber || '-'}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                          <h4 className="font-bold text-purple-700 mt-0.5 text-sm">Rp {explorerPenawaranDetails.totalOffer.toLocaleString('id-ID')}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Masa Berlaku:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">
                            {explorerPenawaranDetails.validityDate ? new Date(explorerPenawaranDetails.validityDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                              <th className="py-2.5 px-4 text-right">Total Sub</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {explorerPenawaranDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
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
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 dark:border-slate-700">
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor RFQ:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{explorerRfqDetails.rfqNumber}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Batas Target Tanggal:</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">
                            {explorerRfqDetails.targetDate ? new Date(explorerRfqDetails.targetDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-semibold">Ketentuan Serah Terima & Syarat Pembayaran (Terms):</p>
                          <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{explorerRfqDetails.terms || '-'}</h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 dark:border-slate-700 dark:border-slate-700 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4">Spesifikasi Detail</th>
                              <th className="py-2.5 px-4">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                            {explorerRfqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 dark:text-slate-400">{item.specifications || '-'}</td>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 dark:border-slate-700 flex justify-end space-x-2 text-xs">
              {canDownloadDoc(effectiveRole, selectedExplorerDoc.fileType) && (
                <button
                  onClick={() => handleDownload(selectedExplorerDoc)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Unduh Berkas Excel Fisik
                </button>
              )}
              <button
                onClick={() => setSelectedExplorerDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
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
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-700 dark:border-slate-700">
              {editingProjectId ? 'Edit Detail Proyek' : 'Daftarkan Proyek Baru'}
            </h3>
            <form onSubmit={handleSaveProjectForm} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nama Perusahaan</label>
                  <select
                    required
                    value={projectFormCode}
                    onChange={(e) => setProjectFormCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 font-mono"
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
                <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Deskripsi Proyek</label>
                <textarea
                  value={projectFormDesc}
                  onChange={(e) => setProjectFormDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 h-16 resize-none"
                  placeholder="Deskripsi singkat mengenai proyek..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={projectFormProgress}
                    onChange={(e) => setProjectFormProgress(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={projectFormStartDate}
                    onChange={(e) => setProjectFormStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={projectFormEndDate}
                    onChange={(e) => setProjectFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Remarks / Catatan</label>
                <textarea
                  value={projectFormRemarks}
                  onChange={(e) => setProjectFormRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 h-16 resize-none"
                  placeholder="Remarks atau catatan tambahan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setProjectFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
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
          <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 dark:border-slate-700 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-700 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">Detail Penawaran Vendor</h3>
                <p className="text-3xs text-slate-400 mt-1 font-mono">ID Dokumen: {viewPenawaranDoc.id}</p>
              </div>
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:text-slate-300"
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
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 dark:border-slate-700">
                    <div>
                      <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{penawaranHeader.vendorName}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">{penawaranHeader.quoteNumber || '-'}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                      <h4 className="font-bold text-sky-700 mt-0.5 text-sm">Rp {penawaranHeader.totalOffer.toLocaleString('id-ID')}</h4>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold">Berlaku Hingga:</p>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-200 mt-0.5">
                        {penawaranHeader.validityDate ? new Date(penawaranHeader.validityDate).toLocaleDateString('id-ID') : '-'}
                      </h4>
                    </div>
                  </div>

                  {/* List Item Penawaran */}
                  <div className="border border-slate-100 dark:border-slate-700 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/50 text-left font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Deskripsi Barang / Jasa</th>
                          <th className="py-2 px-3 text-center">Qty / Satuan</th>
                          <th className="py-2 px-3 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                        {penawaranHeader.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900/10">
                            <td className="py-2 px-3 font-mono">{item.itemNo}</td>
                            <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-200 dark:text-slate-200">{item.description}</td>
                            <td className="py-2 px-3 text-center">{item.quantity} {item.unit}</td>
                            <td className="py-2 px-3 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-100 dark:text-slate-100">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 dark:border-slate-700 flex justify-end space-x-2 text-xs">
              {canDownloadDoc(effectiveRole, viewPenawaranDoc?.fileType || '') && (
                <button
                  onClick={() => handleDownload(viewPenawaranDoc)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:bg-slate-900 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Unduh File Asli
                </button>
              )}
              <button
                onClick={() => setViewPenawaranDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:text-slate-300 rounded-lg font-semibold"
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
