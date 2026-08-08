'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Project, ProjectJob } from '@/types';
import { 
  Loader2, 
  Save,
  X,
  Edit,
  Plus,
  Trash2,
  Search
} from 'lucide-react';

export default function RfqTable() {
  const { user, loading: authLoading, isSuperAdmin, isProyekAdmin, isEngineering, isProcurement } = useAuth();
  
  const canEdit = isSuperAdmin || isProyekAdmin || isEngineering || isProcurement || user?.role === 'SUPERADMIN' || user?.role === 'PROYEK_ADMIN' || user?.role === 'ENGINEERING' || user?.role === 'PROCUREMENT';

  const [projects, setProjects] = useState<Project[]>([]);
  const [masterSubkons, setMasterSubkons] = useState<{id: string, code: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [jobsFormData, setJobsFormData] = useState<Partial<ProjectJob>[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, subRes] = await Promise.all([
        api.get('/projects'),
        api.get('/master-data/subkons')
      ]);
      if (res.data && res.data.data) {
        setProjects(res.data.data);
      }
      if (subRes.data && subRes.data.data) {
        setMasterSubkons(subRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [user, authLoading]);

  const handleOpenForm = (project: Project) => {
    setEditingProject(project);
    if (project.jobs && project.jobs.length > 0) {
      setJobsFormData(project.jobs.map(j => ({ ...j })));
    } else {
      // Create empty row
      setJobsFormData([{ id: '', projectId: project.id }]);
    }
  };

  const handleSaveData = async () => {
    if (!editingProject) return;
    try {
      setSaving(true);
      
      const res = await api.put(`/projects/${editingProject.id}`, {
        jobs: jobsFormData
      });
      
      const updatedProject = res.data?.data;
      if (updatedProject) {
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else {
        loadData(); // fallback refresh
      }
      setEditingProject(null);
    } catch (err) {
      alert('Gagal menyimpan data RFQ.');
    } finally {
      setSaving(false);
    }
  };

  const getProjectCode = (p: Project) => {
    return p.code || '-';
  };

  const progressOptions = ['', 'Belum', 'Mulai', 'Selesai'];
  const statusOptions = ['', 'Unsent', 'QUO', 'Nego', 'SPK', 'Deal', 'Rejected'];

  const handleAddJobRow = () => {
    setJobsFormData([...jobsFormData, { id: '', projectId: editingProject?.id || '' }]);
  };

  const handleRemoveJobRow = (index: number) => {
    const newData = [...jobsFormData];
    newData.splice(index, 1);
    if (newData.length === 0) {
      newData.push({ id: '', projectId: editingProject?.id || '' }); // Always keep at least 1 row
    }
    setJobsFormData(newData);
  };

  const updateJob = (index: number, field: keyof ProjectJob, value: string) => {
    const newData = [...jobsFormData];
    newData[index] = { ...newData[index], [field]: value };
    setJobsFormData(newData);
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'SPK':
      case 'Deal': return 'text-emerald-600';
      case 'Rejected': return 'text-red-500';
      case 'Unsent': return 'text-slate-400';
      case 'Nego': return 'text-amber-600';
      case 'QUO': return 'text-sky-600';
      default: return '';
    }
  };

  const getRowBgColor = (job: Partial<ProjectJob>) => {
    if (job.progress === 'Selesai') return 'bg-green-100/50 dark:bg-emerald-900/20';
    if (job.progress === 'Mulai') return 'bg-yellow-100/50 dark:bg-yellow-900/20';
    return 'bg-orange-100/50 dark:bg-orange-900/20';
  };

  const filteredProjects = projects.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchProject = p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term));
    const matchJobs = p.jobs?.some(j => 
      j.uraianPekerjaan?.toLowerCase().includes(term) ||
      j.subkon1Nama?.toLowerCase().includes(term) ||
      j.subkon2Nama?.toLowerCase().includes(term) ||
      j.subkon3Nama?.toLowerCase().includes(term)
    );
    return matchProject || matchJobs;
  });

  if (loading || authLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Tracking RFQ</h4>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm transition-colors"
              placeholder="Cari Proyek / Uraian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs smooth-scroll table-scroll-container">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-middle">Kode Proyek</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 min-w-[200px] align-middle">Nama Proyek</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 min-w-[200px] align-middle">Uraian Pekerjaan</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center align-middle">RFQ</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center align-middle">Progress</th>
                <th colSpan={2} className="px-3 py-1 border-b border-r border-slate-200 dark:border-slate-700 text-center">Subkon 1</th>
                <th colSpan={2} className="px-3 py-1 border-b border-r border-slate-200 dark:border-slate-700 text-center">Subkon 2</th>
                <th colSpan={2} className="px-3 py-1 border-b border-r border-slate-200 dark:border-slate-700 text-center">Subkon 3</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 min-w-[150px] align-middle">Remarks</th>
                {canEdit && (
                  <th rowSpan={2} className="px-3 py-2 text-center w-20 align-middle">Aksi</th>
                )}
              </tr>
              <tr className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold border-b border-slate-200 dark:border-slate-700 text-center">
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Nama</th>
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Status</th>
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Nama</th>
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Status</th>
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Nama</th>
                <th className="px-3 py-1 border-r border-slate-200 dark:border-slate-700 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
              {filteredProjects.map(project => {
                const isEditing = editingProject?.id === project.id;
                const jobsToRender = isEditing ? jobsFormData : (project.jobs && project.jobs.length > 0 ? project.jobs : [{} as Partial<ProjectJob>]);
                const rowSpan = Math.max(1, jobsToRender.length);
                
                return (
                  <React.Fragment key={project.id}>
                    {jobsToRender.map((job, index) => {
                      const rowBg = getRowBgColor(job);
                      return (
                        <tr key={job.id || `temp-${index}`} className={`transition-colors hover:brightness-95 ${rowBg}`}>
                          {index === 0 && (
                            <>
                              <td rowSpan={rowSpan} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 font-medium align-top">
                                {getProjectCode(project)}
                              </td>
                              <td rowSpan={rowSpan} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] align-top whitespace-normal" title={project.name}>
                                {project.name}
                              </td>
                            </>
                          )}
                          
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 group relative">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input type="text" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px]" value={job.uraianPekerjaan || ''} onChange={e => updateJob(index, 'uraianPekerjaan', e.target.value)} placeholder="Uraian Pekerjaan" />
                                <button onClick={() => handleRemoveJobRow(index)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Hapus Baris">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (job.uraianPekerjaan || '-')}
                          </td>
                          
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                            {isEditing ? (
                              <input type="text" placeholder="e.g. 7-Oct" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] text-center min-w-[70px]" value={job.rfqDate || ''} onChange={e => updateJob(index, 'rfqDate', e.target.value)} />
                            ) : (job.rfqDate || '-')}
                          </td>
                          
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] text-center" value={job.progress || ''} onChange={e => updateJob(index, 'progress', e.target.value)}>
                                {progressOptions.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${job.progress === 'Selesai' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : job.progress === 'Mulai' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : job.progress === 'Belum' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}`}>
                                {job.progress || '-'}
                              </span>
                            )}
                          </td>
                          
                          {/* Subkon 1 */}
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] min-w-[80px]" value={job.subkon1Nama || ''} onChange={e => updateJob(index, 'subkon1Nama', e.target.value)}>
                                <option value="">-</option>
                                {masterSubkons.map(sub => (
                                  <option key={sub.id} value={sub.code}>{sub.code}</option>
                                ))}
                                {/* Allow existing value if not in master list */}
                                {job.subkon1Nama && !masterSubkons.find(s => s.code === job.subkon1Nama) && (
                                  <option value={job.subkon1Nama}>{job.subkon1Nama}</option>
                                )}
                              </select>
                            ) : (job.subkon1Nama || '-')}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] text-center" value={job.subkon1Status || ''} onChange={e => updateJob(index, 'subkon1Status', e.target.value)}>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                              </select>
                            ) : (
                              <span className={`text-[10px] font-medium ${getStatusColor(job.subkon1Status)}`}>{job.subkon1Status || '-'}</span>
                            )}
                          </td>

                          {/* Subkon 2 */}
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] min-w-[80px]" value={job.subkon2Nama || ''} onChange={e => updateJob(index, 'subkon2Nama', e.target.value)}>
                                <option value="">-</option>
                                {masterSubkons.map(sub => (
                                  <option key={sub.id} value={sub.code}>{sub.code}</option>
                                ))}
                                {job.subkon2Nama && !masterSubkons.find(s => s.code === job.subkon2Nama) && (
                                  <option value={job.subkon2Nama}>{job.subkon2Nama}</option>
                                )}
                              </select>
                            ) : (job.subkon2Nama || '-')}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] text-center" value={job.subkon2Status || ''} onChange={e => updateJob(index, 'subkon2Status', e.target.value)}>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                              </select>
                            ) : (
                              <span className={`text-[10px] font-medium ${getStatusColor(job.subkon2Status)}`}>{job.subkon2Status || '-'}</span>
                            )}
                          </td>

                          {/* Subkon 3 */}
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] min-w-[80px]" value={job.subkon3Nama || ''} onChange={e => updateJob(index, 'subkon3Nama', e.target.value)}>
                                <option value="">-</option>
                                {masterSubkons.map(sub => (
                                  <option key={sub.id} value={sub.code}>{sub.code}</option>
                                ))}
                                {job.subkon3Nama && !masterSubkons.find(s => s.code === job.subkon3Nama) && (
                                  <option value={job.subkon3Nama}>{job.subkon3Nama}</option>
                                )}
                              </select>
                            ) : (job.subkon3Nama || '-')}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 text-center">
                            {isEditing ? (
                              <select className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] text-center" value={job.subkon3Status || ''} onChange={e => updateJob(index, 'subkon3Status', e.target.value)}>
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt || '-'}</option>)}
                              </select>
                            ) : (
                              <span className={`text-[10px] font-medium ${getStatusColor(job.subkon3Status)}`}>{job.subkon3Status || '-'}</span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                            {isEditing ? (
                              <input type="text" className="w-full border border-slate-300 dark:border-slate-600 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-1 rounded text-[10px] min-w-[120px]" value={job.remarks || ''} onChange={e => updateJob(index, 'remarks', e.target.value)} />
                            ) : (job.remarks || '-')}
                          </td>

                          {/* Action Column - For SuperAdmin, Engineering, Proyek Admin, Procurement */}
                          {canEdit && index === 0 && (
                            <td rowSpan={rowSpan} className="px-3 py-2 text-center align-top">
                              {isEditing ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-1 justify-center">
                                    <button onClick={handleSaveData} disabled={saving} className="p-1.5 bg-sky-100 text-sky-700 rounded hover:bg-sky-200" title="Simpan">
                                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setEditingProject(null)} className="p-1.5 bg-slate-100 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200" title="Batal">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <button onClick={handleAddJobRow} className="mt-1 flex items-center justify-center gap-1 w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1 rounded border border-emerald-200 text-[10px] font-medium transition-colors">
                                    <Plus className="w-3 h-3" /> Tambah
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleOpenForm(project)} className="p-1.5 text-slate-400 hover:text-sky-600 transition-colors" title="Edit">
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
