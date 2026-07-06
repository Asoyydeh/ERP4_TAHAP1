export type Role = 'ADMIN' | 'STAFF';

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Asset {
  id: string;
  skuCode: string;
  name: string;
  categoryId: string;
  category: {
    name: string;
  };
  status: AssetStatus;
  location: string;
  price: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetLog {
  id: string;
  assetId: string;
  asset?: {
    name: string;
    skuCode: string;
  };
  userId: string;
  user?: {
    name: string;
  };
  actionType: string;
  notes?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalAssets: number;
  totalValue: number;
  statusCounts: {
    AVAILABLE: number;
    IN_USE: number;
    MAINTENANCE: number;
    RETIRED: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
  recentLogs: AssetLog[];
}
