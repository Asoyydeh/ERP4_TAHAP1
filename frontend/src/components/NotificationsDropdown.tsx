'use client';

import React, { useState, useEffect, useRef } from 'react';
import api, { getBackendHostUrl } from '@/lib/api';
import { AuditLog } from '@/types';
import { Bell, User, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsDropdown() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const res = await api.get('/monitoring/audit-logs');
      if (res.data && res.data.data) {
        setLogs(res.data.data);
        // Basic unread simulation logic: just show count of latest 5 or something
        // A real unread logic would track last seen ID in local storage or backend
        // For now, let's just show a simple static unread count if there are logs
        // Or track last seen timestamp in localStorage
        const lastSeen = localStorage.getItem('last_seen_notifications');
        const count = res.data.data.filter((log: AuditLog) => !lastSeen || new Date(log.timestamp) > new Date(lastSeen)).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      localStorage.setItem('last_seen_notifications', new Date().toISOString());
    }
  };

  const handleNotificationClick = (log: AuditLog) => {
    setIsOpen(false);
    if (log.tableName === 'projects' || log.actionType.includes('PROJECT')) {
      router.push(`/projects?projectId=${log.recordId}`);
    } else if (log.tableName === 'documents') {
      router.push(`/projects?docId=${log.recordId}`); // Use query param for document
    } else if (log.tableName && log.tableName.includes('master')) {
      router.push('/master-data');
    } else if (log.tableName === 'users' || log.actionType.includes('USER')) {
      router.push('/users');
    } else if (log.tableName === 'work_reports') {
      router.push('/admin-reports');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpenDropdown}
        className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Notifikasi</h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {logs.length} Aktivitas
            </span>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">Tidak ada notifikasi.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {logs.slice(0, 30).map((log) => {
                  const isCreate = log.actionType.startsWith('CREATE') || log.actionType.startsWith('UPLOAD');
                  const isDelete = log.actionType.startsWith('DELETE') || log.actionType.startsWith('REJECT');

                  return (
                    <div 
                      key={log.id} 
                      onClick={() => handleNotificationClick(log)}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors flex gap-3 items-start"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                          {log.user?.photoUrl && log.user.photoUrl !== 'null' ? (
                            <img src={`${getBackendHostUrl()}${log.user.photoUrl}`} alt="avatar" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{log.user?.name || 'Sistem'} </span>
                          {log.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold">
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                            isCreate ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' :
                            isDelete ? 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:border-rose-800' :
                            'bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/30 dark:border-sky-800'
                          }`}>
                            {log.actionType.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Hanya menampilkan 30 aktivitas terakhir</p>
          </div>
        </div>
      )}
    </div>
  );
}
