'use client';

import React, { useState, useEffect } from 'react';
import api, { getBackendHostUrl } from '@/lib/api';

export default function WorkReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const fetchReports = async () => {
    try {
      const res = await api.get('/work-reports/my-reports');
      setReports(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      if (attachment) form.append('attachment', attachment);

      await api.post('/work-reports', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Laporan berhasil dikirim!');
      setFormData({ title: '', description: '' });
      setAttachment(null);
      // Reset file input by accessing DOM or relying on unmount, but simpler to just reset state for now
      const fileInput = document.getElementById('attachmentInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchReports();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Gagal mengirim laporan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Kirim Laporan Kerja</h2>
        {message && <div className="mb-4 p-3 bg-sky-100 text-sky-700 rounded-lg text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Judul Pekerjaan</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Deskripsi / Hasil Kerja</label>
            <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Lampiran File (PDF/Excel/Word)</label>
            <input id="attachmentInput" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2" />
          </div>
          <button type="submit" className="bg-sky-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-sky-700">Kirim Laporan</button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Riwayat Laporan Saya</h3>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{report.title}</h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{report.description}</p>
              {report.attachmentUrl && (
                <a href={`${getBackendHostUrl()}${report.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-sky-600 font-semibold hover:underline">
                  Download Lampiran
                </a>
              )}
            </div>
          ))}
          {reports.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Belum ada laporan kerja.</p>}
        </div>
      </div>
    </div>
  );
}
