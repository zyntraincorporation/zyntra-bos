// ============================================================
// All shared TypeScript types for Puspaloy Business OS
// ============================================================

export type ProductCategory = 'Cosmetics' | 'Gift' | 'Fashion' | 'Others';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Courier Submitted'
  | 'Delivered'
  | 'Returned'
  | 'Cancelled';

export type OrderSource = 'Facebook' | 'Telegram' | 'Manual';

export type AdPlatform = 'Facebook' | 'Instagram';

export type CampaignType =
  | 'Messaging Campaign'
  | 'Website Sales'
  | 'Engagement'
  | 'Awareness'
  | 'Retargeting';

export type ExpenseCategory =
  | 'Facebook Ads'
  | 'Packaging'
  | 'Courier'
  | 'Website Maintenance'
  | 'Domain'
  | 'Hosting'
  | 'Internet'
  | 'Misc'
  | 'Others';

export type ReturnReason =
  | 'Customer refused'
  | 'Wrong item'
  | 'Damaged'
  | 'Other';

export type InvestmentPerson = 'Nirob' | 'Partner';

// ── Product ──────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  image: string;
  supplier: string;
  createdAt: string;
}

// ── Order ────────────────────────────────────────────────────
export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  status: OrderStatus;
  source: OrderSource;
  courierTracking: string;
  courierSubmittedAt?: string;
  note?: string;
  createdAt: string;
}

// ── Purchase ─────────────────────────────────────────────────
export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  supplier: string;
  quantity: number;
  purchasePricePerUnit: number;
  totalCost: number;
  date: string;
  createdAt: string;
}

// ── Expense ──────────────────────────────────────────────────
export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

// ── Ad Spend ─────────────────────────────────────────────────
export interface AdSpend {
  id: string;
  productId: string;
  productName: string;
  platform: AdPlatform;
  campaignType: CampaignType;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

// ── Customer ─────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpending: number;
  lastOrderDate: string;
  createdAt: string;
}

// ── Investment ───────────────────────────────────────────────
export interface Investment {
  id: string;
  person: InvestmentPerson;
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

// ── Return ───────────────────────────────────────────────────
export interface Return {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  productName: string;
  quantity: number;
  amount: number;
  returnReason: ReturnReason;
  returnedAt: string;
}

// ── Dashboard ────────────────────────────────────────────────
export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  profitToday: number;
  adSpendToday: number;
  currentCashBalance: number;
  inventoryValue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
}

export interface DailyChartPoint {
  date: string;       // e.g. "Jun 01"
  revenue: number;
  adSpend: number;
}

// ── AI Parse ─────────────────────────────────────────────────
export interface ParsedOrder {
  customerName?: string;
  phone?: string;
  address?: string;
  product?: string;
  quantity?: number;
  missingFields: string[];
}
