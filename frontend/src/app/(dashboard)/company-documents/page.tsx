'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { getBackendHostUrl } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import * as XLSX from 'xlsx';
import {
  FileText,
  Plus,
  History,
  Printer,
  Save,
  Trash2,
  Edit,
  RefreshCw,
  Building2,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Search
} from 'lucide-react';

// Interfaces
interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  manager?: { role: string };
}

interface SignatureOption {
  name: string;
  imageUrl: string;
}

interface SignaturesData {
  MJI: SignatureOption[];
  MJK?: SignatureOption[];
  DJI: SignatureOption[];
  IRI: SignatureOption[];
}

interface ItemRow {
  no: number;
  item: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface TerminItem {
  stageName: string;
  percent: number;
  amount: number;
  notes: string;
}

interface SignatureSlot {
  label: string;
  name: string;
  note?: string;
  signatureUrl: string;
}

interface SavedDocument {
  id: string;
  _id?: string;
  projectId?: string;
  company: string;
  documentNo: string;
  poNo: string | null;
  vendorName: string | null;
  documentData: any;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Terbilang Helper (Bahasa Indonesia)
function terbilang(angka: number): string {
  const bil = ['', 'SATU', 'DUA', 'TIGA', 'EMPAT', 'LIMA', 'ENAM', 'TUJUH', 'DELAPAN', 'SEMBILAN', 'SEPULUH', 'SEBELAS'];
  let temp = '';
  const n = Math.floor(Math.abs(angka));

  if (n < 12) {
    temp = ' ' + bil[n];
  } else if (n < 20) {
    temp = terbilang(n - 10) + ' BELAS';
  } else if (n < 100) {
    temp = terbilang(Math.floor(n / 10)) + ' PULUH' + terbilang(n % 10);
  } else if (n < 200) {
    temp = ' SERATUS' + terbilang(n - 100);
  } else if (n < 1000) {
    temp = terbilang(Math.floor(n / 100)) + ' RATUS' + terbilang(n % 100);
  } else if (n < 2000) {
    temp = ' SERIBU' + terbilang(n - 1000);
  } else if (n < 1000000) {
    temp = terbilang(Math.floor(n / 1000)) + ' RIBU' + terbilang(n % 1000);
  } else if (n < 1000000000) {
    temp = terbilang(Math.floor(n / 1000000)) + ' JUTA' + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    temp = terbilang(Math.floor(n / 1000000000)) + ' MILYAR' + terbilang(n % 1000000000);
  }
  return temp.replace(/\s+/g, ' ').trim();
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
}

const getSignatureImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${getBackendHostUrl()}${cleanPath}`;
};

export default function CompanyDocumentsPage() {
  const { user } = useAuth();
  const [activeCompany, setActiveCompany] = useState<'MJK' | 'DJI' | 'IRI' | 'MJI'>('MJK');
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'total_po'>('create');
  
  const [signatures, setSignatures] = useState<SignaturesData>({ MJI: [], DJI: [], IRI: [] });
  const [loadingSignatures, setLoadingSignatures] = useState(true);
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchHistory, setSearchHistory] = useState('');
  const [searchTotalPO, setSearchTotalPO] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<'ALL' | 'MJK' | 'DJI' | 'IRI' | 'MJI'>('ALL');

  const documentPrintRef = useRef<HTMLDivElement>(null);

  // Projects & Master Subkons list & Attachment state
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [masterSubkons, setMasterSubkons] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [attachments, setAttachments] = useState<{ file?: File; url?: string; name: string }[]>([]);


  // Form State - Common & Company Specific
  const [docNo, setDocNo] = useState('PR.2026.005.0032');
  const [poNo, setPoNo] = useState('MJKPO-2026/05-009');
  const [tanggal, setTanggal] = useState('07/05/2026');
  const [kategori, setKategori] = useState('AFI3 - PARTISI WORKSHOP 8');
  const [pemesan, setPemesan] = useState('Imah');
  const [noInvoice, setNoInvoice] = useState('601-WKA/PI/V/2026');
  
  // DJI Specific
  const [kodeProyek, setKodeProyek] = useState('201-DJI-AFI 3');
  const [namaPelanggan, setNamaPelanggan] = useState('PT. DELTA JAYA INDOTAMA');
  const [npwpPelanggan, setNpwpPelanggan] = useState('');
  const [diskon, setDiskon] = useState(0);
  const [isPpnActive, setIsPpnActive] = useState(false);

  // PO Number (PO 1 s/d PO 50 per project, terpisah PPN & Non-PPN)
  const [poNumber, setPoNumber] = useState<number>(1);

  // DP & Manual Termin (Down Payment / Tahapan Pembayaran) untuk MJK, DJI, IRI
  const [hasDp, setHasDp] = useState<boolean>(false);
  const [dpPercent, setDpPercent] = useState<number>(0);
  const [terminItems, setTerminItems] = useState<TerminItem[]>([]);

  // Accent Box Color (MJI, DJI, IRI) - Normal: #16a34a (Green), Urgent: #dc2626 (Red)
  const [accentColor, setAccentColor] = useState('#16a34a');

  // Vendor Info
  const [vendorName, setVendorName] = useState('CV. Wahyu Karya Abadi');
  const [vendorAddress, setVendorAddress] = useState('Jl. Pasir Awi RT/RW 06/02 Ds. Sukaasih Kec. Pasar Kemis Kabupaten Tangerang, 15560');
  const [vendorPhone, setVendorPhone] = useState('');

  // Item Rows
  const [items, setItems] = useState<ItemRow[]>([
    { no: 1, item: 'MATERIAL PARTISI WORKSHOP 8 LANTAI 1', qty: 1, unit: 'LOT', rate: 137600000, amount: 137600000 }
  ]);

  // Payment Details
  const [pembayaranKe, setPembayaranKe] = useState('BCA / 743 5219 942 / Wahyu Karya Abadi CV');


  // System Users state for role-scoped signature dropdowns
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Signatures Slots State (6 uniform slots across MJK, DJI, IRI)
  const [sig2, setSig2] = useState<SignatureSlot>({ label: 'Dibuat oleh (1)', name: '', signatureUrl: '' });
  const [sig3, setSig3] = useState<SignatureSlot>({ label: 'Dibuat oleh (2)', name: '', signatureUrl: '' });
  const [sig4, setSig4] = useState<SignatureSlot>({ label: 'Disetujui oleh (1)', name: '', signatureUrl: '' });
  const [sig5, setSig5] = useState<SignatureSlot>({ label: 'Disetujui oleh (2)', name: '', signatureUrl: '' });
  const [sig6, setSig6] = useState<SignatureSlot>({ label: 'Diperiksa Oleh,', name: '', signatureUrl: '' });
  const [sig7, setSig7] = useState<SignatureSlot>({ label: 'Dibayarkan Oleh,', name: 'Rachel', signatureUrl: '' });

  const getSigImage = (sig: { name: string; signatureUrl?: string }) => {
    // Pada menu PO PROCUREMENT, tanda tangan berupa gambar belum ditampilkan.
    // Hanya menampilkan username/nama pemilik tanda tangan seperti kolom lainnya.
    return null;
  };

  // Load Signatures, Users, Projects, Master Subkons & Live Polling on Mount
  useEffect(() => {
    fetchSignatures();
    fetchHistory();
    api.get('/auth/users').then(res => setSystemUsers(res.data?.data || [])).catch(() => {});
    api.get('/projects').then(res => setProjectsList(res.data?.data || [])).catch(() => {});
    api.get('/master-data/subkons').then(res => setMasterSubkons(res.data?.data || [])).catch(() => {});

    const handleSync = () => {
      fetchHistory();
      api.get('/projects').then(res => setProjectsList(res.data?.data || [])).catch(() => {});
      api.get('/master-data/subkons').then(res => setMasterSubkons(res.data?.data || [])).catch(() => {});
    };


    window.addEventListener('app_data_changed', handleSync);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('app_data_sync');
      channel.onmessage = () => {
        handleSync();
      };
    }

    const interval = setInterval(() => {
      fetchHistory();
    }, 4000);

    return () => {
      window.removeEventListener('app_data_changed', handleSync);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);

  // Auto-redirect Finance to history tab (they can't create documents)
  useEffect(() => {
    if (user && user.role === 'FINANCE') {
      setActiveTab('history');
    }
  }, [user]);

  // Auto-format PR.MJK / PR.DJI / PR.IRI and PO numbers dynamically when poNumber, company, or selected project changes
  useEffect(() => {
    if (editingId) return;
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const seqStr = String(poNumber).padStart(3, '0');

    if (activeCompany === 'MJK' || activeCompany === 'MJI') {
      setDocNo(`PR.MJK.${YYYY}.${MM}.${seqStr}`);
      setPoNo(`MJKPO-${YYYY}/${MM}-${seqStr}`);
    } else if (activeCompany === 'DJI') {
      setDocNo(`PR.DJI.${YYYY}.${MM}.${seqStr}`);
      setPoNo(`DJIPO-${YYYY}/${MM}-${seqStr}`);
    } else if (activeCompany === 'IRI') {
      setDocNo(`PR.IRI.${YYYY}.${MM}.${seqStr}`);
      setPoNo(`IRIPO-${YYYY}/${MM}-${seqStr}`);
    }
  }, [activeCompany, poNumber, selectedProjectId, isPpnActive, editingId]);

  // Update default templates when company changes
  useEffect(() => {
    if (editingId) return; // Don't reset if editing an existing doc

    if (activeCompany === 'MJK' || activeCompany === 'MJI') {
      setAccentColor('#8cc63f');
      setTanggal('07/05/2026');
      setKategori('AFI3 - PARTISI WORKSHOP 8');
      setPemesan('Imah');
      setNoInvoice('601-WKA/PI/V/2026');
      setVendorName('CV. Wahyu Karya Abadi');
      setVendorAddress('Jl. Pasir Awi RT/RW 06/02 Ds. Sukaasih Kec. Pasar Kemis Kabupaten Tangerang, 15560');
      setVendorPhone('');
      setItems([
        { no: 1, item: 'MATERIAL PARTISI WORKSHOP 8 LANTAI 1', qty: 1, unit: 'LOT', rate: 137600000, amount: 137600000 }
      ]);
      setPembayaranKe('BCA / 743 5219 942 / Wahyu Karya Abadi CV');
      
      const mjiSigs = signatures.MJI || signatures.MJK || [];
      const viaSig = mjiSigs.find(s => s.name.toLowerCase().includes('via'))?.imageUrl || '';
      const lucasSig = mjiSigs.find(s => s.name.toLowerCase().includes('lucas'))?.imageUrl || signatures.DJI?.find(s => s.name.toLowerCase().includes('lucas'))?.imageUrl || '';
      const ediSig = mjiSigs.find(s => s.name.toLowerCase().includes('edi'))?.imageUrl || '';
      const fitriSig = mjiSigs.find(s => s.name.toLowerCase().includes('fitri') || s.name.toLowerCase().includes('yunita'))?.imageUrl || '';
      const rachelSig = mjiSigs.find(s => s.name.toLowerCase().includes('rachel'))?.imageUrl || '';

      setSig2({ label: 'Dibuat oleh (1)', name: '', signatureUrl: '' });
      setSig3({ label: 'Dibuat oleh (2)', name: '', signatureUrl: '' });
      setSig4({ label: 'Disetujui oleh (1)', name: '', signatureUrl: '' });
      setSig5({ label: 'Disetujui oleh (2)', name: '', signatureUrl: '' });
      setSig6({ label: 'Diperiksa Oleh,', name: '', signatureUrl: '' });
      setSig7({ label: 'Dibayarkan Oleh,', name: '', signatureUrl: '' });
    } else if (activeCompany === 'DJI') {
      setAccentColor('#dc2626');
      setDocNo('PR.DJI.2026.07.134');
      setPoNo('DJIPO/2607084');
      setKodeProyek('201-DJI-AFI 3');
      setKategori('006/HD/DJI-AFI-3 (PEKERJAAN PEMBANGUNAN PARKIRAN AFI 3 TAHAP 1)');
      setTanggal('27/07/2026');
      setNamaPelanggan('PT. DELTA JAYA INDOTAMA');
      setNpwpPelanggan('');
      setVendorName('TB. AKHDAN GAGA');
      setVendorAddress('KEDUNG KELOR - TEGAL');
      setVendorPhone('');
      setItems([
        { no: 1, item: 'Terpal 4x5', qty: 1, unit: 'PCS', rate: 120000, amount: 120000 },
        { no: 2, item: 'Kawat BWG', qty: 10, unit: 'KG', rate: 25000, amount: 250000 }
      ]);
      setPembayaranKe('Mandiri / 1390 02742 5374 / Kardiyan Warureja Kedungkelor, Tegal');

      setSig2({ label: 'Dibuat oleh (1)', name: '', signatureUrl: '' });
      setSig3({ label: 'Dibuat oleh (2)', name: '', signatureUrl: '' });
      setSig4({ label: 'Disetujui oleh (1)', name: '', signatureUrl: '' });
      setSig5({ label: 'Disetujui oleh (2)', name: '', signatureUrl: '' });
      setSig6({ label: 'Diperiksa Oleh,', name: '', signatureUrl: '' });
      setSig7({ label: 'Dibayarkan Oleh,', name: '', signatureUrl: '' });
    } else if (activeCompany === 'IRI') {
      setAccentColor('#d97706');
      setDocNo('PR.IRI.2026.07.015');
      setPoNo('IRIPO/2607005');
      setKodeProyek('201-IRI-AFI 3');
      setKategori('PEKERJAAN PEMBANGUNAN PARKIRAN');
      setTanggal('27/07/2026');
      setVendorName('TB. AKHDAN GAGA');
      setVendorAddress('KEDUNG KELOR - TEGAL');
      setVendorPhone('');
      setItems([
        { no: 1, item: 'Semen Holcim 50kg', qty: 50, unit: 'ZAK', rate: 65000, amount: 3250000 }
      ]);
      setPembayaranKe('BCA / 1234 5678 90 / TB. AKHDAN GAGA');

      setSig2({ label: 'Dibuat oleh (1) 申请人', name: '', signatureUrl: '' });
      setSig3({ label: 'Dibuat oleh (2)', name: '', signatureUrl: '' });
      setSig4({ label: 'Disetujui oleh (1) 批准人', name: '', signatureUrl: '' });
      setSig5({ label: 'Disetujui oleh (2)', name: '', signatureUrl: '' });
      setSig6({ label: 'Diperiksa Oleh, 审核人', name: '', signatureUrl: '' });
      setSig7({ label: 'Dibayarkan Oleh, 付款人', name: '', signatureUrl: '' });
    }
  }, [activeCompany, signatures, editingId]);

  const fetchSignatures = async () => {
    try {
      setLoadingSignatures(true);
      const res = await api.get('/company-documents/signatures');
      if (res.data.success) {
        setSignatures(res.data.signatures);
      }
    } catch (err: any) {
      console.error('Error fetching signatures:', err);
    } finally {
      setLoadingSignatures(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/company-documents/forms');
      if (res.data.success) {
        const companyOnlyDocs = (res.data.data || []).filter((d: any) => 
          !d.company?.startsWith('GA') && 
          !d.documentNo?.startsWith('GA') && 
          !d.documentNo?.includes('PR-GA')
        );
        setSavedDocs(companyOnlyDocs);
      }
    } catch (err: any) {
      console.error('Error fetching forms history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };


  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const subtotalAfterDiskon = Math.max(0, subtotal - diskon);

  // Deductions calculation (PPN 12% dari DPP Nilai Lain)
  const dpp = isPpnActive ? Math.round(subtotal * (11 / 12)) : 0;
  const ppn = isPpnActive ? Math.round(subtotal * 0.11) : 0;
  const grandTotal = subtotal + ppn;

  const dpAmount = Math.round((grandTotal * dpPercent) / 100);
  const finalTotalToPay = (hasDp && dpPercent > 0) ? dpAmount : grandTotal;

  // Terbilang selalu otomatis dari TOTAL YANG HARUS DIBAYARKAN (finalTotalToPay)
  const currentTerbilangText = finalTotalToPay > 0 ? `${terbilang(finalTotalToPay)} RUPIAH` : '-';

  // Item rows manipulator
  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const target = { ...updated[index] };

    if (field === 'qty' || field === 'rate') {
      const numVal = parseFloat(value) || 0;
      (target as any)[field] = numVal;
      target.amount = target.qty * target.rate;
    } else {
      (target as any)[field] = value;
    }
    updated[index] = target;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { no: items.length + 1, item: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 }]);
  };
  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index).map((row, i) => ({ ...row, no: i + 1 }));
    setItems(updated);
  };

  // Save Document handler (Instant save with pre-uploaded attachments)
  const handleSave = async () => {
    if (!docNo) {
      alert('Nomor Dokumen wajib diisi');
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // Process & upload any pending attachment files gracefully
      const finalAttachments = [];
      for (const att of attachments) {
        if (att.url) {
          finalAttachments.push({ url: att.url, name: att.name });
        } else if (att.file) {
          try {
            const formData = new FormData();
            formData.append('attachment', att.file);
            const uploadRes = await api.post('/company-documents/upload-attachment', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadRes.data && uploadRes.data.success) {
              finalAttachments.push({ url: uploadRes.data.fileUrl, name: uploadRes.data.fileName || att.name });
            } else {
              finalAttachments.push({ url: '', name: att.name });
            }
          } catch (err) {
            console.warn('Upload error on save:', err);
            finalAttachments.push({ url: '', name: att.name });
          }
        }
      }

      const dpAmountVal = (hasDp || dpPercent > 0) ? Math.round((grandTotal * dpPercent) / 100) : 0;

      const documentData = {
        accentColor,
        docNo,
        poNo,
        poNumber,
        tanggal,
        kategori,
        pemesan,
        noInvoice,
        kodeProyek,
        selectedProjectId,
        namaPelanggan,
        npwpPelanggan,
        vendorName,
        vendorAddress,
        vendorPhone,
        items,
        subtotal,
        diskon,
        dpp,
        ppn,
        isPpnActive,
        poType: isPpnActive ? 'PPN' : 'NON_PPN',
        grandTotal: finalTotalToPay,
        originalGrandTotal: grandTotal,
        hasDp,
        dpPercent,
        dpAmount: dpAmountVal,
        terminItems,
        pembayaranKe,
        attachmentUrl: finalAttachments.length > 0 ? finalAttachments[0].url : '',
        attachmentName: finalAttachments.length > 0 ? finalAttachments[0].name : '',
        attachments: finalAttachments,
        terbilang: currentTerbilangText,
        signatures: {
          sig2,
          sig3,
          sig4,
          sig5,
          sig6,
          sig7
        }
      };

      const payload = {
        company: activeCompany,
        documentNo: docNo,
        poNo,
        vendorName,
        totalAmount: grandTotal,
        documentData,
      };

      let res;
      if (editingId) {
        res = await api.put(`/company-documents/forms/${editingId}`, payload);
      } else {
        res = await api.post('/company-documents/forms', payload);
      }

      if (res.data.success) {
        setMessage({ type: 'success', text: editingId ? 'Dokumen berhasil diperbarui dan terhubung!' : 'Dokumen berhasil disimpan ke riwayat dan terhubung!' });
        if (res.data.data?.id) {
          setEditingId(res.data.data.id);
        }
        fetchHistory();
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
      }
    } catch (err: any) {
      console.error('Error saving document:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan dokumen.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async (docTarget?: SavedDocument) => {
    if (typeof window === 'undefined') return;

    if (docTarget) {
      handleEdit(docTarget);
      await new Promise((r) => setTimeout(r, 200));
    }

    setMessage({ type: 'success', text: '⚡ Sedang memproses dan mengunduh berkas PDF presisi ke komputer Anda...' });

    try {
      const dData = docTarget ? (docTarget.documentData || {}) : {};
      const comp = docTarget ? docTarget.company : activeCompany;
      const dNo = docTarget ? (dData.docNo || docTarget.documentNo) : docNo;
      const pNo = docTarget ? (dData.poNo || docTarget.poNo || poNo) : poNo;
      const cleanName = (dNo || comp || 'Dokumen_PO').replace(/[^a-zA-Z0-9_-]/g, '_');

      // Resolve target attachments array
      let targetAttachments: any[] = docTarget ? (dData.attachments || []) : attachments;
      if (!targetAttachments || targetAttachments.length === 0) {
        const singleUrl = docTarget ? dData.attachmentUrl : (attachments[0]?.url || '');
        const singleName = docTarget ? dData.attachmentName : (attachments[0]?.name || '');
        if (singleUrl) {
          targetAttachments = [{ url: singleUrl, name: singleName || 'Lampiran' }];
        }
      }

      // Load html-to-image library for pixel-perfect DOM capturing
      if (!(window as any).htmlToImage) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      const htmlToImage = (window as any).htmlToImage;
      const page1El = document.getElementById('printable-page-1');
      const page2El = document.getElementById('printable-page-2');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      let capturedSuccessfully = false;

      // Convert all <img> elements inside a DOM container to Base64 DataURLs before canvas rendering
      const inlineAllImagesAsBase64 = async (container: HTMLElement) => {
        const images = Array.from(container.querySelectorAll('img'));
        for (const img of images) {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:')) continue;

          let fullUrl = src;
          if (!src.startsWith('http')) {
            if (src.startsWith('/signatures-assets') || src.startsWith('/storage') || src.includes('/uploads')) {
              fullUrl = `${getBackendHostUrl()}${src}`;
            } else if (src.startsWith('/')) {
              fullUrl = `${window.location.origin}${src}`;
            } else {
              fullUrl = `${getBackendHostUrl()}/${src}`;
            }
          }

          try {
            if (src.endsWith('.svg') || fullUrl.endsWith('.svg')) {
              const pngBase64 = await new Promise<string | null>((resolve) => {
                const tempImg = new Image();
                tempImg.crossOrigin = 'Anonymous';
                tempImg.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = tempImg.naturalWidth || 320;
                  canvas.height = tempImg.naturalHeight || 200;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(tempImg, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                  } else {
                    resolve(null);
                  }
                };
                tempImg.onerror = () => resolve(null);
                tempImg.src = fullUrl;
              });
              if (pngBase64) {
                img.setAttribute('src', pngBase64);
              }
            } else {
              const res = await fetch(fullUrl);
              const blob = await res.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              if (base64) {
                img.setAttribute('src', base64);
              }
            }
          } catch (e) {
            console.warn('Failed to inline image base64:', src, e);
          }
        }
      };

      if (htmlToImage && page1El) {
        try {
          await inlineAllImagesAsBase64(page1El);
          if (page2El) await inlineAllImagesAsBase64(page2El);

          const png1 = await htmlToImage.toPng(page1El, { quality: 0.98, pixelRatio: 2, cacheBust: true });
          doc.addImage(png1, 'PNG', 0, 0, 210, 297);

          if (page2El) {
            const png2 = await htmlToImage.toPng(page2El, { quality: 0.98, pixelRatio: 2, cacheBust: true });
            const props2 = doc.getImageProperties(png2);
            const naturalH2 = Math.min(297, Math.round((props2.height * 210) / props2.width));
            doc.addPage();
            doc.addImage(png2, 'PNG', 0, 0, 210, naturalH2);
          }

          capturedSuccessfully = true;
        } catch (domCaptureErr) {
          console.warn('DOM capture warning, falling back to manual vector PDF:', domCaptureErr);
        }
      }

      // Fallback manual vector PDF if DOM capture unavailable
      if (!capturedSuccessfully) {
        const primaryRGB = comp === 'MJI' ? [140, 198, 63] : comp === 'DJI' ? [220, 38, 38] : [217, 119, 6];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(comp === 'MJI' ? 'PT. MODERN JAYA KONSTRUKSI' : comp === 'DJI' ? 'PT. DELTA JAYA INDOTAMA' : 'PT. INOVATIF RENOVALOGI INDONESIA', 15, 18);
        doc.setFillColor(primaryRGB[0], primaryRGB[1], primaryRGB[2]);
        doc.rect(135, 12, 60, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(dNo || 'NO DOKUMEN', 165, 18.5, { align: 'center' });
      }

      // Load pdf-lib for merging attached PDF files (Halaman 3+)
      if (!(window as any).PDFLib && targetAttachments.length > 0) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      const PDFLib = (window as any).PDFLib;
      if (PDFLib && targetAttachments.length > 0) {
        try {
          const mainPdfBytes = doc.output('arraybuffer');
          const { PDFDocument } = PDFLib;
          const mergedPdf = await PDFDocument.create();

          // Copy main PO PDF pages (Page 1 & Page 2 from DOM capture)
          const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
          const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
          mainPages.forEach((p: any) => mergedPdf.addPage(p));

          // Helper to format safe URL for fetching attachments with spaces/special characters
          const getSafeFetchUrl = (rawUrl: string) => {
            const full = rawUrl.startsWith('http') ? rawUrl : `${getBackendHostUrl()}${rawUrl}`;
            try {
              const u = new URL(full);
              u.pathname = encodeURI(u.pathname);
              return u.toString();
            } catch {
              return encodeURI(full);
            }
          };

          // Helper to get ArrayBuffer from attachment (URL or local File object)
          const getAttachmentBuffer = async (att: any): Promise<ArrayBuffer | null> => {
            try {
              if (att.file) {
                return await att.file.arrayBuffer();
              }
              if (att.url) {
                const targetUrl = getSafeFetchUrl(att.url);
                return await fetch(targetUrl).then((res) => res.arrayBuffer());
              }
            } catch (err) {
              console.warn('Error reading attachment buffer:', att.name, err);
            }
            return null;
          };

          // Merge each attachment's actual pages into the final PDF document
          for (let i = 0; i < targetAttachments.length; i++) {
            const att = targetAttachments[i];
            const attBytes = await getAttachmentBuffer(att);
            if (!attBytes) continue;

            const attName = att.name || att.url || '';
            const isPdf = attName.match(/\.pdf$/i) || (att.file && att.file.type === 'application/pdf');
            const isImg = attName.match(/\.(jpeg|jpg|png|webp)$/i) || (att.file && att.file.type?.startsWith('image/'));
            const isXls = attName.match(/\.(xlsx|xls)$/i);

            if (isPdf) {
              try {
                const attPdfDoc = await PDFDocument.load(attBytes);
                const attPages = await mergedPdf.copyPages(attPdfDoc, attPdfDoc.getPageIndices());
                attPages.forEach((p: any) => mergedPdf.addPage(p));
              } catch (e) {
                console.warn('Could not merge attached PDF:', e);
              }
            } else if (isImg) {
              try {
                let img;
                if (attName.match(/\.png$/i) || (att.file && att.file.type === 'image/png')) {
                  img = await mergedPdf.embedPng(attBytes);
                } else {
                  img = await mergedPdf.embedJpg(attBytes);
                }
                const page = mergedPdf.addPage([595.28, 841.89]);
                const { width, height } = img.scaleToFit(540, 770);
                page.drawImage(img, {
                  x: (595.28 - width) / 2,
                  y: (841.89 - height) / 2,
                  width,
                  height,
                });
              } catch (e) {
                console.warn('Could not embed attached image:', e);
              }
            } else if (isXls) {
              try {
                const workbook = XLSX.read(attBytes, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData && jsonData.length > 0) {
                  const page = mergedPdf.addPage([595.28, 841.89]);
                  const font = await mergedPdf.embedFont(PDFLib.StandardFonts.Helvetica);
                  const boldFont = await mergedPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);

                  page.drawText(`LAMPIRAN EXCEL SPREADSHEET: ${att.name || 'Data Spreadsheet'}`, {
                    x: 35,
                    y: 810,
                    size: 11,
                    font: boldFont,
                    color: PDFLib.rgb(0.1, 0.1, 0.1),
                  });

                  let yPos = 785;
                  const maxRows = Math.min(jsonData.length, 35);
                  for (let r = 0; r < maxRows; r++) {
                    const row = jsonData[r] || [];
                    const rowText = row.slice(0, 7).map(c => String(c ?? '')).join('  |  ');
                    if (rowText.trim()) {
                      page.drawText(rowText.substring(0, 110), {
                        x: 35,
                        y: yPos,
                        size: 8,
                        font: r === 0 ? boldFont : font,
                        color: PDFLib.rgb(0.2, 0.2, 0.2),
                      });
                      yPos -= 20;
                      if (yPos < 40) break;
                    }
                  }
                }
              } catch (e) {
                console.warn('Could not embed attached Excel file:', e);
              }
            }
          }

          // Save final combined PDF and trigger direct download
          const mergedBytes = await mergedPdf.save();
          const blob = new Blob([mergedBytes], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Dokumen_PO_${cleanName}.pdf`;
          link.click();

