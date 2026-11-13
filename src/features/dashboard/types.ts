import type { CurrencyCode } from "@/lib/currency";
import type { OrderStatus, OrderSummary, TableSummary } from "@/features/pos/contracts";
import type { WorkspaceBranch } from "@/features/workspace/types";
import type { StaffRole } from "@/types/roles";

export const DASHBOARD_RANGE_PRESETS = ["today", "7d", "30d"] as const;

export type DashboardRangePreset = (typeof DASHBOARD_RANGE_PRESETS)[number];

export interface DashboardRange {
  preset: DashboardRangePreset;
  /** Branch-local timezone used to calculate the boundaries. */
  timezone: string;
  /** Inclusive UTC instant. */
  from: string;
  /** Exclusive UTC instant. */
  to: string;
  /** Branch-local calendar date for the first included day. */
  fromLocalDate: string;
  /** Branch-local calendar date for the last included day. */
  toLocalDate: string;
}

export interface DashboardViewer {
  roles: readonly StaffRole[];
  branchId: string;
  branchName: string;
  branches: WorkspaceBranch[];
  timezone: string;
  currency: CurrencyCode;
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}

export type DashboardViewerResult =
  | { status: "ready"; viewer: DashboardViewer }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: DashboardActionError };

export interface DashboardActionError {
  code: string;
  message: string;
  retryable: boolean;
}

export type DashboardLoadResult<T> =
  { ok: true; data: T } | { ok: false; error: DashboardActionError };

export interface DashboardOrder {
  orderId: string;
  orderReference: string;
  diningSessionId: string;
  tableLabel: string | null;
  status: OrderStatus;
  currency: CurrencyCode;
  payableSubtotalMinor: number;
  createdAt: string;
}

export interface DashboardBranchSnapshot {
  branchId: string;
  branchName: string;
  timezone: string;
  currency: CurrencyCode;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  /** Average payable order subtotal. Never treated as settled revenue. */
  averageOrderValueMinor: number | null;
  statusCounts: Record<OrderStatus, number>;
  activeSessions: number;
  occupiedTables: number;
  availableTables: number;
  totalTables: number;
  occupancyRate: number;
  occupiedTableLabels: string[];
  recentOrders: DashboardOrder[];
  ordersTruncated: boolean;
}

export interface DashboardBranchPerformance {
  branchId: string;
  branchName: string;
  timezone: string;
  totalOrders: number;
  activeOrders: number;
  activeSessions: number;
  occupiedTables: number;
  availableTables: number;
  totalTables: number;
  occupancyRate: number;
}

export type DashboardAlertKind = "pending-orders" | "ready-orders" | "waitlist" | "occupied-tables";

export interface DashboardAlert {
  kind: DashboardAlertKind;
  count: number;
  /** Present for waitlist alerts: total party size in the active queue. */
  guests?: number;
  /** True when the active queue exceeded the bounded dashboard read. */
  truncated?: boolean;
}

export type DashboardQueueUnavailableReason = "role" | "unavailable";

export type DashboardQueueSummary =
  | {
      available: true;
      activeEntries: number;
      waitingGuests: number;
      hasMore: boolean;
    }
  | {
      available: false;
      reason: DashboardQueueUnavailableReason;
    };

export interface DashboardSalesStatus {
  available: false;
  reason: "NO_SETTLEMENT_CONTRACT";
}

export interface DashboardData {
  asOf: string;
  range: DashboardRange;
  current: DashboardBranchSnapshot;
  branchPerformance: DashboardBranchPerformance[];
  /** Branches whose branch-level reads failed and were omitted. */
  branchPerformanceUnavailable: number;
  alerts: DashboardAlert[];
  queue: DashboardQueueSummary;
  sales: DashboardSalesStatus;
}

export interface DashboardBranchSource {
  branchId: string;
  branchName: string;
  timezone: string;
  currency: CurrencyCode;
  orders: readonly OrderSummary[];
  tables: TableSummary[];
  sessions: DashboardSession[];
  ordersTruncated: boolean;
}

/** Minimal session shape required to resolve table labels for order rows. */
export interface DashboardSession {
  sessionId: string;
  tableLabel: string;
}
