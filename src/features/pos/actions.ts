"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  AddOrderItemInputSchema,
  CreateOrderInputSchema,
  DiningSessionDetailSchema,
  OrderDetailSchema,
  TransitionTargetStatusSchema,
  UuidSchema,
  type DiningSessionDetail,
  type OrderDetail,
} from "./contracts";
import { resolveMutationResponse, type RpcResponse } from "./mutation";
import type { PosActionError, PosActionResult } from "./types";

const ReasonSchema = z.string().trim().max(500).optional();
const CancellationReasonSchema = z.string().trim().min(1).max(500);

function validationFailure(message: string): {
  ok: false;
  error: PosActionError;
  committed: false;
} {
  return {
    ok: false,
    committed: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      retryable: false,
    },
  };
}

function revalidatePos() {
  // The shell layout owns the workspace and the two operational surfaces.
  // Revalidating from the root layout keeps table, session, and order reads
  // coherent after a transactional RPC.
  revalidatePath("/", "layout");
}

async function mutate<T>(
  call: () => Promise<RpcResponse>,
  parse: (value: unknown) => T | null,
): Promise<PosActionResult<T>> {
  let response: RpcResponse;

  try {
    response = await call();
  } catch {
    return {
      ok: false,
      committed: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The request could not be sent.",
        retryable: true,
      },
    };
  }

  const resolution = resolveMutationResponse(response, parse);
  if (resolution.shouldRevalidate) {
    revalidatePos();
  }

  if (resolution.status === "success") {
    return { ok: true, data: resolution.data, committed: true };
  }

  return { ok: false, error: resolution.error, committed: resolution.committed };
}

function parseSession(value: unknown): DiningSessionDetail | null {
  const parsed = DiningSessionDetailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseOrder(value: unknown): OrderDetail | null {
  const parsed = OrderDetailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function openDiningSessionAction(
  tableId: string,
  idempotencyKey?: string,
): Promise<PosActionResult<DiningSessionDetail>> {
  const parsed = z
    .object({
      tableId: UuidSchema,
      idempotencyKey: z
        .string()
        .min(16)
        .max(128)
        .regex(/^[A-Za-z0-9_-]+$/)
        .optional(),
    })
    .strict()
    .safeParse({ tableId, idempotencyKey });

  if (!parsed.success) {
    return validationFailure("The dining session request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("open_dining_session", {
      p_table_id: parsed.data.tableId,
      p_idempotency_key: parsed.data.idempotencyKey ?? null,
    });
  }, parseSession);
}

export async function closeDiningSessionAction(
  sessionId: string,
  reason?: string,
): Promise<PosActionResult<DiningSessionDetail>> {
  const parsed = z
    .object({ sessionId: UuidSchema, reason: ReasonSchema })
    .strict()
    .safeParse({ sessionId, reason });

  if (!parsed.success) {
    return validationFailure("The close-session request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("close_dining_session", {
      p_session_id: parsed.data.sessionId,
      p_reason: parsed.data.reason ?? null,
    });
  }, parseSession);
}

export async function createOrderAction(
  input: z.input<typeof CreateOrderInputSchema>,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = CreateOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The order request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("create_order", {
      p_dining_session_id: parsed.data.diningSessionId,
      p_items: parsed.data.items,
      p_notes: parsed.data.notes ?? null,
      p_idempotency_key: parsed.data.idempotencyKey ?? null,
    });
  }, parseOrder);
}

export async function addOrderItemAction(
  input: z.input<typeof AddOrderItemInputSchema>,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = AddOrderItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The order item request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("add_order_item", {
      p_order_id: parsed.data.orderId,
      p_menu_item_id: parsed.data.menuItemId,
      p_quantity: parsed.data.quantity,
      p_modifier_option_ids: parsed.data.modifierOptionIds,
      p_notes: parsed.data.notes ?? null,
    });
  }, parseOrder);
}

export async function updateOrderItemQuantityAction(
  orderItemId: string,
  quantity: number,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = z
    .object({ orderItemId: UuidSchema, quantity: z.number().int().min(1).max(99) })
    .strict()
    .safeParse({ orderItemId, quantity });

  if (!parsed.success) {
    return validationFailure("The item quantity is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("update_order_item_quantity", {
      p_order_item_id: parsed.data.orderItemId,
      p_quantity: parsed.data.quantity,
    });
  }, parseOrder);
}

export async function removeOrderItemAction(
  orderItemId: string,
  reason?: string,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = z
    .object({ orderItemId: UuidSchema, reason: ReasonSchema })
    .strict()
    .safeParse({ orderItemId, reason });

  if (!parsed.success) {
    return validationFailure("The removal request is invalid.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("remove_order_item", {
      p_order_item_id: parsed.data.orderItemId,
      p_reason: parsed.data.reason ?? null,
    });
  }, parseOrder);
}

export async function transitionOrderStatusAction(
  orderId: string,
  status: string,
  reason?: string,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = z
    .object({
      orderId: UuidSchema,
      status: TransitionTargetStatusSchema,
      reason: ReasonSchema,
    })
    .strict()
    .safeParse({ orderId, status, reason });

  if (!parsed.success) {
    return validationFailure("The order transition is not allowed.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("transition_order_status", {
      p_order_id: parsed.data.orderId,
      p_status: parsed.data.status,
      p_reason: parsed.data.reason ?? null,
    });
  }, parseOrder);
}

export async function cancelOrderAction(
  orderId: string,
  reason: string,
): Promise<PosActionResult<OrderDetail>> {
  const parsed = z
    .object({ orderId: UuidSchema, reason: CancellationReasonSchema })
    .strict()
    .safeParse({ orderId, reason });

  if (!parsed.success) {
    return validationFailure("A cancellation reason is required.");
  }

  return mutate(async () => {
    const supabase = await createSupabaseServerClient();
    return supabase.rpc("cancel_order", {
      p_order_id: parsed.data.orderId,
      p_reason: parsed.data.reason,
    });
  }, parseOrder);
}
