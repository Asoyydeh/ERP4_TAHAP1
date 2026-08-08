'use client';
import React, { useState, useEffect } from 'react';
import { Project, User, Document } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';

export default function AllProyekTable({ projects, documents, onUpdateProject, setExplorerProject, setExplorerFolder }: { projects: Project[], documents: Document[], onUpdateProject: (proj: Project) => void, setExplorerProject: any, setExplorerFolder: any }) {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [staffs, setStaffs] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      const endpoint = (user.role === 'SUPERADMIN' || user.role === 'ADMIN_MONITORING') ? '/auth/users' : '/staff';
      api.get(endpoint).then(res => setStaffs(res.data.data)).catch(() => {
        api.get('/auth/users').then(res => setStaffs(res.data.data)).catch(() => {});
      });
    }
  }, [user]);

  const canEditColumn = (roleReq: string) => {
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MONITORING') return true;
    return user?.role === roleReq && !user?.managerId;
  };

  const handleEdit = (proj: Project) => {
    setEditingId(proj.id);
    setEditForm(proj);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await api.put(`/projects/${id}`, editForm);
      onUpdateProject(res.data.data);
      setEditingId(null);
    } catch (error) {
      alert('Gagal menyimpan perubahan');
    }
  };

  const renderPicDropdown = (value: string | null | undefined, field: keyof Project, isAllowed: boolean) => {
    if (editingId && isAllowed) {
      const getRoleForField = (f: keyof Project) => {
        if (f === 'penawaranPicId' || f === 'boqPicId') return 'ENGINEERING';
        if (f === 'rfqPicId' || f === 'progressPicId') return 'PROCUREMENT';
        if (f === 'spkPicId') return 'PROYEK_ADMIN';
        if (f === 'invoicePicId') return 'FINANCE';
        return '';
      };
      const requiredRole = getRoleForField(field);
      const isSuperAdmin = user?.role === 'SUPERADMIN';
      const isAdminMonitoring = user?.role === 'ADMIN_MONITORING';

      const filteredStaffs = staffs.filter(s => {
        if (s.id === value) return true;
        if (s.role === requiredRole) return true;
        if ((isSuperAdmin || isAdminMonitoring) && s.role === 'SUPERADMIN') return true;
        return !requiredRole && (s.role !== 'SUPERADMIN' || isSuperAdmin || isAdminMonitoring);
      });
      const displayStaffs = filteredStaffs.length > 0 ? filteredStaffs : staffs.filter(s => s.role !== 'SUPERADMIN' || isSuperAdmin || isAdminMonitoring);

      return (
        <select
          className="w-full border p-1 rounded text-[10px]"
          value={editForm[field] as string || ''}
          onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
        >
          <option value="">Pilih PIC</option>
          {displayStaffs.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{s.managerId ? ' (Staff)' : ` (${s.role || 'Admin'})`}
            </option>
          ))}
        </select>
      );
    }
    return <span className="text-[10px]">{staffs.find(s => s.id === value)?.name || '-'}</span>;
  };



  const renderDateInput = (value: string | null | undefined, field: keyof Project, isAllowed: boolean, withTime: boolean = false) => {
    if (editingId && isAllowed) {
      return (
        <input
          type={withTime ? "datetime-local" : "date"}
          className="w-full border p-1 rounded text-[10px]"
          value={editForm[field] ? (editForm[field] as string).substring(0, withTime ? 16 : 10) : ''}
          onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
        />
      );
    }
    if (!value) return <span className="text-[10px]">-</span>;
    const d = new Date(value);
    const dateStr = d.toLocaleDateString('id-ID');
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return <span className="text-[10px]">{withTime ? `${dateStr} ${timeStr}` : dateStr}</span>;
  };

  const handleDescChange = (field: string, value: string) => {
    try {
      const parsed = JSON.parse(editForm.description || '{}');
      parsed[field] = value;
      setEditForm({ ...editForm, description: JSON.stringify(parsed) });
    } catch (e) {
      setEditForm({ ...editForm, description: JSON.stringify({ [field]: value }) });
    }
  };

  return (
    <div className="overflow-x-auto responsive-table-wrapper smooth-scroll border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-bold border-b border-slate-200 dark:border-slate-700">
            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top min-w-[140px]">Kode Proyek</th>
            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 min-w-[200px] align-top">Nama Proyek</th>
            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top">Req By</th>
            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top">Req Date</th>

            <th colSpan={2} className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 text-center border-b bg-green-100/50 dark:bg-emerald-950/60 dark:text-emerald-300">Penawaran</th>
            <th colSpan={2} className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 text-center border-b bg-green-100/50 dark:bg-emerald-950/60 dark:text-emerald-300">BOQ</th>
            <th colSpan={2} className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 text-center border-b bg-blue-100/50 dark:bg-sky-950/60 dark:text-sky-300">RFQ</th>

            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top">Tgl Selesai</th>
            <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top">Terakhir Update</th>
            <th rowSpan={2} className="px-3 py-2 text-center align-top">Aksi</th>
          </tr>
          <tr className="bg-emerald-50/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
            {/* Penawaran */}
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">Due Date</th>
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">PIC</th>
            {/* BOQ */}
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">Due Date</th>
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">PIC</th>
            {/* RFQ */}
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">Due Date</th>
            <th className="px-2 py-1 border-r border-slate-200 dark:border-slate-700">PIC</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900">
          {[...projects].sort((a, b) => {
            const numA = parseInt((a.code || '').match(/^\d+/)?.[0] || '0', 10);
            const numB = parseInt((b.code || '').match(/^\d+/)?.[0] || '0', 10);
            return numA - numB;
          }).map(project => {
            const isEditing = editingId === project.id;
            const parseDesc = (desc: string) => {
              try { return JSON.parse(desc); } catch (e) { return {}; }
            };
            const engData = parseDesc(project.description || '{}');

            const isReqFilled = !!engData.reqBy && !!engData.reqDate;
            const isPenawaranFilled = !!project.penawaranDueDate && !!project.penawaranPicId;
            const isBoqFilled = !!project.boqDueDate && !!project.boqPicId;
            const isRfqFilled = !!project.rfqDueDate && !!project.rfqPicId;
            const isAllTasksFilled = isReqFilled && isPenawaranFilled && isBoqFilled && isRfqFilled;
            const isTglSelesaiFilled = !!project.endDate;

            let statusBg = 'bg-orange-100/40 dark:bg-amber-950/25';
            if (isAllTasksFilled && isTglSelesaiFilled) {
              statusBg = 'bg-green-100/40 dark:bg-emerald-950/25';
            } else if (isAllTasksFilled && !isTglSelesaiFilled) {
              statusBg = 'bg-yellow-100/40 dark:bg-yellow-950/25';
            }

            return (
              <tr key={project.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${statusBg}`}>
                <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-700/60 text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 min-w-[140px]">
                  {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MONITORING') ? (
                    <input
                      type="text"
                      defaultValue={project.code || ''}
                      key={`${project.id}_${project.code}`}
                      onBlur={async (e) => {
                        const newCode = e.target.value;
                        if (newCode !== (project.code || '')) {
                          await api.put(`/projects/${project.id}`, { code: newCode });
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('app_data_changed'));
                            if ('BroadcastChannel' in window) {
                              try {
                                const ch = new BroadcastChannel('app_data_sync');
                                ch.postMessage('refresh');
                                ch.close();
                              } catch (err) {}
                            }
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full text-left font-mono font-bold text-[11px] py-0.5 px-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      title="Klik untuk ubah Kode Proyek (Super Admin)"
                    />
                  ) : (
                    <span className="cursor-pointer hover:underline" onClick={() => { setExplorerProject(project); setExplorerFolder(null); }}>
                      {project.code}
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-700/60 text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate max-w-[150px]" title={project.name}>{project.name}</td>

                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">
                  {isEditing && canEditColumn('ENGINEERING') ? (
                    <input type="text" className="w-20 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-1 rounded text-[10px]" value={parseDesc(editForm.description || '{}').reqBy || ''} onChange={(e) => handleDescChange('reqBy', e.target.value)} />
                  ) : engData.reqBy || '-'}
                </td>
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">
                  {isEditing && canEditColumn('ENGINEERING') ? (
                    <input type="date" className="w-24 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-1 rounded text-[10px]" value={parseDesc(editForm.description || '{}').reqDate || ''} onChange={(e) => handleDescChange('reqDate', e.target.value)} />
                  ) : engData.reqDate ? new Date(engData.reqDate).toLocaleDateString('id-ID') : '-'}
                </td>

                {/* Penawaran */}
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderDateInput(project.penawaranDueDate, 'penawaranDueDate', canEditColumn('ENGINEERING'), true)}</td>
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderPicDropdown(project.penawaranPicId, 'penawaranPicId', canEditColumn('ENGINEERING'))}</td>

                {/* BOQ */}
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderDateInput(project.boqDueDate, 'boqDueDate', canEditColumn('ENGINEERING'), true)}</td>
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderPicDropdown(project.boqPicId, 'boqPicId', canEditColumn('ENGINEERING'))}</td>

                {/* RFQ */}
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderDateInput(project.rfqDueDate, 'rfqDueDate', canEditColumn('ENGINEERING'), true)}</td>
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60">{renderPicDropdown(project.rfqPicId, 'rfqPicId', canEditColumn('ENGINEERING'))}</td>

                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60 font-semibold text-center">
                  {isEditing && canEditColumn('ENGINEERING') ? (
                    <input
                      type="date"
                      className="w-24 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 p-1 rounded text-[10px]"
                      value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    />
                  ) : project.endDate ? new Date(project.endDate).toLocaleDateString('id-ID') : '-'}
                </td>
                <td className="px-2 py-1 border-r border-slate-200 dark:border-slate-700/60 font-semibold text-center">
                  {new Date((project as any).lastUpdated || (project as any).updatedAt || project.createdAt).toLocaleDateString('id-ID')}
                </td>

                <td className="px-2 py-1 text-center">
                  {isEditing ? (
                    <div className="flex justify-center space-x-1">
                      <button onClick={() => handleSave(project.id)} className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px]">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px]">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEdit(project)} className="text-sky-600 dark:text-sky-400 hover:underline text-[10px] font-bold">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
