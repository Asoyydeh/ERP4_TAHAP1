'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Upload } from 'lucide-react';

export default function AttendancePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('HADIR');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendance/my-attendance');
      setHistory(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAction = async (type: 'in' | 'out') => {
    if (type === 'in' && status !== 'HADIR' && (!notes || !file)) {
      setMessage('Keterangan dan foto bukti wajib diisi untuk status selain Hadir.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    let lat: number | undefined;
    let lng: number | undefined;

    if (type === 'out' || status === 'HADIR') {
      // Fitur lokasi dimatikan sementara sesuai permintaan
      /*
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        if (position.coords.accuracy > 40) {
          throw new Error(`Akurasi GPS Anda terlalu rendah (${Math.round(position.coords.accuracy)}m). Pastikan Anda berada di luar ruangan atau koneksi GPS stabil.`);
        }

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err: any) {
        if (err.message && err.message.includes('Akurasi GPS')) {
          setMessage(err.message);
          setLoading(false);
          return;
        }
      }
      */
    }

    try {
      if (type === 'in') {
        const formData = new FormData();
        formData.append('status', status);
        if (notes) formData.append('notes', notes);
        if (lat !== undefined) formData.append('lat', lat.toString());
        if (lng !== undefined) formData.append('lng', lng.toString());
        if (file) formData.append('file', file);

        await api.post('/attendance/check-in', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage('Check-in berhasil!');
        setStatus('HADIR');
        setNotes('');
        setFile(null);
      } else {
        await api.post('/attendance/check-out', { lat, lng });
        setMessage('Check-out berhasil!');
      }
      fetchHistory();
    } catch (error: any) {
      setMessage(error.response?.data?.message || `Gagal melakukan check-${type}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Absensi Hari Ini</h2>
        {message && <div className="mb-4 p-3 bg-slate-100 rounded-lg text-sm text-slate-700 dark:text-slate-200">{message}</div>}
        
        <div className="space-y-4 max-w-md mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status Kehadiran</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="HADIR">Hadir</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="TIDAK_HADIR">Tidak Hadir</option>
            </select>
          </div>

          {status !== 'HADIR' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Keterangan <span className="text-rose-500">*</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  rows={3}
                  placeholder="Jelaskan alasan Anda..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Bukti Foto <span className="text-rose-500">*</span></label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-300 justify-center">
                      <label className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none">
                        <span>Pilih File Foto</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    {file && <p className="text-xs text-emerald-600 mt-2 font-semibold">{file.name}</p>}
                    {!file && <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG up to 15MB</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex space-x-4">
          <button onClick={() => handleAction('in')} disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">
            {status === 'HADIR' ? 'Check-In' : 'Kirim Laporan Absen'}
          </button>
          {status === 'HADIR' && (
            <button onClick={() => handleAction('out')} disabled={loading} className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50">
              Check-Out
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Riwayat Absensi</h3>
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record: any) => (
              <tr key={record.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900">
                <td className="px-4 py-3">{new Date(record.date).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 font-semibold">
                  <span className={`px-2 py-1 rounded text-xs ${
                    record.status === 'HADIR' ? 'bg-emerald-100 text-emerald-800' :
                    record.status === 'SAKIT' ? 'bg-amber-100 text-amber-800' :
                    record.status === 'IZIN' ? 'bg-sky-100 text-sky-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID') : '-'}</td>
                <td className="px-4 py-3">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID') : '-'}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={record.notes || '-'}>{record.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
