export type Role = 'ENGINEERING' | 'PROYEK_ADMIN' | 'PROCUREMENT' | 'FINANCE' | 'ADMIN_MONITORING' | 'SUPERADMIN';

export type DocType = 'GAMBAR' | 'PENAWARAN' | 'BOQ' | 'RFQ' | 'PO';
export type DocStatus = 'DRAFT' | 'PENDING' | 'REVISED_BY_PROCUREMENT' | 'APPROVED' | 'REJECTED' | 'PO_PENDING' | 'PO_RELEASED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
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
