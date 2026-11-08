import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BranchOrderListResponseSchema,
  CreateOrderInputSchema,
  DiningSessionDetailSchema,
  OrderDetailSchema,
  OrderStatusSchema,
  TableSummarySchema,
  nextOrderStatuses,
  nextOrderStatusesForItems,
  isCancellableOrderStatus,
} from "../contracts";

const id = (suffix: number): string =>
  `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;

const orderSummary = {
  orderId: id(1),
  orderReference: "ORD-00000001",
  organizationId: id(2),
  branchId: id(3),
  diningSessionId: id(4),
  source: "staff" as const,
  status: "pending" as const,
  currency: "IDR",
  subtotalMinor: 50000,
  payableSubtotalMinor: 50000,
  notes: null,
  itemCount: 1,
  activeItemCount: 1,
  createdAt: "2026-11-08T10:00:00Z",
  updatedAt: "2026-11-08T10:00:00.123456+07:00",
  acceptedAt: null,
  preparingAt: null,
  readyAt: null,
  servedAt: null,
  completedAt: null,
  cancelledAt: null,
  cancellationReason: null,
};

const orderDetail = {
  ...orderSummary,
  submittedByStaffId: id(5),
  cancelledByStaffId: null,
  items: [
    {
      orderItemId: id(6),
      orderId: id(1),
      menuItemId: id(7),
      name: "Nasi Goreng",
      baseUnitPriceMinor: 50000,
      modifierUnitDeltaMinor: 5000,
      effectiveUnitPriceMinor: 55000,
      quantity: 2,
      lineTotalMinor: 110000,
      currency: "IDR",
      status: "pending",
      notes: "No chili",
      preparingAt: null,
      readyAt: null,
      servedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      modifiers: [
        {
          modifierGroupId: id(8),
          modifierOptionId: id(9),
          groupName: "Spice level",
          optionName: "Mild",
          priceDeltaMinor: 5000,
        },
      ],
    },
  ],
};

function sessionDetail() {
  return {
    sessionId: id(4),
    organizationId: id(2),
    branchId: id(3),
    branchName: "Downtown",
    tableId: id(10),
    tableLabel: "T1",
    status: "active",
    openedAt: "2026-11-08T09:00:00Z",
    closedAt: null,
    openedByStaffId: id(5),
    closedByStaffId: null,
    currency: "IDR",
    orderCount: 1,
    activeOrderCount: 1,
    subtotalMinor: 110000,
    orders: [orderSummary],
  };
}

test("order details parse the backend snapshot shape", () => {
  const parsed = OrderDetailSchema.parse(orderDetail);
  assert.equal(parsed.items[0]?.lineTotalMinor, 110000);
  assert.equal(parsed.items[0]?.modifiers[0]?.optionName, "Mild");
  assert.equal(parsed.updatedAt, "2026-11-08T10:00:00.123456+07:00");
});

test("order responses accept additive backend fields but requests stay strict", () => {
  const parsed = OrderDetailSchema.parse({
    ...orderDetail,
    futureBackendField: "ignored",
    items: [{ ...orderDetail.items[0], futureItemField: true }],
  });

  assert.equal(parsed.orderId, id(1));
  assert.equal(
    CreateOrderInputSchema.safeParse({
      diningSessionId: id(4),
      items: [{ menuItemId: id(7), quantity: 1, clientPriceMinor: 1 }],
    }).success,
    false,
  );
});

test("cancelled orders retain historical subtotal and expose zero payable", () => {
  const parsed = OrderDetailSchema.parse({
    ...orderDetail,
    status: "cancelled",
    subtotalMinor: 110000,
    payableSubtotalMinor: 0,
    cancelledAt: "2026-11-08T10:30:00Z",
    cancellationReason: "Guest left",
  });

  assert.equal(parsed.subtotalMinor, 110000);
  assert.equal(parsed.payableSubtotalMinor, 0);
});

test("branch order lists parse payable summaries and pagination metadata", () => {
  const parsed = BranchOrderListResponseSchema.parse({
    branchId: id(3),
    orders: [orderSummary],
    pageSize: 50,
    hasMore: true,
    nextOffset: 50,
  });

  assert.equal(parsed.orders[0]?.payableSubtotalMinor, 50000);
  assert.equal(parsed.nextOffset, 50);
});

test("dining session details parse active sessions with order summaries", () => {
  const parsed = DiningSessionDetailSchema.parse(sessionDetail());
  assert.equal(parsed.status, "active");
  assert.equal(parsed.orders.length, 1);
});

test("table summaries carry availability and active session metadata", () => {
  const parsed = TableSummarySchema.parse({
    tableId: id(10),
    organizationId: id(2),
    branchId: id(3),
    label: "T1",
    capacity: 4,
    status: "active",
    deactivatedAt: null,
    qrPublicId: id(11),
    availability: "occupied",
    activeSessionId: id(4),
    activeSessionOpenedAt: "2026-11-08T09:00:00Z",
  });

  assert.equal(parsed.availability, "occupied");
  assert.equal(parsed.activeSessionId, id(4));
});

test("the published transition map matches the M3 state machine", () => {
  assert.deepEqual(nextOrderStatuses("pending"), ["accepted", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("accepted"), ["preparing", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("preparing"), ["ready", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("ready"), ["served", "cancelled"]);
  assert.deepEqual(nextOrderStatuses("served"), ["completed"]);
  assert.deepEqual(nextOrderStatuses("completed"), []);
  assert.deepEqual(nextOrderStatuses("cancelled"), []);
});

test("served and completed are hidden when no non-cancelled items remain", () => {
  assert.deepEqual(nextOrderStatusesForItems("ready", 1), ["served", "cancelled"]);
  assert.deepEqual(nextOrderStatusesForItems("ready", 0), ["cancelled"]);
  assert.deepEqual(nextOrderStatusesForItems("served", 1), ["completed"]);
  assert.deepEqual(nextOrderStatusesForItems("served", 0), []);
});

test("cancellation is limited to pre-service statuses", () => {
  assert.equal(isCancellableOrderStatus("pending"), true);
  assert.equal(isCancellableOrderStatus("accepted"), true);
  assert.equal(isCancellableOrderStatus("preparing"), true);
  assert.equal(isCancellableOrderStatus("ready"), true);
  assert.equal(isCancellableOrderStatus("served"), false);
  assert.equal(isCancellableOrderStatus("completed"), false);
  assert.equal(isCancellableOrderStatus("cancelled"), false);
});

test("unknown order statuses are rejected", () => {
  assert.equal(OrderStatusSchema.safeParse("confirmed").success, false);
  assert.equal(OrderStatusSchema.safeParse("accepted").success, true);
});
