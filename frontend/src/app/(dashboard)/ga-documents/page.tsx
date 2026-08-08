'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import api, { getBackendHostUrl } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  FileText, Plus, History, Printer, Save, Trash2, Edit,
  RefreshCw, Building2, CheckCircle, AlertCircle, Search, X,
  PlusCircle, MinusCircle, Download
} from 'lucide-react';

// ─── Interfaces ────────────────────────────────────────────────────────
interface GaItemRow {
  no: number;
  kategori: string;
  deskripsi: string;
  keterangan: string;
  qty: number;
  nominal: number;
  total: number;
}

interface GaSigSlot {
  label: string;
  subLabel: string;
  name: string;
  signatureUrl: string;
}

interface SignatureOption {
  name: string;
  imageUrl: string;
}

interface SavedGaDocument {
  id: string;
  company: string;
  documentNo: string;
  vendorName: string | null;
  documentData: any;
  createdAt: string;
  createdBy: { id: string; name: string; email: string; role: string };
}

// ─── Helpers ───────────────────────────────────────────────────────────
function terbilangGA(angka: number): string {
  const satuan = ['', 'SATU', 'DUA', 'TIGA', 'EMPAT', 'LIMA', 'ENAM', 'TUJUH', 'DELAPAN', 'SEMBILAN', 'SEPULUH', 'SEBELAS'];
  if (angka < 12) return satuan[angka];
  if (angka < 20) return terbilangGA(angka - 10) + ' BELAS';
  if (angka < 100) return terbilangGA(Math.floor(angka / 10)) + ' PULUH' + (angka % 10 ? ' ' + terbilangGA(angka % 10) : '');
  if (angka < 200) return 'SERATUS' + (angka > 100 ? ' ' + terbilangGA(angka - 100) : '');
  if (angka < 1000) return terbilangGA(Math.floor(angka / 100)) + ' RATUS' + (angka % 100 ? ' ' + terbilangGA(angka % 100) : '');
  if (angka < 2000) return 'SERIBU' + (angka > 1000 ? ' ' + terbilangGA(angka - 1000) : '');
  if (angka < 1000000) return terbilangGA(Math.floor(angka / 1000)) + ' RIBU' + (angka % 1000 ? ' ' + terbilangGA(angka % 1000) : '');
  if (angka < 1000000000) return terbilangGA(Math.floor(angka / 1000000)) + ' JUTA' + (angka % 1000000 ? ' ' + terbilangGA(angka % 1000000) : '');
  return terbilangGA(Math.floor(angka / 1000000000)) + ' MILYAR' + (angka % 1000000000 ? ' ' + terbilangGA(angka % 1000000000) : '');
}

function toTerbilangText(val: number): string {
  if (!val || val <= 0) return '-';
  const kata = terbilangGA(Math.round(val)).trim();
  return kata.charAt(0) + kata.slice(1).toLowerCase() + ' Rupiah';
}

function formatRp(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID');
}

