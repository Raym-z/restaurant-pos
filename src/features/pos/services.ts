import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getWorkspace } from "@/features/workspace/services";

import {
  BranchOrderListResponseSchema,
  DiningSessionDetailSchema,
  GetActiveDiningSessionResponseSchema,
  ListBranchTablesResponseSchema,
  OrderDetailSchema,
  TableSummarySchema,
  type BranchOrderListResponse,
  type OrderStatus,
} from "./contracts";
import { normalizePosError } from "./errors";
import { buildPosMenu, type BranchMenuSource, type MenuItemModifierGroupSource } from "./menu";
import type {
  OrderDetailData,
  PosLoadResult,
  PosMenu,
  TableDetailData,
  TableOverviewData,
} from "./types";
import { resolvePosViewerResult, type PosViewerResult } from "./viewer";

type PosClient = SupabaseClient<Database>;

function failure(error: unknown): PosLoadResult<never> {
  return { ok: false, error: normalizePosError(error) };
}

async function loadPosClient(): Promise<PosClient> {
  return createSupabaseServerClient();
}

export async function getPosViewer(): Promise<PosViewerResult> {
  return resolvePosViewerResult(await getWorkspace());
}

export async function loadTableOverview(
  branchId: string,
): Promise<PosLoadResult<TableOverviewData>> {
  const supabase = await loadPosClient();
  const { data, error } = await supabase.rpc("list_branch_tables", {
    p_branch_id: branchId,
    p_include_inactive: false,
  });

  if (error) {
    return failure(error);
  }

  const parsed = ListBranchTablesResponseSchema.safeParse(data);
  if (!parsed.success) {
    return failure(parsed.error);
  }

  const tables = parsed.data.tables;
  const available = tables.filter((table) => table.availability === "available").length;
  const occupied = tables.filter((table) => table.availability === "occupied").length;

  return {
    ok: true,
    data: {
      branchId: parsed.data.branchId,
      tables,
      stats: {
        total: tables.length,
        available,
        occupied,
      },
    },
  };
}

export async function loadBranchMenu(
  branchId: string,
  defaultCurrency: string,
): Promise<PosLoadResult<PosMenu>> {
  const supabase = await loadPosClient();

  const [categories, items, branchCategories, branchItems, groups, options, links] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("id, name, sort_order, archived_at")
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("menu_items")
        .select(
          "id, category_id, name, description, base_price_minor, currency_code, sort_order, archived_at",
        )
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("branch_menu_categories")
        .select("menu_category_id, is_available")
        .eq("branch_id", branchId),
      supabase
        .from("branch_menu_items")
        .select("menu_item_id, is_available, price_override_minor")
        .eq("branch_id", branchId),
      supabase
        .from("modifier_groups")
        .select("id, name, min_selections, max_selections, archived_at")
        .is("archived_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("modifier_options")
        .select("id, modifier_group_id, name, price_delta_minor, sort_order, archived_at")
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("menu_item_modifier_groups")
        .select("menu_item_id, modifier_group_id, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  const queryError =
    categories.error ??
    items.error ??
    branchCategories.error ??
    branchItems.error ??
    groups.error ??
    options.error ??
    links.error;

  if (queryError) {
    return failure(queryError);
  }

  const source: BranchMenuSource = {
    categories: categories.data ?? [],
    items: items.data ?? [],
    branchCategories: branchCategories.data ?? [],
    branchItems: branchItems.data ?? [],
    modifierGroups: groups.data ?? [],
    modifierOptions: options.data ?? [],
    itemModifierGroups: (links.data ?? []) as MenuItemModifierGroupSource[],
  };

  return { ok: true, data: buildPosMenu(branchId, defaultCurrency, source) };
}

export async function loadTableDetail(
  tableId: string,
  defaultCurrency: string,
): Promise<PosLoadResult<TableDetailData>> {
  const supabase = await loadPosClient();

  const [tableResult, sessionResult] = await Promise.all([
    supabase.rpc("get_table", { p_table_id: tableId }),
    supabase.rpc("get_active_dining_session", { p_table_id: tableId }),
  ]);

  if (tableResult.error) {
    return failure(tableResult.error);
  }
  if (sessionResult.error) {
    return failure(sessionResult.error);
  }

  const table = TableSummarySchema.safeParse(tableResult.data);
  if (!table.success) {
    return failure(table.error);
  }

  const session = GetActiveDiningSessionResponseSchema.safeParse(sessionResult.data);
  if (!session.success) {
    return failure(session.error);
  }

  let menu: PosMenu | null = null;
  if (session.data.activeSession) {
    const menuResult = await loadBranchMenu(table.data.branchId, defaultCurrency);
    if (!menuResult.ok) {
      return menuResult;
    }
    menu = menuResult.data;
  }

  return {
    ok: true,
    data: {
      table: table.data,
      activeSession: session.data.activeSession,
      menu,
    },
  };
}

export async function loadBranchOrders(
  branchId: string,
  options: { status?: OrderStatus; limit: number; offset: number },
): Promise<PosLoadResult<BranchOrderListResponse>> {
  const supabase = await loadPosClient();
  const { data, error } = await supabase.rpc("list_branch_orders", {
    p_branch_id: branchId,
    p_status: options.status ?? null,
    p_limit: options.limit,
    p_offset: options.offset,
  });

  if (error) {
    return failure(error);
  }

  const parsed = BranchOrderListResponseSchema.safeParse(data);
  if (!parsed.success) {
    return failure(parsed.error);
  }

  return { ok: true, data: parsed.data };
}

export async function loadOrderDetail(
  orderId: string,
  defaultCurrency: string,
): Promise<PosLoadResult<OrderDetailData>> {
  const supabase = await loadPosClient();
  const orderResult = await supabase.rpc("get_order", { p_order_id: orderId });

  if (orderResult.error) {
    return failure(orderResult.error);
  }

  const order = OrderDetailSchema.safeParse(orderResult.data);
  if (!order.success) {
    return failure(order.error);
  }

  const sessionResult = await supabase.rpc("get_dining_session", {
    p_session_id: order.data.diningSessionId,
  });

  // The order always references a session. A read failure is a real error, not
  // evidence that the session is missing.
  if (sessionResult.error) {
    return failure(sessionResult.error);
  }

  const parsedSession = DiningSessionDetailSchema.safeParse(sessionResult.data);
  if (!parsedSession.success) {
    return failure(parsedSession.error);
  }

  const session = parsedSession.data;
  let menu: PosMenu | null = null;
  let menuError = null;
  if (session.status === "active") {
    const menuResult = await loadBranchMenu(order.data.branchId, defaultCurrency);
    if (menuResult.ok) {
      menu = menuResult.data;
    } else {
      menuError = menuResult.error;
    }
  }

  return { ok: true, data: { order: order.data, session, menu, menuError } };
}
