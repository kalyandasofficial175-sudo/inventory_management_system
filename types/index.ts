import { Role, TxType } from "@prisma/client";

export type { Role, TxType };

export interface UserWithCount {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  _count: {
    products: number;
    transactions: number;
  };
}

export interface ProductWithUser {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isLowStock?: boolean;
}

export interface TransactionWithDetails {
  id: string;
  type: TxType;
  quantity: number;
  note: string | null;
  productId: string;
  userId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  totalUsers: number;
  recentTransactions: TransactionWithDetails[];
  stockByCategory: { category: string; total: number }[];
  transactionsOverTime: { date: string; IN: number; OUT: number; DAMAGED: number }[];
}

export interface ReportFilters {
  userId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  type?: TxType;
}
