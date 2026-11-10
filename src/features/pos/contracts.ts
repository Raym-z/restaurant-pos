import { z } from "zod";

/**
 * Runtime parsers for the backend M3 core POS contracts.
 *
 * Shapes mirror `restaurant-platform-backend` at
 * `agent/m3-core-pos-operations` (0131b3e):
 * - src/contracts/table/rpc.ts
 * - src/contracts/session/rpc.ts
 * - src/contracts/order/rpc.ts
 * - src/contracts/order/status.ts
 *
 * The backend remains authoritative. These parsers only protect the POS from
 * malformed or drifted responses; they are not an authorization boundary.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

export const UuidSchema = z.string().regex(UUID_PATTERN, "Must be a UUID");
export type Uuid = z.infer<typeof UuidSchema>;

export const InstantSchema = z.string().regex(INSTANT_PATTERN, "Must be an ISO-8601 instant");
export type Instant = z.infer<typeof InstantSchema>;

const NullableInstantSchema = InstantSchema.nullable();
const NonNegativeMinorUnitsSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OrderStatusSchema = z.enum(ORDER_STATUSES);

/**
 * Approved order-level transitions from the M3 backend. Cancellation is a
 * separate RPC and is only allowed from pending, accepted, preparing, or ready.
 */
export const ORDER_STATUS_TRANSITIONS = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["completed"],
  completed: [],
  cancelled: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>;

export const CANCELLABLE_ORDER_STATUSES: readonly OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
];

export const ORDER_ITEM_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "cancelled",
] as const;

export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

export const OrderItemStatusSchema = z.enum(ORDER_ITEM_STATUSES);

export const TABLE_AVAILABILITY_STATES = ["available", "occupied", "inactive"] as const;
export const TableAvailabilitySchema = z.enum(TABLE_AVAILABILITY_STATES);
export type TableAvailability = z.infer<typeof TableAvailabilitySchema>;

export const DINING_SESSION_STATUSES = ["active", "closed"] as const;
export const DiningSessionStatusSchema = z.enum(DINING_SESSION_STATUSES);
export type DiningSessionStatus = z.infer<typeof DiningSessionStatusSchema>;

const OrderSourceSchema = z.enum(["guest", "staff"]);

// Response objects intentionally strip unknown fields instead of rejecting them.
// Additive backend fields must not break the POS response boundary, while every
// request schema below remains strict.
export const OrderItemModifierSchema = z.object({
  modifierGroupId: UuidSchema,
  modifierOptionId: UuidSchema,
  groupName: z.string().min(1).max(200),
  optionName: z.string().min(1).max(200),
  priceDeltaMinor: z.number().int(),
});

export type OrderItemModifier = z.infer<typeof OrderItemModifierSchema>;

