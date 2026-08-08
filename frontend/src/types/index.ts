export type Role = 'ENGINEERING' | 'PROYEK_ADMIN' | 'PROCUREMENT' | 'FINANCE' | 'ADMIN_MONITORING' | 'SUPERADMIN' | 'HRD' | 'GA' | 'STAFF_GA' | 'PROJECT_MANAGER' | 'SUPERVISOR';

export type DocType = 'SPK' | 'PENAWARAN_FINAL' | 'DRAWING_AS_BUILT' | 'INVOICE' | 'SUBKON_DOCS' | 'RFQ_SCAN_KOSONG' | 'DRAWING' | 'FOTO' | 'RAB' | 'PENAWARAN_DRAFT' | 'BOQ' | 'FORECAST_COST';
export type DocStatus = 'DRAFT' | 'PENDING' | 'REVISED_BY_PROCUREMENT' | 'APPROVED' | 'REJECTED' | 'PO_PENDING' | 'PO_RELEASED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  address?: string | null;
  photoUrl?: string | null;
  managerId?: string | null;
  manager?: { role: string } | null;
  createdAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  client?: string;
  
  penawaranPicId?: string | null;
  penawaranDueDate?: string | null;
  boqPicId?: string | null;
  boqDueDate?: string | null;
  rfqPicId?: string | null;
  rfqDueDate?: string | null;
  spkPicId?: string | null;
  spkDueDate?: string | null;
  progressPicId?: string | null;
  progressDueDate?: string | null;
  invoicePicId?: string | null;
  invoiceDueDate?: string | null;
  
  createdAt: string;
  documents?: Document[];
  jobs?: ProjectJob[];
}

export interface ProjectJob {
  id: string;
  projectId: string;
  uraianPekerjaan?: string;
  rfqDate?: string;
  progress?: string;
  subkon1Nama?: string;
  subkon1Status?: string;
  subkon2Nama?: string;
  subkon2Status?: string;
  subkon3Nama?: string;
  subkon3Status?: string;
  remarks?: string;
}

export interface Document {
  id: string;
  projectId: string;
  project?: {
    name: string;
  };
  fileName: string;
  fileType: DocType;
  filePath: string;
  fileSize: number;
  uploadedById: string;
  uploadedBy?: {
    name: string;
    role: Role;
  };
  status: DocStatus;
  subFolderName?: string | null;
  createdAt: string;
  updatedAt: string;
  boqHeaders?: BoqHeader[];
  penawaranHeaders?: PenawaranHeader[];
  rfqHeaders?: RfqHeader[];
}

export interface BoqHeader {
  id: string;
  documentId: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items?: BoqItem[];
}

export interface BoqItem {
  id: string;
  boqHeaderId: string;
  wbsCode?: string;
  description: string;
  quantity: number;
  unit: string;
  rateEngineering: number;
  rateProcurement: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PenawaranHeader {
  id: string;
  documentId: string;
  vendorName: string;
  quoteNumber?: string;
  totalOffer: number;
  validityDate?: string;
  createdAt: string;
  items?: PenawaranItem[];
}

export interface PenawaranItem {
  id: string;
  penawaranHeaderId: string;
  itemNo: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface RfqHeader {
  id: string;
  documentId: string;
  rfqNumber: string;
  targetDate?: string;
  terms?: string;
  createdAt: string;
  items?: RfqItem[];
}

export interface RfqItem {
  id: string;
  rfqHeaderId: string;
  itemNo: number;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: {
    name: string;
    email: string;
    role: Role;
    photoUrl?: string;
  };
  actionType: string;
  tableName: string;
  recordId: string;
  description: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardStats {
  documentCount: number;
  projectCount: number;
  userCount: number;
  totalBoqAmount: number;
  totalPenawaranAmount: number;
}

export interface ProcurementTrackingItem {
  id: string;
  projectId: string;
  projectCode?: string;
  projectName?: string;
  reqBy?: string;
  description: string;
  tanggalDiminta?: string;
  tanggalDibutuhkan?: string;
  tanggalPoDibuat?: string;
  tanggalTibaDiLokasi?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
