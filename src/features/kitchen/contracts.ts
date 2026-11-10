import { z } from "zod";

import { InstantSchema, OrderStatusSchema, UuidSchema } from "@/features/pos/contracts";

/**
 * Runtime parsers for the backend M4.2/M4.3 kitchen contracts.
 *
 * Source of truth:
 * `restaurant-platform-backend` migrations 20261109160000, 20261109170000,
 * 20261109180000, 20261110120000, and 20261110130000.
 *
 * KDS responses intentionally exclude financial data. Unknown response fields
 * are stripped so additive backend fields do not break the board, while
 * requests below remain strict.
 */

const NullableInstantSchema = InstantSchema.nullable();

export const KITCHEN_TICKET_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type KitchenTicketStatus = (typeof KITCHEN_TICKET_STATUSES)[number];

export const KitchenTicketStatusSchema = z.enum(KITCHEN_TICKET_STATUSES);

export const KITCHEN_TICKET_ITEM_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type KitchenTicketItemStatus = (typeof KITCHEN_TICKET_ITEM_STATUSES)[number];

export const KitchenTicketItemStatusSchema = z.enum(KITCHEN_TICKET_ITEM_STATUSES);

/** Active board statuses supported by M4.3 without a history window. */
export const KITCHEN_ACTIVE_STATUSES = ["pending", "preparing", "ready"] as const;

export type KitchenActiveStatus = (typeof KITCHEN_ACTIVE_STATUSES)[number];

export const KITCHEN_HISTORY_STATUSES = ["completed", "cancelled"] as const;

export type KitchenHistoryStatus = (typeof KITCHEN_HISTORY_STATUSES)[number];

export const KITCHEN_ITEM_TRANSITION_TARGETS = ["preparing", "ready", "completed"] as const;

export type KitchenItemTransitionTarget = (typeof KITCHEN_ITEM_TRANSITION_TARGETS)[number];

export const KITCHEN_BOARD_PAGE_SIZE = 50;
export const KITCHEN_BOARD_MAX_PAGE_SIZE = 100;

const KitchenModifierSchema = z.object({
  modifierGroupId: UuidSchema,
  modifierOptionId: UuidSchema,
  groupName: z.string().min(1).max(200),
  optionName: z.string().min(1).max(200),
});

export type KitchenModifier = z.infer<typeof KitchenModifierSchema>;

export const KitchenTicketItemSchema = z.object({
  ticketItemId: UuidSchema,
  ticketId: UuidSchema,
  orderItemId: UuidSchema,
  menuItemId: UuidSchema,
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).nullable(),
  status: KitchenTicketItemStatusSchema,
  startedAt: NullableInstantSchema,
  readyAt: NullableInstantSchema,
  completedAt: NullableInstantSchema,
  cancelledAt: NullableInstantSchema,
  cancelledByActorType: z.enum(["staff", "system"]).nullable(),
  cancelledByStaffId: UuidSchema.nullable(),
  cancellationReason: z.string().max(500).nullable(),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
  modifiers: z.array(KitchenModifierSchema),
});

export type KitchenTicketItem = z.infer<typeof KitchenTicketItemSchema>;

export const KitchenOrderContextSchema = z.object({
  orderId: UuidSchema,
  orderReference: z.string().min(1).max(64),
  status: OrderStatusSchema,
  source: z.enum(["guest", "staff"]),
  acceptedAt: NullableInstantSchema,
  notes: z.string().max(1000).nullable(),
  tableId: UuidSchema.nullable(),
  tableLabel: z.string().min(1).max(80).nullable(),
});

export type KitchenOrderContext = z.infer<typeof KitchenOrderContextSchema>;

export const KitchenTicketSchema = z.object({
  ticketId: UuidSchema,
  organizationId: UuidSchema,
  branchId: UuidSchema,
  stationId: UuidSchema,
  stationName: z.string().min(1).max(200),
  generation: z.number().int().min(1),
  status: KitchenTicketStatusSchema,
  startedAt: NullableInstantSchema,
  readyAt: NullableInstantSchema,
  completedAt: NullableInstantSchema,
  cancelledAt: NullableInstantSchema,
  cancelledByActorType: z.enum(["staff", "system"]).nullable(),
  cancelledByStaffId: UuidSchema.nullable(),
  cancellationReason: z.string().max(500).nullable(),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
  order: KitchenOrderContextSchema,
  items: z.array(KitchenTicketItemSchema),
});

