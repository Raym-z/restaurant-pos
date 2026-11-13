import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BranchDiningSessionListResponseSchema,
  BranchOrderListResponseSchema,
  ListBranchTablesResponseSchema,
  type OrderSummary,
  type TableSummary,
} from "@/features/pos/contracts";
import { normalizePosError } from "@/features/pos/errors";
import { canViewQueue } from "@/features/queue/access";
import { QueueListResponseSchema, type QueueEntry } from "@/features/queue/contracts";
import { getWorkspace } from "@/features/workspace/services";
import type { WorkspaceBranch } from "@/features/workspace/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { buildDashboardData, summarizeBranch, summarizeQueue } from "./aggregation";
import type {
  DashboardBranchSnapshot,
  DashboardData,
  DashboardLoadResult,
  DashboardQueueSummary,
  DashboardRange,
  DashboardSession,
  DashboardViewer,
  DashboardViewerResult,
} from "./types";
import { resolveDashboardBranch, resolveDashboardViewer } from "./viewer";

type DashboardClient = SupabaseClient<Database>;

const DASHBOARD_ORDER_PAGE_SIZE = 100;
const DASHBOARD_MAX_ORDER_ROWS = 1000;
const DASHBOARD_SESSION_PAGE_SIZE = 100;
const DASHBOARD_QUEUE_PAGE_SIZE = 100;
const DASHBOARD_MAX_QUEUE_ROWS = 500;

function failure(error: unknown): DashboardLoadResult<never> {
  return { ok: false, error: normalizePosError(error) };
}

function invalidResponse(message: string): DashboardLoadResult<never> {
  return {
    ok: false,
    error: {
      code: "INVALID_RESPONSE",
      message,
      retryable: true,
    },
  };
}

async function loadDashboardClient(): Promise<DashboardClient> {
  return createSupabaseServerClient();
}

export async function getDashboardViewer(): Promise<DashboardViewerResult> {
  return resolveDashboardViewer(await getWorkspace());
}

