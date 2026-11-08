import type {
  BranchLocalDate,
  CurrencyCode,
  IsoInstant,
  Money,
  Uuid,
} from "@/features/shared/domain";

export type MetricFormat = "currency" | "number";

export interface DashboardMetric {
  id: string;
  label: string;
  value: number;
  format: MetricFormat;
  currency?: CurrencyCode;
  /** Percentage change as a fraction, e.g. 0.124 for +12.4%. */
  changeRatio: number | null;
  comparisonLabel: string;
}

export interface SalesTrendPoint {
  date: BranchLocalDate;
  revenue: Money;
  orders: number;
}

export interface BranchPerformance {
  branchId: Uuid;
  revenue: Money;
  orders: number;
  averageOrderValue: Money;
  /** Fraction of organization revenue, e.g. 0.487 for 48.7%. */
  revenueShare: number;
  changeRatio: number;
}

export type DashboardOrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export interface RecentOrder {
  id: Uuid;
  orderNumber: string;
  branchId: Uuid;
  tableLabel: string;
  status: DashboardOrderStatus;
  total: Money;
  placedAt: IsoInstant;
}

export interface TopSellingItem {
  menuItemId: Uuid;
  name: string;
  categoryName: string;
  quantitySold: number;
  revenue: Money;
}

export type AttentionTone = "info" | "warning";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  title: string;
  description: string;
  branchId: Uuid | null;
}

export interface OperationalSnapshot {
  kitchenOpenOrders: number;
  tablesSeated: number;
  tablesTotal: number;
  guestsWaiting: number;
  staffOnShift: number;
}

export interface DashboardData {
  asOf: IsoInstant;
  metrics: DashboardMetric[];
  salesTrend: SalesTrendPoint[];
  branchPerformance: BranchPerformance[];
  topSellingItems: TopSellingItem[];
  recentOrders: RecentOrder[];
  attentionItems: AttentionItem[];
  operationalSnapshot: OperationalSnapshot;
  comparisonWindowLabel: string;
}

export const DASHBOARD_ORDER_STATUS_LABELS: Record<DashboardOrderStatus, string> = {
  new: "New",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};
