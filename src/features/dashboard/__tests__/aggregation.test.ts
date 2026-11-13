import assert from "node:assert/strict";
import test from "node:test";

import type { OrderStatus, OrderSummary, TableSummary } from "@/features/pos/contracts";

import {
  buildDashboardAlerts,
  buildDashboardData,
  countOrdersByStatus,
  summarizeBranch,
  summarizeQueue,
  toBranchPerformance,
} from "../aggregation";
import type { DashboardBranchSource, DashboardRange } from "../types";

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const BRANCH_ID = "00000000-0000-4000-8000-000000000002";

const range: DashboardRange = {
  preset: "7d",
  timezone: "Asia/Jakarta",
  from: "2026-11-06T17:00:00.000Z",
  to: "2026-11-13T17:00:00.000Z",
  fromLocalDate: "2026-11-07",
  toLocalDate: "2026-11-13",
};

function order(
  overrides: Partial<OrderSummary> & Pick<OrderSummary, "orderId" | "diningSessionId">,
): OrderSummary {
  const status: OrderStatus = overrides.status ?? "pending";
  return {
    orderId: overrides.orderId,
    orderReference: overrides.orderReference ?? `ORD-${overrides.orderId.slice(-4)}`,
    organizationId: ORG_ID,
    branchId: BRANCH_ID,
    diningSessionId: overrides.diningSessionId,
    source: "staff",
    status,
    currency: "IDR",
    subtotalMinor: overrides.subtotalMinor ?? 0,
    payableSubtotalMinor: overrides.payableSubtotalMinor ?? 0,
    notes: null,
    itemCount: 1,
    activeItemCount: 1,
    createdAt: overrides.createdAt ?? "2026-11-13T03:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-11-13T03:00:00.000Z",
    acceptedAt: null,
    preparingAt: null,
    readyAt: null,
    servedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null,
  };
}

function table(
  overrides: Partial<TableSummary> & Pick<TableSummary, "tableId" | "label">,
): TableSummary {
  return {
    tableId: overrides.tableId,
    organizationId: ORG_ID,
    branchId: BRANCH_ID,
    label: overrides.label,
    capacity: 4,
    status: overrides.status ?? "active",
    deactivatedAt: overrides.deactivatedAt ?? null,
    qrPublicId: null,
    availability: overrides.availability ?? "available",
    activeSessionId: overrides.activeSessionId ?? null,
    activeSessionOpenedAt: overrides.activeSessionOpenedAt ?? null,
  };
}

const orders = [
  order({
    orderId: "10000000-0000-4000-8000-000000000001",
    orderReference: "ORD-1",
    diningSessionId: "s1",
    status: "pending",
    subtotalMinor: 53000,
    payableSubtotalMinor: 53000,
    createdAt: "2026-11-13T03:00:00.000Z",
  }),
  order({
    orderId: "10000000-0000-4000-8000-000000000002",
    orderReference: "ORD-2",
    diningSessionId: "s2",
    status: "completed",
    subtotalMinor: 120000,
    payableSubtotalMinor: 120000,
    createdAt: "2026-11-11T03:00:00.000Z",
  }),
  order({
    orderId: "10000000-0000-4000-8000-000000000003",
    orderReference: "ORD-3",
    diningSessionId: "s1",
    status: "cancelled",
    subtotalMinor: 60000,
    payableSubtotalMinor: 0,
    createdAt: "2026-11-13T02:00:00.000Z",
  }),
  order({
    orderId: "10000000-0000-4000-8000-000000000004",
    orderReference: "ORD-4",
    diningSessionId: "s3",
    status: "ready",
    subtotalMinor: 86000,
    payableSubtotalMinor: 86000,
    createdAt: "2026-11-13T04:00:00.000Z",
  }),
];

const tables = [
  table({
    tableId: "t1",
    label: "A01",
    availability: "available",
  }),
  table({
    tableId: "t2",
    label: "A02",
    availability: "occupied",
    activeSessionId: "s1",
    activeSessionOpenedAt: "2026-11-13T02:30:00.000Z",
  }),
  table({
    tableId: "t3",
    label: "A03",
    availability: "occupied",
    activeSessionId: "s3",
    activeSessionOpenedAt: "2026-11-13T03:00:00.000Z",
  }),
  table({
    tableId: "t4",
    label: "A04",
    status: "inactive",
    availability: "inactive",
    deactivatedAt: "2026-11-10T00:00:00.000Z",
  }),
];

const source: DashboardBranchSource = {
  branchId: BRANCH_ID,
  branchName: "Demo Branch",
  timezone: "Asia/Jakarta",
  currency: "IDR",
  orders,
  tables,
  sessions: [
    { sessionId: "s2", tableLabel: "A06" },
    { sessionId: "s3", tableLabel: "A03" },
  ],
  ordersTruncated: false,
};

