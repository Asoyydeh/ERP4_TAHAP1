'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import api, { getBackendHostUrl } from '@/lib/api';
import {
  CheckSquare,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Building2,
  PenTool,
  X,
  Printer,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface FormDoc {
  id: string;
  company: string;
  documentNo: string;
  poNo?: string | null;
  vendorName?: string | null;
  documentData: any;
  createdBy?: { id: string; name: string; role: string };
  createdAt: string;
}

interface SystemUser {
  id: string;
  name: string;
  role: string;
  manager?: { role?: string };
}

interface ExtendedFormDoc extends FormDoc {
  sourceModule?: 'PROCUREMENT' | 'GA' | 'PROYEK_ADMIN';
}

export default function PoSignaturesPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<ExtendedFormDoc[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'SIGNED'>('PENDING');
  const [activeTab, setActiveTab] = useState<'APPROVAL' | 'SUMMARY_PROJECT'>('APPROVAL');

  // Modal Sign State
  const [selectedDoc, setSelectedDoc] = useState<ExtendedFormDoc | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ExtendedFormDoc | null>(null);
  const [signing, setSavingSign] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(2);
  const [signerName, setSignerName] = useState('');
  const [availableSignatures, setAvailableSignatures] = useState<{ name: string; imageUrl: string }[]>([]);

  useEffect(() => {
    fetchDocs();
    fetchSignatures();
    fetchUsers();

    const handleDataChange = () => {
      fetchDocs();
    };

    window.addEventListener('app_data_changed', handleDataChange);
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('app_data_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'DATA_CHANGED') {
          fetchDocs();
        }
      };
    }

    return () => {
      window.removeEventListener('app_data_changed', handleDataChange);
      if (channel) channel.close();
    };
  }, []);

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
      } catch (e) {
        console.error('Error fetching system users:', e);
      }
    }
  };

  const getSlotNames = (s: number, sourceModule?: string) => {
    let names: string[] = [];
    const moduleType = sourceModule || selectedDoc?.sourceModule;

    if (moduleType === 'GA') {
      if (s === 1) {
        names = systemUsers.filter(u => u.role === 'GA' || u.role === 'STAFF' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Dini', 'Dian', 'GA Staff', 'Imah', 'Via'];
      } else if (s === 2) {
        names = systemUsers.filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Lucas', 'Anson', 'Edi Purwanto', 'Edi'];
      } else if (s === 3 || s === 4) {
        names = systemUsers.filter(u => u.role === 'FINANCE' || u.role === 'GA' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Fitri', 'Dian', 'Yunita', 'Rachel'];
      } else if (s === 5) {
        names = systemUsers.filter(u => u.role === 'FINANCE' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Rachel', 'Fitri', 'Kiki', 'Dian', 'Yunita', 'Finance Dept'];
      }
    } else if (moduleType === 'PROYEK_ADMIN') {
      if (s === 1) {
        names = systemUsers.filter(u => u.role === 'PROYEK_ADMIN' || u.role === 'ENGINEERING' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Arnis', 'Denny', 'Dhea', 'Lucas', 'Proyek Admin Staff'];
      } else if (s === 2 || s === 3) {
        names = systemUsers.filter(u => u.role === 'PROCUREMENT' || u.manager?.role === 'PROCUREMENT' || u.role === 'ENGINEERING').map(u => u.name);
        if (names.length === 0) names = ['Glori', 'Via', 'Imah', 'Salsa', 'Zein', 'Fanisa Ariesti', 'Fanisa', 'Procurement Dept'];
      } else if (s === 4) {
        names = systemUsers.filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Edi Purwanto', 'Edi', 'Joko', 'Lucas', 'Anson', 'Project Manager', 'Supervisor'];
      } else if (s === 5) {
        names = systemUsers.filter(u => u.role === 'FINANCE' || u.role === 'SUPERADMIN').map(u => u.name);
        if (names.length === 0) names = ['Rachel', 'Kiki', 'Fitri', 'Dian', 'Yunita', 'Finance Dept'];
      }
    } else {
      if (s === 2 || s === 3) {
        names = systemUsers
          .filter(u => u.role === 'PROCUREMENT' || u.manager?.role === 'PROCUREMENT')
          .map(u => u.name);
        if (names.length === 0) names = ['Glori', 'Via', 'Imah', 'Salsa', 'Zein', 'Fanisa Ariesti', 'Fanisa', 'Procurement Dept'];
      } else if (s === 4 || s === 5) {
        names = systemUsers
          .filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN')
          .map(u => u.name);
        if (names.length === 0) names = ['Edi Purwanto', 'Edi', 'Joko', 'Lucas', 'Dwi', 'Project Manager', 'Supervisor'];
      } else if (s === 6 || s === 7) {
        names = systemUsers
          .filter(u => u.role === 'FINANCE' || u.role === 'SUPERADMIN')
          .map(u => u.name);
        if (names.length === 0) names = ['Rachel', 'Fitri', 'Kiki', 'Dian', 'Yunita', 'Finance Dept'];
      }
    }

    const matchedDiskNames = availableSignatures
      .map(sig => sig.name)
      .filter(diskName => names.some(n => n.toLowerCase().trim() === diskName.toLowerCase().trim() || diskName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(diskName.toLowerCase())));

    return Array.from(new Set([...names, ...matchedDiskNames])).sort();
  };

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const allDocs: ExtendedFormDoc[] = [];

      // 1. PO PROCUREMENT & PO PROYEK ADMIN (from /company-documents/forms)
      try {
        const res1 = await api.get('/company-documents/forms');
        if (res1.data?.success) {
          const list = (res1.data.data || []).map((d: any) => ({
            ...d,
            sourceModule: d.documentData?.type === 'PROYEK_ADMIN' || d.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'
          }));
          allDocs.push(...list);
        }
      } catch (e) {
        console.warn('Company docs fetch warn:', e);
      }

      // 2. PO GA (from /ga-documents/forms)
      try {
        const res2 = await api.get('/ga-documents/forms');
        if (res2.data?.success) {
          const list = (res2.data.data || []).map((d: any) => ({ ...d, sourceModule: 'GA' as const }));
          allDocs.push(...list);
        }
      } catch (e) {
        console.warn('GA docs fetch warn:', e);
      }

      const uniqueDocs = allDocs.filter((doc, index, self) =>
        index === self.findIndex((t) => t.id === doc.id)
      );
      uniqueDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDocs(uniqueDocs);
    } catch (err) {
      console.error('Error fetching PO documents for signature:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatures = async () => {
    try {
      const res = await api.get('/company-documents/signatures');
      if (res.data?.success) {
        const list = res.data.data || res.data.signatures?.MJK || [];
        setAvailableSignatures(list);
      }
    } catch (err) {
      console.error('Error fetching signature list:', err);
    }
  };

  const getUserAllowedSlots = (role?: string, sourceModule?: string): number[] => {
    const r = role || '';
    if (r === 'SUPERADMIN') return [1, 2, 3, 4, 5, 6, 7];
    const moduleType = sourceModule || selectedDoc?.sourceModule;

    if (moduleType === 'PROYEK_ADMIN') {
      if (r === 'PROYEK_ADMIN' || r === 'ENGINEERING') return [1, 3];
      if (r === 'PROCUREMENT') return [2, 3];
      if (r === 'SUPERVISOR' || r === 'PROJECT_MANAGER') return [4];
      if (r === 'FINANCE') return [5];
      return [1, 2, 3, 4, 5];
    }

    if (moduleType === 'GA') {
      if (r === 'GA' || r === 'STAFF_GA') return [1, 3, 4];
      if (r === 'SUPERVISOR' || r === 'PROJECT_MANAGER' || r === 'HRD') return [2];
      if (r === 'FINANCE') return [5];
      return [1, 2, 3, 4, 5];
    }

    if (r === 'PROCUREMENT') return [2, 3];
    if (r === 'PROYEK_ADMIN' || r === 'ENGINEERING') return [];
    if (r === 'SUPERVISOR' || r === 'PROJECT_MANAGER') return [4, 5];
    if (r === 'FINANCE') return [6, 7];
    if (r === 'GA' || r === 'HRD' || r === 'STAFF_GA') return [1, 2, 3, 4, 5];
    return [1, 2, 3, 4, 5, 6, 7];
  };

  const isSlotPendingForUser = (doc: FormDoc): boolean => {
    const data = doc.documentData || {};
    const sigs = data.signatures || {};

    const moduleType = (doc as any).sourceModule ||
      (doc.company?.startsWith('GA') ? 'GA' :
       (data.type === 'PROYEK_ADMIN' || doc.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'));

    let slotsToCheck: number[] = [2, 3, 4, 5, 6, 7];
    if (moduleType === 'GA' || doc.company?.startsWith('GA')) {
      slotsToCheck = [1, 2, 3, 4, 5];
    } else if (moduleType === 'PROYEK_ADMIN') {
      slotsToCheck = [1, 2, 3, 4];
    }

    // Suatu dokumen berstatus Pending TTD jika terdapat minimal 1 slot TTD relevan yang belum diisi (kosong)
    for (const s of slotsToCheck) {
      const slotData = sigs[`sig${s}`];
      if (!slotData || !slotData.name || slotData.name.trim() === '') {
        return true;
      }
    }
    return false;
  };

  const handleOpenSignModal = (doc: ExtendedFormDoc) => {
    setSelectedDoc(doc);
    const docModule = doc.sourceModule ||
      (doc.company?.startsWith('GA') ? 'GA' :
       (doc.documentData?.type === 'PROYEK_ADMIN' || doc.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'));

    const allowedSlots = getUserAllowedSlots(user?.role, docModule);
    const defaultInitial = docModule === 'PROYEK_ADMIN' ? 1 : (docModule === 'GA' ? 1 : 2);
    const initialSlot = allowedSlots[0] || defaultInitial;
    setSelectedSlot(initialSlot);

    const names = getSlotNames(initialSlot, docModule);
    const matchedUser = names.find(n => n.toLowerCase() === (user?.name || '').toLowerCase());
    setSignerName(matchedUser || names[0] || user?.name || '');
  };

  const handleSaveSignature = async () => {
    if (!selectedDoc) return;
    if (!signerName) {
      alert('Pilih nama penanda tangan terlebih dahulu!');
      return;
    }

    try {
      setSavingSign(true);
      const data = { ...selectedDoc.documentData };
      if (!data.signatures) data.signatures = {};

      const slotKey = `sig${selectedSlot}`;
      const currentSlot = data.signatures[slotKey] || {};

      const matchedSig = availableSignatures.find(s =>
        s.name.toLowerCase() === signerName.toLowerCase() ||
        s.name.toLowerCase().includes(signerName.toLowerCase()) ||
        signerName.toLowerCase().includes(s.name.toLowerCase())
      );

      data.signatures[slotKey] = {
        ...currentSlot,
        name: signerName || user?.name || 'Tanda Tangan',
        signatureUrl: matchedSig?.imageUrl || '',
        signedAt: new Date().toISOString(),
      };

      const payload = {
        company: selectedDoc.company,
        documentNo: selectedDoc.documentNo,
        poNo: selectedDoc.poNo,
        vendorName: selectedDoc.vendorName,
        documentData: data,
      };

      let endpoint = `/company-documents/forms/${selectedDoc.id}`;
      if (selectedDoc.sourceModule === 'GA') {
        endpoint = `/ga-documents/forms/${selectedDoc.id}`;
      } else if (selectedDoc.sourceModule === 'PROYEK_ADMIN') {
        endpoint = `/company-documents/forms/${selectedDoc.id}`;
      }

      const res = await api.put(endpoint, payload);
      if (res.data.success) {
        alert('Tanda tangan berhasil dibubuhkan pada dokumen PO!');
        setSelectedDoc(null);
        fetchDocs();
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Gagal menyimpan tanda tangan.');
    } finally {
      setSavingSign(false);
    }
  };

  const handleExportPdf = async (targetDoc: ExtendedFormDoc) => {
    if (typeof window === 'undefined' || !targetDoc) return;

    try {
      const dData = targetDoc.documentData || {};
      const comp = targetDoc.company || 'MJK';
      const dNo = dData.docNo || targetDoc.documentNo || comp;
      const cleanName = (dNo || 'Dokumen_PO').replace(/[^a-zA-Z0-9_-]/g, '_');

      // Resolve attachments
      let targetAttachments: any[] = dData.attachments || [];
      if (!targetAttachments || targetAttachments.length === 0) {
        const singleUrl = dData.attachmentUrl;
        const singleName = dData.attachmentName;
        if (singleUrl) {
          targetAttachments = [{ url: singleUrl, name: singleName || 'Lampiran' }];
        }
      }

      // Load html-to-image library
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

      const inlineAllImagesAsBase64 = async (container: HTMLElement) => {
        const images = Array.from(container.querySelectorAll('img'));
        for (const img of images) {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:')) continue;

          let fullUrl = src;
          if (!src.startsWith('http')) {
            if (src.startsWith('/signatures-assets') || src.startsWith('/storage') || src.includes('/uploads') || src.startsWith('/proyekadmin-signatures-assets')) {
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
          console.warn('DOM capture warning:', domCaptureErr);
        }
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
            }
          }

          // Save final combined PDF and trigger direct download
          const mergedBytes = await mergedPdf.save();
          const blob = new Blob([mergedBytes], { type: 'application/pdf' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `Dokumen_PO_${cleanName}.pdf`;
          link.click();
          return;
        } catch (mergeErr) {
          console.warn('PDF merging error, falling back to standard jsPDF save:', mergeErr);
        }
      }

      doc.save(`Dokumen_PO_${cleanName}.pdf`);
    } catch (err) {
      console.error('Export PDF error, fallback to print:', err);
      window.print();
    }
  };

  const getProjectSummaries = () => {
    const map = new Map<string, { kodeProyek: string; count: number; subtotal: number; ppn: number; grandTotal: number }>();

    docs.forEach((doc) => {
      const dData = doc.documentData || {};
      const kode = (dData.kodeProyek || dData.kategori || dData.projectCode || 'LAINNYA').toUpperCase().trim();
      const items = dData.items || [];
      const itemSubtotal = items.reduce((acc: number, it: any) => acc + Number(it.amount || 0), 0);
      const subtotal = dData.subtotal ? Number(dData.subtotal) : itemSubtotal;
      const isPpn = dData.isPPN !== false && dData.isPpn !== false && dData.isPPN !== 'false';
      const ppn = dData.ppn !== undefined && dData.ppn !== null && dData.ppn !== ''
        ? Number(dData.ppn)
        : (isPpn ? Math.round(subtotal * 0.11) : 0);
      const grandTotal = dData.grandTotal ? Number(dData.grandTotal) : subtotal + ppn;

      if (!map.has(kode)) {
        map.set(kode, { kodeProyek: kode, count: 0, subtotal: 0, ppn: 0, grandTotal: 0 });
      }
      const curr = map.get(kode)!;
      curr.count += 1;
      curr.subtotal += subtotal;
      curr.ppn += ppn;
      curr.grandTotal += grandTotal;
    });

    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  };

  const filteredDocs = docs.filter((doc) => {
    const data = doc.documentData || {};
    const items = data.items || [];
    const attachments = data.attachments || [];

    const kodeProyek = data.kodeProyek || data.kategori || '';
    const attName = (data.attachmentName || '') + ' ' + attachments.map((a: any) => a.name || '').join(' ');

    const s = search.toLowerCase();

    const matchSearch =
      doc.documentNo.toLowerCase().includes(s) ||
      (doc.poNo && doc.poNo.toLowerCase().includes(s)) ||
      (doc.vendorName && doc.vendorName.toLowerCase().includes(s)) ||
      kodeProyek.toLowerCase().includes(s) ||
      attName.toLowerCase().includes(s);

    const docCo = (doc.company || '').replace('GA-', '');
    const matchCompany =
      filterCompany === 'ALL' ||
      doc.company === filterCompany ||
      docCo === filterCompany ||
      (filterCompany === 'MJK' && (docCo === 'MJI' || docCo === 'MJK')) ||
      (filterCompany === 'MJI' && (docCo === 'MJI' || docCo === 'MJK'));

    const pending = isSlotPendingForUser(doc);
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PENDING' && pending) ||
      (filterStatus === 'SIGNED' && !pending);

    const docModule = (doc as any).sourceModule ||
      (doc.company?.startsWith('GA') ? 'GA' :
       (data.type === 'PROYEK_ADMIN' || doc.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'));

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const allowedSlotsForDoc = getUserAllowedSlots(user?.role, docModule);
    const hasRoleAccess = isSuperAdmin || allowedSlotsForDoc.length > 0;

    if (!hasRoleAccess) {
      return false;
    }

    return matchSearch && matchCompany && matchStatus;
  });

  const isSuperAdmin = user?.role === 'SUPERADMIN';

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckSquare className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              Persetujuan & Tanda Tangan PO
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar seluruh dokumen PO (Procurement, GA, Proyek Admin) terintegrasi realtime untuk verifikasi dan pratinjau.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
            Role: <span className="text-emerald-600 dark:text-emerald-400">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-4">
        <button
          onClick={() => setActiveTab('APPROVAL')}
          className={`pb-3 text-xs md:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'APPROVAL'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <CheckSquare className="h-4 w-4" />
          Persetujuan &amp; Tanda Tangan PO
        </button>
        <button
          onClick={() => setActiveTab('SUMMARY_PROJECT')}
          className={`pb-3 text-xs md:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'SUMMARY_PROJECT'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Total PO Per Kode Proyek
        </button>
      </div>

      {/* TAB 1: PERSETUJUAN & TTD PO */}
      {activeTab === 'APPROVAL' && (
        <div className="space-y-6">
          {/* Controls & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari No Dokumen / PO / Vendor..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
              >
                <option value="ALL">Semua Perusahaan</option>
                <option value="MJK">PT. MJK</option>
                <option value="DJI">PT. DJI</option>
                <option value="IRI">PT. IRI</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
              >
                ⏳ Perlu TTD
              </button>
              <button
                onClick={() => setFilterStatus('SIGNED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'SIGNED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
              >
                ✅ Sudah Selesai
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'ALL'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                  }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Document Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-sm text-slate-500 font-medium">Memuat daftar permohonan tanda tangan PO...</span>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Tidak Ada Dokumen PO Membutuhkan Tanda Tangan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Seluruh dokumen PO sesuai kriteria filter saat ini sudah selesai disetujui atau belum tersedia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const pending = isSlotPendingForUser(doc);
                const data = doc.documentData || {};
                const items = data.items || [];

                return (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${doc.company === 'MJK' || doc.company === 'MJI'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : doc.company === 'DJI'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                            {doc.company === 'MJI' ? 'PT. MJK' : `PT. ${doc.company}`}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                            data.isPpnActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                          }`}>
                            {data.isPpnActive ? '🟢 PPN' : '⚪ NON-PPN'}
                          </span>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 ${pending
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                          {pending ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                          {pending ? 'Butuh TTD' : 'Sudah Selesai'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 block mb-0.5 uppercase tracking-wide">
                          Kode Proyek: {data.kodeProyek || data.kategori || 'Tanpa Kode Proyek'}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                          {doc.poNo || doc.documentNo}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          No. Dokumen: {doc.documentNo}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-bold truncate">
                          🏢 {doc.vendorName || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          📦 {items.length} Item Barang / Jasa
                        </div>
                        <div className="text-xs text-slate-500">
                          👤 Dibuat oleh: <span className="font-bold text-slate-700 dark:text-slate-200">{doc.createdBy?.name || 'Staff'}</span>
                        </div>
                        {data.attachmentUrl && (
                          <a
                            href={`${getBackendHostUrl()}${data.attachmentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1"
                          >
                            📎 Berkas: {data.attachmentName || 'Unduh Berkas'}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      {getUserAllowedSlots(user?.role).length > 0 ? (
                        <>
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Pratinjau
                          </button>
                          <button
                            onClick={() => handleOpenSignModal(doc)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm"
                          >
                            <PenTool className="h-3.5 w-3.5" />
                            Beri Tanda Tangan
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Pratinjau Dokumen &amp; Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TOTAL PO PER KODE PROYEK */}
      {activeTab === 'SUMMARY_PROJECT' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kode Proyek</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{getProjectSummaries().length} Proyek</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dokumen PO</span>
              <h3 className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">{docs.length} Dokumen</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accumulation (Grand Total)</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                Rp {getProjectSummaries().reduce((sum, item) => sum + item.grandTotal, 0).toLocaleString('id-ID')}
              </h3>
            </div>
          </div>

          {/* Table Report */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Rekapitulasi Total Nilai PO Per Kode Proyek
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">NO</th>
                    <th className="py-3 px-4">KODE PROYEK / KATEGORI</th>
                    <th className="py-3 px-4 text-center">JUMLAH PO</th>
                    <th className="py-3 px-4 text-right">SUBTOTAL (RP)</th>
                    <th className="py-3 px-4 text-right">PPN 11% (RP)</th>
                    <th className="py-3 px-4 text-right">GRAND TOTAL (RP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {getProjectSummaries().map((proj, idx) => (
                    <tr key={proj.kodeProyek} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 font-medium">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-extrabold text-sky-600 dark:text-sky-400">{proj.kodeProyek}</td>
                      <td className="py-3 px-4 text-center font-bold">{proj.count} Dokumen</td>
                      <td className="py-3 px-4 text-right font-mono">Rp {proj.subtotal.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">Rp {proj.ppn.toLocaleString('id-ID')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                        Rp {proj.grandTotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-900 font-extrabold text-xs">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-4 text-right uppercase">TOTAL KESELURUHAN:</td>
                    <td className="py-3.5 px-4 text-center">{docs.length} Dokumen</td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      Rp {getProjectSummaries().reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      Rp {getProjectSummaries().reduce((sum, item) => sum + item.ppn, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 dark:text-emerald-300">
                      Rp {getProjectSummaries().reduce((sum, item) => sum + item.grandTotal, 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-100 dark:border-slate-800 space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Pratinjau Hasil Lembar Dokumen PO ({previewDoc.company})
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{previewDoc.documentNo}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPdf(previewDoc)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  <Printer className="h-3.5 w-3.5 text-sky-400" />
                  Cetak / Export PDF 🖨️
                </button>
                <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div><span className="text-slate-500 block text-[10px]">Nomor PO:</span><span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{previewDoc.poNo || '-'}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Vendor:</span><span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.vendorName || '-'}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Kode Proyek:</span><span className="font-bold text-sky-600 dark:text-sky-400">{previewDoc.documentData?.kodeProyek || previewDoc.documentData?.kategori || '-'}</span></div>
                <div><span className="text-slate-500 block text-[10px]">Tanggal:</span><span className="font-bold text-slate-800 dark:text-slate-200">{new Date(previewDoc.createdAt).toLocaleDateString('id-ID')}</span></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Status Tanda Tangan Hak Akses:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
                  {[
                    { key: 'sig2', label: 'Dibuat (1)' },
                    { key: 'sig3', label: 'Dibuat (2)' },
                    { key: 'sig4', label: 'Disetujui (1)' },
                    { key: 'sig5', label: 'Disetujui (2)' },
                    { key: 'sig6', label: 'Diperiksa' },
                    { key: 'sig7', label: 'Dibayarkan' },
                  ].map(({ key, label }) => {
                    const sigInfo = (previewDoc.documentData?.signatures || {})[key];
                    const isSigned = !!sigInfo?.name;
                    return (
                      <div key={key} className={`p-2 rounded-lg border ${isSigned
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-800 dark:text-amber-300'
                        }`}>
                        <div className="font-bold mb-1">{label}</div>
                        <div className="font-extrabold truncate">{isSigned ? sigInfo.name : 'Belum TTD'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LAMPIRAN BERKAS (PDF / EXCEL / FOTO) */}
              {(() => {
                const dData = previewDoc.documentData || {};
                const attList = dData.attachments && dData.attachments.length > 0
                  ? dData.attachments
                  : dData.attachmentUrl
                    ? [{ url: dData.attachmentUrl, name: dData.attachmentName || 'Berkas Lampiran PO' }]
                    : [];

                if (attList.length === 0) return null;

                return (
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      📎 Berkas Lampiran PO (PDF / Foto / Excel):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attList.map((att: any, idx: number) => {
                        if (!att?.url) return null;
                        const fullUrl = att.url.startsWith('http') ? att.url : `${getBackendHostUrl()}${att.url}`;
                        const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url);
                        const isPdf = /\.pdf$/i.test(att.url);

                        return (
                          <div key={idx} className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs text-xs">
                            {isImg && <img src={fullUrl} alt={att.name || 'Lampiran'} className="h-10 w-10 object-cover rounded-lg border" />}
                            {isPdf && <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg font-extrabold text-[10px]">PDF</div>}
                            {!isImg && !isPdf && <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-lg font-extrabold text-[10px]">FILE</div>}

                            <div className="max-w-[200px] truncate">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{att.name || 'Berkas PO'}</span>
                            </div>

                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 ml-auto transition-all"
                            >
                              <Eye className="w-3 h-3" /> Buka Berkas
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* LIVE FULL A4 DOCUMENT PREVIEW SHEET */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
                    📄 Lembar Hasil Dokumen PO (A4 Presisi):
                  </span>
                </div>

                <div className="bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 rounded-xl overflow-x-auto flex justify-center border border-slate-300 dark:border-slate-800">
                  {(() => {
                    const dData = previewDoc.documentData || {};
                    const sigs = dData.signatures || {};
                    const sig2 = sigs.sig2 || {};
                    const sig3 = sigs.sig3 || {};
                    const sig4 = sigs.sig4 || {};
                    const sig5 = sigs.sig5 || {};
                    const sig6 = sigs.sig6 || {};
                    const sig7 = sigs.sig7 || {};

                    const items: any[] = dData.items || [];
                    const subtotal = Number(dData.subtotal || 0);
                    const diskon = Number(dData.diskon || 0);
                    const dpp = Number(dData.dpp || 0);
                    const ppn = Number(dData.ppn || 0);
                    const isPpnActive = dData.isPpnActive ?? true;
                    const hasDp = dData.hasDp ?? false;
                    const dpPercent = Number(dData.dpPercent || 0);
                    const dpAmount = Number(dData.dpAmount || 0);
                    const grandTotal = Number(dData.grandTotal || subtotal);
                    const finalTotalToPay = Number(dData.finalTotalToPay || grandTotal);
                    const currentTerbilangText = dData.terbilang || '-';

                    const poNo = dData.poNo || previewDoc.poNo || previewDoc.documentNo;
                    const docNo = previewDoc.documentNo;
                    const tanggal = dData.tanggal || new Date(previewDoc.createdAt).toLocaleDateString('id-ID');
                    const kodeProyek = dData.kodeProyek || dData.kategori || '-';
                    const pemesan = dData.pemesan || dData.createdBy || '-';
                    const noInvoice = dData.noInvoice || '-';
                    const vendorName = previewDoc.vendorName || dData.vendorName || '-';
                    const vendorAddress = dData.vendorAddress || '-';
                    const vendorPhone = dData.vendorPhone || '-';
                    const namaPelanggan = dData.namaPelanggan || 'PT. DELTA JAYA INDOTAMA';
                    const npwpPelanggan = dData.npwpPelanggan || '-';
                    const pembayaranKe = dData.pembayaranKe || dData.payToName || '-';

                    const formatRupiah = (val: number) => Number(val || 0).toLocaleString('id-ID');

                    // Determine exact company matching MJK, DJI, IRI
                    const compCode = (previewDoc.company || previewDoc.documentNo || '').toUpperCase();
                    const activeCompany = compCode.includes('DJI') ? 'DJI' : compCode.includes('IRI') ? 'IRI' : 'MJK';

                    const renderSigSlot = (sigInfo: any) => {
                      if (!sigInfo || !sigInfo.name) {
                        return (
                          <div className="flex flex-col items-center justify-between h-20 w-full">
                            <div className="h-12 flex items-center justify-center text-slate-300"></div>
                            <div className="w-full border-t border-slate-300 pt-0.5 text-center text-slate-300 font-normal">-</div>
                          </div>
                        );
                      }

                      let sigUrl = sigInfo.signatureUrl || '';
                      if (!sigUrl) {
                        const matched = availableSignatures.find(
                          s => s.name.toLowerCase().trim() === sigInfo.name.toLowerCase().trim() ||
                            s.name.toLowerCase().includes(sigInfo.name.toLowerCase()) ||
                            sigInfo.name.toLowerCase().includes(s.name.toLowerCase())
                        );
                        if (matched) sigUrl = matched.imageUrl;
                      }

                      const cleanSigUrl = sigUrl ? (sigUrl.startsWith('/') ? sigUrl : `/${sigUrl}`) : '';
                      const fullSigUrl = cleanSigUrl
                        ? (cleanSigUrl.startsWith('http') ? cleanSigUrl : `${getBackendHostUrl()}${cleanSigUrl}`)
                        : null;

                      return (
                        <div className="flex flex-col items-center justify-between h-20 w-full">
                          <div className="h-12 flex items-center justify-center w-full relative">
                            {fullSigUrl ? (
                              <img
                                src={fullSigUrl}
                                alt={sigInfo.name}
                                className="h-10 w-auto object-contain max-h-10 mx-auto"
                                onError={(e) => {
                                  const target = e.target as HTMLElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.sig-fallback-text')) {
                                    const textSpan = document.createElement('span');
                                    textSpan.className = 'sig-fallback-text font-serif italic font-bold text-emerald-800 text-sm tracking-wider';
                                    textSpan.innerText = sigInfo.name;
                                    parent.appendChild(textSpan);
                                  }
                                }}
                              />
                            ) : (
                              <span className="font-serif italic font-bold text-emerald-800 text-sm tracking-wider">
                                {sigInfo.name}
                              </span>
                            )}
                          </div>
                          <div className="w-full border-t border-black pt-0.5 text-center font-extrabold text-slate-900 truncate">
                            {sigInfo.name}
                          </div>
                        </div>
                      );
                    };

                    const renderSignaturesSection = () => {
                      if (previewDoc.sourceModule === 'GA') {
                        const sig1 = sigs.sig1 || sigs.sig1_pic || {};
                        const sig2 = sigs.sig2 || sigs.sig2_approved || {};
                        const sig3 = sigs.sig3 || sigs.sig3_checked1 || {};
                        const sig4 = sigs.sig4 || sigs.sig4_checked2 || {};
                        const sig5 = sigs.sig5 || sigs.sig5_paid || {};
                        return (
                          <div className="pt-8 grid grid-cols-5 gap-2 text-center text-[10px] border-t-2 border-black mt-6">
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Signature of PIC /</div>
                              <div>{renderSigSlot(sig1)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Approved by /</div>
                              <div>{renderSigSlot(sig2)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Checked by /</div>
                              <div>{renderSigSlot(sig3)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Checked by /</div>
                              <div>{renderSigSlot(sig4)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Paid by /</div>
                              <div>{renderSigSlot(sig5)}</div>
                            </div>
                          </div>
                        );
                      }

                      if (previewDoc.sourceModule === 'PROYEK_ADMIN') {
                        const pSig1 = sigs.sig1 || sigs.preparedBy || {};
                        const pSig2 = sigs.sig2 || sigs.checkedBy1 || sigs.checkedBy || {};
                        const pSig3 = sigs.sig3 || sigs.checkedBy2 || {};
                        const pSig4 = sigs.sig4 || sigs.approvedBy || {};
                        const pSig5 = sigs.sig5 || sigs.paidBy || {};
                        return (
                          <div className="pt-8 grid grid-cols-5 gap-2 text-center text-[10px] border-t-2 border-black mt-6">
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Prepared By,</div>
                              <div>{renderSigSlot(pSig1)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Checked by /</div>
                              <div>{renderSigSlot(pSig2)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Checked by /</div>
                              <div>{renderSigSlot(pSig3)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Approved By,</div>
                              <div>{renderSigSlot(pSig4)}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold mb-1">Paid By,</div>
                              <div>{renderSigSlot(pSig5)}</div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="pt-8 grid grid-cols-4 gap-2 text-center text-[10px] border-t-2 border-black mt-6">
                          {/* Column 1: Dibuat oleh */}
                          <div className="space-y-1">
                            <div className="font-bold mb-1">Dibuat oleh</div>
                            <div className="grid grid-cols-2 gap-2">
                              {renderSigSlot(sig2)}
                              {renderSigSlot(sig3)}
                            </div>
                          </div>

                          {/* Column 2: Disetujui oleh */}
                          <div className="space-y-1">
                            <div className="font-bold mb-1">Disetujui oleh</div>
                            <div className="grid grid-cols-2 gap-2">
                              {renderSigSlot(sig4)}
                              {renderSigSlot(sig5)}
                            </div>
                          </div>

                          {/* Column 3: Diperiksa Oleh, */}
                          <div className="space-y-1">
                            <div className="font-bold mb-1">Diperiksa Oleh,</div>
                            <div>
                              {renderSigSlot(sig6)}
                            </div>
                          </div>

                          {/* Column 4: Dibayarkan Oleh, */}
                          <div className="space-y-1">
                            <div className="font-bold mb-1">Dibayarkan Oleh,</div>
                            <div>
                              {renderSigSlot(sig7)}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div id={`printable-doc-${previewDoc.id}`} className="flex flex-col items-center">
                        <div id="printable-po-document" className="flex flex-col items-center">
                          <style jsx global>{`
                          @media print {
                            @page {
                              size: A4 portrait;
                              margin: 0;
                            }
                            body {
                              background: white !important;
                              margin: 0 !important;
                              padding: 0 !important;
                            }
                            body * {
                              visibility: hidden !important;
                            }
                            #printable-po-document, #printable-po-document * {
                              visibility: visible !important;
                            }
                            #printable-po-document {
                              position: absolute !important;
                              left: 0 !important;
                              top: 0 !important;
                              width: 210mm !important;
                              margin: 0 !important;
                              padding: 0 !important;
                              background: white !important;
                            }
                            .printable-page-container {
                              page-break-after: always !important;
                              break-after: page !important;
                              page-break-inside: avoid !important;
                              break-inside: avoid !important;
                              box-shadow: none !important;
                              margin: 0 !important;
                              border: none !important;
                              border-radius: 0 !important;
                              width: 210mm !important;
                              height: 297mm !important;
                              max-height: 297mm !important;
                              box-sizing: border-box !important;
                              overflow: hidden !important;
                            }
                            .no-print {
                              display: none !important;
                            }
                            .print-only {
                              display: block !important;
                            }
                          }
                          @media screen {
                            .print-only {
                              display: none !important;
                            }
                          }
                        `}</style>

                          {/* HALAMAN 1: PURCHASE ORDER (PO) SHEET */}
                          <div
                            id="printable-page-1"
                            className="printable-page-container bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 shadow-xl rounded-sm font-sans text-xs relative flex flex-col justify-between"
                            style={{ color: '#000' }}
                          >
                            <div>
                              {/* TEMPLATE 1: MJK (PT. MODERN JAYA KONSTRUKSI) */}
                              {(activeCompany === 'MJK') && (
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
                                      <div className="bg-black text-white font-mono font-bold text-sm px-3 py-1">
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
                                      <div className="grid grid-cols-[100px_12px_1fr] items-start"><span className="font-bold">KODE PROYEK</span><span className="text-center">:</span><span>{kodeProyek}</span></div>
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
                                      {items.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                          <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                                          <td className="border border-black px-2 py-1.5">{row.item || row.deskripsi || '-'}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.qty || 1}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.unit || 'Lot'}</td>
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

                                  {renderSignaturesSection()}
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
                                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">KODE PROYEK</span><span className="text-center">:</span><span>{kodeProyek}</span></div>
                                      <div className="grid grid-cols-[110px_12px_1fr] items-start"><span className="font-semibold">TANGGAL</span><span className="text-center">:</span><span>{tanggal}</span></div>
                                    </div>

                                    <div className="col-span-6 space-y-1">
                                      <p className="font-bold text-xs uppercase mb-2">PELANGGAN</p>
                                      <div className="grid grid-cols-[130px_12px_1fr] items-start"><span className="font-semibold">NAMA PELANGGAN</span><span className="text-center">:</span><span>{namaPelanggan}</span></div>
                                      <div className="grid grid-cols-[130px_12px_1fr] items-start"><span className="font-semibold">NPWP</span><span className="text-center">:</span><span>{npwpPelanggan}</span></div>
                                      <div className="h-6 w-full mt-4 bg-[#D32F2F]"></div>
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
                                      {items.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                          <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                                          <td className="border border-black px-2 py-1.5">{row.item || row.deskripsi || '-'}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.qty || 1}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.unit || 'Lot'}</td>
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
                                            <td className="px-2 py-1 text-right border-r border-black uppercase">TAGIHAN (Rp)</td>
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

                                  {renderSignaturesSection()}
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
                                      <div className="h-6 w-32 ml-auto my-1 bg-[#E07A5F]"></div>
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
                                      <div className="grid grid-cols-[140px_12px_1fr] items-start"><span className="font-bold">KODE PROYEK 项目代码</span><span className="text-center">:</span><span>{kodeProyek}</span></div>
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

                                  {/* Items Table */}
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
                                      {items.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                          <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                                          <td className="border border-black px-2 py-1.5">{row.item || row.deskripsi || '-'}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.qty || 1}</td>
                                          <td className="border border-black px-2 py-1.5 text-center">{row.unit || 'Lot'}</td>
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
                                            <td className="px-2 py-1 font-semibold text-right border-r border-black">Subtotal 小计</td>
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
                                            <td className="px-2 py-1 text-right border-r border-black uppercase">Tagihan Total (Rp) 账单总额</td>
                                            <td className="px-2 py-1 text-right">Rp {formatRupiah(finalTotalToPay)}</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {renderSignaturesSection()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* HALAMAN 2: REKAPITULASI BOQ MATERIAL & PENAWARAN HARGA (FULL A4 STANDALONE PAGE) */}
                          <div
                            id="printable-page-2"
                            className="printable-page-container bg-white text-slate-900 w-[210mm] min-h-[297mm] p-8 shadow-xl rounded-sm font-sans text-xs relative flex flex-col justify-between mt-8 border-t-2 border-slate-200"
                            style={{ color: '#000' }}
                          >
                            <div className="space-y-4">
                              {/* Header Perusahaan di Page 2 */}
                              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={activeCompany === 'MJK' ? '/mjk_logo.png' : activeCompany === 'DJI' ? '/dji_logo.svg' : '/iri_logo.svg'}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                  />
                                  <div>
                                    <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none uppercase">
                                      {activeCompany === 'MJK' ? 'PT. MODERN JAYA KONSTRUKSI' : activeCompany === 'DJI' ? 'PT. DELTA JAYA INDOTAMA' : 'PT. INOVATIF RENOVALOGI INDONESIA'}
                                    </h2>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                                      DOCUMENT BOQ REKAPITULASI
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 inline-block mb-1">
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
                                    Kode Proyek: <span className="font-bold text-black">{kodeProyek}</span> | Tanggal: {tanggal}
                                  </p>
                                </div>
                                <div className="text-right text-[10px] font-mono text-slate-500">
                                  Vendor: <span className="font-bold text-slate-900">{vendorName}</span>
                                </div>
                              </div>

                              {/* Full Height BOQ Items Table */}
                              <table className="w-full border-collapse border border-black text-[11px] my-2">
                                <thead>
                                  <tr className="bg-slate-800 text-white font-extrabold uppercase text-center border-b border-black">
                                    <th className="border border-black px-2 py-2 w-10">NO</th>
                                    <th className="border border-black px-2 py-2 text-left">RINCIAN BOQ MATERIAL / SUBCON</th>
                                    <th className="border border-black px-2 py-2 w-16">QTY</th>
                                    <th className="border border-black px-2 py-2 w-16">SATUAN</th>
                                    <th className="border border-black px-2 py-2 text-right w-28">HARGA SATUAN</th>
                                    <th className="border border-black px-2 py-2 text-right w-32">TOTAL MATERIAL</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((row: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="border border-black px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                                      <td className="border border-black px-2 py-1.5 font-medium">{row.item || row.deskripsi || '-'}</td>
                                      <td className="border border-black px-2 py-1.5 text-center">{row.qty || 1}</td>
                                      <td className="border border-black px-2 py-1.5 text-center">{row.unit || 'PCS'}</td>
                                      <td className="border border-black px-2 py-1.5 text-right font-mono">{row.rate ? formatRupiah(row.rate) : ''}</td>
                                      <td className="border border-black px-2 py-1.5 text-right font-mono font-bold">{row.amount ? formatRupiah(row.amount) : ''}</td>
                                    </tr>
                                  ))}
                                  {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                                    <tr key={`empty-boq-${i}`}>
                                      <td className="border border-black px-2 py-2.5 text-center"></td>
                                      <td className="border border-black px-2 py-2.5"></td>
                                      <td className="border border-black px-2 py-2.5"></td>
                                      <td className="border border-black px-2 py-2.5"></td>
                                      <td className="border border-black px-2 py-2.5"></td>
                                      <td className="border border-black px-2 py-2.5"></td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="font-extrabold bg-emerald-50">
                                    <td colSpan={5} className="border border-black px-3 py-2.5 text-right uppercase text-xs">
                                      TOTAL HARGA MATERIAL BOQ
                                    </td>
                                    <td className="border border-black px-3 py-2.5 text-right font-mono text-xs text-emerald-800">
                                      Rp {formatRupiah(subtotal)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Page 2 Footer Note */}
                            <div className="pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Dokumen Rekapitulasi BOQ Resmi - PT. {activeCompany}</span>
                              <span>Halaman 2 Dari Dokumen PO Integrasi</span>
                            </div>
                          </div>

                          {/* HALAMAN 3+: SURAT JALAN & BERKAS LAMPIRAN TERHUBUNG (DIJADIKAN 1 UTUH) */}
                          {(() => {
                            const attList = dData.attachments && dData.attachments.length > 0
                              ? dData.attachments
                              : dData.attachmentUrl
                                ? [{ url: dData.attachmentUrl, name: dData.attachmentName || 'Berkas Lampiran PO' }]
                                : [];

                            return attList.map((att: any, idx: number) => {
                              if (!att.url && !att.file) return null;
                              const displayUrl = att.url
                                ? (att.url.startsWith('http') ? att.url : `${getBackendHostUrl()}${att.url}`)
                                : (att.file ? URL.createObjectURL(att.file) : '');
                              const isImage = (att.url && att.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) || (att.file && att.file.type.startsWith('image/'));
                              const isPdf = (att.url && att.url.match(/\.pdf$/i)) || (att.file && att.file.type === 'application/pdf');

                              return (
                                <div
                                  key={`print-att-${idx}`}
                                  id={`printable-page-${idx + 3}`}
                                  className="printable-page-container bg-white text-slate-900 w-[210mm] h-[297mm] p-6 shadow-xl rounded-sm font-sans text-xs relative flex flex-col justify-between mt-8 border-t-2 border-slate-300 space-y-3"
                                  style={{ color: '#000', boxSizing: 'border-box' }}
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
                                      <div className="bg-slate-900 text-white font-mono font-bold text-xs px-2 py-0.5 inline-block">
                                        {docNo}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 min-h-[350px] flex items-center justify-center">
                                    {isImage ? (
                                      <img
                                        src={displayUrl}
                                        alt={`Lampiran ${idx + 1}`}
                                        className="max-w-full h-auto max-h-[750px] object-contain rounded-lg shadow-sm mx-auto"
                                      />
                                    ) : (
                                      <div className="w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 my-2">
                                        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-extrabold text-3xl border border-sky-100">
                                          📄
                                        </div>
                                        <div className="space-y-1">
                                          <h4 className="font-extrabold text-base text-slate-800 tracking-wide">{att.name || 'Dokumen Surat Jalan & Lampiran'}</h4>
                                          <p className="text-xs text-slate-500 font-medium">Berkas PDF Terhubung & Terintegrasi Sistem</p>
                                          <p className="text-[11px] text-slate-400 font-mono mt-1">Kode PO: {docNo}</p>
                                        </div>
                                        {displayUrl && (
                                          <a
                                            href={displayUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 mt-2 cursor-pointer no-print"
                                          >
                                            <span>🔗 Buka / Unduh Berkas PDF Utuh</span>
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-4 border-t border-slate-300 flex justify-between text-[10px] text-slate-500 font-mono">
                                    <span>Lampiran Dokumen Resmi - PT. {activeCompany}</span>
                                    <span>Halaman {idx + 3} Dari Dokumen PO Integrasi</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t dark:border-slate-800 gap-2">
              <button
                onClick={() => handleExportPdf(previewDoc)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-sky-400" />
                Cetak / Export PDF 🖨️
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Tutup
              </button>
              <button
                onClick={() => { setPreviewDoc(null); handleOpenSignModal(previewDoc); }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1.5 shadow-sm"
              >
                <PenTool className="h-3.5 w-3.5" />
                Lanjut Beri Tanda Tangan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-emerald-600" />
                  Pembubuhan Tanda Tangan PO
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedDoc.documentNo}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Slot Tanda Tangan
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => {
                    const newSlot = Number(e.target.value);
                    setSelectedSlot(newSlot);
                    const docModule = selectedDoc.sourceModule ||
                      (selectedDoc.company?.startsWith('GA') ? 'GA' :
                       (selectedDoc.documentData?.type === 'PROYEK_ADMIN' || selectedDoc.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'));
                    const names = getSlotNames(newSlot, docModule);
                    const matchedUser = names.find(n => n.toLowerCase() === (user?.name || '').toLowerCase());
                    setSignerName(matchedUser || names[0] || user?.name || '');
                  }}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:text-white font-bold cursor-pointer"
                >
                  {(() => {
                    const docModule = selectedDoc.sourceModule ||
                      (selectedDoc.company?.startsWith('GA') ? 'GA' :
                       (selectedDoc.documentData?.type === 'PROYEK_ADMIN' || selectedDoc.documentNo?.includes('PR/') ? 'PROYEK_ADMIN' : 'PROCUREMENT'));
                    const allowed = getUserAllowedSlots(user?.role, docModule);

                    if (docModule === 'PROYEK_ADMIN') {
                      return (
                        <>
                          {allowed.includes(1) && <option value={1}>Slot 1: Prepared By / Dibuat Oleh - Proyek Admin</option>}
                          {allowed.includes(2) && <option value={2}>Slot 2: Checked By (1) / DiCek Oleh - Procurement</option>}
                          {allowed.includes(3) && <option value={3}>Slot 3: Checked By (2) / DiCek Oleh - Procurement</option>}
                          {allowed.includes(4) && <option value={4}>Slot 4: Approved By / Disetujui Oleh - PM / SPV</option>}
                          {allowed.includes(5) && <option value={5}>Slot 5: Paid By / Dibayarkan Oleh - Finance</option>}
                        </>
                      );
                    }

                    if (docModule === 'GA') {
                      return (
                        <>
                          {allowed.includes(1) && <option value={1}>Slot 1: Signature of PIC / Dibuat Oleh - GA Staff</option>}
                          {allowed.includes(2) && <option value={2}>Slot 2: Approved by / Disetujui Oleh - GA Manager/SPV</option>}
                          {allowed.includes(3) && <option value={3}>Slot 3: Checked by / DiCek Oleh - GA/Finance</option>}
                          {allowed.includes(4) && <option value={4}>Slot 4: Checked by (2) - GA/Finance</option>}
                          {allowed.includes(5) && <option value={5}>Slot 5: Paid by / Dibayarkan Oleh - Finance</option>}
                        </>
                      );
                    }

                    return (
                      <>
                        {allowed.includes(2) && <option value={2}>Slot 2: Dibuat Oleh (1) - Staff Procurement</option>}
                        {allowed.includes(3) && <option value={3}>Slot 3: Dibuat Oleh (2) - Staff Procurement</option>}
                        {allowed.includes(4) && <option value={4}>Slot 4: Disetujui Oleh (1) - Supervisor / Project Manager</option>}
                        {allowed.includes(5) && <option value={5}>Slot 5: Disetujui Oleh (2) - Supervisor / Project Manager</option>}
                        {allowed.includes(6) && <option value={6}>Slot 6: Diperiksa Oleh - Finance</option>}
                        {allowed.includes(7) && <option value={7}>Slot 7: Dibayarkan Oleh - Finance</option>}
                      </>
                    );
                  })()}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penanda Tangan (Dropdown Staf Role)
                </label>
                <select
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:text-white font-bold cursor-pointer"
                >
                  <option value="">-- Pilih Nama Penanda Tangan --</option>
                  {getSlotNames(selectedSlot).map((nameStr, idx) => (
                    <option key={idx} value={nameStr}>
                      {nameStr}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Pilihan nama disesuaikan secara otomatis dengan staf role hak akses pada database.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSignature}
                disabled={signing}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {signing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan & Setujui Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