export type KitchenTicket = z.infer<typeof KitchenTicketSchema>;

export const KitchenBoardResponseSchema = z.object({
  branchId: UuidSchema,
  stationId: UuidSchema.nullable(),
  statuses: z.array(KitchenTicketStatusSchema),
  from: NullableInstantSchema,
  to: NullableInstantSchema,
  tickets: z.array(KitchenTicketSchema),
  pageSize: z.number().int().min(1).max(KITCHEN_BOARD_MAX_PAGE_SIZE),
  hasMore: z.boolean(),
  nextOffset: z.number().int().min(0).nullable(),
});

export type KitchenBoardResponse = z.infer<typeof KitchenBoardResponseSchema>;

export const KitchenCategoryRouteSchema = z.object({
  routeId: UuidSchema,
  menuCategoryId: UuidSchema,
  menuCategoryName: z.string().min(1).max(200),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
});

export type KitchenCategoryRoute = z.infer<typeof KitchenCategoryRouteSchema>;

export const KitchenItemRouteSchema = z.object({
  routeId: UuidSchema,
  menuItemId: UuidSchema,
  menuItemName: z.string().min(1).max(200),
  menuCategoryId: UuidSchema,
  menuCategoryName: z.string().min(1).max(200),
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
});

export type KitchenItemRoute = z.infer<typeof KitchenItemRouteSchema>;

export const KitchenStationSchema = z.object({
  stationId: UuidSchema,
  organizationId: UuidSchema,
  branchId: UuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable(),
  status: z.enum(["active", "inactive"]),
  deactivatedAt: NullableInstantSchema,
  createdAt: InstantSchema,
  updatedAt: InstantSchema,
  categoryRoutes: z.array(KitchenCategoryRouteSchema),
  itemRoutes: z.array(KitchenItemRouteSchema),
});

export type KitchenStation = z.infer<typeof KitchenStationSchema>;

export const KitchenStationsResponseSchema = z.object({
  branchId: UuidSchema,
  stations: z.array(KitchenStationSchema),
});

export type KitchenStationsResponse = z.infer<typeof KitchenStationsResponseSchema>;

/** M4.2 transition responses are the smaller ticket shape. */
export const KitchenTransitionResponseSchema = z.object({
  ticketId: UuidSchema,
  status: KitchenTicketStatusSchema,
});

export const KitchenBoardRequestSchema = z
  .object({
    branchId: UuidSchema,
    stationId: UuidSchema.nullable(),
    page: z.number().int().min(1),
    limit: z
      .number()
      .int()
      .min(1)
      .max(KITCHEN_BOARD_MAX_PAGE_SIZE)
      .default(KITCHEN_BOARD_PAGE_SIZE),
  })
  .strict();

export type KitchenBoardRequest = z.infer<typeof KitchenBoardRequestSchema>;

export const KitchenStationInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).nullable(),
  })
  .strict();

export type KitchenStationInput = z.infer<typeof KitchenStationInputSchema>;

export const KitchenStationIdInputSchema = z.object({ stationId: UuidSchema }).strict();

export const KitchenCategoryRouteInputSchema = z
  .object({ stationId: UuidSchema, menuCategoryId: UuidSchema })
  .strict();

export const KitchenItemRouteInputSchema = z
  .object({ stationId: UuidSchema, menuItemId: UuidSchema })
  .strict();

export const KitchenMenuCategoryRowSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(200),
  sort_order: z.number().int(),
});

export const KitchenMenuItemRowSchema = z.object({
  id: UuidSchema,
  category_id: UuidSchema,
  name: z.string().min(1).max(200),
  sort_order: z.number().int(),
});

export interface KitchenMenuCatalog {
  categories: Array<{ id: string; name: string }>;
  items: Array<{ id: string; name: string; categoryId: string; categoryName: string }>;
}

export function isKitchenTicketStatus(value: unknown): value is KitchenTicketStatus {
  return (
    typeof value === "string" && (KITCHEN_TICKET_STATUSES as readonly string[]).includes(value)
  );
}

export function isKitchenHistoryStatus(value: unknown): value is KitchenHistoryStatus {
  return (
    typeof value === "string" && (KITCHEN_HISTORY_STATUSES as readonly string[]).includes(value)
  );
}
