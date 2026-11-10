"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { UuidSchema } from "@/features/pos/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  KitchenBoardRequestSchema,
  KitchenCategoryRouteInputSchema,
  KitchenItemRouteInputSchema,
  KitchenStationIdInputSchema,
  KitchenStationInputSchema,
  KitchenStationSchema,
  KitchenTransitionResponseSchema,
  type KitchenBoardRequest,
  type KitchenBoardResponse,
  type KitchenStation,
} from "./contracts";
import { normalizeKitchenError } from "./errors";
import { loadKitchenBoardForRequest } from "./services";
import type { KitchenActionResult, KitchenLoadResult } from "./types";

interface RpcResponse {
  data: unknown;
  error: unknown;
}

function validationFailure<T>(message: string): KitchenActionResult<T> {
  return {
    ok: false,
    committed: false,
    error: { code: "VALIDATION_ERROR", message, retryable: false },
  };
}

function revalidateKitchen() {
  revalidatePath("/kitchen", "layout");
}

function parseStation(value: unknown): KitchenStation | null {
  const parsed = KitchenStationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function mutateStation(
  call: () => Promise<RpcResponse>,
): Promise<KitchenActionResult<KitchenStation>> {
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

  if (response.error) {
    return {
      ok: false,
      committed: false,
      error: normalizeKitchenError(response.error),
    };
  }

  revalidateKitchen();

  const station = parseStation(response.data);
  if (!station) {
    return {
      ok: false,
      committed: true,
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The backend completed the request, but its response could not be read. Refresh and verify the station before retrying.",
        retryable: false,
      },
    };
  }

  return { ok: true, data: station, committed: true };
}

export async function loadKitchenBoardAction(
  input: unknown,
): Promise<KitchenLoadResult<KitchenBoardResponse>> {
  const parsed = KitchenBoardRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The kitchen board request is invalid.",
        retryable: false,
      },
    };
  }

  return loadKitchenBoardForRequest(parsed.data as KitchenBoardRequest);
}

async function transitionTicketItem(
  ticketItemId: string,
  call: (
    client: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    id: string,
  ) => PromiseLike<RpcResponse>,
): Promise<KitchenActionResult<{ ticketId: string }>> {
  const parsedId = UuidSchema.safeParse(ticketItemId);
  if (!parsedId.success) {
    return validationFailure("The kitchen ticket item is invalid.");
  }

  let response: RpcResponse;
  try {
    const client = await createSupabaseServerClient();
    response = await call(client, parsedId.data);
  } catch {
    return {
      ok: false,
      committed: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The kitchen update could not be sent.",
        retryable: true,
      },
    };
  }

  if (response.error) {
    return {
      ok: false,
      committed: false,
      error: normalizeKitchenError(response.error),
    };
  }

  revalidateKitchen();

  const transition = KitchenTransitionResponseSchema.safeParse(response.data);
  if (!transition.success) {
    return {
      ok: false,
      committed: true,
      error: {
        code: "INVALID_RESPONSE",
        message:
          "The backend completed the kitchen update, but its response could not be read. The board will refresh before you retry.",
        retryable: false,
      },
    };
  }

  return {
    ok: true,
    data: { ticketId: transition.data.ticketId },
    committed: true,
  };
}

export async function startKitchenTicketItemAction(
  ticketItemId: string,
): Promise<KitchenActionResult<{ ticketId: string }>> {
  return transitionTicketItem(ticketItemId, (client, id) =>
    client.rpc("start_kitchen_ticket_item", { p_ticket_item_id: id }),
  );
}

export async function markKitchenTicketItemReadyAction(
  ticketItemId: string,
): Promise<KitchenActionResult<{ ticketId: string }>> {
  return transitionTicketItem(ticketItemId, (client, id) =>
    client.rpc("mark_kitchen_ticket_item_ready", { p_ticket_item_id: id }),
  );
}

export async function completeKitchenTicketItemAction(
  ticketItemId: string,
): Promise<KitchenActionResult<{ ticketId: string }>> {
  return transitionTicketItem(ticketItemId, (client, id) =>
    client.rpc("complete_kitchen_ticket_item", { p_ticket_item_id: id }),
  );
}

const CreateKitchenStationActionSchema = KitchenStationInputSchema.extend({
  branchId: UuidSchema,
}).strict();

export async function createKitchenStationAction(input: {
  branchId: string;
  name: string;
  description: string | null;
}): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = CreateKitchenStationActionSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("Enter a station name of up to 200 characters.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("create_kitchen_station", {
      p_branch_id: parsed.data.branchId,
      p_name: parsed.data.name,
      p_description: parsed.data.description,
    });
  });
}

const UpdateKitchenStationActionSchema = KitchenStationInputSchema.extend({
  stationId: UuidSchema,
}).strict();

export async function updateKitchenStationAction(input: {
  stationId: string;
  name: string;
  description: string | null;
}): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = UpdateKitchenStationActionSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("Enter a station name of up to 200 characters.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("update_kitchen_station", {
      p_station_id: parsed.data.stationId,
      p_name: parsed.data.name,
      p_description: parsed.data.description,
    });
  });
}

const DeactivateKitchenStationActionSchema = z
  .object({
    stationId: UuidSchema,
    reason: z.string().trim().max(500).nullable().default(null),
  })
  .strict();

export async function deactivateKitchenStationAction(input: {
  stationId: string;
  reason: string | null;
}): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = DeactivateKitchenStationActionSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The deactivation reason must be 500 characters or fewer.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("deactivate_kitchen_station", {
      p_station_id: parsed.data.stationId,
      p_reason: parsed.data.reason,
    });
  });
}

export async function reactivateKitchenStationAction(
  input: unknown,
): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = KitchenStationIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The kitchen station is invalid.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("reactivate_kitchen_station", {
      p_station_id: parsed.data.stationId,
    });
  });
}

export async function addKitchenCategoryRouteAction(
  input: unknown,
): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = KitchenCategoryRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("Choose a menu category to route.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("add_kitchen_station_category_route", {
      p_station_id: parsed.data.stationId,
      p_menu_category_id: parsed.data.menuCategoryId,
    });
  });
}

export async function removeKitchenCategoryRouteAction(
  input: unknown,
): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = KitchenCategoryRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The category route is invalid.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("remove_kitchen_station_category_route", {
      p_station_id: parsed.data.stationId,
      p_menu_category_id: parsed.data.menuCategoryId,
    });
  });
}

export async function addKitchenItemRouteAction(
  input: unknown,
): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = KitchenItemRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("Choose a menu item to route.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("add_kitchen_station_item_route", {
      p_station_id: parsed.data.stationId,
      p_menu_item_id: parsed.data.menuItemId,
    });
  });
}

export async function removeKitchenItemRouteAction(
  input: unknown,
): Promise<KitchenActionResult<KitchenStation>> {
  const parsed = KitchenItemRouteInputSchema.safeParse(input);
  if (!parsed.success) {
    return validationFailure("The item route is invalid.");
  }

  return mutateStation(async () => {
    const client = await createSupabaseServerClient();
    return client.rpc("remove_kitchen_station_item_route", {
      p_station_id: parsed.data.stationId,
      p_menu_item_id: parsed.data.menuItemId,
    });
  });
}
