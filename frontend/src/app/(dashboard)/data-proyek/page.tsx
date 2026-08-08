'use client';

import React, { useState, useEffect } from 'react';
import api, { getApiBaseUrl } from '@/lib/api';
// import Cookies from 'js-cookie';
import { useAuth } from '@/lib/AuthContext';
import { Project, Document, BoqHeader, BoqItem, PenawaranHeader, RfqHeader, AuditLog, DashboardStats, Role, DocType } from '@/types';
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

export default function DataProyekPage() {
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
  const [masterCompanies, setMasterCompanies] = useState<{code: string, name: string}[]>([]);
  const [masterClients, setMasterClients] = useState<{code: string, name: string}[]>([]);

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
  const [projectModalOpen, setProjectModalOpen] = useState(false);

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
      // Ignore background errors
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
    } catch (err) {
      alert('Gagal mengunduh berkas dari server.');
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
      roleTypes = ['SPK', 'PENAWARAN_FINAL', 'SUBKON_DOCS', 'FOTO', 'INVOICE'];
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
      {/* PROJECT FILE EXPLORER */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="h-4 w-4 mr-1.5 text-slate-400" />
            <span className="font-bold">Data Proyek</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>

        {/* RIWAYAT KERJA ENGINEERING */}
        {isEngineering && (
          <div className="mt-6 space-y-4 pt-2 animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Unggah & Riwayat Kerja Anda</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-semibold">Semua data berkas teknis dan komersil milik Anda.</p>
              </div>
              <button
                onClick={openUploadModal}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Unggah Berkas Baru
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                  <thead>
                    <tr className="text-left font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-2.5 px-4">Nama Berkas</th>
                      <th className="py-2.5 px-4">Proyek</th>
                      <th className="py-2.5 px-4">Tipe</th>
                      <th className="py-2.5 px-4">Ukuran</th>
                      <th className="py-2.5 px-4">Tanggal Upload</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 dark:text-slate-300">
                    {documents.filter(d => d.uploadedById === user?.id).map((doc) => {
                      const isExcel = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls');
                      const hasDetails = isExcel && (doc.fileType === 'BOQ' || doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'RFQ_SCAN_KOSONG');
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:bg-slate-900/10">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                            {(doc.fileType === 'DRAWING' || doc.fileType === 'DRAWING_AS_BUILT') && <ImageIcon className="h-4 w-4 text-sky-500 shrink-0" />}
                            {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {(doc.fileType === 'PENAWARAN_DRAFT' || doc.fileType === 'PENAWARAN_FINAL') && <FileCheck className="h-4 w-4 text-purple-600 shrink-0" />}
                            {(doc.fileType === 'RFQ_SCAN_KOSONG' || doc.fileType === 'SPK' || doc.fileType === 'INVOICE' || doc.fileType === 'SUBKON_DOCS' || doc.fileType === 'RAB' || doc.fileType === 'FORECAST_COST' || doc.fileType === 'FOTO') && <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />}
                            <span className="truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{doc.project?.name || '-'}</td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{doc.fileType}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                          <td className="py-3 px-4 text-slate-400">{new Date(doc.createdAt).toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {hasDetails ? (
                              <button
                                onClick={() => handleOpenExplorerDetails(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 shadow-3xs"
                                title="Buka Detail Rincian Excel"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewFile(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-sky-600 shadow-3xs"
                                title="Buka / Preview Berkas"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDownloadDoc(user?.role || '', doc.fileType) && (
                              <button
                                onClick={() => handleDownload(doc)}
                                className="inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 shadow-3xs"
                                title="Unduh Berkas Asli"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                              className="inline-flex p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-500 shadow-3xs"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {documents.filter(d => d.uploadedById === user?.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
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
              {canDownloadDoc(user?.role || '', selectedExplorerDoc.fileType) && (
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
              {canDownloadDoc(user?.role || '', viewPenawaranDoc?.fileType || '') && (
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
    </div>
  );
}
