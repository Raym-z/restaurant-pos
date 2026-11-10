import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getWorkspace } from "@/features/workspace/services";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  KITCHEN_ACTIVE_STATUSES,
  KITCHEN_BOARD_PAGE_SIZE,
  KitchenBoardResponseSchema,
  KitchenMenuCategoryRowSchema,
  KitchenMenuItemRowSchema,
  KitchenStationsResponseSchema,
  type KitchenBoardRequest,
  type KitchenBoardResponse,
  type KitchenHistoryStatus,
  type KitchenMenuCatalog,
  type KitchenTicketStatus,
  type KitchenStationsResponse,
} from "./contracts";
import { normalizeKitchenError } from "./errors";
import type { KitchenLoadResult, KitchenViewerResult } from "./types";
import { resolveKitchenViewerResult } from "./viewer";

type KitchenClient = SupabaseClient<Database>;

function failure(error: unknown): KitchenLoadResult<never> {
  return { ok: false, error: normalizeKitchenError(error) };
}

function invalidResponse(): KitchenLoadResult<never> {
  return {
    ok: false,
    error: {
      code: "INVALID_RESPONSE",
      message:
        "The kitchen service returned data that could not be verified. Refresh before continuing.",
      retryable: true,
    },
  };
}

async function loadKitchenClient(): Promise<KitchenClient> {
  return createSupabaseServerClient();
}

export async function getKitchenViewer(): Promise<KitchenViewerResult> {
  return resolveKitchenViewerResult(await getWorkspace());
}

export async function loadKitchenStations(
  branchId: string,
): Promise<KitchenLoadResult<KitchenStationsResponse>> {
  const supabase = await loadKitchenClient();
  const { data, error } = await supabase.rpc("list_kitchen_stations", {
    p_branch_id: branchId,
  });

  if (error) {
    return failure(error);
  }

  const parsed = KitchenStationsResponseSchema.safeParse(data);
  return parsed.success ? { ok: true, data: parsed.data } : invalidResponse();
}

export interface LoadKitchenBoardInput {
  branchId: string;
  stationId?: string | null;
  statuses?: readonly KitchenTicketStatus[] | null;
  page?: number;
  limit?: number;
  from?: string | null;
  to?: string | null;
}

export async function loadKitchenBoard(
  input: LoadKitchenBoardInput,
): Promise<KitchenLoadResult<KitchenBoardResponse>> {
  const page = input.page ?? 1;
  const limit = input.limit ?? KITCHEN_BOARD_PAGE_SIZE;
  const supabase = await loadKitchenClient();

  const { data, error } = await supabase.rpc("list_kitchen_tickets", {
    p_branch_id: input.branchId,
    p_station_id: input.stationId ?? null,
    p_statuses: input.statuses ? [...input.statuses] : null,
    p_limit: limit,
    p_offset: (page - 1) * limit,
    p_from: input.from ?? null,
    p_to: input.to ?? null,
  });

  if (error) {
    return failure(error);
  }

  const parsed = KitchenBoardResponseSchema.safeParse(data);
  return parsed.success ? { ok: true, data: parsed.data } : invalidResponse();
}

export async function loadKitchenBoardForRequest(
  request: KitchenBoardRequest,
): Promise<KitchenLoadResult<KitchenBoardResponse>> {
  return loadKitchenBoard({
    branchId: request.branchId,
    stationId: request.stationId,
    statuses: KITCHEN_ACTIVE_STATUSES,
    page: request.page,
    limit: request.limit,
  });
}

export async function loadKitchenHistory(
  input: Omit<LoadKitchenBoardInput, "statuses"> & {
    statuses: readonly KitchenHistoryStatus[];
  },
): Promise<KitchenLoadResult<KitchenBoardResponse>> {
  return loadKitchenBoard(input);
}

export async function loadKitchenMenuCatalog(): Promise<KitchenLoadResult<KitchenMenuCatalog>> {
  const supabase = await loadKitchenClient();

  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, category_id, name, sort_order")
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const queryError = categoriesResult.error ?? itemsResult.error;
  if (queryError) {
    return failure(queryError);
  }

  const categories = KitchenMenuCategoryRowSchema.array().safeParse(categoriesResult.data ?? []);
  if (!categories.success) {
    return invalidResponse();
  }

  const items = KitchenMenuItemRowSchema.array().safeParse(itemsResult.data ?? []);
  if (!items.success) {
    return invalidResponse();
  }

  const categoryNames = new Map(categories.data.map((category) => [category.id, category.name]));
  const catalogItems = items.data
    .filter((item) => categoryNames.has(item.category_id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.category_id,
      categoryName: categoryNames.get(item.category_id) ?? "",
    }));

  return {
    ok: true,
    data: {
      categories: categories.data.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      items: catalogItems,
    },
  };
}

export interface KitchenStationPageData {
  branchId: string;
  stations: KitchenStationsResponse["stations"];
  catalog: KitchenMenuCatalog;
}

export async function loadKitchenStationPage(
  branchId: string,
): Promise<KitchenLoadResult<KitchenStationPageData>> {
  const [stationsResult, catalogResult] = await Promise.all([
    loadKitchenStations(branchId),
    loadKitchenMenuCatalog(),
  ]);

  if (!stationsResult.ok) {
    return stationsResult;
  }
  if (!catalogResult.ok) {
    return catalogResult;
  }

  return {
    ok: true,
    data: {
      branchId,
      stations: stationsResult.data.stations,
      catalog: catalogResult.data,
    },
  };
}