// ─── Sig Selector sub-component ─────────────────────────────────────────
const SigSelector = ({ data, setter, num, loadingSignatures, availableSignatures }: { data: GaSigSlot; setter: (v: GaSigSlot) => void; num: number; loadingSignatures: boolean; availableSignatures: SignatureOption[] }) => (
  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-2">
    <div className="text-[10px] font-extrabold text-slate-400 uppercase">TTD {num}</div>
    <input value={data.label} onChange={e => setter({ ...data, label: e.target.value })}
      placeholder="Label (Approved by /)"
      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
    <input value={data.subLabel} onChange={e => setter({ ...data, subLabel: e.target.value })}
      placeholder="Sub-label (批准人:)"
      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
    <input value={data.name} onChange={e => setter({ ...data, name: e.target.value })}
      placeholder="Nama"
      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
    <select
      value={data.signatureUrl}
      onChange={e => {
        const url = e.target.value;
        const opt = availableSignatures.find(s => s.imageUrl === url);
        setter({
          ...data,
          signatureUrl: url,
          name: opt ? opt.name.toUpperCase() : data.name
        });
      }}
      className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white"
    >
      <option value="">-- Tanpa TTD Gambar --</option>
      {loadingSignatures ? <option disabled>Memuat...</option> :
        availableSignatures.map((s, i) => <option key={i} value={s.imageUrl}>{s.name}</option>)}
    </select>

    {data.signatureUrl && (
      <img src={`${getBackendHostUrl()}${data.signatureUrl}`} alt="ttd" className="h-10 mx-auto object-contain opacity-80" />
    )}
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────
export default function GaDocumentsPage() {
  const { user } = useAuth();
  const [activeCompany, setActiveCompany] = useState<'MJK' | 'IRI' | 'DJI'>('MJK');
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  const [signatures, setSignatures] = useState<{ MJK: SignatureOption[]; DJI: SignatureOption[]; ALL: SignatureOption[] }>({ MJK: [], DJI: [], ALL: [] });
  const [loadingSignatures, setLoadingSignatures] = useState(true);
  const [savedDocs, setSavedDocs] = useState<SavedGaDocument[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchHistory, setSearchHistory] = useState('');
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  // ─── Metadata ─────────────────────────────────────────────────────────
  const [docNo, setDocNo] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [namaProject, setNamaProject] = useState('');
  const [diajukanOleh, setDiajukanOleh] = useState('');
  const [divisi, setDivisi] = useState('GA');
  const [periodeYear, setPeriodeYear] = useState(new Date().getFullYear().toString());

  // ─── Penerima ──────────────────────────────────────────────────────────
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaBank, setPenerimaBank] = useState('');
  const [penerimaRekening, setPenerimaRekening] = useState('');

  // ─── Attachments State (Excel, PDF, Foto) ──────────────────────────────
  const [attachments, setAttachments] = useState<{ file?: File; url?: string; name: string }[]>([]);

  // ─── Financial Extras ─────────────────────────────────────────────────
  const [biayaAdmin, setBiayaAdmin] = useState(0);
  const [pph, setPph] = useState(0);
  const [isPpnActive, setIsPpnActive] = useState(false);
  const [biayaLainnya, setBiayaLainnya] = useState(0);

  // ─── Item Rows ────────────────────────────────────────────────────────
  const [items, setItems] = useState<GaItemRow[]>([
    { no: 1, kategori: '', deskripsi: '', keterangan: '', qty: 1, nominal: 0, total: 0 },
  ]);

  // ─── 5 Signature Slots ────────────────────────────────────────────────
  const [sig1, setSig1] = useState<GaSigSlot>({ label: 'Signature of PIC/', subLabel: '报账人签名:', name: 'DINI', signatureUrl: '' });
  const [sig2, setSig2] = useState<GaSigSlot>({ label: 'Approved by /', subLabel: '批准人:', name: 'LUCAS/ANSON', signatureUrl: '' });
  const [sig3, setSig3] = useState<GaSigSlot>({ label: 'Checked by /', subLabel: '审核人:', name: 'FITRI', signatureUrl: '' });
  const [sig4, setSig4] = useState<GaSigSlot>({ label: 'Checked by /', subLabel: '审核人:', name: 'DIAN', signatureUrl: '' });
  const [sig5, setSig5] = useState<GaSigSlot>({ label: 'Paid by /', subLabel: '付款人:', name: 'RACHEL', signatureUrl: '' });

  // ─── Calculations ──────────────────────────────────────────────────────
  const subtotal = items.reduce((acc, r) => acc + (r.total || 0), 0);
  const dpp = isPpnActive ? Math.round(subtotal * (11 / 12)) : 0;
  const ppn = isPpnActive ? Math.round(subtotal * 0.11) : 0;
  const grandTotal = subtotal + biayaAdmin + pph + ppn + biayaLainnya;
  const terbilangText = toTerbilangText(grandTotal);

  // ─── Fetch & Live Sync ────────────────────────────────────────────────
  useEffect(() => {
    fetchGaSignatures();
    fetchHistory();

    const handleSync = () => {
      fetchGaSignatures();
      fetchHistory();
    };

    window.addEventListener('app_data_changed', handleSync);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('app_data_sync');
      channel.onmessage = () => {
        handleSync();
      };
    }

    const iv = setInterval(fetchHistory, 5000);

    return () => {
      window.removeEventListener('app_data_changed', handleSync);
      if (channel) channel.close();
      clearInterval(iv);
    };
  }, []);

  const fetchGaSignatures = async () => {
    try {
      setLoadingSignatures(true);
      const res = await api.get('/ga-documents/signatures');
      if (res.data.success) {
        const mjkList: SignatureOption[] = res.data.signatures.MJK || [];
        const djiList: SignatureOption[] = res.data.signatures.DJI || [];
        const allList: SignatureOption[] = res.data.signatures.ALL || [];
        setSignatures({ MJK: mjkList, DJI: djiList, ALL: allList });

        setSig1(prev => ({ ...prev, label: 'Signature of PIC/', subLabel: '报账人签名:', name: prev.name || 'DINI', signatureUrl: prev.signatureUrl || '' }));
        setSig2(prev => ({ ...prev, label: 'Approved by /', subLabel: '批准人:', name: prev.name || 'LUCAS/ANSON', signatureUrl: prev.signatureUrl || '' }));
        setSig3(prev => ({ ...prev, label: 'Checked by /', subLabel: '审核人:', name: prev.name || 'FITRI', signatureUrl: prev.signatureUrl || '' }));
        setSig4(prev => ({ ...prev, label: 'Checked by /', subLabel: '审核人:', name: prev.name || 'DIAN', signatureUrl: prev.signatureUrl || '' }));
        setSig5(prev => ({ ...prev, label: 'Paid by /', subLabel: '付款人:', name: prev.name || 'RACHEL', signatureUrl: prev.signatureUrl || '' }));
      }
    } catch (e) { console.error(e); }
    finally { setLoadingSignatures(false); }
  };






  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/ga-documents/forms');
      if (res.data.success) setSavedDocs(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingHistory(false); }
  };

  const availableSignatures: SignatureOption[] =
    activeCompany === 'MJK' ? signatures.MJK :
      activeCompany === 'DJI' ? signatures.DJI :
        signatures.ALL;

  // ─── Item Handlers ────────────────────────────────────────────────────
  const handleItemChange = (idx: number, field: keyof GaItemRow, val: any) => {
    const updated = [...items];
    const row = { ...updated[idx], [field]: val };
    if (field === 'qty' || field === 'nominal') {
      row.total = (field === 'qty' ? Number(val) : row.qty) * (field === 'nominal' ? Number(val) : row.nominal);
    }
    updated[idx] = row;
    setItems(updated);
  };

  const addRow = () => setItems([...items, { no: items.length + 1, kategori: '', deskripsi: '', keterangan: '', qty: 1, nominal: 0, total: 0 }]);
  const removeRow = (idx: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: i + 1 }))); };

  // ─── Save Document GA ─────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Upload pending attachment files first
      const finalAttachments = [...attachments];
      for (let i = 0; i < finalAttachments.length; i++) {
        if (finalAttachments[i].file) {
          const formData = new FormData();
          formData.append('attachment', finalAttachments[i].file as File);
          const uploadRes = await api.post('/ga-documents/upload-attachment', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data.success) {
            finalAttachments[i].url = uploadRes.data.fileUrl;
            finalAttachments[i].name = uploadRes.data.fileName;
            delete finalAttachments[i].file;
          }
        }
      }
      setAttachments(finalAttachments);

      const documentData = {
        docNo, tanggal, namaProject, diajukanOleh, divisi, periodeYear,
        penerimaNama, penerimaBank, penerimaRekening, subtotal,
        biayaAdmin, pph, isPpnActive, ppn, dpp, biayaLainnya,
        grandTotal, items,
        attachments: finalAttachments,
        attachmentUrl: finalAttachments.length > 0 ? finalAttachments[0].url : '',
        attachmentName: finalAttachments.length > 0 ? finalAttachments[0].name : '',
        signatures: { sig1, sig2, sig3, sig4, sig5 },
      };
      const payload = { company: activeCompany, documentNo: docNo || `GA-${Date.now()}`, documentTitle: namaProject || docNo, documentData };
      const res = editingId
        ? await api.put(`/ga-documents/forms/${editingId}`, payload)
        : await api.post('/ga-documents/forms', payload);
      if (res.data.success) {
        setMessage({ type: 'success', text: editingId ? 'Dokumen GA berhasil diperbarui!' : 'Dokumen GA berhasil disimpan!' });
        if (res.data.data?.id) setEditingId(res.data.data.id);
        await new Promise(r => setTimeout(r, 300));
        await fetchHistory();
        setActiveTab('history');
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Gagal menyimpan.' });
    } finally { setSaving(false); }
  };

  // ─── High Precision PDF Export & Merging ──────────────────────────────
  const handlePrint = async (docTarget?: SavedGaDocument) => {
    if (docTarget) {
      handleEdit(docTarget);
      await new Promise((r) => setTimeout(r, 200));
    }

    setMessage({ type: 'success', text: '⚡ Sedang memproses dan mengunduh berkas PDF presisi ke komputer Anda...' });

    try {
      const dData = docTarget ? (docTarget.documentData || {}) : {};
      const comp = docTarget ? docTarget.company : activeCompany;
      const dNo = docTarget ? (dData.docNo || docTarget.documentNo) : docNo;
      const cleanName = (dNo || comp || 'Dokumen_GA').replace(/[^a-zA-Z0-9_-]/g, '_');

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
      const gaEl = document.getElementById('ga-printable-area');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let capturedSuccessfully = false;

      // Convert all <img> elements inside DOM to Base64 DataURLs before canvas rendering
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

      if (htmlToImage && gaEl) {
        try {
          await inlineAllImagesAsBase64(gaEl);
          const png1 = await htmlToImage.toPng(gaEl, { quality: 0.98, pixelRatio: 2, cacheBust: true });
          doc.addImage(png1, 'PNG', 0, 0, 210, 297);
          capturedSuccessfully = true;
        } catch (domCaptureErr) {
          console.warn('DOM capture warning, falling back to window.print():', domCaptureErr);
        }
      }

      // Load pdf-lib for merging attached PDF files / images (Halaman 2+)
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

          const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
          const mainPages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices());
          mainPages.forEach((p: any) => mergedPdf.addPage(p));

          for (let i = 0; i < targetAttachments.length; i++) {
            const att = targetAttachments[i];
            if (!att.url) continue;
            const fullUrl = att.url.startsWith('http') ? att.url : `${getBackendHostUrl()}${att.url}`;

            if (att.url.match(/\.pdf$/i)) {
              try {
                const attBytes = await fetch(fullUrl).then((res) => res.arrayBuffer());
                const attPdfDoc = await PDFDocument.load(attBytes);
                const attPages = await mergedPdf.copyPages(attPdfDoc, attPdfDoc.getPageIndices());
                attPages.forEach((p: any) => mergedPdf.addPage(p));
              } catch (e) {
                console.warn('Could not merge attached PDF:', e);
              }
            } else if (att.url.match(/\.(jpeg|jpg|png|webp)$/i)) {
              try {
                const imgBytes = await fetch(fullUrl).then((res) => res.arrayBuffer());
                let img;
                if (att.url.match(/\.png$/i)) {
                  img = await mergedPdf.embedPng(imgBytes);
                } else {
                  img = await mergedPdf.embedJpg(imgBytes);
                }
                const page = mergedPdf.addPage([595.28, 841.89]);
                const { width, height } = img.scaleToFit(550, 780);
                page.drawImage(img, {
                  x: (595.28 - width) / 2,
                  y: (841.89 - height) / 2,
                  width,
                  height,
                });
              } catch (e) {
                console.warn('Could not embed attached image:', e);
              }
            }
          }

          const mergedBytes = await mergedPdf.save();
          const blob = new Blob([mergedBytes], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Dokumen_GA_${cleanName}.pdf`;
          link.click();

          setMessage({ type: 'success', text: `✅ Berkas PDF Lengkap (Dokumen_GA_${cleanName}.pdf) BERHASIL TERUNDUH ke komputer Anda!` });
          return;
        } catch (mergeErr) {
          console.warn('PDF merging error, falling back to standard jsPDF save:', mergeErr);
        }
      }

      doc.save(`Dokumen_GA_${cleanName}.pdf`);
      setMessage({ type: 'success', text: `✅ Berkas PDF (Dokumen_GA_${cleanName}.pdf) BERHASIL TERUNDUH!` });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      window.print();
    }
  };

  // ─── Edit / Delete ────────────────────────────────────────────────────
  const handleEdit = (doc: SavedGaDocument) => {
    setEditingId(doc.id);
    setActiveCompany(doc.company.replace('GA-', '') as any);
    const d = doc.documentData;
    setDocNo(d.docNo || doc.documentNo || '');
    setTanggal(d.tanggal || '');
    setNamaProject(d.namaProject || '');
    setDiajukanOleh(d.diajukanOleh || '');
    setDivisi(d.divisi || 'GA');
    setPeriodeYear(d.periodeYear || new Date().getFullYear().toString());
    setPenerimaNama(d.penerimaNama || '');
    setPenerimaBank(d.penerimaBank || '');
    setPenerimaRekening(d.penerimaRekening || '');
    setBiayaAdmin(d.biayaAdmin || 0);
    setPph(d.pph || 0);
    setIsPpnActive(d.isPpnActive || false);
    setBiayaLainnya(d.biayaLainnya || 0);
    const sanitizedItems = (d.items || []).map((row: any, i: number) => ({
      no: row.no || i + 1,
      kategori: row.kategori || '',
      deskripsi: row.deskripsi || '',
      keterangan: row.keterangan || '',
      qty: row.qty ?? 1,
      nominal: row.nominal ?? 0,
      total: row.total ?? 0
    }));
    setItems(sanitizedItems.length > 0 ? sanitizedItems : [{ no: 1, kategori: '', deskripsi: '', keterangan: '', qty: 1, nominal: 0, total: 0 }]);


    const loadedAttachments = d.attachments || [];
    if (loadedAttachments.length === 0 && d.attachmentUrl) {
      loadedAttachments.push({ url: d.attachmentUrl, name: d.attachmentName || 'Lampiran GA' });
    }
    setAttachments(loadedAttachments);

    if (d.signatures) {
      setSig1(d.signatures.sig1 || sig1);
      setSig2(d.signatures.sig2 || sig2);
      setSig3(d.signatures.sig3 || sig3);
      setSig4(d.signatures.sig4 || sig4);
      setSig5(d.signatures.sig5 || sig5);
    }
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen GA ini?')) return;
    try {
      await api.delete(`/ga-documents/forms/${id}`);
      fetchHistory();
      setMessage({ type: 'success', text: 'Dokumen GA berhasil dihapus.' });
    } catch { alert('Gagal menghapus.'); }
  };

  const handleReset = () => {
    setEditingId(null); setDocNo(''); setTanggal(''); setNamaProject(''); setDiajukanOleh(''); setDivisi('GA'); setPeriodeYear(new Date().getFullYear().toString());
    setPenerimaNama(''); setPenerimaBank(''); setPenerimaRekening('');
    setBiayaAdmin(0); setPph(0); setIsPpnActive(false); setBiayaLainnya(0);
    setItems([{ no: 1, kategori: '', deskripsi: '', keterangan: '', qty: 1, nominal: 0, total: 0 }]);
    setAttachments([]);
    setSig1({ label: 'Signature of PIC/', subLabel: '报账人签名:', name: '', signatureUrl: '' });
    setSig2({ label: 'Approved by /', subLabel: '批准人:', name: '', signatureUrl: '' });
    setSig3({ label: 'Checked by /', subLabel: '审核人:', name: '', signatureUrl: '' });
    setSig4({ label: '', subLabel: '', name: '', signatureUrl: '' });
    setSig5({ label: 'Paid by /', subLabel: '付款人:', name: '', signatureUrl: '' });
    setMessage(null);
  };

  // ─── Access Guard ─────────────────────────────────────────────────────
  const userRole = user?.role;
  const canAccess = ['SUPERADMIN', 'HRD', 'GA', 'STAFF_GA'].includes(userRole || '') ||
    ['HRD', 'GA'].includes(user?.manager?.role || '');

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-1">Akses Ditolak</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Halaman ini hanya untuk <strong>HRD / GA / Staff GA</strong> dan <strong>Super Admin</strong>.
          </p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userRole === 'SUPERADMIN';
  const isGA = userRole === 'GA' || userRole === 'HRD' || userRole === 'STAFF_GA' || ['HRD', 'GA'].includes(user?.manager?.role || '');
  const isFinance = userRole === 'FINANCE' || user?.manager?.role === 'FINANCE';
  const isProyekAdmin = userRole === 'PROYEK_ADMIN' || userRole === 'ENGINEERING';
  const isManager = userRole === 'PROJECT_MANAGER' || userRole === 'SUPERVISOR';

  const checkSlotPermission = (slotNum: 1 | 2 | 3 | 4 | 5): { allowed: boolean; roleLabel: string } => {
    if (isSuperAdmin) return { allowed: true, roleLabel: 'SUPERADMIN' };
    if (slotNum === 1) return { allowed: isGA, roleLabel: 'GA / STAFF GA' };
    if (slotNum === 2) return { allowed: isManager, roleLabel: 'PROJECT MANAGER' };
    if (slotNum === 3) return { allowed: isFinance || isProyekAdmin, roleLabel: 'ADMIN / FINANCE' };
    if (slotNum === 4 || slotNum === 5) return { allowed: isFinance, roleLabel: 'FINANCE' };
    return { allowed: false, roleLabel: 'Akses Dibatasi' };
  };

  const getSlotNames = (slotNum: 1 | 2 | 3 | 4 | 5) => {
    let names: string[] = [];
    if (slotNum === 1) {
      names = systemUsers.filter(u => u.role === 'GA' || u.role === 'HRD' || u.role === 'STAFF_GA').map(u => u.name);
      if (names.length === 0) names = ['Dini', 'Staff GA', 'HRD Staff'];
    } else if (slotNum === 2) {
      names = systemUsers.filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN').map(u => u.name);
      if (names.length === 0) names = ['Edi Purwanto', 'Rachel', 'Supervisor'];
    } else if (slotNum === 3) {
      names = systemUsers.filter(u => u.role === 'FINANCE' || u.role === 'PROYEK_ADMIN' || u.role === 'ENGINEERING' || u.role === 'SUPERADMIN').map(u => u.name);
      if (names.length === 0) names = ['Edi', 'Nurdin', 'Lucas', 'Yunita', 'Dian'];
    } else if (slotNum === 4 || slotNum === 5) {
      names = systemUsers.filter(u => u.role === 'FINANCE' || u.role === 'SUPERADMIN').map(u => u.name);
      if (names.length === 0) names = ['Fitri', 'Rachel', 'Yunita', 'Dian'];
    }
    return Array.from(new Set(names)).sort();
  };

  // ─── Header colors & presets per company ─────────────────────────────
  const headerColor = activeCompany === 'MJK' ? '#e91e8c' : activeCompany === 'DJI' ? '#D9531E' : '#f59e0b';
  const companyName = activeCompany === 'MJK' ? 'PT MODERN JAYA KONSTRUKSI' :
    activeCompany === 'DJI' ? 'PT DELTA JAYA INDOTAMA' : 'PT INOVATIF RENOVALOGI INDONESIA';

  // Auto-reset form saat pindah tab perusahaan (kecuali sedang edit)
  useEffect(() => {
    if (editingId) return;
    setDocNo('');
    setTanggal('');
    setNamaProject('');
    setDiajukanOleh('');
    setDivisi('GA');
    setPeriodeYear(new Date().getFullYear().toString());
    setPenerimaNama('');
    setPenerimaBank('');
    setPenerimaRekening('');
    setBiayaAdmin(0);
    setPph(0);
    setIsPpnActive(false);
    setBiayaLainnya(0);
    setItems([{ no: 1, kategori: '', deskripsi: '', keterangan: '', qty: 1, nominal: 0, total: 0 }]);
    setAttachments([]);
    setSig1({ label: 'Signature of PIC/', subLabel: '报账人签名:', name: '', signatureUrl: '' });
    setSig2({ label: 'Approved by /', subLabel: '批准人:', name: '', signatureUrl: '' });
    setSig3({ label: 'Checked by /', subLabel: '审核人:', name: '', signatureUrl: '' });
    setSig4({ label: 'Checked by /', subLabel: '审核人:', name: '', signatureUrl: '' });
    setSig5({ label: 'Paid by /', subLabel: '付款人:', name: '', signatureUrl: '' });
    setMessage(null);
  }, [activeCompany]);

  const filteredHistory = savedDocs.filter(d =>
    (d.documentNo || '').toLowerCase().includes(searchHistory.toLowerCase()) ||
    (d.vendorName || '').toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #ga-printable-area, #ga-printable-area * { visibility: visible !important; }
          #ga-printable-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 8mm 12mm !important; box-shadow: none !important; background: white !important; color: black !important; box-sizing: border-box !important; font-size: 9pt !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-pink-600" />
            Formulir Payment Request GA
          </h1>
          <p className="text-xs text-slate-500 mt-1">Buat Payment Request divisi GA untuk MJK, DJI, dan IRI lengkap dengan Lampiran Excel/PDF/Foto.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'create' && (
            <>
              <button onClick={() => handlePrint()} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02]">
                <Printer className="h-4 w-4 text-sky-400" /> Cetak / Export PDF 🖨️
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
              </button>
              <button onClick={handleReset} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all" title="Reset">
                <RefreshCw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 no-print">
        {[
          { id: 'create', label: editingId ? 'Edit Dokumen GA' : 'Buat Dokumen GA', icon: Plus },
          { id: 'history', label: `Riwayat (${savedDocs.length})`, icon: History },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all cursor-pointer ${activeTab === tab.id ? 'border-pink-600 text-pink-600 dark:text-pink-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Message ── */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold no-print ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
          <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ════════ CREATE TAB ════════ */}
      {activeTab === 'create' && (
        <div className="space-y-5">
          {/* Company selector */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex gap-2 no-print">
            {(['MJK', 'DJI', 'IRI'] as const).map(co => (
              <button key={co} onClick={() => setActiveCompany(co)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCompany === co ? 'bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                <div className={`w-2 h-2 rounded-full ${co === 'MJK' ? 'bg-pink-500' : co === 'DJI' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                {co === 'MJK' ? 'MJK' : co === 'DJI' ? 'DJI' : 'IRI'}
              </button>
            ))}
          </div>

          {/* ── Form Inputs ── */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-5 no-print">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 border-b pb-3 border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-pink-500" /> Data Dokumen — {companyName}
            </h2>

            {/* Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Nomor Dokumen', val: docNo, set: setDocNo, ph: '020/PR-GA/MJK/VII/2026' },
                { label: 'Tanggal', val: tanggal, set: setTanggal, ph: 'Kamis, 30 Juli 2026' },
                { label: 'Nama Project', val: namaProject, set: setNamaProject, ph: 'HO / AFI-3 / ...' },
                { label: 'Periode Tahun', val: periodeYear, set: setPeriodeYear, ph: '2026' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{f.label}</label>
                  <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
                </div>
              ))}
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Diajukan Oleh</label>
                <input type="text" value={diajukanOleh} onChange={e => setDiajukanOleh(e.target.value)} placeholder="Nama pengaju"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Divisi</label>
                <input type="text" value={divisi} onChange={e => setDivisi(e.target.value)} placeholder="GA / HRD / ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
              </div>
            </div>

            {/* ── File Upload Section (Excel, PDF, Foto) ── */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
              <label className="block text-[11px] font-bold text-pink-600 dark:text-pink-400 mb-1">
                Upload Berkas Lampiran GA (Excel / PDF / Foto / Gambar)
              </label>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.pdf,.jpeg,.jpg,.png,.webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, name: f.name }))]);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs border border-pink-300 dark:border-pink-600 rounded-lg bg-pink-50/50 dark:bg-slate-900 dark:text-white"
              />
              <div className="mt-2 space-y-1.5">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {att.url ? (
                      <a href={`${getBackendHostUrl()}${att.url}`} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 font-bold underline truncate max-w-[80%] flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> 📎 {att.name || 'Lihat Lampiran GA'}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[80%] flex items-center gap-1.5">
                        📎 {att.name} <span className="text-[10px] text-pink-600 font-bold">(Siap diunggah saat simpan)</span>
                      </span>
                    )}
                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700 font-bold text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950">✕ Hapus</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Item Table Inputs */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Tabel Item</label>
                <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-xs font-bold cursor-pointer">
                  <PlusCircle className="h-3.5 w-3.5" /> Tambah Baris
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: headerColor }} className="text-white">
                      <th className="p-2 text-center w-8">No</th>
                      <th className="p-2 text-left w-28">Kategori</th>
                      <th className="p-2 text-left">Deskripsi/Item</th>
                      <th className="p-2 text-left w-28">Keterangan</th>
                      <th className="p-2 text-center w-14">Qty</th>
                      <th className="p-2 text-right w-28">Nominal (Rp)</th>
                      <th className="p-2 text-right w-28">Total (Rp)</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {items.map((row, i) => (
                      <tr key={i} className="bg-white dark:bg-slate-900">
                        <td className="p-1 text-center text-slate-400">{row.no}</td>
                        <td className="p-1"><input value={row.kategori || ''} onChange={e => handleItemChange(i, 'kategori', e.target.value)} placeholder="claim / material"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 dark:text-white text-xs" /></td>
                        <td className="p-1"><input value={row.deskripsi || ''} onChange={e => handleItemChange(i, 'deskripsi', e.target.value)} placeholder="Deskripsi item..."
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 dark:text-white text-xs" /></td>
                        <td className="p-1"><input value={row.keterangan || ''} onChange={e => handleItemChange(i, 'keterangan', e.target.value)} placeholder="Juli 2026"
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 dark:text-white text-xs" /></td>
                        <td className="p-1"><input type="number" value={row.qty ?? 0} onChange={e => handleItemChange(i, 'qty', Number(e.target.value))} min={0}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 dark:text-white text-xs text-center" /></td>
                        <td className="p-1"><input type="number" value={row.nominal ?? 0} onChange={e => handleItemChange(i, 'nominal', Number(e.target.value))} min={0}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 dark:text-white text-xs text-right" /></td>
                        <td className="p-1 text-right pr-3 font-semibold text-slate-700 dark:text-slate-300">{formatRp(row.total)}</td>

                        <td className="p-1 text-center">
                          <button onClick={() => removeRow(i)} className="text-rose-400 hover:text-rose-600 cursor-pointer"><MinusCircle className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial extras */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
              {[
                { label: 'Biaya Admin', val: biayaAdmin, set: setBiayaAdmin },
                { label: 'Pph', val: pph, set: setPph },
                { label: 'Biaya Lainnya', val: biayaLainnya, set: setBiayaLainnya },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{f.label} (Rp)</label>
                  <input type="number" value={f.val} onChange={e => f.set(Number(e.target.value))} min={0}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
                </div>
              ))}
            </div>

            {/* PPN Toggle */}
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <input
                type="checkbox"
                id="gaPpnToggle"
                checked={isPpnActive}
                onChange={(e) => setIsPpnActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="gaPpnToggle" className="text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                Aktifkan PPN 11% (DPP Nilai Lain)
              </label>
            </div>

            {/* Penerima */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Penerima</label>
                <input type="text" value={penerimaNama} onChange={e => setPenerimaNama(e.target.value)} placeholder="Defri Safrudin Arsjad"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Bank</label>
                <input type="text" value={penerimaBank} onChange={e => setPenerimaBank(e.target.value)} placeholder="BCA KCP Dasana Indah"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Rekening No</label>
                <input type="text" value={penerimaRekening} onChange={e => setPenerimaRekening(e.target.value)} placeholder="7611401471"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white" />
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Pengaturan Penanda Tangan PO GA ({activeCompany})
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Role: {userRole || 'GUEST'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { slotNum: 1 as const, data: sig1, setter: setSig1 },
                  { slotNum: 2 as const, data: sig2, setter: setSig2 },
                  { slotNum: 3 as const, data: sig3, setter: setSig3 },
                  { slotNum: 4 as const, data: sig4, setter: setSig4 },
                  { slotNum: 5 as const, data: sig5, setter: setSig5 },
                ].map(({ slotNum, data, setter }) => {
                  const perm = checkSlotPermission(slotNum);
                  const names = getSlotNames(slotNum);
                  return (
                    <div key={slotNum} className={`p-3 rounded-xl border ${perm.allowed ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-slate-100/60 dark:bg-slate-900/20 border-slate-200/60 opacity-70'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{data.label || `TTD ${slotNum}`}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${perm.allowed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>{perm.roleLabel}</span>
                      </div>
                      <select
                        value={data.name}
                        disabled={!perm.allowed}
                        onChange={(e) => setter({ ...data, name: e.target.value, signatureUrl: '' })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 dark:text-white font-bold cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Pilih Nama --</option>
                        {names.map((n, i) => <option key={i} value={n}>{n}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ════ PREVIEW ════ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between no-print">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pratinjau — Format A4</span>
              <button onClick={() => handlePrint()} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                <Printer className="h-4 w-4 text-sky-400" /> Cetak / Export PDF Presisi 🖨️
              </button>
            </div>
            <div className="bg-slate-300 dark:bg-slate-900 p-2 sm:p-8 rounded-2xl overflow-x-auto w-full flex md:justify-center justify-start max-w-full shadow-inner">
              <div
                id="ga-printable-area"
                className="bg-white text-[#000] w-[210mm] min-h-[297mm] shadow-2xl"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', padding: '8mm 12mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
              >
                {/* ── HEADER ── */}
                <div style={{ display: 'flex', alignItems: 'stretch', border: '2px solid #000', padding: '4px 6px', marginBottom: '8px' }}>
                  {/* Logo */}
                  <div style={{ width: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRight: '1px solid #000', paddingRight: '8px', marginRight: '8px' }}>
                    {activeCompany === 'DJI' ? (
                      <img src="/dji_logo.svg" alt="DJI Logo" style={{ height: '44px', objectFit: 'contain' }} />
                    ) : activeCompany === 'IRI' ? (
                      <img src="/iri_logo.svg" alt="IRI Logo" style={{ height: '44px', objectFit: 'contain' }} />
                    ) : (
                      <img src="/mjk_logo.png" alt="MJK Logo" style={{ height: '44px', objectFit: 'contain' }} />
                    )}
                  </div>
                  {/* Title Block */}
                  <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', letterSpacing: '1px' }}>PAYMENT REQUEST</div>
                    <div style={{ fontWeight: 'bold', fontSize: '10.5pt', letterSpacing: '0.5px', margin: '1px 0' }}>{companyName}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>PERIODE TAHUN {periodeYear || new Date().getFullYear()}</div>
                  </div>
                </div>

                {/* ── META + DOC NO ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', fontSize: '8.5pt' }}>
                  {/* Left Metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '95px' }}>Nomor</span>
                      <span>: {docNo || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '95px' }}>Tanggal</span>
                      <span>: {tanggal || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '95px' }}>Nama Project</span>
                      <span>: {namaProject || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '95px' }}>Diajukan oleh</span>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>: {diajukanOleh || '-'}</span>
                    </div>
                  </div>

                  {/* Right: Divisi : GA */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '8.5pt' }}>
                      <span>Divisi</span>
                      <span style={{ fontWeight: 'bold' }}>: {divisi || 'GA'}</span>
                    </div>
                  </div>
                </div>

                {/* ── ITEM TABLE ── */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginBottom: '0', border: '2px solid #000' }}>
                  <thead>
                    <tr style={{ backgroundColor: headerColor, color: activeCompany === 'DJI' ? 'black' : 'white' }}>
                      {['No', 'Kategori', 'Deskripsi/Item', 'Keterangan', 'Qty', 'Nominal', 'Total'].map(h => (
                        <th key={h} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: h === 'No' || h === 'Qty' ? 'center' : h === 'Nominal' || h === 'Total' ? 'right' : 'left', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fixed 5 rows minimum */}
                    {Array.from({ length: Math.max(items.length, 5) }).map((_, i) => {
                      const row = items[i];
                      return (
                        <tr key={i}>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', minHeight: '22px', height: '22px' }}>{row ? row.no : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{row ? row.kategori : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{row ? row.deskripsi : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{row ? row.keterangan : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{row ? row.qty : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{row ? formatRp(row.nominal) : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>{row ? formatRp(row.total) : ''}</td>
                        </tr>
                      );
                    })}

                    {/* Terbilang + Summary row */}
                    <tr>
                      <td colSpan={4} rowSpan={6} style={{ border: '1px solid #000', padding: '6px 8px', verticalAlign: 'middle' }}>
                        <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '9pt' }}>{terbilangText}</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8pt' }}>Subtotal</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontSize: '8pt' }}>{formatRp(subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8pt' }}>Biaya Admin</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontSize: '8pt' }}>{biayaAdmin > 0 ? formatRp(biayaAdmin) : ''}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8pt' }}>Pph</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontSize: '8pt' }}>{pph > 0 ? formatRp(pph) : ''}</td>
                    </tr>
                    {isPpnActive && (
                      <tr>
                        <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8pt' }}>Ppn (11%)</td>
                        <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontSize: '8pt' }}>{formatRp(ppn)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8pt' }}>Biaya Lainnya</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontSize: '8pt' }}>{biayaLainnya > 0 ? formatRp(biayaLainnya) : ''}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid #000', padding: '3px 6px', fontWeight: 'bold', fontSize: '8.5pt' }}>Total</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '8.5pt' }}>{formatRp(grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ── NOTICE ── */}
                <div style={{ fontSize: '7.5pt', fontStyle: 'italic', margin: '6px 0', color: '#333' }}>
                  <em>Please attach all original invoices and receipts when submitting this document for requesting Payment</em>
                </div>

                {/* ── PENERIMA ── */}
                {(penerimaNama || penerimaBank || penerimaRekening) && (
                  <div style={{ border: '2px solid #000', padding: '5px 8px', marginBottom: '8px', fontSize: '8pt' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Penerima</div>
                    {penerimaNama && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Nama</span><span style={{ marginRight: '4px' }}>:</span><span style={{ fontWeight: 'bold' }}>{penerimaNama}</span></div>}
                    {penerimaBank && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Bank</span><span style={{ marginRight: '4px' }}>:</span><span>{penerimaBank}</span></div>}
                    {penerimaRekening && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Rekening No</span><span style={{ marginRight: '4px' }}>:</span><span>{penerimaRekening}</span></div>}
                  </div>
                )}

                {/* ── SIGNATURES (4 COLUMNS LAYOUT: COMBINED CHECKED BY) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>

                  {/* Column 1: Signature of PIC */}
                  <div style={{ textAlign: 'center', fontSize: '8pt' }}>
                    <div style={{ marginBottom: '2px', fontWeight: '500' }}>{sig1.label || 'Signature of PIC/'}</div>
                    <div style={{ marginBottom: '4px', fontSize: '7.5pt', color: '#555' }}>{sig1.subLabel || '报账人签名:'}</div>
                    {sig1.signatureUrl ? (
                      <img src={`${getBackendHostUrl()}${sig1.signatureUrl}`} alt="ttd"
                        style={{ height: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ height: '45px' }} />
                    )}
                    <div style={{ paddingTop: '2px', fontWeight: 'bold', marginTop: '2px' }}>{sig1.name || 'DINI'}</div>
                  </div>

                  {/* Column 2: Approved by */}
                  <div style={{ textAlign: 'center', fontSize: '8pt' }}>
                    <div style={{ marginBottom: '2px', fontWeight: '500' }}>{sig2.label || 'Approved by /'}</div>
                    <div style={{ marginBottom: '4px', fontSize: '7.5pt', color: '#555' }}>{sig2.subLabel || '批准人:'}</div>
                    {sig2.signatureUrl ? (
                      <img src={`${getBackendHostUrl()}${sig2.signatureUrl}`} alt="ttd"
                        style={{ height: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ height: '45px' }} />
                    )}
                    <div style={{ paddingTop: '2px', fontWeight: 'bold', marginTop: '2px' }}>{sig2.name || 'LUCAS/ANSON'}</div>
                  </div>

                  {/* Column 3: Single Checked by Header with 2 Signatures (FITRI & DIAN side-by-side) */}
                  <div style={{ textAlign: 'center', fontSize: '8pt' }}>
                    <div style={{ marginBottom: '2px', fontWeight: '500' }}>{sig3.label || 'Checked by /'}</div>
                    <div style={{ marginBottom: '4px', fontSize: '7.5pt', color: '#555' }}>{sig3.subLabel || '审核人:'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'flex-end' }}>
                      {/* Sub-slot 1 (FITRI) */}
                      <div>
                        {sig3.signatureUrl ? (
                          <img src={`${getBackendHostUrl()}${sig3.signatureUrl}`} alt="ttd"
                            style={{ height: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: '45px' }} />
                        )}
                        <div style={{ paddingTop: '2px', fontWeight: 'bold', marginTop: '2px' }}>{sig3.name || 'FITRI'}</div>
                      </div>
                      {/* Sub-slot 2 (DIAN) */}
                      <div>
                        {sig4.signatureUrl ? (
                          <img src={`${getBackendHostUrl()}${sig4.signatureUrl}`} alt="ttd"
                            style={{ height: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ height: '45px' }} />
                        )}
                        <div style={{ paddingTop: '2px', fontWeight: 'bold', marginTop: '2px' }}>{sig4.name || 'DIAN'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 4: Paid by */}
                  <div style={{ textAlign: 'center', fontSize: '8pt' }}>
                    <div style={{ marginBottom: '2px', fontWeight: '500' }}>{sig5.label || 'Paid by /'}</div>
                    <div style={{ marginBottom: '4px', fontSize: '7.5pt', color: '#555' }}>{sig5.subLabel || '付款人:'}</div>
                    {sig5.signatureUrl ? (
                      <img src={`${getBackendHostUrl()}${sig5.signatureUrl}`} alt="ttd"
                        style={{ height: '45px', display: 'block', margin: '0 auto 4px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ height: '45px' }} />
                    )}
                    <div style={{ paddingTop: '2px', fontWeight: 'bold', marginTop: '2px' }}>{sig5.name || 'RACHEL'}</div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ HISTORY TAB ════════ */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-pink-500" /> Riwayat Payment Request GA
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input type="text" placeholder="Cari No Dokumen / Judul..." value={searchHistory} onChange={e => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white" />
            </div>
          </div>
          {loadingHistory ? (
            <div className="text-center py-12 text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-pink-500" />Memuat...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">Belum ada riwayat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Perusahaan</th>
                    <th className="p-3">No. Dokumen</th>
                    <th className="p-3">Project / Judul</th>
                    <th className="p-3">Lampiran</th>
                    <th className="p-3">Dibuat Oleh</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredHistory.map(doc => {
                    const attList = doc.documentData?.attachments || [];
                    if (attList.length === 0 && doc.documentData?.attachmentUrl) {
                      attList.push({ url: doc.documentData.attachmentUrl, name: doc.documentData.attachmentName || 'Lampiran' });
                    }
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${doc.company.includes('MJK') ? 'bg-pink-100 text-pink-800' : doc.company.includes('DJI') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                            {doc.company.replace('GA-', '')}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{doc.documentNo}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{doc.vendorName || '-'}</td>
                        <td className="p-3">
                          {attList.length > 0 ? (
                            <div className="space-y-1">
                              {attList.map((att: any, aIdx: number) => (
                                <a key={aIdx} href={`${getBackendHostUrl()}${att.url}`} target="_blank" rel="noreferrer" className="text-[11px] text-pink-600 font-bold underline block truncate max-w-[150px]">
                                  📎 {att.name || 'Berkas'}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{doc.createdBy?.name || '-'}</td>
                        <td className="p-3 text-slate-400">{new Date(doc.createdAt).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handlePrint(doc)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                              title="Cetak / Export PDF Presisi Dokumen Ini"
                            >
                              <Printer className="h-3.5 w-3.5 text-sky-400" />
                              Cetak PDF 🖨️
                            </button>
                            <button onClick={() => handleEdit(doc)} className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg dark:bg-sky-950 dark:text-sky-400" title="Edit / Lihat"><Edit className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(doc.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg dark:bg-rose-950 dark:text-rose-400" title="Hapus"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