async function loadOrdersInRange(
  client: DashboardClient,
  branchId: string,
  range: DashboardRange,
): Promise<DashboardLoadResult<{ orders: OrderSummary[]; truncated: boolean }>> {
  const orders: OrderSummary[] = [];
  let offset = 0;
  let truncated = false;

  while (true) {
    const { data, error } = await client.rpc("list_branch_orders", {
      p_branch_id: branchId,
      p_status: null,
      p_from: range.from,
      p_to: range.to,
      p_limit: DASHBOARD_ORDER_PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      return failure(error);
    }

    const parsed = BranchOrderListResponseSchema.safeParse(data);
    if (
      !parsed.success ||
      parsed.data.branchId !== branchId ||
      parsed.data.orders.some((order) => order.branchId !== branchId)
    ) {
      return invalidResponse("The order service returned data outside the active branch.");
    }

    orders.push(...parsed.data.orders);

    if (!parsed.data.hasMore) {
      break;
    }

    if (orders.length >= DASHBOARD_MAX_ORDER_ROWS) {
      truncated = true;
      break;
    }

    offset = parsed.data.nextOffset ?? offset + DASHBOARD_ORDER_PAGE_SIZE;
  }

  return { ok: true, data: { orders, truncated } };
}

async function loadTables(
  client: DashboardClient,
  branchId: string,
): Promise<DashboardLoadResult<TableSummary[]>> {
  const { data, error } = await client.rpc("list_branch_tables", {
    p_branch_id: branchId,
    p_include_inactive: false,
  });

  if (error) {
    return failure(error);
  }

  const parsed = ListBranchTablesResponseSchema.safeParse(data);
  if (
    !parsed.success ||
    parsed.data.branchId !== branchId ||
    parsed.data.tables.some((table) => table.branchId !== branchId)
  ) {
    return invalidResponse("The table service returned data outside the active branch.");
  }

  return { ok: true, data: parsed.data.tables };
}

async function loadSessions(
  client: DashboardClient,
  branchId: string,
  range: DashboardRange,
): Promise<DashboardLoadResult<DashboardSession[]>> {
  const { data, error } = await client.rpc("list_branch_dining_sessions", {
    p_branch_id: branchId,
    p_status: null,
    p_from: null,
    p_to: range.to,
    p_limit: DASHBOARD_SESSION_PAGE_SIZE,
    p_offset: 0,
  });

  if (error) {
    return failure(error);
  }

  const parsed = BranchDiningSessionListResponseSchema.safeParse(data);
  if (
    !parsed.success ||
    parsed.data.branchId !== branchId ||
    parsed.data.sessions.some((session) => session.branchId !== branchId)
  ) {
    return invalidResponse("The dining-session service returned data outside the active branch.");
  }

  return {
    ok: true,
    data: parsed.data.sessions.map((session) => ({
      sessionId: session.sessionId,
      tableLabel: session.tableLabel,
    })),
  };
}

async function loadBranchSnapshot(
  client: DashboardClient,
  branch: WorkspaceBranch,
  range: DashboardRange,
  currency: string,
): Promise<DashboardLoadResult<DashboardBranchSnapshot>> {
  const [ordersResult, tablesResult, sessionsResult] = await Promise.all([
    loadOrdersInRange(client, branch.id, range),
    loadTables(client, branch.id),
    loadSessions(client, branch.id, range),
  ]);

  if (!ordersResult.ok) {
    return ordersResult;
  }
  if (!tablesResult.ok) {
    return tablesResult;
  }
  if (!sessionsResult.ok) {
    return sessionsResult;
  }

  return {
    ok: true,
    data: summarizeBranch({
      branchId: branch.id,
      branchName: branch.name,
      timezone: branch.timezone,
      currency,
      orders: ordersResult.data.orders,
      tables: tablesResult.data,
      sessions: sessionsResult.data,
      ordersTruncated: ordersResult.data.truncated,
    }),
  };
}

async function loadQueueSummary(
  client: DashboardClient,
  viewer: DashboardViewer,
): Promise<DashboardQueueSummary> {
  if (!canViewQueue(viewer.roles)) {
    return { available: false, reason: "role" };
  }

  const entries: QueueEntry[] = [];
  let offset = 0;
  let hasMore = false;

  while (true) {
    const { data, error } = await client.rpc("list_waitlist_entries", {
      p_branch_id: viewer.branchId,
      p_statuses: null,
      p_search: null,
      p_limit: DASHBOARD_QUEUE_PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      return { available: false, reason: "unavailable" };
    }

    const parsed = QueueListResponseSchema.safeParse(data);
    if (!parsed.success || parsed.data.branchId !== viewer.branchId) {
      return { available: false, reason: "unavailable" };
    }

    entries.push(...parsed.data.entries);

    if (!parsed.data.hasMore) {
      break;
    }

    if (entries.length >= DASHBOARD_MAX_QUEUE_ROWS) {
      hasMore = true;
      break;
    }

    offset = parsed.data.nextOffset ?? offset + DASHBOARD_QUEUE_PAGE_SIZE;
  }

  return summarizeQueue(entries, hasMore);
}

/**
 * Loads the dashboard from the existing branch-scoped read RPCs.
 *
 * Every branch identifier comes from the RLS-protected workspace and the
 * database re-authorizes each call. No organization-wide order history is
 * downloaded and no client-supplied branch identifier is trusted.
 */
export async function loadDashboard(
  viewer: DashboardViewer,
  range: DashboardRange,
): Promise<DashboardLoadResult<DashboardData>> {
  const activeBranch = resolveDashboardBranch(viewer, viewer.branchId);
  if (!activeBranch) {
    return invalidResponse("The active branch is not part of the accessible workspace.");
  }

  const client = await loadDashboardClient();
  const [branchLoads, queue] = await Promise.all([
    Promise.all(
      viewer.branches.map((branch) => loadBranchSnapshot(client, branch, range, viewer.currency)),
    ),
    loadQueueSummary(client, viewer),
  ]);

  const snapshots: DashboardBranchSnapshot[] = [];
  let branchPerformanceUnavailable = 0;

  for (const load of branchLoads) {
    if (load.ok) {
      snapshots.push(load.data);
    } else {
      branchPerformanceUnavailable += 1;
    }
  }

  const current = snapshots.find((snapshot) => snapshot.branchId === activeBranch.id);
  if (!current) {
    const currentIndex = viewer.branches.findIndex((branch) => branch.id === activeBranch.id);
    const currentLoad = branchLoads[currentIndex];
    return currentLoad && !currentLoad.ok
      ? currentLoad
      : invalidResponse("The active branch dashboard could not be loaded.");
  }

  return {
    ok: true,
    data: buildDashboardData({
      asOf: new Date().toISOString(),
      range,
      current,
      branchSnapshots: snapshots,
      branchPerformanceUnavailable,
      queue,
    }),
  };
}