          setMessage({ type: 'success', text: `✅ Berkas PDF Lengkap (Dokumen_PO_${cleanName}.pdf) BERHASIL TERUNDUH ke folder Downloads Anda!` });
          return;
        } catch (mergeErr) {
          console.warn('PDF merging error, falling back to standard jsPDF save:', mergeErr);
        }
      }

      // Direct download of PDF
      doc.save(`Dokumen_PO_${cleanName}.pdf`);
      setMessage({ type: 'success', text: `✅ Berkas PDF (Dokumen_PO_${cleanName}.pdf) BERHASIL TERUNDUH ke folder Downloads Anda!` });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setMessage({ type: 'error', text: 'Gagal membuat file PDF.' });
    }
  };

  const handleEdit = (doc: SavedDocument) => {
    setEditingId(doc.id);
    setActiveCompany(doc.company as any);
    const data = doc.documentData;

    setAccentColor(data.accentColor || (doc.company === 'MJI' ? '#8cc63f' : '#dc2626'));
    setDocNo(data.docNo || doc.documentNo);
    setPoNo(data.poNo || doc.poNo || '');
    setTanggal(data.tanggal || '');
    setKategori(data.kategori || '');
    setPemesan(data.pemesan || '');
    setNoInvoice(data.noInvoice || '');
    setKodeProyek(data.kodeProyek || '');
    setSelectedProjectId(data.selectedProjectId || '');
    setPoNumber(data.poNumber || 1);
    setHasDp(Boolean(data.hasDp || (data.dpPercent && data.dpPercent > 0) || (data.terminItems && data.terminItems.length > 0)));
    setDpPercent(data.dpPercent || 0);
    setTerminItems(data.terminItems || []);
    setNamaPelanggan(data.namaPelanggan || '');
    setNpwpPelanggan(data.npwpPelanggan || '');
    setVendorName(data.vendorName || doc.vendorName || '');
    setVendorAddress(data.vendorAddress || '');
    setVendorPhone(data.vendorPhone || '');
    const sanitizedItems = (data.items || []).map((row: any, i: number) => ({
      no: row.no || i + 1,
      item: row.item || '',
      qty: row.qty ?? 1,
      unit: row.unit || 'PCS',
      rate: row.rate ?? 0,
      amount: row.amount ?? 0
    }));
    setItems(sanitizedItems.length > 0 ? sanitizedItems : [{ no: 1, item: '', qty: 1, unit: 'PCS', rate: 0, amount: 0 }]);
    setPembayaranKe(data.pembayaranKe || '');

    const loadedAttachments = data.attachments || [];
    if (loadedAttachments.length === 0 && data.attachmentUrl) {
      loadedAttachments.push({ url: data.attachmentUrl, name: data.attachmentName || 'Lampiran' });
    }
    setAttachments(loadedAttachments);
    setDiskon(data.diskon || 0);
    setIsPpnActive(data.isPpnActive || false);

    if (data.signatures) {
      setSig2(data.signatures.sig2 || sig2);
      setSig3(data.signatures.sig3 || sig3);
      setSig4(data.signatures.sig4 || sig4);
      setSig5(data.signatures.sig5 || sig5);
      setSig6(data.signatures.sig6 || sig6);
      setSig7(data.signatures.sig7 || sig7);
    }

    setActiveTab('create');
  };

  const handlePrintDocument = (doc: SavedDocument) => {
    handleEdit(doc);
    handlePrint(doc);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini dari riwayat?')) return;
    try {
      const res = await api.delete(`/company-documents/forms/${id}`);
      if (res.data.success) {
        fetchHistory();
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
        setMessage({ type: 'success', text: 'Dokumen berhasil dihapus.' });
      }
    } catch (err: any) {
      alert('Gagal menghapus dokumen.');
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setSelectedProjectId('');
    setKodeProyek('');
    setDocNo('');
    setPoNo('');
    setTanggal('');
    setKategori('');
    setPemesan('');
    setNoInvoice('');
    setNamaPelanggan('');
    setNpwpPelanggan('');
    setVendorName('');
    setVendorAddress('');
    setVendorPhone('');
    setItems([]);
    setPembayaranKe('');
    setPoNumber(1);
    setHasDp(false);
    setDpPercent(0);
    setAttachments([]);
    setDiskon(0);
    setIsPpnActive(false);
    setMessage(null);
  };

  const switchCompanyTab = (company: 'MJK' | 'DJI' | 'IRI' | 'MJI') => {
    const target = company === 'MJI' ? 'MJK' : company;
    if (activeCompany === target && !editingId) return;
    setActiveCompany(target);
    handleResetForm();
    setMessage({ type: 'success', text: `Beralih ke Formulir Dokumen ${target}. Data & lampiran terisolasi khusus perusahaan ${target}.` });
  };

  const filteredHistory = savedDocs.filter(d => {
    if (d.documentData?.type === 'PROYEK_ADMIN') return false;
    
    const matchesSearch = d.documentNo.toLowerCase().includes(searchHistory.toLowerCase()) ||
      (d.poNo && d.poNo.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (d.vendorName && d.vendorName.toLowerCase().includes(searchHistory.toLowerCase())) ||
      d.company.toLowerCase().includes(searchHistory.toLowerCase()) ||
      (d.documentData?.kodeProyek && d.documentData.kodeProyek.toLowerCase().includes(searchHistory.toLowerCase())) ||
      (d.documentData?.kategori && d.documentData.kategori.toLowerCase().includes(searchHistory.toLowerCase()));

    const matchesCompany = selectedCompanyFilter === 'ALL' || d.company === selectedCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  const userRole = user?.role;
  const isSuperAdmin = Boolean(userRole === 'SUPERADMIN');
  const isFinance = Boolean(userRole === 'FINANCE');
  const isProcurement = Boolean(userRole === 'PROCUREMENT' || user?.manager?.role === 'PROCUREMENT');

  // Divisi Utama Procurement (Manager / Head / Chief) vs Staff Procurement
  const isProcurementChief = Boolean(isProcurement && (
    !user?.managerId ||
    (user?.name && user.name.toLowerCase().includes('chief')) ||
    (user?.name && user.name.toLowerCase().includes('head')) ||
    (user?.name && user.name.toLowerCase().includes('manager')) ||
    (user?.name && user.name.toLowerCase().includes('utama')) ||
    (user?.email && user.email.toLowerCase().includes('head')) ||
    (user?.email && user.email.toLowerCase().includes('chief'))
  ));
  const isProcurementStaff = Boolean(isProcurement && !isProcurementChief);

  // Permission rules (Uniform for all documents MJK, DJI, IRI):
  // 1. PROCUREMENT (Staff / Chief): diminta oleh (slot 1)
  // 2. Staff PROCUREMENT: dibuat oleh 1 (slot 2)
  // 3. Divisi Utama PROCUREMENT: dibuat oleh 2 (slot 3)
  // 4. SUPER_ADMIN: disetujui oleh 1 & 2 (slot 4 & 5)
  // 5. FINANCE: diperiksa oleh 1 & dibayar oleh 1 (slot 6 & 7)
  const checkSlotPermission = (slotIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7): { allowed: boolean; roleLabel: string } => {
    if (isSuperAdmin) {
      return { allowed: true, roleLabel: 'SUPER_ADMIN' };
    }

    if (slotIndex === 1) return { allowed: isProcurement, roleLabel: 'PROCUREMENT' };
    if (slotIndex === 2) return { allowed: isProcurementStaff, roleLabel: 'Staff PROCUREMENT' };
    if (slotIndex === 3) return { allowed: isProcurementChief, roleLabel: 'Divisi Utama PROCUREMENT' };
    if (slotIndex === 4 || slotIndex === 5) return { allowed: false, roleLabel: 'SUPER_ADMIN' };
    if (slotIndex === 6 || slotIndex === 7) return { allowed: isFinance, roleLabel: 'FINANCE' };

    return { allowed: false, roleLabel: 'Akses Dibatasi' };
  };

  // Available options for signature dropdowns
  const availableSignatures = signatures[activeCompany] || [];

  // Apakah user bisa membuat/mengakses halaman ini
  const canAccessPage = isSuperAdmin || isProcurement || isFinance;
  // Apakah user bisa membuat dokumen baru (hanya PROCUREMENT & SUPER_ADMIN)
  const canCreateDocument = isSuperAdmin || isProcurement;

  // Jika tidak punya akses, tampilkan halaman ditolak
  if (!canAccessPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-1">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Halaman Formulir Dokumen Perusahaan hanya dapat diakses oleh divisi <strong>PROCUREMENT</strong>, <strong>SUPER ADMIN</strong>, atau <strong>FINANCE</strong>.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Role Anda saat ini: <span className="font-mono font-bold">{userRole || 'UNKNOWN'}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* CSS Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-area, #printable-area * {
            visibility: visible !important;
          }
          #printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }
          .no-print, .no-print * {
            display: none !important;
            height: 0 !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            Formulir Dokumen Perusahaan (MJK, DJI, IRI)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Super Admin: akses penuh untuk membuat, mengisi, memilih tanda tangan, dan mencetak dokumen.'
              : isProcurement
              ? 'PROCUREMENT: dapat membuat dokumen dan mengisi tanda tangan sesuai hak akses divisi.'
              : 'FINANCE: dapat melihat riwayat dokumen dan mengisi tanda tangan (Diperiksa / Dibayarkan).'
            }
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (activeTab !== 'create') {
                setActiveTab('create');
              }
              handlePrint();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Printer className="h-4 w-4 text-sky-400" />
            Cetak / Export PDF 🖨️
          </button>

          {activeTab === 'create' && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Menyimpan...' : editingId ? 'Perbarui Dokumen' : 'Simpan Dokumen'}
              </button>
              <button
                onClick={handleResetForm}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                title="Reset Form"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 no-print">
        <div className="flex gap-2">
          {canCreateDocument && (
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Plus className="h-4 w-4" />
              {editingId ? 'Edit Dokumen' : 'Buat Dokumen Baru'}
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <History className="h-4 w-4" />
            Riwayat Dokumen ({savedDocs.filter(d => d.documentData?.type !== 'PROYEK_ADMIN').length})
          </button>

          <button
            onClick={() => setActiveTab('total_po')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'total_po'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Total PO Per Kode Proyek
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold no-print ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200' : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* CREATE / EDIT TAB CONTENT */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Company Selection Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-2 no-print">
            <button
              onClick={() => switchCompanyTab('MJK')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCompany === 'MJK' || activeCompany === 'MJI'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
              MJK (PT. Modern Jaya Konstruksi)
            </button>


            <button
              onClick={() => switchCompanyTab('DJI')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCompany === 'DJI'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              DJI (PT. Delta Jaya Indotama)
            </button>

            <button
              onClick={() => switchCompanyTab('IRI')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCompany === 'IRI'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              IRI (PT. Inovatif Renovalogi Indonesia)
            </button>
          </div>

          {/* Form Input Control Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5 no-print">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
              <FileSpreadsheet className="h-4 w-4 text-sky-500" />
              Pengisian Data Dokumen
            </h2>

            {/* Header Metadata Controls - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-sky-600 dark:text-sky-400 mb-1">
                  Pilih Kode Proyek (Database Super Admin)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const projId = e.target.value;
                    setSelectedProjectId(projId);
                    const selectedProj = projectsList.find(p => p.id === projId);
                    if (selectedProj) {
                      setKodeProyek(selectedProj.code || selectedProj.name);
                      if (selectedProj.client) setNamaPelanggan(selectedProj.client);
                      setKategori(`${selectedProj.code} - ${selectedProj.name}`);
                    }
                    // Auto-detect next PO number (terpisah PPN vs Non-PPN, max 50)
                    if (projId && !editingId) {
                      const countSameType = savedDocs.filter(d => {
                        const data = d.documentData || {};
                        const fProjId = data.selectedProjectId || d.projectId;
                        if (fProjId !== projId) return false;
                        if (data.type === 'PROYEK_ADMIN') return false;
                        return Boolean(data.isPpnActive) === isPpnActive;
                      }).length;
                      setPoNumber(Math.min(50, countSameType + 1));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-sky-300 dark:border-sky-600 rounded-lg bg-sky-50/50 dark:bg-slate-900 dark:text-white font-bold"
                >
                  <option value="">-- Pilih Kode Proyek (Database Super Admin) --</option>
                  {projectsList
                    .slice()
                    .sort((a, b) => {
                      const compFilter = activeCompany === 'MJI' ? 'MJK' : activeCompany;
                      const aMatch = (a.code || '').toUpperCase().includes(compFilter) ? -1 : 1;
                      const bMatch = (b.code || '').toUpperCase().includes(compFilter) ? -1 : 1;
                      return aMatch - bMatch;
                    })
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ${p.name}` : p.name} ({p.client || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dokumen Existing untuk Proyek yang Dipilih */}
              {selectedProjectId && (() => {
                const docsForProject = savedDocs.filter(d => (d.projectId === selectedProjectId || (d.documentData?.kodeProyek && d.documentData?.selectedProjectId === selectedProjectId)) && d.documentData?.type !== 'PROYEK_ADMIN');
                if (docsForProject.length === 0) return null;
                return (
                  <div className="col-span-1 md:col-span-5 -mt-2">
                    <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                          <span>📋</span>
                          Dokumen Tersimpan untuk Kode Proyek Ini ({docsForProject.length} dokumen)
                        </p>
                        <span className="text-[10px] text-sky-500 dark:text-sky-500">Formulir baru di bawah mengisi dokumen tambahan</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {docsForProject.map((doc, idx) => (
                          <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-sky-200 dark:border-sky-700 px-3 py-2 text-[10px] group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`px-1.5 py-0.5 text-white rounded font-extrabold text-[9px] tracking-wide ${doc.documentData?.isPpnActive ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                                  PO {doc.documentData?.poNumber || idx + 1} ({doc.documentData?.isPpnActive ? 'PPN' : 'NON-PPN'})
                                </span>
                                <p className="font-bold text-slate-800 dark:text-white truncate">{(doc.documentNo || doc.documentData?.docNo || '').replace(/PR\.MJI\./g, 'PR.MJK.')}</p>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400">{(doc.company === 'MJI' ? 'MJK' : doc.company)} · {(doc.poNo || doc.documentData?.poNo || '-').replace(/MJIPO/g, 'MJKPO')}</p>
                              <p className="text-slate-400 dark:text-slate-500">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID') : ''}</p>
                            </div>
                            <button
                              onClick={() => handleEdit(doc)}
                              className="ml-2 px-2 py-1 text-[10px] bg-sky-100 hover:bg-sky-200 dark:bg-sky-900 dark:hover:bg-sky-800 text-sky-700 dark:text-sky-300 rounded font-bold transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Status Dokumen (Warna Header)
                </label>
                <select
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="#16a34a">🟢 Hijau (Normal)</option>
                  <option value="#dc2626">🔴 Merah (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nomor Dokumen (PR)
                </label>
                <input
                  type="text"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Nomor PO (Urutan 1 s/d 50 terpisah PPN & Non-PPN) */}
              <div>
                <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                  Urutan PO (Max 50)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={poNumber}
                    onChange={(e) => setPoNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-amber-300 dark:border-amber-600 rounded-lg bg-amber-50/50 dark:bg-slate-900 dark:text-white font-bold"
                  >
                    {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        PO {num} ({isPpnActive ? 'PPN' : 'NON-PPN'})
                      </option>
                    ))}
                  </select>
                  <span className={`px-2 py-1.5 text-white rounded-lg text-xs font-extrabold whitespace-nowrap ${isPpnActive ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                    PO {poNumber}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nomor PO
                </label>
                <input
                  type="text"
                  value={poNo}
                  onChange={(e) => setPoNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Upload Berkas Lampiran (Excel / PDF / Gambar)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.pdf,.jpeg,.jpg,.png,.webp"
                  disabled={uploadingAttachments}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    // Instantly attach files locally so selecting files NEVER fails
                    const newAttachments = files.map(f => ({ file: f, name: f.name, url: '' }));
                    setAttachments(prev => [...prev, ...newAttachments]);
                    setMessage({ type: 'success', text: `✅ ${files.length} Berkas lampiran berhasil ditambahkan dan tampil di pratinjau!` });
                    e.target.value = '';
                  }}
                  className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
                {uploadingAttachments && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1 animate-pulse">⚡ Mengunggah lampiran...</p>
                )}
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between mt-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                    {att.url ? (
                      <a href={`${getBackendHostUrl()}${att.url}`} target="_blank" rel="noreferrer" className="text-[10px] text-sky-600 dark:text-sky-400 font-bold underline truncate max-w-[80%]">
                        📎 {att.name || 'Lihat Lampiran'}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[80%]">
                        📎 {att.name}
                      </span>
                    )}
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-bold text-xs ml-2 px-2">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Kategori, Pemesan, No Invoice, Kode Proyek (DJI) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kode Proyek / Deskripsi
                </label>
                <input
                  type="text"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>


              {(activeCompany === 'MJK' || activeCompany === 'MJI' || activeCompany === 'IRI') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Pemesan
                  </label>
                  <input
                    type="text"
                    value={pemesan}
                    onChange={(e) => setPemesan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}

              {(activeCompany === 'MJK' || activeCompany === 'MJI') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    No. Invoice
                  </label>
                  <input
                    type="text"
                    value={noInvoice}
                    onChange={(e) => setNoInvoice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}

              {activeCompany === 'DJI' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Kode Proyek
                    </label>
                    <input
                      type="text"
                      value={kodeProyek}
                      onChange={(e) => setKodeProyek(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Nama Pelanggan
                    </label>
                    <input
                      type="text"
                      value={namaPelanggan}
                      onChange={(e) => setNamaPelanggan(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Row 3: Vendor Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Vendor / Supplier
                </label>
                <select
                  value={vendorName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setVendorName(selectedName);
                    const selectedSub = masterSubkons.find(s => s.name === selectedName);
                    if (selectedSub) {
                      if (selectedSub.address) setVendorAddress(selectedSub.address);
                      if (selectedSub.phone) setVendorPhone(selectedSub.phone);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="">-- Pilih Master Subcon --</option>
                  {masterSubkons.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Alamat Vendor
                </label>
                <input
                  type="text"
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  No. Telepon Vendor
                </label>
                <input
                  type="text"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  placeholder="+62..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Row 4: Payment & Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Info Rekening Pembayaran
                </label>
                <input
                  type="text"
                  value={pembayaranKe}
                  onChange={(e) => setPembayaranKe(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Info Rekening Pembayaran */}

              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl mt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ppnToggle"
                      checked={isPpnActive}
                      onChange={(e) => {
                        const newPpn = e.target.checked;
                        setIsPpnActive(newPpn);
                        if (selectedProjectId && !editingId) {
                          const countSameType = savedDocs.filter(d => {
                            const data = d.documentData || {};
                            const fProjId = data.selectedProjectId || d.projectId;
                            if (fProjId !== selectedProjectId) return false;
                            if (data.type === 'PROYEK_ADMIN') return false;
                            return Boolean(data.isPpnActive) === newPpn;
                          }).length;
                          setPoNumber(Math.min(50, countSameType + 1));
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="ppnToggle" className="text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                      Aktifkan PPN 11% (DPP Nilai Lain)
                    </label>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                    isPpnActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-800 border border-slate-300'
                  }`}>
                    {isPpnActive ? '🟢 Kategori: PO PPN' : '⚪ Kategori: PO NON-PPN'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-6">
                  Informasi: Urutan PO (PO 1, PO 2, dst) terpisah secara independen antara <b>PO PPN</b> dan <b>PO NON-PPN</b> untuk kode proyek yang sama.
                </p>
              </div>

              {/* DP & Manual Termin Options (MJK, DJI, IRI) */}
              <div className="flex flex-col space-y-3 mt-4 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dpToggle"
                    checked={hasDp}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasDp(checked);
                      if (!checked) {
                        setDpPercent(0);
                      } else {
                        if (dpPercent === 0) setDpPercent(50);
                        if (terminItems.length === 0) {
                          setTerminItems([
                            { stageName: 'Termin 1 (DP 50%)', percent: 50, amount: 0, notes: 'Uang Muka / Down Payment' },
                            { stageName: 'Pelunasan (50%)', percent: 50, amount: 0, notes: 'Pembayaran Pelunasan Pekerjaan' }
                          ]);
                        }
                      }
                    }}
                    className="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"
                  />
                  <label htmlFor="dpToggle" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                    DP/TERMIN
                  </label>
                </div>

                {hasDp && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Persentase DP (%)
                        </label>
                        <input
                          type="number"
                          value={dpPercent}
                          onChange={(e) => setDpPercent(parseFloat(e.target.value) || 0)}
                          min={0}
                          max={100}
                          className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                          placeholder="e.g. 50"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const newIdx = terminItems.length + 1;
                            setTerminItems([
                              ...terminItems,
                              { stageName: `Termin ${newIdx}`, percent: 0, amount: 0, notes: '' }
                            ]);
                          }}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          + Tambah Tahapan Termin (Manual)
                        </button>
                      </div>
                    </div>

                    {/* Manual Termin Stages List */}
                    {terminItems.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          Rincian Tahapan Termin Pembayaran:
                        </label>
                        {terminItems.map((tItem, tIdx) => (
                          <div key={tIdx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={tItem.stageName}
                                onChange={(e) => {
                                  const updated = [...terminItems];
                                  updated[tIdx].stageName = e.target.value;
                                  setTerminItems(updated);
                                }}
                                placeholder="e.g. Termin 1 (DP 50%)"
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={tItem.percent || ''}
                                onChange={(e) => {
                                  const updated = [...terminItems];
                                  updated[tIdx].percent = parseFloat(e.target.value) || 0;
                                  setTerminItems(updated);
                                }}
                                placeholder="%"
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                value={tItem.amount || ''}
                                onChange={(e) => {
                                  const updated = [...terminItems];
                                  updated[tIdx].amount = parseFloat(e.target.value) || 0;
                                  setTerminItems(updated);
                                }}
                                placeholder="Nominal (Rp)"
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={tItem.notes || ''}
                                onChange={(e) => {
                                  const updated = [...terminItems];
                                  updated[tIdx].notes = e.target.value;
                                  setTerminItems(updated);
                                }}
                                placeholder="Catatan"
                                className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-xs dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                type="button"
                                onClick={() => setTerminItems(terminItems.filter((_, i) => i !== tIdx))}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {activeCompany === 'DJI' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    value={diskon}
                    onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Row 5: Item Rows Table */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Daftar Item / Barang
                </label>
                <button
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg transition-all"
                >
                  <Plus className="h-3 w-3" />
                  Tambah Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                      <th className="px-2 py-2 text-left font-bold w-10">No</th>
                      <th className="px-2 py-2 text-left font-bold">Deskripsi Item</th>
                      <th className="px-2 py-2 text-center font-bold w-20">Qty</th>
                      <th className="px-2 py-2 text-center font-bold w-20">Satuan</th>
                      <th className="px-2 py-2 text-right font-bold w-32">Harga/Unit (Rp)</th>
                      <th className="px-2 py-2 text-right font-bold w-32">Jumlah (Rp)</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-2 py-1.5 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={row.item || ''}
                            onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white text-xs"
                            placeholder="Nama item..."
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.qty ?? 0}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white text-xs text-center"
                            min={0}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={row.unit || ''}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white text-xs text-center"
                            placeholder="PCS"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            value={row.rate ?? 0}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white text-xs text-right"
                            min={0}
                          />
                        </td>

                        <td className="px-2 py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">
                          {formatRupiah(row.amount)}
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                      <td colSpan={5} className="px-2 py-2 text-right font-bold text-xs text-slate-700 dark:text-slate-200">TOTAL</td>
                      <td className="px-2 py-2 text-right font-bold font-mono text-xs text-slate-800 dark:text-slate-100">{formatRupiah(subtotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Tanda Tangan Selectors (Dropdowns) with Role Permissions */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Pengaturan Penanda Tangan ({activeCompany})
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Role: {userRole || 'GUEST'}</span>
              </div>

              {(() => {
                const availableSignatures = [
                  ...(signatures[activeCompany as keyof SignaturesData] || []),
                  ...(signatures.MJK || []),
                  ...(signatures.MJI || []),
                  ...(signatures.DJI || []),
                  ...(signatures.IRI || []),
                  { name: 'Imah', imageUrl: '' },
                  { name: 'Via', imageUrl: '' },
                  { name: 'Lucas', imageUrl: '' },
                  { name: 'Edi Purwanto', imageUrl: '' },
                  { name: 'Edi', imageUrl: '' },
                  { name: 'Fitri', imageUrl: '' },
                  { name: 'Rachel', imageUrl: '' },
                  { name: 'Zein', imageUrl: '' },
                  { name: 'Glori', imageUrl: '' },
                  { name: 'Salsa', imageUrl: '' },
                  { name: 'EDwi P', imageUrl: '' },
                  { name: 'Fanisa Ariesti', imageUrl: '' },
                  { name: 'Kiki', imageUrl: '' },
                  { name: 'Dian', imageUrl: '' },
                ].filter((sig, idx, self) => sig && sig.name && self.findIndex(s => s.name === sig.name) === idx);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {[
                      { slot: 2 as const, data: sig2, setter: setSig2 },
                      { slot: 3 as const, data: sig3, setter: setSig3 },
                      { slot: 4 as const, data: sig4, setter: setSig4 },
                      { slot: 5 as const, data: sig5, setter: setSig5 },
                      { slot: 6 as const, data: sig6, setter: setSig6 },
                      { slot: 7 as const, data: sig7, setter: setSig7 },
                    ].map(({ slot, data, setter }) => {
                      const perm = checkSlotPermission(slot);

                      // Helper role-filtered names list for dropdown strictly matching user roles in database
                      const getSlotNames = (s: number) => {
                        let names: string[] = [];
                        if (s === 2) {
                          // Dibuat oleh (1) -> HANYA DIVISION PROCUREMENT / STAFF PROCUREMENT
                          names = systemUsers
                            .filter(u => u.role === 'PROCUREMENT' || u.manager?.role === 'PROCUREMENT')
                            .map(u => u.name);
                          if (names.length === 0) names = ['Imah', 'Via', 'Glori', 'Salsa', 'Zein', 'Fanisa Ariesti'];
                        } else if (s === 3) {
                          // Dibuat oleh (2) -> HANYA PROYEK ADMIN & ENGINEERING
                          names = systemUsers
                            .filter(u => u.role === 'PROYEK_ADMIN' || u.role === 'ENGINEERING')
                            .map(u => u.name);
                          if (names.length === 0) names = ['Lucas', 'Engineering Staff', 'Proyek Admin Staff'];
                        } else if (s === 4 || s === 5) {
                          // Disetujui oleh (1 & 2) -> HANYA PROJECT MANAGER & SUPERVISOR & SUPERADMIN
                          names = systemUsers
                            .filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN')
                            .map(u => u.name);
                          if (names.length === 0) names = ['Edi Purwanto', 'Edi', 'EDwi P', 'Dwi', 'Project Manager', 'Supervisor'];
                        } else if (s === 6 || s === 7) {
                          // Diperiksa Oleh & Dibayarkan Oleh -> HANYA DIVISION FINANCE & SUPERADMIN
                          names = systemUsers
                            .filter(u => u.role === 'FINANCE' || u.role === 'SUPERADMIN')
                            .map(u => u.name);
                          if (names.length === 0) names = ['Fitri', 'Rachel', 'Kiki', 'Dian', 'Yunita'];
                        }
                        return Array.from(new Set(names)).sort();
                      };

                      const nameOptions = getSlotNames(slot);

                      return (
                        <div key={slot} className={`p-2.5 rounded-xl border transition-all ${
                          perm.allowed
                            ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800 opacity-70'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block truncate" title={data.label}>
                              {data.label}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              perm.allowed
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {perm.roleLabel}
                            </span>
                          </div>

                          {/* Dropdown NAMA pemilik tanda tangan (Hanya Username/Nama tanpa TTD Gambar) */}
                          <select
                            value={data.name}
                            disabled={!perm.allowed}
                            onChange={(e) => {
                              const chosenName = e.target.value;
                              // Setting signatureUrl to empty string so NO signature image is rendered anywhere!
                              setter({ ...data, name: chosenName, signatureUrl: '' });
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed font-bold cursor-pointer"
                          >
                            <option value="">-- Pilih Nama --</option>
                            {nameOptions.map((nameStr, i) => (
                              <option key={i} value={nameStr}>{nameStr}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* LIVE TEMPLATE PREVIEW (DOCUMENT A4 FORMAT) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between no-print">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                Pratinjau Hasil Dokumen ({activeCompany})
              </span>
              <span className="text-[11px] text-slate-400">Ukuran A4 Presisi</span>
            </div>

            <div className="bg-slate-200 dark:bg-slate-900 p-2 sm:p-8 rounded-2xl overflow-x-auto w-full flex md:justify-center justify-start max-w-full shadow-inner">
              <div
                id="printable-area"
                ref={documentPrintRef}
                className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 shadow-2xl rounded-sm font-sans text-xs relative flex flex-col justify-between"
                style={{ color: '#000' }}
              >
                {/* HALAMAN 1 CONTAINER FOR IMAGE PDF EXPORT */}
                <div id="printable-page-1" className="bg-white p-4 space-y-4">
                {/* TEMPLATE 1: MJK (PT. MODERN JAYA KONSTRUKSI) */}
                {(activeCompany === 'MJK' || activeCompany === 'MJI') && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src="/mjk_logo.png" alt="MJK Logo" className="h-12 w-auto object-contain" />
                        <div>
                          <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">PT. MODERN JAYA</h2>
                          <span className="text-xs font-bold text-slate-400 tracking-widest leading-none">KONSTRUKSI</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div style={{ backgroundColor: accentColor }} className="text-black font-mono font-bold text-sm px-3 py-1">
                          {docNo}
                        </div>
                      </div>
                    </div>

                    {/* Address & Header Table */}
                    <div className="grid grid-cols-12 gap-4 text-[11px] pt-4">
                      <div className="col-span-7 space-y-1">
                        <p>Jl. Cempaka 2 NC.1 No.1, Desa/Kelurahan Wanakerta,</p>
                        <p>Kec. Bungursari, Kab Purwakarta, Provinsi Jawa Barat, 41181</p>
                        <p className="pt-2">Email: pt.modernjayakonstruksi@gmail.com</p>
                      </div>

                      <div className="col-span-5 space-y-1 font-sans">
                        <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">NO PO</span><span className="text-center">:</span><span>{poNo}</span></div>
                        <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">TANGGAL</span><span className="text-center">:</span><span>{tanggal}</span></div>
                        <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">KODE PROYEK</span><span className="text-center">:</span><span>{kategori}</span></div>
                        <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">PEMESAN</span><span className="text-center">:</span><span>{pemesan}</span></div>

                        <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">NO INVOICE</span><span className="text-center">:</span><span>{noInvoice}</span></div>
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="border-t border-b border-black py-2 my-2 text-[11px] space-y-0.5">
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-bold">NAMA VENDOR</span><span className="text-center">:</span><span>{vendorName}</span></div>
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-bold">ALAMAT</span><span className="text-center">:</span><span>{vendorAddress}</span></div>
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-bold">NOMER TELP</span><span className="text-center">:</span><span>{vendorPhone || '-'}</span></div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse border border-black text-[11px]">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="border border-black px-2 py-1 text-center w-10">No.</th>
                          <th className="border border-black px-2 py-1 text-left">Items</th>
                          <th className="border border-black px-2 py-1 text-center w-16">Quantity</th>
                          <th className="border border-black px-2 py-1 text-center w-16">Units</th>
                          <th className="border border-black px-2 py-1 text-right w-28">Rp/Unit</th>
                          <th className="border border-black px-2 py-1 text-right w-32">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black px-2 py-1.5">{row.item}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.qty}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.rate ? formatRupiah(row.rate) : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.amount ? formatRupiah(row.amount) : ''}</td>
                          </tr>
                        ))}
                        {/* Empty padding rows to look authentic */}
                        {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="border border-black px-2 py-3 text-center"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Calculations & Payment Table Container */}
                    <div className="flex border border-black text-[11px]">
                      <div className="w-1/2 p-2 border-r border-black flex flex-col justify-between">
                        <div>
                          <p className="font-bold">PEMBAYARAN KE</p>
                          <p>{pembayaranKe}</p>
                        </div>
                      </div>

                      <div className="w-1/2">
                        <table className="w-full border-collapse text-[11px]">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 font-semibold text-right border-r border-black">Subtotal</td>
                              <td className="px-2 py-1 text-right w-32">Rp {formatRupiah(subtotal)}</td>
                            </tr>
                            {isPpnActive && (
                              <>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">DPP</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(dpp)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">PPN 11%</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(ppn)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">Subtotal setelah PPN</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(grandTotal)}</td>
                                </tr>
                              </>
                            )}
                            {hasDp && dpPercent > 0 && (
                              <tr className="border-b border-black italic font-semibold">
                                <td className="px-2 py-1 text-right border-r border-black">Uang Muka (DP {dpPercent}%):</td>
                                <td className="px-2 py-1 text-right">Rp {formatRupiah(dpAmount)}</td>
                              </tr>
                            )}
                            <tr className="font-bold bg-slate-100">
                              <td className="px-2 py-1 text-right border-r border-black uppercase">TOTAL YANG HARUS DIBAYARKAN</td>
                              <td className="px-2 py-1 text-right">Rp {formatRupiah(finalTotalToPay)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-x border-b border-black px-2 py-1 text-[11px]">
                      <span className="font-bold">Terbilang : </span>
                      <span className="font-mono uppercase">{currentTerbilangText}</span>
                    </div>

                    {/* Signature Rows for MJI (6 Signatures Total across 4 Columns) */}
                    <div className="pt-8 grid grid-cols-4 gap-2 text-center text-[10px]">
                      {/* Column 1: Dibuat oleh (2 signatures: sig2 & sig3) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibuat oleh</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig2)}
                          {getSigImage(sig3)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig2.name}</span>
                          <span>{sig3.name}</span>
                        </div>
                      </div>

                      {/* Column 2: Disetujui oleh (2 signatures: sig4 & sig5) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Disetujui oleh</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig4)}
                          {getSigImage(sig5)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig4.name}</span>
                          <span>{sig5.name}</span>
                        </div>
                      </div>

                      {/* Column 3: Diperiksa Oleh, (1 signature: sig6) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Diperiksa Oleh,</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig6)}
                        </div>
                        <span className="font-bold">{sig6.name}</span>
                      </div>

                      {/* Column 4: Dibayarkan Oleh, (1 signature: sig7) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibayarkan Oleh,</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig7)}
                        </div>
                        <span className="font-bold">{sig7.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: DJI (PT. DELTA JAYA INDOTAMA) */}
                {activeCompany === 'DJI' && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-2 border-black pb-2">
                      <div className="flex items-center gap-3">
                        <img src="/dji_logo.svg" alt="DJI Logo" className="h-12 w-auto object-contain" />
                        <h2 className="text-base font-extrabold uppercase tracking-wide">PT. DELTA JAYA INDOTAMA</h2>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-mono text-sm font-bold">{docNo}</div>
                      </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-12 gap-4 text-[11px] pt-2">
                      <div className="col-span-6 space-y-1">
                        <p className="font-bold text-xs uppercase mb-2">PURCHASE ORDER (PO)</p>
                        <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">NOMOR PO</span><span className="text-center">:</span><span>{poNo}</span></div>
                        <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">KODE PROYEK</span><span className="text-center">:</span><span>{kodeProyek || kategori}</span></div>
                        <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">TANGGAL</span><span className="text-center">:</span><span>{tanggal}</span></div>

                      </div>

                      <div className="col-span-6 space-y-1">
                        <p className="font-bold text-xs uppercase mb-2">PELANGGAN</p>
                        <div className="grid grid-cols-[130px_12px_1fr] items-start"><span className="font-semibold">NAMA PELANGGAN</span><span className="text-center">:</span><span>{namaPelanggan}</span></div>
                        <div className="grid grid-cols-[130px_12px_1fr] items-start"><span className="font-semibold">NPWP</span><span className="text-center">:</span><span>{npwpPelanggan || '-'}</span></div>
                        <div style={{ backgroundColor: accentColor }} className="h-6 w-full mt-4"></div>
                      </div>
                    </div>

                    {/* Vendor Header */}
                    <div className="border border-black p-2 my-2 text-[11px]">
                      <p className="font-bold uppercase text-center border-b border-black pb-1 mb-1">INFORMASI VENDOR</p>
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">NAMA VENDOR</span><span className="text-center">:</span><span>{vendorName}</span></div>
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">ALAMAT</span><span className="text-center">:</span><span>{vendorAddress}</span></div>
                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">NOMER TELF</span><span className="text-center">:</span><span>{vendorPhone || '-'}</span></div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse border border-black text-[11px]">
                      <thead>
                        <tr className="border-b border-black font-bold uppercase text-center">
                          <th className="border border-black px-2 py-1.5 w-10">NO</th>
                          <th className="border border-black px-2 py-1.5 text-left">DESKRIPSI</th>
                          <th className="border border-black px-2 py-1.5 w-16">QTY</th>
                          <th className="border border-black px-2 py-1.5 w-16">SATUAN</th>
                          <th className="border border-black px-2 py-1.5 text-right w-28">HARGA SATUAN</th>
                          <th className="border border-black px-2 py-1.5 text-right w-32">HARGA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black px-2 py-1.5">{row.item}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.qty}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.rate ? formatRupiah(row.rate) : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.amount ? formatRupiah(row.amount) : ''}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="border border-black px-2 py-3 text-center"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Calculations & Payment Section */}
                    <div className="flex border border-black text-[11px]">
                      <div className="w-1/2 p-2 border-r border-black flex flex-col justify-between">
                        <div>
                          <p className="font-bold mb-1">Pembayaran</p>
                          <p>{pembayaranKe}</p>
                        </div>
                      </div>

                      <div className="w-1/2">
                        <table className="w-full border-collapse text-[11px]">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 font-semibold text-right border-r border-black">Subtotal (Rp)</td>
                              <td className="px-2 py-1 text-right w-32">Rp {formatRupiah(subtotal)}</td>
                            </tr>
                            {diskon > 0 && (
                              <tr className="border-b border-black">
                                <td className="px-2 py-1 font-semibold text-right border-r border-black">Diskon</td>
                                <td className="px-2 py-1 text-right">Rp {formatRupiah(diskon)}</td>
                              </tr>
                            )}
                            {isPpnActive && (
                              <>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">DPP</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(dpp)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">PPN 11%</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(ppn)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black">Subtotal setelah PPN</td>
                                  <td className="px-2 py-1 text-right">Rp {formatRupiah(grandTotal)}</td>
                                </tr>
                              </>
                            )}
                            {hasDp && dpPercent > 0 && (
                              <tr className="border-b border-black italic font-semibold">
                                <td className="px-2 py-1 text-right border-r border-black">Uang Muka (DP {dpPercent}%):</td>
                                <td className="px-2 py-1 text-right">Rp {formatRupiah(dpAmount)}</td>
                              </tr>
                            )}
                            <tr className="font-bold bg-slate-100">
                              <td className="px-2 py-1 text-right border-r border-black uppercase">Tagihan (Rp)</td>
                              <td className="px-2 py-1 text-right">Rp {formatRupiah(finalTotalToPay)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="border-x border-b border-black px-2 py-1 text-[11px]">
                      <span className="font-bold">Terbilang : </span>
                      <span className="font-mono uppercase">{currentTerbilangText}</span>
                    </div>

                    {/* Signatures DJI (6 Signatures Total across 4 Columns) */}
                    <div className="pt-8 grid grid-cols-4 gap-2 text-center text-[10px]">
                      {/* Column 1: Dibuat oleh (2 signatures: sig2 & sig3) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibuat oleh</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig2)}
                          {getSigImage(sig3)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig2.name}</span>
                          <span>{sig3.name}</span>
                        </div>
                      </div>

                      {/* Column 2: Disetujui oleh (2 signatures: sig4 & sig5) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Disetujui oleh</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig4)}
                          {getSigImage(sig5)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig4.name}</span>
                          <span>{sig5.name}</span>
                        </div>
                      </div>

                      {/* Column 3: Diperiksa Oleh, (1 signature: sig6) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Diperiksa Oleh,</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig6)}
                        </div>
                        <span className="font-bold">{sig6.name}</span>
                      </div>

                      {/* Column 4: Dibayarkan Oleh, (1 signature: sig7) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibayarkan Oleh,</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig7)}
                        </div>
                        <span className="font-bold">{sig7.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 3: IRI (PT. INOVATIF RENOVALOGI INDONESIA) */}
                {activeCompany === 'IRI' && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src="/iri_logo.svg" alt="IRI Logo" className="h-16 w-auto object-contain" />
                      </div>

                      <div className="text-right">
                        <div className="font-serif text-lg font-bold text-slate-900">{docNo}</div>
                        <div style={{ backgroundColor: accentColor }} className="h-6 w-32 ml-auto my-1"></div>
                        <h3 className="text-sm font-extrabold tracking-wide uppercase">PURCHASE ORDER 采购订单</h3>
                      </div>
                    </div>

                    {/* Address & Order Metadata */}
                    <div className="grid grid-cols-12 gap-4 text-[11px] pt-2">
                      <div className="col-span-7 space-y-1">
                        <p className="font-bold text-xs">PT. INOVATIF RENOVALOGI INDONESIA</p>
                        <p>Citra Raya Bizlink Blok P05/92 Sukamulya, Cikupa Kab. Tangerang Banten</p>
                        <p>NPWP : 20.815.973.1-451.000</p>
                        <p>Email : inovatifrenovalogindonesia@gmail.com</p>
                      </div>

                      <div className="col-span-5 space-y-1">
                        <div className="grid grid-cols-[140px_12px_1fr] items-start"><span className="font-bold">NO PO 订单号</span><span className="text-center">:</span><span>{poNo}</span></div>
                        <div className="grid grid-cols-[140px_12px_1fr] items-start"><span className="font-bold">TANGGAL 日期</span><span className="text-center">:</span><span>{tanggal}</span></div>
                        <div className="grid grid-cols-[140px_12px_1fr] items-start"><span className="font-bold">KODE PROYEK 项目代码</span><span className="text-center">:</span><span>{kategori}</span></div>
                        <div className="grid grid-cols-[140px_12px_1fr] items-start"><span className="font-bold">PEMESAN 订购方</span><span className="text-center">:</span><span>{pemesan}</span></div>

                      </div>
                    </div>

                    {/* Supplier Info */}
                    <div className="border-t border-b border-black py-2 my-2 text-[11px] space-y-0.5">
                      <p className="font-bold text-xs uppercase mb-1">SUPPLIER 供应商:</p>
                      <div className="grid grid-cols-[170px_12px_1fr] items-start"><span className="font-bold">NAMA VENDOR 供应商名称</span><span className="text-center">:</span><span>{vendorName}</span></div>
                      <div className="grid grid-cols-[170px_12px_1fr] items-start"><span className="font-bold">ALAMAT 地址</span><span className="text-center">:</span><span>{vendorAddress}</span></div>
                      <div className="grid grid-cols-[170px_12px_1fr] items-start"><span className="font-bold">NOMER TELP 电话号码</span><span className="text-center">:</span><span>{vendorPhone || '-'}</span></div>
                    </div>

                    {/* Items Table (Peach / Coral Headers) */}
                    <table className="w-full border-collapse border border-black text-[11px]">
                      <thead>
                        <tr className="border-b border-black bg-[#E07A5F] text-white font-bold">
                          <th className="border border-black px-2 py-1.5 text-center w-12">No. 序号</th>
                          <th className="border border-black px-2 py-1.5 text-left">Material 材料</th>
                          <th className="border border-black px-2 py-1.5 text-center w-20">Qty 数量</th>
                          <th className="border border-black px-2 py-1.5 text-center w-20">Unit 单位</th>
                          <th className="border border-black px-2 py-1.5 text-right w-28">Rp/Unit 单价</th>
                          <th className="border border-black px-2 py-1.5 text-right w-32">Total 总价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black px-2 py-1.5">{row.item}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.qty}</td>
                            <td className="border border-black px-2 py-1.5 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.rate ? formatRupiah(row.rate) : ''}</td>
                            <td className="border border-black px-2 py-1.5 text-right">{row.amount ? formatRupiah(row.amount) : ''}</td>
                          </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="border border-black px-2 py-3 text-center"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                            <td className="border border-black px-2 py-3"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Calculations & Payment Section */}
                    <div className="flex border border-black text-[11px]">
                      <div className="w-1/2 p-2 border-r border-black flex flex-col justify-between">
                        <div>
                          <p className="font-bold mb-2">{pembayaranKe}</p>
                          <div>
                            <span className="font-bold">Terbilang 大写 : </span>
                            <span className="font-mono">{currentTerbilangText}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-1/2">
                        <table className="w-full border-collapse text-[11px]">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="px-2 py-1 font-semibold text-right border-r border-black uppercase">SUBTOTAL</td>
                              <td className="px-2 py-1 text-right w-32">{formatRupiah(subtotal)}</td>
                            </tr>
                            {isPpnActive && (
                              <>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black uppercase">DPP</td>
                                  <td className="px-2 py-1 text-right">{formatRupiah(dpp)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black uppercase">PPN (11%)</td>
                                  <td className="px-2 py-1 text-right">{formatRupiah(ppn)}</td>
                                </tr>
                                <tr className="border-b border-black">
                                  <td className="px-2 py-1 font-semibold text-right border-r border-black uppercase">Subtotal setelah PPN</td>
                                  <td className="px-2 py-1 text-right">{formatRupiah(grandTotal)}</td>
                                </tr>
                              </>
                            )}
                            {hasDp && dpPercent > 0 && (
                              <tr className="border-b border-black italic font-semibold">
                                <td className="px-2 py-1 text-right border-r border-black uppercase">Uang Muka (DP {dpPercent}%) 首付:</td>
                                <td className="px-2 py-1 text-right">{formatRupiah(dpAmount)}</td>
                              </tr>
                            )}
                            <tr className="border-b border-black font-bold bg-slate-100">
                              <td className="px-2 py-1 text-right border-r border-black uppercase">TOTAL YANG HARUS DIBAYARKAN 总共</td>
                              <td className="px-2 py-1 text-right">{formatRupiah(finalTotalToPay)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Signatures IRI (6 Signatures Total across 4 Columns) */}
                    <div className="pt-8 grid grid-cols-4 gap-2 text-center text-[10px]">
                      {/* Column 1: Dibuat oleh 申请人 (2 signatures: sig2 & sig3) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibuat oleh 申请人</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig2)}
                          {getSigImage(sig3)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig2.name}</span>
                          <span>{sig3.name}</span>
                        </div>
                      </div>

                      {/* Column 2: Disetujui oleh 批准人 (2 signatures: sig4 & sig5) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Disetujui oleh 批准人</span>
                        <div className="h-12 flex items-center justify-center gap-1">
                          {getSigImage(sig4)}
                          {getSigImage(sig5)}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-bold">
                          <span>{sig4.name}</span>
                          <span>{sig5.name}</span>
                        </div>
                      </div>

                      {/* Column 3: Diperiksa Oleh, 审核人 (1 signature: sig6) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Diperiksa Oleh, 审核人</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig6)}
                        </div>
                        <span className="font-bold">{sig6.name}</span>
                      </div>

                      {/* Column 4: Dibayarkan Oleh, 付款人 (1 signature: sig7) */}
                      <div className="flex flex-col justify-between h-24">
                        <span className="font-bold mb-1">Dibayarkan Oleh, 付款人</span>
                        <div className="h-12 flex items-center justify-center">
                          {getSigImage(sig7)}
                        </div>
                        <span className="font-bold">{sig7.name}</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* HALAMAN 2: REKAPITULASI BOQ MATERIAL & PENAWARAN HARGA (FULL A4 STANDALONE PAGE) */}
                <div
                  id="printable-page-2"
                  className="bg-white text-slate-900 w-full h-auto p-4 font-sans text-xs relative flex flex-col justify-between mt-8 border-t-2 border-slate-200 pt-8"
                  style={{ color: '#000' }}
                >
                  <div className="space-y-4">
                    {/* Header Perusahaan di Page 2 */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={(activeCompany === 'MJK' || activeCompany === 'MJI') ? '/mjk_logo.png' : activeCompany === 'DJI' ? '/dji_logo.svg' : '/iri_logo.svg'}
                          alt="Logo"
                          className="h-10 w-auto object-contain"
                        />
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">
                            {(activeCompany === 'MJK' || activeCompany === 'MJI') ? 'PT. MODERN JAYA KONSTRUKSI' : activeCompany === 'DJI' ? 'PT. DELTA JAYA INDOTAMA' : 'PT. INOVATIF RENOVALOGI INDONESIA'}
                          </h2>
                          <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                            DOCUMENT BOQ REKAPITULASI
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div style={{ backgroundColor: accentColor }} className="text-black font-mono font-bold text-xs px-3 py-1 inline-block mb-1">
                          {docNo}
                        </div>
                        <div className="text-[10px] font-bold text-slate-600">
                          NO PO: {poNo || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Section Title Box */}
                    <div className="bg-slate-100 p-3 rounded border border-slate-300 flex justify-between items-center my-3">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                          REKAPITULASI BOQ MATERIAL &amp; PENAWARAN HARGA
                        </h3>
                        <p className="text-[10px] text-slate-600 font-medium pt-0.5">
                          Kode Proyek: <span className="font-bold text-black">{kodeProyek || kategori || 'PROYEK'}</span> | Tanggal: {tanggal || '-'}
                        </p>
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-500">
                        Vendor: <span className="font-bold text-slate-900">{vendorName || '-'}</span>
                      </div>
                    </div>

                    {/* Full Height BOQ Items Table with 12 Padding Rows */}
                    <table className="w-full border-collapse border border-black text-[11px] my-2">
                      <thead>
                        <tr style={{ backgroundColor: accentColor }} className="text-black font-extrabold uppercase text-center border-b border-black">
                          <th className="border border-black px-2 py-2 w-10">NO</th>
                          <th className="border border-black px-2 py-2 text-left">RINCIAN BOQ MATERIAL / SUBCON</th>
                          <th className="border border-black px-2 py-2 w-16">QTY</th>
                          <th className="border border-black px-2 py-2 w-16">SATUAN</th>
                          <th className="border border-black px-2 py-2 text-right w-28">HARGA SATUAN</th>
                          <th className="border border-black px-2 py-2 text-right w-32">TOTAL MATERIAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, idx) => (
                          <tr key={`boq-${idx}`} className="hover:bg-slate-50">
                            <td className="border border-black px-2 py-2 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black px-2 py-2 font-medium">{row.item}</td>
                            <td className="border border-black px-2 py-2 text-center">{row.qty}</td>
                            <td className="border border-black px-2 py-2 text-center">{row.unit}</td>
                            <td className="border border-black px-2 py-2 text-right font-mono">{row.rate ? formatRupiah(row.rate) : '-'}</td>
                            <td className="border border-black px-2 py-2 text-right font-mono font-bold">{row.amount ? formatRupiah(row.amount) : '-'}</td>
                          </tr>
                        ))}
                        {/* No padding rows - page height adjusts to content */}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t-2 border-black">
                          <td colSpan={5} className="border border-black px-3 py-2.5 text-right uppercase text-xs">
                            TOTAL HARGA MATERIAL BOQ
                          </td>
                          <td className="border border-black px-3 py-2.5 text-right font-mono text-xs text-emerald-800 bg-emerald-50">
                            Rp {formatRupiah(subtotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Page 2 Footer Note */}
                  <div className="pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Dokumen Rekapitulasi BOQ Resmi - {activeCompany}</span>
                    <span>Halaman 2 Dari Dokumen PO Integrasi</span>
                  </div>
                </div>

                {/* SURAT JALAN & BERKAS LAMPIRAN TERHUBUNG (DIJADIKAN 1 UTUH) */}
                {attachments.map((att, idx) => {
                  if (!att.url && !att.file) return null;
                  const displayUrl = att.url
                    ? (att.url.startsWith('http') ? att.url : `${getBackendHostUrl()}${att.url}`)
                    : (att.file ? URL.createObjectURL(att.file) : '');
                  const isImage = (att.url && att.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) || (att.file && att.file.type.startsWith('image/'));

                  return (
                    <div
                      key={`print-att-${idx}`}
                      id={`printable-page-${idx + 3}`}
                      className="bg-white text-slate-900 w-full h-auto p-4 font-sans text-xs relative flex flex-col justify-between mt-8 border-t-2 border-slate-300 pt-8 space-y-4"
                      style={{ color: '#000' }}
                    >
                      <div className="flex justify-between items-center border-b border-black pb-2">
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                            SURAT JALAN &amp; BERKAS LAMPIRAN TERINTEGRASI ({idx + 1})
                          </h3>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            File: <span className="font-bold text-sky-700">{att.name || 'Lampiran Berkas'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div style={{ backgroundColor: accentColor }} className="text-black font-mono font-bold text-xs px-2 py-0.5 inline-block">
                            {docNo}
                          </div>
                        </div>
                      </div>

                      <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 min-h-[400px] flex items-center justify-center">
                        {isImage ? (
                          <img
                            src={displayUrl}
                            alt={`Lampiran ${idx + 1}`}
                            className="max-w-full h-auto max-h-[800px] object-contain rounded shadow-md mx-auto"
                          />
                        ) : (
                          <div className="w-full bg-slate-900 text-white rounded-xl p-8 border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center space-y-4 my-4">
                            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-extrabold text-3xl border border-sky-500/30">
                              📄
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-base text-white tracking-wide">{att.name || 'Dokumen Lampiran Terintegrasi'}</h4>
                              <p className="text-xs text-slate-400">Berkas Surat Jalan / PDF / Spreadsheet Terlampir</p>
                            </div>
                            {displayUrl && (
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 mt-2 cursor-pointer"
                              >
                                <span>Buka / Unduh Berkas Lampiran</span> 🔗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-sky-500" />
              Daftar Riwayat Formulir Dokumen
            </h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  onClick={() => setSelectedCompanyFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedCompanyFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Semua Perusahaan
                </button>
                <button
                  onClick={() => setSelectedCompanyFilter('MJI')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedCompanyFilter === 'MJI' || selectedCompanyFilter === ('MJK' as any) ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  MJK
                </button>
                <button
                  onClick={() => setSelectedCompanyFilter('DJI')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedCompanyFilter === 'DJI' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  DJI
                </button>
                <button
                  onClick={() => setSelectedCompanyFilter('IRI')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedCompanyFilter === 'IRI' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  IRI
                </button>
              </div>

              <div className="relative flex-1 sm:w-56">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No Dokumen / Vendor..."
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12 text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-sky-500" />
              Memuat riwayat dokumen...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Belum ada riwayat dokumen yang disimpan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Perusahaan</th>
                    <th className="p-3">No. Dokumen (PR)</th>
                    <th className="p-3">No. PO</th>
                    <th className="p-3">Vendor / Supplier</th>
                    <th className="p-3">Dibuat Oleh</th>
                    <th className="p-3">Tanggal Dibuat</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredHistory.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          (doc.company === 'MJI' || doc.company === 'MJK') ? 'bg-cyan-100 text-cyan-800' :
                          doc.company === 'DJI' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.company === 'MJI' ? 'MJK' : doc.company}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{doc.documentNo}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{doc.poNo || '-'}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{doc.vendorName || '-'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{doc.createdBy?.name || 'Super Admin'}</td>
                      <td className="p-3 text-slate-400">{new Date(doc.createdAt).toLocaleDateString('id-ID')}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintDocument(doc)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105"
                            title="Cetak / Export PDF Dokumen Ini"
                          >
                            <Printer className="h-3.5 w-3.5 text-sky-400" />
                            Cetak / Export PDF 🖨️
                          </button>
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg dark:bg-sky-950 dark:text-sky-400"
                            title="Edit / Lihat Dokumen"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg dark:bg-rose-950 dark:text-rose-400"
                            title="Hapus Dokumen"
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
          )}
        </div>
      )}
      {/* TOTAL PO PER KODE PROYEK TAB CONTENT */}
      {activeTab === 'total_po' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                Rekapitulasi Total PO Per Kode Proyek
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Daftar seluruh Formulir Dokumen / PO (PO 1, PO 2, PO 3, dst.) yang dibuat oleh Super Admin & Procurement untuk tiap Kode Proyek beserta akumulasi nilainya.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Kode Proyek..."
                value={searchTotalPO}
                onChange={(e) => setSearchTotalPO(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {savedDocs.filter(d => d.documentData?.type !== 'PROYEK_ADMIN').length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Belum ada data formulir dokumen / PO tersimpan.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group savedDocs by company & project code */}
              {Object.entries(
                savedDocs
                  .filter(d => d.documentData?.type !== 'PROYEK_ADMIN' && !d.company?.startsWith('GA') && !d.documentNo?.startsWith('GA'))
                  .reduce((acc: Record<string, SavedDocument[]>, doc) => {
                    const data = doc.documentData || {};
                    const projId = data.selectedProjectId || doc.projectId;
                    let key = '';

                    // 1. Direct Project ID Match
                    if (projId) {
                      const foundProj = projectsList.find(p => p.id === projId);
                      if (foundProj) {
                        key = `${foundProj.code} - ${foundProj.name}`;
                      }
                    }

                    // 2. Match by code or name in projectsList
                    if (!key) {
                      const rawCode = (data.kodeProyek || data.kategori || doc.poNo || '').trim();
                      const foundProj = projectsList.find(p => 
                        (p.code && rawCode.toLowerCase().includes(p.code.toLowerCase())) ||
                        (p.name && rawCode.toLowerCase().includes(p.name.toLowerCase()))
                      );
                      if (foundProj) {
                        key = `${foundProj.code} - ${foundProj.name}`;
                      } else {
                        key = rawCode || 'Umum / Non-Proyek';
                      }
                    }

                    if (!acc[key]) acc[key] = [];
                    acc[key].push(doc);
                    return acc;
                  }, {})
              )
              .filter(([projectKey]) => projectKey.toLowerCase().includes(searchTotalPO.toLowerCase()))
              .map(([projectKey, docsGroup], groupIdx) => {
                const totalGroupPO = docsGroup.reduce((sum, d) => sum + (d.documentData?.grandTotal || d.documentData?.subtotal || 0), 0);
                const countPpn = docsGroup.filter(d => Boolean(d.documentData?.isPpnActive)).length;
                const countNonPpn = docsGroup.filter(d => !Boolean(d.documentData?.isPpnActive)).length;

                return (
                  <div key={projectKey} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {groupIdx + 1}
                        </span>
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            Kode Proyek: <span className="text-emerald-600 dark:text-emerald-400">{projectKey}</span>
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Total {docsGroup.length} Formulir PO dibuat:</span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              🟢 {countPpn} PO PPN
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              ⚪ {countNonPpn} PO NON-PPN
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Akumulasi Total PO</span>
                          <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            Rp {totalGroupPO.toLocaleString('id-ID')}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const firstDoc = docsGroup[0];
                            const data = firstDoc.documentData || {};
                            const projId = data.selectedProjectId || firstDoc.projectId;
                            const rawComp = firstDoc.company || activeCompany;
                            const comp = rawComp === 'MJI' ? 'MJK' : rawComp;
                            
                            if (rawComp) switchCompanyTab(rawComp as any);
                            setActiveTab('create');
                            setEditingId(null); // Reset editingId so a NEW PO record is created!

                            setTimeout(() => {
                              if (projId) {
                                setSelectedProjectId(projId);
                                const selectedProj = projectsList.find(p => p.id === projId);
                                if (selectedProj) {
                                  setKodeProyek(selectedProj.code || selectedProj.name);
                                  if (selectedProj.client) setNamaPelanggan(selectedProj.client);
                                  setKategori(`${selectedProj.code} - ${selectedProj.name}`);
                                }
                              } else if (data.kodeProyek) {
                                setKodeProyek(data.kodeProyek);
                                setKategori(data.kategori || data.kodeProyek);
                                if (data.namaPelanggan) setNamaPelanggan(data.namaPelanggan);
                              }

                              const existingCount = docsGroup.length;
                              setPoNumber(Math.min(50, existingCount + 1));

                              const year = new Date().getFullYear();
                              const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
                              const seq = (existingCount + 1).toString().padStart(3, '0');
                              
                              setDocNo(`PR.${comp}.${year}.${month}.${seq}`);
                              setPoNo(`${comp}PO-${year}/${month}-${seq}`);
                            }, 150);
                          }}
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Tambah PO Baru Untuk Proyek Ini"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah PO
                        </button>
                      </div>
                    </div>


                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-3">Urutan PO</th>
                            <th className="p-3">Jenis PO</th>
                            <th className="p-3">Perusahaan</th>
                            <th className="p-3">No. Dokumen (PR)</th>
                            <th className="p-3">No. PO</th>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Vendor / Supplier</th>
                            <th className="p-3">Lampiran File</th>
                            <th className="p-3 text-right">Nilai Total PO</th>
                            <th className="p-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {docsGroup.map((doc, docIdx) => {
                            const data = doc.documentData || {};
                            const poAmount = data.grandTotal || data.subtotal || 0;
                            const isPpn = Boolean(data.isPpnActive);
                            const poNumRaw = data.poNumber || (docIdx + 1);
                            const poNumDisplay = `PO ${poNumRaw} (${isPpn ? 'PPN' : 'NON-PPN'})`;

                            return (
                              <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                <td className="p-3 font-extrabold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                                  {poNumDisplay}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap inline-flex items-center gap-1 ${
                                    isPpn ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>
                                    {isPpn ? '🟢 PPN 11%' : '⚪ NON-PPN'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    (doc.company === 'MJI' || doc.company === 'MJK') ? 'bg-cyan-100 text-cyan-800' :
                                    doc.company === 'DJI' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {doc.company === 'MJI' ? 'MJK' : doc.company}
                                  </span>
                                </td>

                                <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{doc.documentNo}</td>
                                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{doc.poNo || '-'}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">{data.tanggal || new Date(doc.createdAt).toLocaleDateString('id-ID')}</td>
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{doc.vendorName || '-'}</td>
                                <td className="p-3">
                                  {data.attachments && data.attachments.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                      {data.attachments.map((att: any, idx: number) => (
                                        <a key={idx} href={`${getBackendHostUrl()}${att.url}`} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 font-bold underline flex items-center gap-1">
                                          📎 {att.name || `Lampiran ${idx + 1}`}
                                        </a>
                                      ))}
                                    </div>
                                  ) : data.attachmentUrl ? (
                                    <a href={`${getBackendHostUrl()}${data.attachmentUrl}`} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 font-bold underline flex items-center gap-1">
                                      📎 {data.attachmentName || 'Lampiran'}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                  Rp {poAmount.toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handlePrintDocument(doc)}
                                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105"
                                      title="Cetak / Export PDF Dokumen Ini"
                                    >
                                      <Printer className="h-3.5 w-3.5 text-sky-400" />
                                      Cetak PDF 🖨️
                                    </button>
                                    <button
                                      onClick={() => handleEdit(doc)}
                                      className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg dark:bg-sky-950 dark:text-sky-400 font-semibold text-[11px]"
                                    >
                                      Lihat Detail
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