export const OrderItemSchema = z.object({
  orderItemId: UuidSchema,
  orderId: UuidSchema,
  menuItemId: UuidSchema,
  name: z.string().min(1).max(200),
  baseUnitPriceMinor: NonNegativeMinorUnitsSchema,
  modifierUnitDeltaMinor: z.number().int(),
  effectiveUnitPriceMinor: NonNegativeMinorUnitsSchema,
  quantity: z.number().int().min(1).max(99),
  lineTotalMinor: NonNegativeMinorUnitsSchema,
  currency: CurrencyCodeSchema,
  status: OrderItemStatusSchema,
  notes: z.string().max(500).nullable(),
  preparingAt: NullableInstantSchema,
  readyAt: NullableInstantSchema,
  servedAt: NullableInstantSchema,
  cancelledAt: NullableInstantSchema,
  cancellationReason: z.string().max(500).nullable(),
  modifiers: z.array(OrderItemModifierSchema),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSummarySchema = z.object({
  orderId: UuidSchema,
  orderReference: z.string().min(1).max(64),
  organizationId: UuidSchema,
  branchId: UuidSchema,
  diningSessionId: UuidSchema,
  source: OrderSourceSchema,
  status: OrderStatusSchema,
  currency: CurrencyCodeSchema,
  /**
   * Immutable historical item snapshot. For cancelled orders this remains for
   * audit but is not payable. Use payableSubtotalMinor for settlement amounts.
   */
  subtotalMinor: NonNegativeMinorUnitsSchema,
  /** Zero for cancelled orders; otherwise equal to subtotalMinor. */
  payableSubtotalMinor: NonNegativeMinorUnitsSchema,
  notes: z.string().max(1000).nullable(),
  itemCount: z.number().int().min(0),
  activeItemCount: z.number().int().min(0),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
  acceptedAt: NullableInstantSchema,
  preparingAt: NullableInstantSchema,
  readyAt: NullableInstantSchema,
  servedAt: NullableInstantSchema,
  completedAt: NullableInstantSchema,
  cancelledAt: NullableInstantSchema,
  cancellationReason: z.string().max(500).nullable(),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;

export const OrderDetailSchema = OrderSummarySchema.extend({
  submittedByStaffId: UuidSchema.nullable(),
  cancelledByStaffId: UuidSchema.nullable(),
  items: z.array(OrderItemSchema),
});

export type OrderDetail = z.infer<typeof OrderDetailSchema>;

export const DiningSessionSummarySchema = z.object({
  sessionId: UuidSchema,
  organizationId: UuidSchema,
  branchId: UuidSchema,
  branchName: z.string().min(1).max(200),
  tableId: UuidSchema,
  tableLabel: z.string().min(1).max(80),
  status: DiningSessionStatusSchema,
  openedAt: InstantSchema,
  closedAt: NullableInstantSchema,
  openedByStaffId: UuidSchema.nullable(),
  closedByStaffId: UuidSchema.nullable(),
  currency: CurrencyCodeSchema,
  orderCount: z.number().int().min(0),
  activeOrderCount: z.number().int().min(0),
  subtotalMinor: NonNegativeMinorUnitsSchema,
});

export type DiningSessionSummary = z.infer<typeof DiningSessionSummarySchema>;

export const DiningSessionDetailSchema = DiningSessionSummarySchema.extend({
  orders: z.array(OrderSummarySchema),
});

export type DiningSessionDetail = z.infer<typeof DiningSessionDetailSchema>;

export const TableSummarySchema = z.object({
  tableId: UuidSchema,
  organizationId: UuidSchema,
  branchId: UuidSchema,
  label: z.string().min(1).max(80),
  capacity: z.number().int().min(1).max(32767),
  status: z.enum(["active", "inactive"]),
  deactivatedAt: NullableInstantSchema,
  qrPublicId: UuidSchema.nullable(),
  availability: TableAvailabilitySchema,
  activeSessionId: UuidSchema.nullable(),
  activeSessionOpenedAt: NullableInstantSchema,
});

export type TableSummary = z.infer<typeof TableSummarySchema>;

export const ListBranchTablesResponseSchema = z.object({
  branchId: UuidSchema,
  tables: z.array(TableSummarySchema),
});

export type ListBranchTablesResponse = z.infer<typeof ListBranchTablesResponseSchema>;

export const TableInputSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    capacity: z.number().int().min(1).max(32767),
  })
  .strict();

export type TableInput = z.infer<typeof TableInputSchema>;

export const CreateTableResponseSchema = z.object({
  tableId: UuidSchema,
  branchId: UuidSchema,
  qrPublicId: UuidSchema,
});

export type CreateTableResponse = z.infer<typeof CreateTableResponseSchema>;

export const UpdateTableResponseSchema = z.object({
  tableId: UuidSchema,
  label: z.string().min(1).max(80),
  capacity: z.number().int().min(1).max(32767),
});

export type UpdateTableResponse = z.infer<typeof UpdateTableResponseSchema>;

export const DeactivateTableResponseSchema = z.object({
  tableId: UuidSchema,
  status: z.literal("inactive"),
});

export type DeactivateTableResponse = z.infer<typeof DeactivateTableResponseSchema>;

export const GetActiveDiningSessionResponseSchema = z.object({
  tableId: UuidSchema,
  activeSession: DiningSessionDetailSchema.nullable(),
});

export type GetActiveDiningSessionResponse = z.infer<typeof GetActiveDiningSessionResponseSchema>;

export const BranchOrderListResponseSchema = z.object({
  branchId: UuidSchema,
  orders: z.array(OrderSummarySchema),
  pageSize: z.number().int().min(1).max(100),
  hasMore: z.boolean(),
  nextOffset: z.number().int().min(0).nullable(),
});

export type BranchOrderListResponse = z.infer<typeof BranchOrderListResponseSchema>;

export const SessionOrderListResponseSchema = z.object({
  diningSessionId: UuidSchema,
  orders: z.array(OrderSummarySchema),
  pageSize: z.number().int().min(1).max(100),
  hasMore: z.boolean(),
  nextOffset: z.number().int().min(0).nullable(),
});

export type SessionOrderListResponse = z.infer<typeof SessionOrderListResponseSchema>;

export const BranchDiningSessionListResponseSchema = z.object({
  branchId: UuidSchema,
  sessions: z.array(DiningSessionSummarySchema),
  pageSize: z.number().int().min(1).max(100),
  hasMore: z.boolean(),
  nextOffset: z.number().int().min(0).nullable(),
});

export type BranchDiningSessionListResponse = z.infer<typeof BranchDiningSessionListResponseSchema>;

export const CreateOrderItemInputSchema = z
  .object({
    menuItemId: UuidSchema,
    quantity: z.number().int().min(1).max(99),
    modifierOptionIds: z.array(UuidSchema).max(50).default([]),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateOrderItemInput = z.infer<typeof CreateOrderItemInputSchema>;

export const CreateOrderInputSchema = z
  .object({
    diningSessionId: UuidSchema,
    items: z.array(CreateOrderItemInputSchema).min(1).max(100),
    notes: z.string().trim().max(1000).optional(),
    idempotencyKey: z
      .string()
      .min(16)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export const AddOrderItemInputSchema = z
  .object({
    orderId: UuidSchema,
    menuItemId: UuidSchema,
    quantity: z.number().int().min(1).max(99),
    modifierOptionIds: z.array(UuidSchema).max(50).default([]),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type AddOrderItemInput = z.infer<typeof AddOrderItemInputSchema>;

export const TRANSITION_TARGET_STATUSES = [
  "accepted",
  "preparing",
  "ready",
  "served",
  "completed",
] as const;

export const TransitionTargetStatusSchema = z.enum(TRANSITION_TARGET_STATUSES);
export type TransitionTargetStatus = z.infer<typeof TransitionTargetStatusSchema>;

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function nextOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status];
}

/**
 * Backend rule: served/completed require at least one non-cancelled item.
 * Such orders must be cancelled instead of being marked fulfilled.
 */
export function nextOrderStatusesForItems(
  status: OrderStatus,
  activeItemCount: number,
): readonly OrderStatus[] {
  return nextOrderStatuses(status).filter(
    (target) => (target !== "served" && target !== "completed") || activeItemCount > 0,
  );
}

export function isCancellableOrderStatus(status: OrderStatus): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}
