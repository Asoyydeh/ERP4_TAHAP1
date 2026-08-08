'use client';

import React, { useState, useEffect, useRef } from 'react';
import api, { getBackendHostUrl } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import {
  Send,
  Search,
  MessageSquare,
  Paperclip,
  CheckCheck,
  User as UserIcon,
  Users,
  ShieldCheck,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  RefreshCw,
  FileText,
  File,
  Download,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  targetRole?: string;
  message: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
    photoUrl?: string;
  };
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  SUPERADMIN: { label: 'Super Admin', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', icon: '👑' },
  ADMIN_MONITORING: { label: 'Admin Monitoring', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: '📊' },
  PROYEK_ADMIN: { label: 'Proyek Admin', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', icon: '📋' },
  ENGINEERING: { label: 'Engineering', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: '🛠️' },
  PROCUREMENT: { label: 'Procurement', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: '📦' },
  FINANCE: { label: 'Finance', bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300', icon: '💰' },
  HRD: { label: 'HRD', bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', icon: '👷' },
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageFile = (url: string) => {
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
};

export default function ChatPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTarget, setActiveTarget] = useState<{ type: 'user' | 'role'; idOrRole: string; name: string; role?: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ fileUrl: string; fileName: string; fileSize?: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFullFileUrl = (relativeOrFullUrl: string) => {
    if (!relativeOrFullUrl) return '';
    if (relativeOrFullUrl.startsWith('http')) return relativeOrFullUrl;

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const serverHost = getBackendHostUrl();
    
    const separator = relativeOrFullUrl.includes('?') ? '&' : '?';
    return `${serverHost}${relativeOrFullUrl}${separator}token=${token}`;
  };

  const handleDownloadAttachment = async (attachmentUrl: string, fileName: string) => {
    try {
      const endpoint = attachmentUrl.startsWith('/api')
        ? attachmentUrl.replace('/api', '')
        : attachmentUrl;

      const res = await api.get(endpoint, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data]);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Gagal mengunduh lampiran via API, membuka tautan langsung:', err);
      const fullUrl = getFullFileUrl(attachmentUrl);
      window.open(fullUrl, '_blank');
    }
  };

  const loadContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data.data);
    } catch (err) {
      console.error('Gagal memuat kontak chat:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadMessages = async (target: { type: 'user' | 'role'; idOrRole: string }, markRead = true) => {
    try {
      let url = '/chat/messages';
      if (target.type === 'user') {
        url += `?userBId=${target.idOrRole}`;
      } else {
        url += `?targetRole=${target.idOrRole}`;
      }
      const res = await api.get(url);
      setMessages(res.data.data);

      if (target.type === 'user' && markRead) {
        await api.put('/chat/mark-read', { senderId: target.idOrRole });
        setContacts(prev => prev.map(c => c.id === target.idOrRole ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err) {
      console.error('Gagal memuat percakapan:', err);
    }
  };

  useEffect(() => {
    loadContacts();
    const interval = setInterval(() => {
      loadContacts();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeTarget) return;
    setLoadingMessages(true);
    loadMessages(activeTarget).finally(() => setLoadingMessages(false));

    const msgInterval = setInterval(() => {
      loadMessages(activeTarget, false);
    }, 3000);
    return () => clearInterval(msgInterval);
  }, [activeTarget]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAttachedFile({
        fileUrl: res.data.data.fileUrl,
        fileName: res.data.data.fileName,
        fileSize: res.data.data.fileSize,
      });
    } catch (err) {
      console.error('Gagal mengunggah berkas:', err);
      alert('Gagal mengunggah berkas. Coba lagi.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !activeTarget || sending) return;

    setSending(true);
    try {
      const payload: any = {
        message: inputText.trim() || (attachedFile ? `[Mengirim Berkas: ${attachedFile.fileName}]` : ''),
        attachmentUrl: attachedFile?.fileUrl || undefined,
      };

      if (activeTarget.type === 'user') {
        payload.receiverId = activeTarget.idOrRole;
      } else {
        payload.targetRole = activeTarget.idOrRole;
      }

      await api.post('/chat/send', payload);
      setInputText('');
      setAttachedFile(null);
      await loadMessages(activeTarget);
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      alert('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedContacts = filteredContacts.reduce((acc, c) => {
    acc[c.role] = acc[c.role] || [];
    acc[c.role].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  const rolesList = Object.keys(ROLE_LABELS);

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── LEFT PANEL: Contact List grouped by Role ────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/50 dark:bg-slate-900/60 ${activeTarget ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <span>Pesan Chat Multi-Role</span>
            </h2>
            <button
              onClick={loadContacts}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Segarkan Kontak"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* BROADCAST / ROLE CHAT ROOMS */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              📢 Saluran Peran / Tim
            </span>
            <div className="space-y-1">
              {rolesList.map((rKey) => {
                const rMeta = ROLE_LABELS[rKey] || { label: rKey, bg: 'bg-slate-100', text: 'text-slate-700', icon: '💬' };
                const isSelected = activeTarget?.type === 'role' && activeTarget.idOrRole === rKey;

                return (
                  <button
                    key={`role-${rKey}`}
                    onClick={() => setActiveTarget({ type: 'role', idOrRole: rKey, name: `Grup ${rMeta.label}` })}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-md font-bold'
                        : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{rMeta.icon}</span>
                      <span className="text-xs font-bold">{rMeta.label}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : `${rMeta.bg} ${rMeta.text}`
                    }`}>
                      Grup
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INDIVIDUAL CONTACTS */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              💬 Obrolan Langsung (1-on-1)
            </span>

            {loadingContacts && (
              <div className="py-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Memuat kontak...
              </div>
            )}

            {!loadingContacts && Object.keys(groupedContacts).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">Tidak ada kontak ditemukan.</p>
            )}

            {Object.entries(groupedContacts).map(([roleKey, roleUsers]) => {
              const roleMeta = ROLE_LABELS[roleKey] || { label: roleKey, bg: 'bg-slate-100', text: 'text-slate-700', icon: '👤' };

              return (
                <div key={`section-${roleKey}`} className="mb-3 space-y-1">
                  <div className="px-2 py-1 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span>{roleMeta.icon}</span>
                      <span>{roleMeta.label}</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                      {roleUsers.length}
                    </span>
                  </div>

                  {roleUsers.map((c) => {
                    const isSelected = activeTarget?.type === 'user' && activeTarget.idOrRole === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveTarget({ type: 'user', idOrRole: c.id, name: c.name, role: c.role })}
                        className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-md font-bold'
                            : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700 dark:bg-slate-700 dark:text-sky-300'
                          }`}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                              {c.name}
                            </p>
                            <p className={`text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                              {c.email}
                            </p>
                          </div>
                        </div>

                        {c.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full shadow-xs">
                            {c.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL: Active Chat Thread ──────────────────────────────────── */}
      <div className={`flex-1 flex-col bg-slate-50/20 dark:bg-slate-900 ${activeTarget ? 'flex' : 'hidden md:flex'}`}>
        
        {activeTarget ? (
          <>
            {/* Header Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveTarget(null)}
                  className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-slate-300 active:scale-95"
                  title="Kembali ke Daftar Kontak"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                  {activeTarget.type === 'role' ? ROLE_LABELS[activeTarget.idOrRole]?.icon || '📢' : activeTarget.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>{activeTarget.name}</span>
                    {activeTarget.role && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        ROLE_LABELS[activeTarget.role]?.bg || 'bg-slate-100'
                      } ${ROLE_LABELS[activeTarget.role]?.text || 'text-slate-700'}`}>
                        {ROLE_LABELS[activeTarget.role]?.label || activeTarget.role}
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {activeTarget.type === 'role' ? 'Saluran Obrolan Tim' : 'Pesan Obrolan Langsung'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages && (
                <div className="py-12 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Memuat pesan...
                </div>
              )}

              {!loadingMessages && messages.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <MessageSquare className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-bold">Belum ada obrolan.</p>
                  <p className="text-[11px] mt-0.5 text-slate-400">Mulailah menyapa {activeTarget.name}!</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const senderRoleMeta = ROLE_LABELS[msg.sender.role] || { label: msg.sender.role, icon: '👤' };
                const hasAttachment = Boolean(msg.attachmentUrl);
                const isImg = hasAttachment && isImageFile(msg.attachmentUrl!);

                let fileName = 'Berkas Lampiran';
                if (msg.attachmentUrl) {
                  try {
                    const matchName = msg.attachmentUrl.match(/name=([^&]+)/);
                    if (matchName && matchName[1]) {
                      fileName = decodeURIComponent(matchName[1]);
                    } else {
                      fileName = msg.attachmentUrl.split('/').pop() || 'Berkas Lampiran';
                    }
                  } catch {
                    fileName = 'Berkas Lampiran';
                  }
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {!isMe && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1">
                        <span>{senderRoleMeta.icon}</span>
                        <span>{msg.sender.name}</span>
                        <span className="text-[9px] text-slate-400">({senderRoleMeta.label})</span>
                      </span>
                    )}

                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-sky-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                      {/* File / Document Attachment Card */}
                      {hasAttachment && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700">
                          {isImg ? (
                            <a href={getFullFileUrl(msg.attachmentUrl!)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                              <img src={getFullFileUrl(msg.attachmentUrl!)} alt="Lampiran Foto" className="max-h-48 rounded-xl object-cover hover:opacity-90 transition-opacity" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(msg.attachmentUrl!, fileName)}
                              className={`w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                                isMe
                                  ? 'bg-sky-700/60 border-sky-500 hover:bg-sky-700 text-white'
                                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-600 dark:bg-slate-800 dark:text-sky-400'}`}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{fileName}</p>
                                <p className={`text-[10px] ${isMe ? 'text-sky-100' : 'text-slate-400'}`}>
                                  Klik untuk Mengunduh Berkas
                                </p>
                              </div>
                              <Download className="h-4 w-4 shrink-0" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-slate-400 px-1">
                      <span>{new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && (
                        <CheckCheck className={`h-3 w-3 ${msg.isRead ? 'text-sky-500 font-bold' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 space-y-2">
              
              {/* File Attachment Badge Preview */}
              {attachedFile && (
                <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-950/40 p-2 px-3 rounded-xl border border-sky-200 dark:border-sky-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{attachedFile.fileName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({formatFileSize(attachedFile.fileSize)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* File Attachment Trigger Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className={`p-3 rounded-2xl border transition-all ${
                    attachedFile
                      ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 border-sky-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Pilih & Unggah Berkas Langsung"
                >
                  {uploadingFile ? <RefreshCw className="h-4 w-4 animate-spin text-sky-600" /> : <Paperclip className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  placeholder={attachedFile ? `Tambahkan pesan pendamping berkas...` : `Tulis pesan untuk ${activeTarget.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                />

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedFile) || sending || uploadingFile}
                  className="p-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all flex items-center justify-center"
                >
                  {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Pesan Chat Multi-Role</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Pilihlah kontak user atau grup role di panel sebelah kiri untuk mulai mengobrol dan mengirim berkas langsung.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
