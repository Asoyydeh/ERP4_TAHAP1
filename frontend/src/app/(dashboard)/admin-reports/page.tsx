'use client';

import React, { useState, useEffect } from 'react';
import api, { getBackendHostUrl } from '@/lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports'>('attendance');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAtt = await api.get('/attendance/all');
        setAttendance(resAtt.data.data);
        const resRep = await api.get('/work-reports/all');
        setReports(resRep.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const exportExcel = (type: 'attendance' | 'reports') => {
    const data = type === 'attendance' ? attendance.map(a => ({
      Nama: a.user.name,
      Role: a.user.role,
      Tanggal: new Date(a.date).toLocaleDateString('id-ID'),
      Status: a.status,
      'Check In': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID') : '-',
      'Check Out': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID') : '-',
      Keterangan: a.notes || '-',
    })) : reports.map(r => ({
      Nama: r.user.name,
      Role: r.user.role,
      Tanggal: new Date(r.createdAt).toLocaleDateString('id-ID'),
      Judul: r.title,
      Deskripsi: r.description,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, `Laporan_${type}_${Date.now()}.xlsx`);
  };

  const exportPDF = async (type: 'attendance' | 'reports') => {
    const doc = new jsPDF();

    try {
      const img = new Image();
      img.src = '/mjk_logo.png';
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      doc.addImage(img, 'PNG', 14, 10, 45, 14); // Sesuaikan ukuran dan posisi logo
    } catch (e) {
      console.log('Logo gagal diload:', e);
    }
    
    // Set font ke Times New Roman
    doc.setFont('times', 'normal');
    
    doc.setFontSize(16);
    doc.text(`Laporan ${type === 'attendance' ? 'Absensi' : 'Kerja Karyawan'}`, 14, 35);
    
    const commonStyles = {
      font: 'times',
      fontSize: 11,
      textColor: [0, 0, 0] as [number, number, number],
      lineColor: [0, 0, 0] as [number, number, number],
      lineWidth: 0.1,
    };

    if (type === 'attendance') {
      const tableData = attendance.map(a => [
        a.user.name, a.user.role, new Date(a.date).toLocaleDateString('id-ID'), 
        a.status, a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID') : '-', 
        a.checkOut ? new Date(a.checkOut).toLocaleTimeString('id-ID') : '-',
        a.notes || '-'
      ]);
      autoTable(doc, {
        head: [['Nama', 'Role', 'Tanggal', 'Status', 'Check In', 'Check Out', 'Keterangan']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        styles: commonStyles,
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      });
    } else {
      const tableData = reports.map(r => [
        r.user.name, r.user.role, new Date(r.createdAt).toLocaleDateString('id-ID'), r.title, r.description
      ]);
      autoTable(doc, {
        head: [['Nama', 'Role', 'Tanggal', 'Judul', 'Deskripsi']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        styles: commonStyles,
        headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
      });
    }
    
    doc.save(`Laporan_${type}_${Date.now()}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">Monitoring Laporan Karyawan</h2>
      
      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setActiveTab('attendance')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'attendance' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
          Absensi
        </button>
        <button onClick={() => setActiveTab('reports')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'reports' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}>
          Laporan Kerja
        </button>
      </div>

      <div className="flex justify-end space-x-2 mb-4">
        <button onClick={() => exportExcel(activeTab)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 text-sm">
          Export Excel
        </button>
        <button onClick={() => exportPDF(activeTab)} className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-rose-700 text-sm">
          Cetak PDF
        </button>
      </div>

      {activeTab === 'attendance' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Nama</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Check In</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Check Out</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Keterangan</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Bukti Foto</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record: any) => (
                <tr key={record.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {record.user.photoUrl && record.user.photoUrl !== 'null' ? (
                        <img src={`${getBackendHostUrl()}${record.user.photoUrl}`} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                          {record.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{record.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs"><span className="bg-slate-200 px-2 py-1 rounded">{record.user.role}</span></td>
                  <td className="px-4 py-3">{new Date(record.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{record.status}</td>
                  <td className="px-4 py-3">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID') : '-'}</td>
                  <td className="px-4 py-3">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID') : '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={record.notes}>{record.notes || '-'}</td>
                  <td className="px-4 py-3">
                    {record.photoUrl ? (
                      <a href={`${getBackendHostUrl()}${record.photoUrl}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold hover:underline">
                        Lihat Foto
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Nama</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Tanggal</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Judul</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Deskripsi</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Lampiran</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report: any) => (
                <tr key={report.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {report.user.photoUrl && report.user.photoUrl !== 'null' ? (
                        <img src={`${getBackendHostUrl()}${report.user.photoUrl}`} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                          {report.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{report.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs"><span className="bg-slate-200 px-2 py-1 rounded">{report.user.role}</span></td>
                  <td className="px-4 py-3">{new Date(report.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 font-semibold">{report.title}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={report.description}>{report.description}</td>
                  <td className="px-4 py-3">
                    {report.attachmentUrl ? (
                      <a href={`${getBackendHostUrl()}${report.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold hover:underline">
                        Unduh
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