test("status counts include every supported order status", () => {
  assert.deepEqual(countOrdersByStatus(orders), {
    pending: 1,
    accepted: 0,
    preparing: 0,
    ready: 1,
    served: 0,
    completed: 1,
    cancelled: 1,
  });
});

test("branch summary calculates operational counts without treating cancellations as revenue", () => {
  const snapshot = summarizeBranch(source);

  assert.equal(snapshot.totalOrders, 4);
  assert.equal(snapshot.activeOrders, 2);
  assert.equal(snapshot.completedOrders, 1);
  assert.equal(snapshot.cancelledOrders, 1);
  assert.equal(snapshot.averageOrderValueMinor, Math.round((53000 + 120000 + 86000) / 3));
  assert.equal(snapshot.totalTables, 3);
  assert.equal(snapshot.occupiedTables, 2);
  assert.equal(snapshot.availableTables, 1);
  assert.equal(snapshot.activeSessions, 2);
  assert.equal(snapshot.occupancyRate, 2 / 3);
  assert.deepEqual(snapshot.occupiedTableLabels, ["A02", "A03"]);
  assert.equal(snapshot.ordersTruncated, false);
});

test("recent orders resolve table labels from sessions and active tables", () => {
  const snapshot = summarizeBranch(source);

  assert.deepEqual(
    snapshot.recentOrders.map((entry) => [entry.orderReference, entry.tableLabel]),
    [
      ["ORD-4", "A03"],
      ["ORD-1", "A02"],
      ["ORD-3", "A02"],
      ["ORD-2", "A06"],
    ],
  );
});

test("an empty branch produces zero-valued metrics and no alerts", () => {
  const snapshot = summarizeBranch({
    ...source,
    orders: [],
    tables: [],
    sessions: [],
  });

  assert.equal(snapshot.totalOrders, 0);
  assert.equal(snapshot.averageOrderValueMinor, null);
  assert.equal(snapshot.totalTables, 0);
  assert.equal(snapshot.occupancyRate, 0);
  assert.deepEqual(snapshot.recentOrders, []);
  assert.deepEqual(buildDashboardAlerts(snapshot, { available: false, reason: "role" }), []);
});

test("alerts are derived from current records and include queue party and guest counts", () => {
  const snapshot = summarizeBranch(source);
  const queue = summarizeQueue(
    [
      {
        entryId: "e1",
        branchId: BRANCH_ID,
        source: "walk_in",
        status: "waiting",
        partySize: 4,
        displayName: "Guest A",
        contactPhone: null,
        contactPhoneMasked: true,
        joinedAt: "2026-11-13T03:00:00.000Z",
        notifiedAt: null,
        position: 1,
        elapsedMinutes: 12,
      },
      {
        entryId: "e2",
        branchId: BRANCH_ID,
        source: "customer",
        status: "notified",
        partySize: 2,
        displayName: "Guest B",
        contactPhone: null,
        contactPhoneMasked: true,
        joinedAt: "2026-11-13T03:05:00.000Z",
        notifiedAt: "2026-11-13T03:10:00.000Z",
        position: 2,
        elapsedMinutes: 7,
      },
    ],
    true,
  );

  assert.deepEqual(queue, {
    available: true,
    activeEntries: 2,
    waitingGuests: 6,
    hasMore: true,
  });
  assert.deepEqual(buildDashboardAlerts(snapshot, queue), [
    { kind: "pending-orders", count: 1 },
    { kind: "ready-orders", count: 1 },
    { kind: "waitlist", count: 2, guests: 6, truncated: true },
    { kind: "occupied-tables", count: 2 },
  ]);
});

test("branch performance exposes only operational metrics", () => {
  const performance = toBranchPerformance(summarizeBranch(source));

  assert.deepEqual(performance, {
    branchId: BRANCH_ID,
    branchName: "Demo Branch",
    timezone: "Asia/Jakarta",
    totalOrders: 4,
    activeOrders: 2,
    activeSessions: 2,
    occupiedTables: 2,
    availableTables: 1,
    totalTables: 3,
    occupancyRate: 2 / 3,
  });
  assert.equal("revenue" in performance, false);
});

test("dashboard data reports sales as unavailable rather than deriving revenue from orders", () => {
  const snapshot = summarizeBranch(source);
  const data = buildDashboardData({
    asOf: "2026-11-13T05:00:00.000Z",
    range,
    current: snapshot,
    branchSnapshots: [snapshot],
    branchPerformanceUnavailable: 0,
    queue: { available: false, reason: "role" },
  });

  assert.deepEqual(data.sales, {
    available: false,
    reason: "NO_SETTLEMENT_CONTRACT",
  });
  assert.equal(data.branchPerformance.length, 1);
  assert.equal(data.branchPerformanceUnavailable, 0);
});
