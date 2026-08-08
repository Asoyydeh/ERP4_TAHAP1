'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import api, { getBackendHostUrl } from '@/lib/api';
import { 
  FileText, Download, Save, Plus, Trash2, Edit2, History, ChevronLeft, Calendar, X, Search
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export default function ProyekDocumentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [activeCompany, setActiveCompany] = useState<'MJI' | 'DJI'>('MJI');
  const [showHistory, setShowHistory] = useState(false);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Signature data from backend
  const [signaturesData, setSignaturesData] = useState<{MJI: any[], DJI: any[]}>({
    MJI: [], DJI: []
  });

  // Basic Form State
  const [docNo, setDocNo] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [requestedBy, setRequestedBy] = useState('');
  const [projectName, setProjectName] = useState('');
  const [kodeProyek, setKodeProyek] = useState('');
  const [preparedByText, setPreparedByText] = useState('');
  
  // Payment Details
  const [payToName, setPayToName] = useState('');
  const [payToBank, setPayToBank] = useState('');
  const [payToAccount, setPayToAccount] = useState('');
  
  // Items
  const [items, setItems] = useState<any[]>([{
    id: Date.now().toString(),
    date: tanggal,
    project: '',
    supplier: '',
    description: '',
    nominal: 0,
    presentase: '100%',
    amount: 0,
    remarks: '',
    kategori: '' // for DJI
  }]);

  // Signatures Selection State (Arrays to support multiple signers per slot)
  const [preparedByList, setPreparedByList] = useState<string[]>(['']);
  const [checkedByList, setCheckedByList] = useState<string[]>(['Edi', 'Nurdin', 'Lucas', 'Yunita', 'Dian']);
  const [approvedByList, setApprovedByList] = useState<string[]>(['Rachel']);
  const [paidByList, setPaidByList] = useState<string[]>(['Rachel']);

  const [sigPrepared, setSigPrepared] = useState<string[]>(['']);
  const [sigChecked, setSigChecked] = useState<string[]>(['']);
  const [sigApproved, setSigApproved] = useState<string[]>(['']);
  const [sigPaid, setSigPaid] = useState<string[]>(['']);
  const [isPpnActive, setIsPpnActive] = useState(false);

  // Helper to format array of names into text string (e.g. Edi, Nurdin, Lucas, Yunita & Dian)
  const formatNamesArray = (arr: string[]) => {
    const valid = arr.filter(Boolean);
    if (valid.length === 0) return '';
    if (valid.length === 1) return valid[0];
    if (valid.length === 2) return `${valid[0]} & ${valid[1]}`;
    return `${valid.slice(0, -1).join(', ')} & ${valid[valid.length - 1]}`;
  };

  // Signature Name Texts
  const [checkedByText, setCheckedByText] = useState('Edi, Nurdin, Lucas, Yunita & Dian');
  const [approvedByText, setApprovedByText] = useState('Rachel');
  const [paidByText, setPaidByText] = useState('Rachel');

  // Priority Color
  const [priorityColor, setPriorityColor] = useState('red');
  
  const documentPrintRef = useRef<HTMLDivElement>(null);
  const [masterSubkons, setMasterSubkons] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  const userRole = user?.role;
  const isSuperAdmin = userRole === 'SUPERADMIN';
  const isProyekAdmin = userRole === 'PROYEK_ADMIN' || user?.manager?.role === 'PROYEK_ADMIN';
  const isEngineering = userRole === 'ENGINEERING' || user?.manager?.role === 'ENGINEERING';
  const isFinance = userRole === 'FINANCE' || user?.manager?.role === 'FINANCE';
  const isManager = userRole === 'PROJECT_MANAGER' || userRole === 'SUPERVISOR';

  const checkSlotPermission = (slot: 'PREPARED' | 'CHECKED' | 'APPROVED' | 'PAID'): { allowed: boolean; roleLabel: string } => {
    if (isSuperAdmin) return { allowed: true, roleLabel: 'SUPERADMIN' };
    if (slot === 'PREPARED') return { allowed: isProyekAdmin || isEngineering, roleLabel: 'PROYEK ADMIN / ENG' };
    if (slot === 'CHECKED') return { allowed: isProyekAdmin || isEngineering || isFinance, roleLabel: 'CHECKER / ADMIN' };
    if (slot === 'APPROVED') return { allowed: isManager, roleLabel: 'PROJECT MANAGER' };
    if (slot === 'PAID') return { allowed: isFinance, roleLabel: 'FINANCE' };
    return { allowed: false, roleLabel: 'Akses Dibatasi' };
  };

  const getSlotNames = (slot: 'PREPARED' | 'CHECKED' | 'APPROVED' | 'PAID') => {
    let names: string[] = systemUsers.map(u => u.name);
    const presetNames = [
      'Arnis', 'Denny', 'Dhea', 'Dian', 'Dini', 'Edi', 'Edi Purwanto',
      'Fanisa Ariesti', 'Fitri', 'Glori', 'Joko', 'Kiki', 'Lucas', 'Nurdin',
      'Rachel', 'Salsa', 'Via', 'Yunita'
    ];
    return Array.from(new Set([...names, ...presetNames])).sort();
  };

  useEffect(() => {
    fetchSignatures();
    fetchHistory();
    fetchMasterSubkons();
    fetchProjects();
    fetchUsers();
  }, [activeCompany]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setSystemUsers(res.data.data || res.data.users || []);
      }
    } catch {
      try {
        const res2 = await api.get('/auth/users');
        if (res2.data?.success) {
          setSystemUsers(res2.data.data || res2.data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch system users:', err);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.success) {
        setProjectsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchMasterSubkons = async () => {

    try {
      const res = await api.get('/master-data/subkons');
      if (res.data?.success) {
        setMasterSubkons(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch master subkons:', err);
    }
  };

  const fetchSignatures = async () => {

    try {
      const res = await api.get('/company-documents/proyek-signatures');
      if (res.data?.success) {
        setSignaturesData(res.data.signatures);
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      // Fetch only documents of this company and marked as PROYEK_ADMIN type
      const res = await api.get(`/company-documents/forms?company=${activeCompany}`);
      if (res.data?.success) {
        const proyekDocs = res.data.data.filter((d: any) => d.documentData?.type === 'PROYEK_ADMIN');
        setHistoryDocs(proyekDocs);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Kalkulasi MJK
  const subtotalMJK = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const dppNilaiLainMJK = isPpnActive ? Math.round(subtotalMJK * (11 / 12)) : 0;
  const pphMJK = Math.round((isPpnActive ? dppNilaiLainMJK : subtotalMJK) * 0.0175); // PPH 1.75%
  const ppnMJK = isPpnActive ? Math.round(subtotalMJK * 0.11) : 0; // PPN 11%
  const totalMJK = subtotalMJK + ppnMJK - pphMJK;

  // Kalkulasi DJI
  const subtotalDJI = items.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const ppnDJI = isPpnActive ? Math.round(subtotalDJI * 0.12) : 0; // DJI uses 12% if active? Actually I'll use 11% since the user said 11% (DPP Nilai Lain), or wait, I'll keep the PPN rate DJI had which was 12%, but conditional. Wait, I'll just change to 12% if that's what DJI used. Or I'll just use 12% conditionally.
  const pphDJI = Math.round(subtotalDJI * 0.02); // PPH 2%
  const totalDJI = subtotalDJI + ppnDJI - pphDJI;

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      date: tanggal,
      project: projectName,
      supplier: payToName,
      description: '',
      nominal: 0,
      presentase: '100%',
      amount: 0,
      remarks: '',
      kategori: ''
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'nominal') {
          updated.amount = value; 
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!docNo) return alert('Nomor Dokumen harus diisi!');
    setIsSaving(true);
    try {
      const computedGrandTotal = items.reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.nominal) || 0), 0);

      const payload = {
        company: activeCompany,
        documentNo: docNo,
        poNo: null,
        vendorName: payToName,
        totalAmount: computedGrandTotal,
        documentData: {
          type: 'PROYEK_ADMIN',
          tanggal,
          requestedBy,
          projectName,
          kodeProyek,
          selectedProjectId,
          preparedByText,
          payToName,
          payToBank,
          payToAccount,
          isPpnActive,
          items,
          subtotal: computedGrandTotal,
          grandTotal: computedGrandTotal,
          checkedByText,
          approvedByText,
          paidByText,
          priorityColor,
          signatures: {
            prepared: sigPrepared.filter(Boolean),
            checked: sigChecked.filter(Boolean),
            approved: sigApproved.filter(Boolean),
            paid: sigPaid.filter(Boolean)
          }
        }
      };

      if (editingId) {
        await api.put(`/company-documents/forms/${editingId}`, payload);
        alert('Dokumen berhasil diupdate!');
      } else {
        await api.post('/company-documents/forms', payload);
        alert('Dokumen berhasil disimpan!');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app_data_changed'));
        if ('BroadcastChannel' in window) {
          try {
            const ch = new BroadcastChannel('app_data_sync');
            ch.postMessage({ type: 'SYNC' });
            ch.close();
          } catch (e) {}
        }
      }

      fetchHistory();
      setShowHistory(true);
      handleReset();
    } catch (err: any) {
      alert('Gagal menyimpan dokumen: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };


  const handleEdit = (doc: any) => {
    const data = doc.documentData;
    setEditingId(doc.id);
    setActiveCompany(doc.company as any);
    setDocNo(doc.documentNo);
    setTanggal(data.tanggal || '');
    setRequestedBy(data.requestedBy || '');
    setProjectName(data.projectName || '');
    setKodeProyek(data.kodeProyek || '');
    setPreparedByText(data.preparedByText || '');
    setPayToName(data.payToName || '');
    setPayToBank(data.payToBank || '');
    setPayToAccount(data.payToAccount || '');
    setIsPpnActive(data.isPpnActive || false);
    setItems(data.items || []);
    
    const cText = data.checkedByText || 'Edi, Nurdin, Lucas, Yunita & Dian';
    const aText = data.approvedByText || 'Rachel';
    const pText = data.paidByText || 'Rachel';

    setCheckedByText(cText);
    setApprovedByText(aText);
    setPaidByText(pText);
    setPriorityColor(data.priorityColor || 'red');
    
    const parseNamesToList = (textVal: string, fallback: string[]) => {
      if (!textVal) return fallback;
      const parts = textVal.split(/,\s*|\s*&\s*/).map(s => s.trim()).filter(Boolean);
      return parts.length > 0 ? parts : fallback;
    };

    setPreparedByList(parseNamesToList(data.preparedByText, ['']));
    setCheckedByList(parseNamesToList(cText, ['Edi', 'Nurdin', 'Lucas', 'Yunita', 'Dian']));
    setApprovedByList(parseNamesToList(aText, ['Rachel']));
    setPaidByList(parseNamesToList(pText, ['Rachel']));

    // Ensure signature states are arrays
    const parseSigs = (val: any) => Array.isArray(val) ? (val.length ? val : ['']) : (val ? [val] : ['']);
    setSigPrepared(parseSigs(data.signatures?.prepared));
    setSigChecked(parseSigs(data.signatures?.checked));
    setSigApproved(parseSigs(data.signatures?.approved));
    setSigPaid(parseSigs(data.signatures?.paid));
    
    setShowHistory(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen ini?')) return;
    try {
      await api.delete(`/company-documents/forms/${id}`);
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus');
    }
  };

  const handleReset = () => {
    setEditingId(null);
    setDocNo('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setRequestedBy('');
    setProjectName('');
    setKodeProyek('');
    setPreparedByText('');
    setPayToName('');
    setPayToBank('');
    setPayToAccount('');
    setIsPpnActive(false);
    setItems([{
      id: Date.now().toString(), date: tanggal, project: '', supplier: '', description: '', nominal: 0, presentase: '100%', amount: 0, remarks: '', kategori: ''
    }]);
    setPreparedByList(['']);
    setCheckedByList(['Edi', 'Nurdin', 'Lucas', 'Yunita', 'Dian']);
    setApprovedByList(['Rachel']);
    setPaidByList(['Rachel']);
    setCheckedByText('Edi, Nurdin, Lucas, Yunita & Dian');
    setApprovedByText('Rachel');
    setPaidByText('Rachel');
    setSigPrepared(['']);
    setSigChecked(['']);
    setSigApproved(['']);
    setSigPaid(['']);
    setCheckedByText('Edi, Nurdin, Lucas, Yunita & Dian');
    setApprovedByText('Rachel');
    setPaidByText('Rachel');
    setPriorityColor('red');
  };

  const handlePrint = async () => {
    if (!documentPrintRef.current) return;
    const element = documentPrintRef.current;
    try {
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = element.offsetWidth;
      const imgHeight = element.offsetHeight;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${activeCompany}_PaymentRequest_${docNo || 'Draft'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal generate PDF');
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const availableSignatures = activeCompany === 'MJI' ? signaturesData.MJI : signaturesData.DJI;

  const renderSignatureSelects = (label: string, sigs: string[], setSigs: (s: string[]) => void, nameText: string, setNameText: (s: string) => void) => {
    return (
      <div className="space-y-2 p-3 bg-slate-50 border rounded-xl">
        <label className="text-xs font-bold text-slate-700 block">{label}</label>
        
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Teks (Bawah TTD)</label>
          <input type="text" value={nameText} onChange={e=>setNameText(e.target.value)} className="w-full p-2 bg-white border rounded-lg text-xs" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">Gambar Tanda Tangan</label>
          {sigs.map((sig, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <select value={sig} onChange={e => {
                const newArr = [...sigs];
                newArr[i] = e.target.value;
                setSigs(newArr);
              }} className="w-full p-2 bg-white border rounded-lg text-xs">
                <option value="">Pilih Tanda Tangan...</option>
                {availableSignatures.map((s: any) => <option key={s.name} value={s.imageUrl}>{s.name}</option>)}
              </select>
              {sigs.length > 1 && (
                <button onClick={() => setSigs(sigs.filter((_, idx) => idx !== i))} className="text-red-500 px-2 bg-red-50 rounded-lg hover:bg-red-100">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setSigs([...sigs, ''])} className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold mt-1 text-slate-600 hover:bg-slate-200">
            + Tambah TTD
          </button>
        </div>
      </div>
    );
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };
  
  const formatDateStringDJI = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear().toString().substring(2)}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 dark:bg-sky-950/60 rounded-xl text-sky-600 dark:text-sky-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">PO PROYEK ADMIN</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Buat dan kelola dokumen Payment Request PO Proyek Admin untuk MJK &amp; DJI</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!showHistory ? (
            <button onClick={() => setShowHistory(true)} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 text-xs transition-all shadow-sm">
              <History className="w-4 h-4 text-sky-600" /> Riwayat Dokumen
            </button>
          ) : (
            <button onClick={() => {setShowHistory(false); handleReset();}} className="px-4 py-2.5 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 flex items-center gap-2 text-xs transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Dokumen Baru
            </button>
          )}
        </div>
      </div>

      {!showHistory && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => { setActiveCompany('MJI'); handleReset(); }}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeCompany === 'MJI' ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-600' : 'text-slate-500'}`}
            >
              MJK
            </button>
            <button
              onClick={() => { setActiveCompany('DJI'); handleReset(); }}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeCompany === 'DJI' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600' : 'text-slate-500'}`}
            >
              DJI
            </button>
          </div>
          
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <input
              type="checkbox"
              id="proyekPpnToggle"
              checked={isPpnActive}
              onChange={(e) => setIsPpnActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="proyekPpnToggle" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
              Aktifkan PPN {activeCompany === 'MJI' ? '11% (DPP Nilai Lain)' : '12%'}
            </label>
          </div>
        </div>
      )}

      {showHistory ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold">Riwayat Dokumen {activeCompany}</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Dokumen atau Kode Proyek..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-bold">Nomor Dokumen</th>
                  <th className="p-3 font-bold">Kode Proyek</th>
                  <th className="p-3 font-bold">Tanggal</th>
                  <th className="p-3 font-bold">Vendor/Penerima</th>
                  <th className="p-3 font-bold">Dibuat Oleh</th>
                  <th className="p-3 font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyDocs.filter(d => {
                  const s = searchHistory.toLowerCase();
                  return d.documentNo?.toLowerCase().includes(s) ||
                         d.documentData?.kodeProyek?.toLowerCase().includes(s) ||
                         d.documentData?.kategori?.toLowerCase().includes(s) ||
                         d.documentData?.payToName?.toLowerCase().includes(s) ||
                         d.documentData?.attachmentName?.toLowerCase().includes(s);
                }).map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="p-3 font-medium font-mono text-xs">{doc.documentNo}</td>
                    <td className="p-3 font-extrabold text-xs text-sky-600 dark:text-sky-400">{doc.documentData?.kodeProyek || doc.documentData?.kategori || '-'}</td>
                    <td className="p-3 text-xs">{doc.documentData?.tanggal}</td>
                    <td className="p-3 text-xs font-bold">{doc.documentData?.payToName || '-'}</td>
                    <td className="p-3 text-xs">{doc.createdBy?.name}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(doc)} className="text-sky-600 hover:bg-sky-50 p-2 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
                {historyDocs.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">Belum ada dokumen</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* FORM EDITOR STACKED (FULL WIDTH) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h3 className="font-extrabold text-base border-b pb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" /> Form Input PO Proyek Admin ({activeCompany})
            </h3>
            
            {/* 1. Informasi Umum */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Umum</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nomor Dokumen</label>
                  <input type="text" value={docNo} onChange={e=>setDocNo(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" placeholder="PR/VII/2026/002" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tanggal</label>
                  <input type="date" value={tanggal} onChange={e=>setTanggal(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Kode Proyek — <span className="text-sky-600 dark:text-sky-400 font-extrabold">Terhubung Database</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        const projId = e.target.value;
                        setSelectedProjectId(projId);
                        const selectedProj = projectsList.find(p => p.id === projId);
                        if (selectedProj) {
                          setKodeProyek(selectedProj.code || selectedProj.name);
                          setProjectName(`${selectedProj.code} - ${selectedProj.name}`);
                        }
                      }}
                      className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <option value="">-- Pilih Proyek (Database Super Admin) --</option>
                      {projectsList
                        .slice()
                        .sort((a, b) => {
                          const cUpper = activeCompany === 'MJI' ? 'MJK' : activeCompany;
                          const aMatch = (a.code || '').toUpperCase().includes(cUpper) ? -1 : 1;
                          const bMatch = (b.code || '').toUpperCase().includes(cUpper) ? -1 : 1;
                          return aMatch - bMatch;
                        })
                        .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `${p.code} - ${p.name}` : p.name} {p.client ? `(${p.client})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={kodeProyek}
                      onChange={(e) => setKodeProyek(e.target.value)}
                      placeholder="Atau manual..."
                      className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Project Name / Keterangan</label>
                  <input type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" />
                </div>
                {activeCompany === 'MJI' && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Requested By</label>
                      <input type="text" value={requestedBy} onChange={e=>setRequestedBy(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Warna Label Status</label>
                      <select value={priorityColor} onChange={e=>setPriorityColor(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold">
                        <option value="red">🔴 Merah (Urgent)</option>
                        <option value="green">🟢 Hijau (Normal)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Informasi Pembayaran */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Pembayaran</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Dibayarkan Kepada — <span className="text-sky-600 dark:text-sky-400 font-extrabold">Master Subkon</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={payToName}
                      onChange={(e) => setPayToName(e.target.value)}
                      className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      <option value="">-- Pilih Subkon --</option>
                      {masterSubkons.map((sub) => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={payToName}
                      onChange={(e) => setPayToName(e.target.value)}
                      placeholder="Atau manual..."
                      className="w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nama Bank</label>
                  <input type="text" value={payToBank} onChange={e=>setPayToBank(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Nomor Rekening</label>
                  <input type="text" value={payToAccount} onChange={e=>setPayToAccount(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-xs" />
                </div>
              </div>
            </div>

            {/* 3. Item Detail */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Detail Pekerjaan</h4>
                <button onClick={handleAddItem} className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5"/> Tambah Item
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 relative group">
                    <button onClick={() => handleRemoveItem(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full hover:bg-red-200"><X className="w-3.5 h-3.5"/></button>
                    <p className="text-xs font-bold text-sky-600">Item #{idx+1}</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Tanggal Item</label>
                        <input type="date" value={item.date} onChange={e=>handleItemChange(item.id, 'date', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Presentase</label>
                        <input type="text" value={item.presentase} onChange={e=>handleItemChange(item.id, 'presentase', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                      </div>
                    </div>

                    {activeCompany === 'MJI' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Project (Item)</label>
                          <input type="text" value={item.project} onChange={e=>handleItemChange(item.id, 'project', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Supplier/Nama</label>
                          <input type="text" value={item.supplier} onChange={e=>handleItemChange(item.id, 'supplier', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Deskripsi/Item</label>
                      <input type="text" value={item.description} onChange={e=>handleItemChange(item.id, 'description', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nominal (Rp)</label>
                        <input type="number" value={item.nominal} onChange={e=>handleItemChange(item.id, 'nominal', Number(e.target.value))} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                      </div>
                      {activeCompany === 'MJI' ? (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Remarks</label>
                          <input type="text" value={item.remarks} onChange={e=>handleItemChange(item.id, 'remarks', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">Kategori</label>
                          <input type="text" value={item.kategori} onChange={e=>handleItemChange(item.id, 'kategori', e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Tanda Tangan */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pengaturan Penanda Tangan PO Proyek Admin ({activeCompany === 'MJI' ? 'MJK' : activeCompany})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Role: {userRole || 'GUEST'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Prepared By */}
                {(() => {
                  const perm = checkSlotPermission('PREPARED');
                  const names = getSlotNames('PREPARED');
                  return (
                    <div className={`p-3 rounded-xl border ${perm.allowed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 opacity-70'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{activeCompany === 'MJI' ? 'Prepared By' : 'Dibuat Oleh'}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${perm.allowed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{perm.roleLabel}</span>
                      </div>
                      <div className="space-y-2">
                        {preparedByList.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <select
                              value={val}
                              disabled={!perm.allowed}
                              onChange={(e) => {
                                const next = [...preparedByList];
                                next[idx] = e.target.value;
                                setPreparedByList(next);
                                setPreparedByText(formatNamesArray(next));
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white font-bold cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                            >
                              <option value="">-- Pilih Nama --</option>
                              {names.map((n, i) => <option key={i} value={n}>{n}</option>)}
                            </select>
                            {preparedByList.length > 1 && perm.allowed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = preparedByList.filter((_, i) => i !== idx);
                                  setPreparedByList(next);
                                  setPreparedByText(formatNamesArray(next));
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                                title="Hapus Penanda Tangan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {perm.allowed && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...preparedByList, ''];
                              setPreparedByList(next);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Tambah Penanda Tangan (+)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Checked By */}
                {(() => {
                  const perm = checkSlotPermission('CHECKED');
                  const names = getSlotNames('CHECKED');
                  return (
                    <div className={`p-3 rounded-xl border ${perm.allowed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 opacity-70'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{activeCompany === 'MJI' ? 'Checked By' : 'DiCek Oleh'}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${perm.allowed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{perm.roleLabel}</span>
                      </div>
                      <div className="space-y-2">
                        {checkedByList.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <select
                              value={val}
                              disabled={!perm.allowed}
                              onChange={(e) => {
                                const next = [...checkedByList];
                                next[idx] = e.target.value;
                                setCheckedByList(next);
                                setCheckedByText(formatNamesArray(next));
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white font-bold cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                            >
                              <option value="">-- Pilih Nama --</option>
                              {names.map((n, i) => <option key={i} value={n}>{n}</option>)}
                            </select>
                            {checkedByList.length > 1 && perm.allowed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = checkedByList.filter((_, i) => i !== idx);
                                  setCheckedByList(next);
                                  setCheckedByText(formatNamesArray(next));
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                                title="Hapus Penanda Tangan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {perm.allowed && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...checkedByList, ''];
                              setCheckedByList(next);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Tambah Penanda Tangan (+)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Approved By */}
                {(() => {
                  const perm = checkSlotPermission('APPROVED');
                  const names = getSlotNames('APPROVED');
                  return (
                    <div className={`p-3 rounded-xl border ${perm.allowed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 opacity-70'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{activeCompany === 'MJI' ? 'Approved By' : 'Disetujui Oleh'}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${perm.allowed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{perm.roleLabel}</span>
                      </div>
                      <div className="space-y-2">
                        {approvedByList.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <select
                              value={val}
                              disabled={!perm.allowed}
                              onChange={(e) => {
                                const next = [...approvedByList];
                                next[idx] = e.target.value;
                                setApprovedByList(next);
                                setApprovedByText(formatNamesArray(next));
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white font-bold cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                            >
                              <option value="">-- Pilih Nama --</option>
                              {names.map((n, i) => <option key={i} value={n}>{n}</option>)}
                            </select>
                            {approvedByList.length > 1 && perm.allowed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = approvedByList.filter((_, i) => i !== idx);
                                  setApprovedByList(next);
                                  setApprovedByText(formatNamesArray(next));
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                                title="Hapus Penanda Tangan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {perm.allowed && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...approvedByList, ''];
                              setApprovedByList(next);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Tambah Penanda Tangan (+)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Paid By (For DJI) */}
                {activeCompany === 'DJI' && (() => {
                  const perm = checkSlotPermission('PAID');
                  const names = getSlotNames('PAID');
                  return (
                    <div className={`p-3 rounded-xl border ${perm.allowed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 opacity-70'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Dibayarkan Oleh</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${perm.allowed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{perm.roleLabel}</span>
                      </div>
                      <div className="space-y-2">
                        {paidByList.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <select
                              value={val}
                              disabled={!perm.allowed}
                              onChange={(e) => {
                                const next = [...paidByList];
                                next[idx] = e.target.value;
                                setPaidByList(next);
                                setPaidByText(formatNamesArray(next));
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white font-bold cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                            >
                              <option value="">-- Pilih Nama --</option>
                              {names.map((n, i) => <option key={i} value={n}>{n}</option>)}
                            </select>
                            {paidByList.length > 1 && perm.allowed && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = paidByList.filter((_, i) => i !== idx);
                                  setPaidByList(next);
                                  setPaidByText(formatNamesArray(next));
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0"
                                title="Hapus Penanda Tangan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {perm.allowed && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...paidByList, ''];
                              setPaidByList(next);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Tambah Penanda Tangan (+)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* 5. Tombol Aksi */}
            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
                <Save className="w-5 h-5"/> {isSaving ? 'Menyimpan...' : 'Simpan Dokumen'}
              </button>
              <button onClick={handlePrint} className="flex-1 py-3 bg-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 transition-colors shadow-sm cursor-pointer">
                <Download className="w-5 h-5"/> Unduh / Cetak PDF Presisi 🖨️
              </button>
            </div>
          </div>

          {/* ── PREVIEW SECTION ── */}
          <div className="bg-slate-200 dark:bg-slate-800 p-2 sm:p-8 rounded-2xl overflow-x-auto shadow-inner w-full flex md:justify-center justify-start max-w-full">
            
            {/* PRINTABLE AREA A4 LANDSCAPE (297mm x 210mm) */}
            <div
              id="printable-area"
              ref={documentPrintRef}
              className="bg-white w-[297mm] min-h-[210mm] shadow-2xl relative shrink-0"
                style={{ color: '#000', fontFamily: 'Arial, sans-serif', width: '297mm' }}
              >
                
                {/* -------------------- MJK LAYOUT -------------------- */}
                {activeCompany === 'MJI' && (
                  <div className="p-12 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-[13px] space-y-1 mt-4">
                        <div className="font-bold underline decoration-2 underline-offset-2 mb-2 text-[14px]">PAYMENT REQUEST</div>
                        <div>Date: {formatDateString(tanggal)}</div>
                        <div className="flex items-center gap-2">
                          <span>Requested By:</span>
                          <span className={`font-bold border-[1px] border-black text-black px-4 ${priorityColor === 'red' ? 'bg-red-600' : priorityColor === 'green' ? 'bg-green-500' : priorityColor === 'yellow' ? 'bg-yellow-400' : 'bg-transparent'}`}>{requestedBy}</span>
                        </div>
                        <div>Project Name: {projectName}</div>
                        <div>Kode Proyek : {kodeProyek}</div>
                        <div>Prepared By: {preparedByText}</div>
                        <div>Nomor : {docNo}</div>
                      </div>
                      <div className="flex flex-col items-center mr-4">
                        <img src="/mjk_logo.png" alt="MJK Logo" className="w-48 mb-2" />
                        <div className="text-[11px] font-bold tracking-widest">PT. MODERN JAYA KONSTRUKSI</div>
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border-[1.5px] border-black text-xs text-center mt-8">
                      <thead>
                        <tr className="bg-[#99ccff]">
                          <th className="border-[1.5px] border-black py-2 px-2 w-10">No.</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-28">DATE</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-48">Project</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-48">Supplier/Nama</th>
                          <th className="border-[1.5px] border-black py-2 px-2">Description/Item</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-32">Nominal</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-20">Presentase</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-32">Amount (Rp.)</th>
                          <th className="border-[1.5px] border-black py-2 px-2 w-40">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={it.id}>
                            <td className="border-[1.5px] border-black py-2 px-1">{idx+1}</td>
                            <td className="border-[1.5px] border-black py-2 px-1">{formatDateString(it.date)}</td>
                            <td className="border-[1.5px] border-black py-2 px-1 text-[11px] text-left">{it.project}</td>
                            <td className="border-[1.5px] border-black py-2 px-1">{it.supplier}</td>
                            <td className="border-[1.5px] border-black py-2 px-1 text-left">{it.description}</td>
                            <td className="border-[1.5px] border-black py-2 px-1 text-center">{formatCurrency(it.nominal)}</td>
                            <td className="border-[1.5px] border-black py-2 px-1">{it.presentase}</td>
                            <td className="border-[1.5px] border-black py-2 px-2 text-right">{formatCurrency(it.amount)}</td>
                            <td className="border-[1.5px] border-black py-2 px-1 text-[11px] text-left">{it.remarks}</td>
                          </tr>
                        ))}
                        {/* Fill rows to make it tall enough if few items */}
                        {items.length === 1 && (
                          <tr className="h-10">
                             <td className="border-[1.5px] border-black"></td><td className="border-[1.5px] border-black"></td>
                             <td className="border-[1.5px] border-black"></td><td className="border-[1.5px] border-black"></td>
                             <td className="border-[1.5px] border-black"></td><td className="border-[1.5px] border-black"></td>
                             <td className="border-[1.5px] border-black"></td><td className="border-[1.5px] border-black"></td>
                             <td className="border-[1.5px] border-black"></td>
                          </tr>
                        )}
                        {/* Summary Rows */}
                        <tr>
                          <td colSpan={5} className="border-t-[1.5px] border-black bg-white" rowSpan={isPpnActive ? 5 : 3}></td>
                          <td colSpan={2} className="border-[1.5px] border-black py-1.5 font-bold bg-white text-right pr-4">Subtotal</td>
                          <td className="border-[1.5px] border-black py-1.5 bg-white text-right px-2">{formatCurrency(subtotalMJK)}</td>
                          <td className="border-l-[1.5px] border-b-0 border-black bg-white" rowSpan={isPpnActive ? 5 : 3}></td>
                        </tr>
                        {isPpnActive && (
                          <>
                            <tr>
                              <td colSpan={2} className="border-[1.5px] border-black py-1.5 font-bold bg-white text-right pr-4">DPP Nilai Lain</td>
                              <td className="border-[1.5px] border-black py-1.5 bg-white text-right px-2">{formatCurrency(dppNilaiLainMJK)}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="border-[1.5px] border-black py-1.5 font-bold bg-white text-right pr-4">PPN 11%</td>
                              <td className="border-[1.5px] border-black py-1.5 bg-white text-right px-2">{formatCurrency(ppnMJK)}</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td colSpan={2} className="border-[1.5px] border-black py-1.5 font-bold bg-white text-right pr-4">PPH (1.75%)</td>
                          <td className="border-[1.5px] border-black py-1.5 bg-white text-right px-2">{formatCurrency(pphMJK)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="border-[1.5px] border-black py-2 font-bold text-sm bg-white text-right pr-4 uppercase">TOTAL</td>
                          <td className="border-[1.5px] border-black py-2 bg-white text-right px-2 text-sm">{formatCurrency(totalMJK)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Payment Box */}
                    <div className="mt-8">
                      <div className="italic text-[13px] mb-1 font-serif text-slate-700">Please attach all original invoices and receipts when submitting this document for requesting Payment</div>
                      <div className="border-[3px] border-black p-3 w-[450px] text-sm font-bold leading-relaxed">
                        <div className="font-normal italic mb-1 text-[13px]">Pembayaran dibuat kepada:</div>
                        <div className="grid grid-cols-[100px_auto] text-[13px]">
                          <span className="font-normal text-right pr-2">Nama:</span> <span>{payToName}</span>
                          <span className="font-normal text-right pr-2">Bank:</span> <span>{payToBank}</span>
                          <span className="font-normal text-right pr-2">Rekening No.:</span> <span>{payToAccount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end mt-16 px-10 pb-10">
                      
                      <div className="w-56 flex flex-col h-40">
                        <div className="text-left font-normal mb-2">Prepared By,</div>
                        <div className="flex justify-start items-end grow">
                          {preparedByList.filter(Boolean).map((name, idx) => {
                            const savedUrl = sigPrepared[idx];
                            const finalUrl = (savedUrl && typeof savedUrl === 'string' && savedUrl.trim()) ? savedUrl : null;
                            return finalUrl ? (
                              <img key={idx} src={`${getBackendHostUrl()}${finalUrl}`} className="h-28 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} alt={name} />
                            ) : null;
                          })}
                        </div>
                        <div className="text-left text-xs leading-relaxed mt-2">
                          <div>Name/姓名: {preparedByText}</div>
                          <div>Date: {formatDateString(tanggal)}</div>
                        </div>
                      </div>

                      <div className="w-72 flex flex-col h-40">
                        <div className="text-left font-normal mb-2">Checked By,</div>
                        <div className="flex justify-start items-end grow">
                          {checkedByList.filter(Boolean).map((name, idx) => {
                            const savedUrl = sigChecked[idx];
                            const finalUrl = (savedUrl && typeof savedUrl === 'string' && savedUrl.trim()) ? savedUrl : null;
                            return finalUrl ? (
                              <img key={idx} src={`${getBackendHostUrl()}${finalUrl}`} className="h-28 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} alt={name} />
                            ) : null;
                          })}
                        </div>
                        <div className="text-left text-xs leading-relaxed mt-2">
                          <div>Name/姓名: {checkedByText}</div>
                          <div>Date/日期:</div>
                        </div>
                      </div>

                      <div className="w-72 flex flex-col h-40">
                        <div className="text-left font-normal mb-2">Approved by / 批准人:</div>
                        <div className="flex justify-start items-end grow">
                          {approvedByList.filter(Boolean).map((name, idx) => {
                            const savedUrl = sigApproved[idx];
                            const finalUrl = (savedUrl && typeof savedUrl === 'string' && savedUrl.trim()) ? savedUrl : null;
                            return finalUrl ? (
                              <img key={idx} src={`${getBackendHostUrl()}${finalUrl}`} className="h-28 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} alt={name} />
                            ) : null;
                          })}
                        </div>
                        <div className="text-left text-xs leading-relaxed mt-2">
                          <div>Name/姓名: {approvedByText}</div>
                          <div>Date/日期:</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* -------------------- DJI LAYOUT -------------------- */}
                {activeCompany === 'DJI' && (
                  <div className="p-4 flex flex-col border-[4px] border-black m-6" style={{ height: 'calc(100% - 48px)' }}>
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center border-b-[3px] border-black pb-4 mb-4 relative pt-2">
                      <img src="/dji_logo.svg" alt="DJI Logo" className="w-24 absolute left-10 top-0" />
                      <div className="text-center font-bold tracking-wide">
                        <div className="text-lg">PT. DELTA JAYA INDOTAMA</div>
                        <div className="text-xl mt-1">FORM PAYMENT REQUEST</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[13px] px-6 mb-4">
                      <div className="grid grid-cols-[110px_15px_auto] gap-y-1.5 w-7/12">
                        <span>Nama 名字</span> <span>:</span> <span>{payToName}</span>
                        <span>Vendor</span> <span>:</span> <span className="font-bold">{payToName}</span>
                        <span>Keterangan</span> <span>:</span> <span className="font-bold whitespace-pre-wrap">{projectName}</span>
                      </div>
                      <div className="grid grid-cols-[100px_15px_auto] gap-y-1.5 w-4/12">
                        <span>Nomor</span> <span>:</span> <span>{docNo}</span>
                        <span>Tgl Invoice</span> <span>:</span> <span>{formatDateStringDJI(tanggal)}</span>
                        <span>Kode Proyek</span> <span>:</span> <span>{kodeProyek}</span>
                      </div>
                    </div>

                    <table className="w-full text-[13px] text-center flex-1">
                      <thead className="border-t-[3px] border-b-[3px] border-black font-bold">
                        <tr>
                          <th className="py-2.5 w-12 font-bold leading-tight">No<br/>号</th>
                          <th className="py-2.5 w-40 font-bold">Tanggal 日期</th>
                          <th className="py-2.5 text-center font-bold">Deskripsi 描述</th>
                          <th className="py-2.5 w-32 font-bold">Kategori 类别</th>
                          <th className="py-2.5 w-40 text-center pr-4 font-bold leading-tight">Nominal<br/>(Rp) 金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={it.id}>
                            <td className="py-3 align-top">{idx+1}</td>
                            <td className="py-3 align-top">{formatDateStringDJI(it.date)}</td>
                            <td className="py-3 text-left align-top font-bold text-[13px]">
                              {it.project}<br/>
                              <span className="font-normal text-slate-700">* {it.description}</span>
                            </td>
                            <td className="py-3 align-top">{it.kategori}</td>
                            <td className="py-3 text-right pr-4 align-top">{formatCurrency(it.nominal)}</td>
                          </tr>
                        ))}
                        {/* Fill remaining space */}
                        <tr className="h-full"><td colSpan={5}></td></tr>
                      </tbody>
                      <tfoot className="border-t-[3px] border-b-[3px] border-black font-bold text-sm">
                        <tr>
                          <td colSpan={2} rowSpan={isPpnActive ? 4 : 3} className="border-r-[3px] border-black"></td>
                          <td colSpan={2} className="text-left py-1.5 px-4 border-b border-black">SUB TOTAL</td>
                          <td className="text-right py-1.5 px-4 border-b border-black">{formatCurrency(subtotalDJI)}</td>
                        </tr>
                        {isPpnActive && (
                          <tr>
                            <td colSpan={2} className="text-left py-1.5 px-4 border-b border-black">PPN</td>
                            <td className="text-right py-1.5 px-4 border-b border-black">{ppnDJI ? formatCurrency(ppnDJI) : '-'}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={2} className="text-left py-1.5 px-4 border-b border-black">PPH 2%</td>
                          <td className="text-right py-1.5 px-4 border-b border-black">{pphDJI ? formatCurrency(pphDJI) : '-'}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="text-left py-2 px-4">TOTAL 合计</td>
                          <td className="text-right py-2 px-4">{formatCurrency(totalDJI)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Payment Info */}
                    <div className="grid grid-cols-[160px_auto] gap-y-1 text-[12px] font-bold mt-6 px-6">
                      <span>Dibayarkan kepada 收款者</span> <span>{payToName}</span>
                      <span>Nomor Rekening 账号</span> <span>{payToAccount}</span>
                      <span>Nama Bank 银行名</span> <span>{payToBank}</span>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end mt-12 px-6 pb-6 text-[13px]">
                      <div className="w-40 flex flex-col h-32">
                        <div className="mb-2 text-left">Dibuat Oleh, 制表</div>
                        <div className="flex justify-center items-end grow">
                          {sigPrepared.filter(Boolean).map((sig, idx) => (
                            <img key={idx} src={`${getBackendHostUrl()}${sig}`} className="h-24 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} />
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-center">{preparedByText ? `( ${preparedByText} )` : ''}</div>
                      </div>
                      
                      <div className="w-48 flex flex-col h-32">
                        <div className="mb-2 text-left">DiCek Oleh,由检查</div>
                        <div className="flex justify-center items-end grow">
                          {sigChecked.filter(Boolean).map((sig, idx) => (
                            <img key={idx} src={`${getBackendHostUrl()}${sig}`} className="h-24 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} />
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-center">{checkedByText ? `( ${checkedByText} )` : ''}</div>
                      </div>

                      <div className="w-48 flex flex-col h-32">
                        <div className="mb-2 text-left">Dibayarkan Oleh,财务</div>
                        <div className="flex justify-center items-end grow">
                          {sigPaid.filter(Boolean).map((sig, idx) => (
                            <img key={idx} src={`${getBackendHostUrl()}${sig}`} className="h-24 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} />
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-center">{paidByText ? `( ${paidByText} )` : ''}</div>
                      </div>

                      <div className="w-56 flex flex-col h-32">
                        <div className="mb-2 text-left">Disetujui Oleh, 批准</div>
                        <div className="flex justify-center items-end grow">
                          {sigApproved.filter(Boolean).map((sig, idx) => (
                            <img key={idx} src={`${getBackendHostUrl()}${sig}`} className="h-24 object-contain mix-blend-darken" style={{ marginLeft: idx > 0 ? '-30px' : '0' }} />
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-center">{approvedByText ? `( ${approvedByText} )` : ''}</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
  );
}
