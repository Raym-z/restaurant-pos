import { z } from "zod";

import { InstantSchema, UuidSchema } from "@/features/pos/contracts";

/**
 * Runtime parsers for the approved M5.2 staff waitlist queue read contract.
 *
 * Source of truth:
 * `restaurant-platform-backend` migration
 * `20261111090000_m5_waitlist_queue_read.sql` and
 * `src/contracts/waitlist/rpc.ts`.
 *
 * The POS only reads through `list_waitlist_entries`; it never selects from
 * `waitlist_entries` directly. Responses intentionally strip unknown additive
 * fields, while requests remain strict.
 */

export const QUEUE_ACTIVE_STATUSES = ["waiting", "notified"] as const;

export type QueueStatus = (typeof QUEUE_ACTIVE_STATUSES)[number];

export const QueueStatusSchema = z.enum(QUEUE_ACTIVE_STATUSES);

export const QUEUE_PAGE_SIZE = 50;
export const QUEUE_MAX_PAGE_SIZE = 100;

export const QUEUE_SOURCES = ["customer", "walk_in"] as const;

export type QueueSource = (typeof QUEUE_SOURCES)[number];

export const QueueSourceSchema = z.enum(QUEUE_SOURCES);

export const QueueEntrySchema = z.object({
  entryId: UuidSchema,
  branchId: UuidSchema,
  source: QueueSourceSchema,
  status: QueueStatusSchema,
  partySize: z.number().int().min(1).max(32767),
  displayName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactPhoneMasked: z.boolean(),
  joinedAt: InstantSchema,
  notifiedAt: InstantSchema.nullable(),
  position: z.number().int().min(1),
  elapsedMinutes: z.number().int().min(0),
});

export type QueueEntry = z.infer<typeof QueueEntrySchema>;

export const QueueListResponseSchema = z
  .object({
    branchId: UuidSchema,
    statuses: z.array(QueueStatusSchema).min(1).max(2),
    generatedAt: InstantSchema,
    entries: z.array(QueueEntrySchema),
    pageSize: z.number().int().min(1).max(QUEUE_MAX_PAGE_SIZE),
    hasMore: z.boolean(),
    nextOffset: z.number().int().min(0).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.hasMore && value.nextOffset === null) {
      ctx.addIssue({
        code: "custom",
        path: ["nextOffset"],
        message: "nextOffset is required when hasMore is true",
      });
    }

    if (!value.hasMore && value.nextOffset !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["nextOffset"],
        message: "nextOffset must be null when hasMore is false",
      });
    }

    if (value.entries.some((entry) => entry.branchId !== value.branchId)) {
      ctx.addIssue({
        code: "custom",
        path: ["entries"],
        message: "Every queue entry must belong to the response branch",
      });
    }

    if (value.entries.some((entry) => !value.statuses.includes(entry.status))) {
      ctx.addIssue({
        code: "custom",
        path: ["entries"],
        message: "Every queue entry status must be part of the effective status set",
      });
    }
  });

export type QueueListResponse = z.infer<typeof QueueListResponseSchema>;

export const QueueListRequestSchema = z
  .object({
    branchId: UuidSchema,
    /** One active status filter; `null` requests both active statuses. */
    status: QueueStatusSchema.nullable().optional(),
    search: z.string().trim().max(200).nullable().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(QUEUE_MAX_PAGE_SIZE).default(QUEUE_PAGE_SIZE),
  })
  .strict();

export type QueueListRequest = z.infer<typeof QueueListRequestSchema>;

export interface QueueRpcParams {
  p_branch_id: string;
  p_statuses: QueueStatus[] | null;
  p_search: string | null;
  p_limit: number;
  p_offset: number;
}

export function queuePageOffset(page: number, limit = QUEUE_PAGE_SIZE): number {
  return (Math.max(1, page) - 1) * limit;
}

/**
 * Maps the POS request to the deployed `p_*` parameters. A blank search is
 * sent as null so the database treats it as "no search".
 */
export function toQueueRpcParams(request: QueueListRequest): QueueRpcParams {
  const search = request.search?.trim() ?? "";
  const limit = request.limit ?? QUEUE_PAGE_SIZE;
  const page = request.page ?? 1;

  return {
    p_branch_id: request.branchId,
    p_statuses: request.status ? [request.status] : null,
    p_search: search.length > 0 ? search : null,
    p_limit: limit,
    p_offset: queuePageOffset(page, limit),
  };
}
