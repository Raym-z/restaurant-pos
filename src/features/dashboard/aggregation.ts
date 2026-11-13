import type { OrderStatus, OrderSummary, TableSummary } from "@/features/pos/contracts";
import type { QueueEntry } from "@/features/queue/contracts";

import type {
  DashboardAlert,
  DashboardBranchPerformance,
  DashboardBranchSnapshot,
  DashboardBranchSource,
  DashboardData,
  DashboardOrder,
  DashboardQueueSummary,
  DashboardRange,
  DashboardSession,
} from "./types";

export const DASHBOARD_ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
];

const DASHBOARD_ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
];

export const DASHBOARD_RECENT_ORDER_LIMIT = 8;

function emptyStatusCounts(): Record<OrderStatus, number> {
  return {
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    completed: 0,
    cancelled: 0,
  };
}

export function countOrdersByStatus(
  orders: readonly Pick<OrderSummary, "status">[],
): Record<OrderStatus, number> {
  const counts = emptyStatusCounts();
  for (const order of orders) {
    counts[order.status] += 1;
  }
  return counts;
}

export function isDashboardActiveOrder(status: OrderStatus): boolean {
  return DASHBOARD_ACTIVE_ORDER_STATUSES.includes(status);
}

function sessionTableLabels(
  sessions: readonly DashboardSession[],
  tables: readonly TableSummary[],
): Map<string, string> {
  const labels = new Map<string, string>();

  for (const session of sessions) {
    labels.set(session.sessionId, session.tableLabel);
  }

  for (const table of tables) {
    if (table.activeSessionId) {
      labels.set(table.activeSessionId, table.label);
    }
  }

  return labels;
}

function toDashboardOrder(
  order: OrderSummary,
  tableLabels: ReadonlyMap<string, string>,
): DashboardOrder {
  return {
    orderId: order.orderId,
    orderReference: order.orderReference,
    diningSessionId: order.diningSessionId,
    tableLabel: tableLabels.get(order.diningSessionId) ?? null,
    status: order.status,
    currency: order.currency,
    payableSubtotalMinor: order.payableSubtotalMinor,
    createdAt: order.createdAt,
  };
}

function tableStats(tables: readonly TableSummary[]) {
  const activeTables = tables.filter((table) => table.status === "active");
  const occupied = activeTables.filter((table) => table.availability === "occupied");
  const available = activeTables.filter((table) => table.availability === "available");
  const total = activeTables.length;

  return {
    total,
    occupied: occupied.length,
    available: available.length,
    activeSessions: activeTables.filter((table) => table.activeSessionId !== null).length,
    occupancyRate: total > 0 ? occupied.length / total : 0,
    occupiedLabels: occupied
      .map((table) => table.label)
      .sort((left, right) => left.localeCompare(right)),
  };
}

export function summarizeBranch(source: DashboardBranchSource): DashboardBranchSnapshot {
  const statusCounts = countOrdersByStatus(source.orders);
  const activeOrders = source.orders.filter((order) => isDashboardActiveOrder(order.status)).length;
  const payableOrders = source.orders.filter((order) => order.status !== "cancelled");
  const payableTotal = payableOrders.reduce((sum, order) => sum + order.payableSubtotalMinor, 0);
  const averageOrderValueMinor =
    payableOrders.length > 0 ? Math.round(payableTotal / payableOrders.length) : null;
  const tables = tableStats(source.tables);
  const tableLabels = sessionTableLabels(source.sessions, source.tables);
  const recentOrders = [...source.orders]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, DASHBOARD_RECENT_ORDER_LIMIT)
    .map((order) => toDashboardOrder(order, tableLabels));

  return {
    branchId: source.branchId,
    branchName: source.branchName,
    timezone: source.timezone,
    currency: source.currency,
    totalOrders: source.orders.length,
    activeOrders,
    completedOrders: statusCounts.completed,
    cancelledOrders: statusCounts.cancelled,
    averageOrderValueMinor,
    statusCounts,
    activeSessions: tables.activeSessions,
    occupiedTables: tables.occupied,
    availableTables: tables.available,
    totalTables: tables.total,
    occupancyRate: tables.occupancyRate,
    occupiedTableLabels: tables.occupiedLabels,
    recentOrders,
    ordersTruncated: source.ordersTruncated,
  };
}

export function toBranchPerformance(snapshot: DashboardBranchSnapshot): DashboardBranchPerformance {
  return {
    branchId: snapshot.branchId,
    branchName: snapshot.branchName,
    timezone: snapshot.timezone,
    totalOrders: snapshot.totalOrders,
    activeOrders: snapshot.activeOrders,
    activeSessions: snapshot.activeSessions,
    occupiedTables: snapshot.occupiedTables,
    availableTables: snapshot.availableTables,
    totalTables: snapshot.totalTables,
    occupancyRate: snapshot.occupancyRate,
  };
}

export function summarizeQueue(
  entries: readonly QueueEntry[],
  hasMore: boolean,
): DashboardQueueSummary {
  return {
    available: true,
    activeEntries: entries.length,
    waitingGuests: entries.reduce((sum, entry) => sum + entry.partySize, 0),
    hasMore,
  };
}

export function buildDashboardAlerts(
  snapshot: DashboardBranchSnapshot,
  queue: DashboardQueueSummary,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (snapshot.statusCounts.pending > 0) {
    alerts.push({ kind: "pending-orders", count: snapshot.statusCounts.pending });
  }

  if (snapshot.statusCounts.ready > 0) {
    alerts.push({ kind: "ready-orders", count: snapshot.statusCounts.ready });
  }

  if (queue.available && queue.activeEntries > 0) {
    alerts.push({
      kind: "waitlist",
      count: queue.activeEntries,
      guests: queue.waitingGuests,
      truncated: queue.hasMore,
    });
  }

  if (snapshot.occupiedTables > 0) {
    alerts.push({ kind: "occupied-tables", count: snapshot.occupiedTables });
  }

  return alerts;
}

export function buildDashboardData({
  asOf,
  range,
  current,
  branchSnapshots,
  branchPerformanceUnavailable,
  queue,
}: {
  asOf: string;
  range: DashboardRange;
  current: DashboardBranchSnapshot;
  branchSnapshots: readonly DashboardBranchSnapshot[];
  branchPerformanceUnavailable: number;
  queue: DashboardQueueSummary;
}): DashboardData {
  return {
    asOf,
    range,
    current,
    branchPerformance: branchSnapshots.map(toBranchPerformance),
    branchPerformanceUnavailable,
    alerts: buildDashboardAlerts(current, queue),
    queue,
    sales: { available: false, reason: "NO_SETTLEMENT_CONTRACT" },
  };
}

export function dashboardOrderStatuses(): readonly OrderStatus[] {
  return DASHBOARD_ORDER_STATUSES;
}
