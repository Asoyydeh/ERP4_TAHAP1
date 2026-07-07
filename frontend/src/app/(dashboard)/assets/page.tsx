'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Document, Project, BoqHeader, PenawaranHeader, RfqHeader } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  Image, 
  FileCheck,
  X
} from 'lucide-react';

export default function DocumentsPage() {
  const { user, isSuperAdmin, isProyekAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // States Pencarian & Filter
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');

  // States Detail Modals
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [boqDetails, setBoqDetails] = useState<BoqHeader | null>(null);
  const [penawaranDetails, setPenawaranDetails] = useState<PenawaranHeader | null>(null);
  const [rfqDetails, setRfqDetails] = useState<RfqHeader | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDocsAndProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsRes, projRes] = await Promise.all([
        api.get('/documents'),
        api.get('/projects'),
      ]);
      setDocuments(docsRes.data.data);
      setProjects(projRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data dokumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocsAndProjects();
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus berkas "${name}"? Tindakan ini permanen.`)) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchDocsAndProjects();
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
      } else if (doc.fileType === 'PENAWARAN') {
        const res = await api.get(`/documents/penawaran/${doc.id}`);
        setPenawaranDetails(res.data.data);
      } else if (doc.fileType === 'RFQ') {
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

  // Filtered List
  const filteredDocuments = documents.filter((doc) => {
    const matchSearch = doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
                        doc.uploadedBy?.name.toLowerCase().includes(search.toLowerCase());
    const matchProj = filterProject ? doc.projectId === filterProject : true;
    const matchType = filterType ? doc.fileType === filterType : true;
    return matchSearch && matchProj && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Penjelajah Dokumen Proyek</h2>
          <p className="text-xs text-slate-500 mt-1">Daftar semua dokumen proyek yang diunggah oleh Engineering beserta data detail terurai.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(isSuperAdmin || isProyekAdmin) && (
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll || loading}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              <Download className={`mr-1.5 h-4 w-4 ${downloadingAll ? 'animate-bounce' : ''}`} />
              {downloadingAll ? 'Mengunduh...' : 'Unduh Semua (ZIP)'}
            </button>
          )}
          <button
            onClick={fetchDocsAndProjects}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama berkas, uploader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none text-sm cursor-pointer"
          >
            <option value="">Semua Proyek</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 px-3.5 py-2.5 text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none text-sm cursor-pointer"
          >
            <option value="">Semua Tipe Dokumen</option>
            <option value="GAMBAR">Gambar Proyek</option>
            <option value="BOQ">BOQ (Bill of Quantity)</option>
            <option value="PENAWARAN">Penawaran Vendor</option>
            <option value="RFQ">RFQ (Request for Quotation)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-6 text-center text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filteredDocuments.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-2xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6 rounded-l-lg">Nama Dokumen</th>
                  <th className="py-3.5 px-6">Proyek</th>
                  <th className="py-3.5 px-6">Tipe Dokumen</th>
                  <th className="py-3.5 px-6">Diunggah Oleh</th>
                  <th className="py-3.5 px-6">Ukuran</th>
                  <th className="py-3.5 px-6">Status Dokumen</th>
                  <th className="py-3.5 px-6 text-right rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredDocuments.map((doc) => {
                  const isOwner = doc.uploadedById === user?.id;
                  const canDelete = user?.role === 'SUPERADMIN' || isOwner;
                  const isExcel = doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls');
                  const hasDetails = isExcel && (doc.fileType === 'BOQ' || doc.fileType === 'PENAWARAN' || doc.fileType === 'RFQ');

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="py-4 px-6 font-semibold text-slate-800 flex items-center space-x-2.5">
                        {doc.fileType === 'GAMBAR' && <Image className="h-5 w-5 text-sky-500 shrink-0" />}
                        {doc.fileType === 'BOQ' && <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />}
                        {doc.fileType === 'PENAWARAN' && <FileCheck className="h-5 w-5 text-purple-600 shrink-0" />}
                        {doc.fileType === 'RFQ' && <FileText className="h-5 w-5 text-amber-500 shrink-0" />}
                        {doc.fileType === 'PO' && <FileText className="h-5 w-5 text-indigo-500 shrink-0" />}
                        <span className="truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{doc.project?.name}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-xs">{doc.fileType}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-medium text-slate-700">{doc.uploadedBy?.name}</span>
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
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {doc.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        {hasDetails && (
                          <button
                            onClick={() => handleOpenDetails(doc)}
                            className="inline-flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sky-600 hover:text-sky-700 transition-all shadow-2xs"
                            title="Buka Detail Rincian Excel"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-2xs"
                          title="Unduh Berkas Asli"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(doc.id, doc.fileName)}
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
              {loading ? 'Sedang mengambil data...' : 'Belum ada berkas proyek terdaftar.'}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL PANELS */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Rincian Data: {selectedDoc.fileName}</h3>
                <p className="text-3xs text-slate-400 mt-1">Tipe: <span className="font-bold">{selectedDoc.fileType}</span> | Proyek: {selectedDoc.project?.name}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
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
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-slate-400 font-semibold">Total Anggaran BOQ:</p>
                          <h4 className="text-lg font-bold text-slate-800 mt-1">Rp {boqDetails.totalAmount.toLocaleString('id-ID')}</h4>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">BOQ Sheet</span>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">Kode WBS</th>
                              <th className="py-2.5 px-4">Deskripsi Pekerjaan</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4 text-right">Harga (Eng)</th>
                              <th className="py-2.5 px-4 text-right">Harga (Proc)</th>
                              <th className="py-2.5 px-4 text-right">Total Sub</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {boqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/10">
                                <td className="py-2.5 px-4 font-mono">{item.wbsCode || '-'}</td>
                                <td className="py-2.5 px-4 font-medium text-slate-700">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.rateEngineering.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right text-sky-600 font-bold">Rp {item.rateProcurement.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
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
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-slate-400 font-semibold">Nama Vendor:</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">{penawaranDetails.vendorName}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor Penawaran:</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">{penawaranDetails.quoteNumber || '-'}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Total Nilai Penawaran:</p>
                          <h4 className="font-bold text-purple-700 mt-0.5 text-sm">Rp {penawaranDetails.totalOffer.toLocaleString('id-ID')}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Masa Berlaku:</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">
                            {penawaranDetails.validityDate ? new Date(penawaranDetails.validityDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                              <th className="py-2.5 px-4 text-right">Total Sub</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {penawaranDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                                <td className="py-2.5 px-4 text-right font-bold text-slate-800">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
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
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-slate-400 font-semibold">Nomor RFQ:</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">{rfqDetails.rfqNumber}</h4>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold">Batas Target Tanggal:</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">
                            {rfqDetails.targetDate ? new Date(rfqDetails.targetDate).toLocaleDateString('id-ID') : '-'}
                          </h4>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400 font-semibold">Ketentuan Serah Terima & Syarat Pembayaran (Terms):</p>
                          <h4 className="font-bold text-slate-700 mt-0.5">{rfqDetails.terms || '-'}</h4>
                        </div>
                      </div>
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100 text-left">
                          <thead className="bg-slate-50/50 font-semibold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">No</th>
                              <th className="py-2.5 px-4">Nama Barang / Deskripsi</th>
                              <th className="py-2.5 px-4 text-center">Qty / Satuan</th>
                              <th className="py-2.5 px-4">Spesifikasi Detail</th>
                              <th className="py-2.5 px-4">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {rfqDetails.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/10">
                                <td className="py-2.5 px-4 font-mono">{item.itemNo}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700">{item.description}</td>
                                <td className="py-2.5 px-4 text-center">{item.quantity} {item.unit}</td>
                                <td className="py-2.5 px-4 text-slate-500">{item.specifications || '-'}</td>
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

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-semibold"
              >
                Unduh Berkas Excel Fisik
              </button>
              <button
                onClick={() => setSelectedDoc(null)}
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
