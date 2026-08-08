'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Project } from '@/types';
import TrackingProyekTable from '@/components/TrackingProyekTable';
import { RefreshCw } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function TrackingProyekPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MONITORING') {
      router.push('/dashboard');
    } else {
      loadProjects();
    }
  }, [user]);

  return (
    <div className="space-y-4 pb-12">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span>Tracking Procurement by Proyek</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Rekapitulasi pengadaan material, tanggal permintaan, PO, hingga tanggal tiba di lokasi per proyek.
          </p>
        </div>
      </div>

      {/* ── Table Component ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Memuat data tracking...</span>
        </div>
      ) : (
        <TrackingProyekTable projects={projects} onRefresh={loadProjects} />
      )}
    </div>
  );
}
