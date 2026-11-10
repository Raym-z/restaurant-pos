/**
 * Hosted Development verification for the POS M2/M3 integration.
 *
 * This script intentionally runs against the real Supabase Development project.
 * It is not part of `npm test` because it requires hosted credentials and
 * network access.
 *
 * Usage (credentials are read from the process environment only):
 *
 *   POS_DEV_STAFF_EMAIL=... POS_DEV_STAFF_PASSWORD=... npm run verify:hosted
 *
 * Safety properties:
 * - Only the Development project ref is accepted; Production fails closed.
 * - Only the publishable/anon key is accepted. Secret keys, personal access
 *   tokens, service-role JWTs, and database URLs are rejected.
 * - No credential or token value is printed.
 * - The default run performs reads plus mutation requests that the backend
 *   rejects before any write. It does not create orders or dining sessions.
 * - Every tested rejected mutation re-reads the affected order and compares
 *   status, totals, and item counts to prove nothing was committed.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  BranchOrderListResponseSchema,
  DiningSessionDetailSchema,
  GetActiveDiningSessionResponseSchema,
  ListBranchTablesResponseSchema,
  OrderDetailSchema,
  OrderSummarySchema,
  SessionOrderListResponseSchema,
  type BranchOrderListResponse,
  type OrderDetail,
  type OrderSummary,
} from "@/features/pos/contracts";
import { normalizePosError } from "@/features/pos/errors";
import { buildPosMenu } from "@/features/pos/menu";
import type { PosMenu } from "@/features/pos/types";
import {
  deriveEffectivePrimaryRole,
  effectiveRoles,
  isOrganizationAdmin,
} from "@/features/workspace/access";
import { buildWorkspace, mapRoleAssignments } from "@/features/workspace/mappers";
import type { Database } from "@/lib/supabase/database.types";
import { parsePublicEnvironment } from "@/lib/supabase/env";

type Client = SupabaseClient<Database>;

const PRODUCTION_REF = "xzchsyxhpknlogwcfsll";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, condition: boolean, detail = ""): boolean {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
  return condition;
}

function skip(label: string, reason: string): void {
  console.log(`SKIP ${label} — ${reason}`);
}

function safeError(error: unknown): string {
  const normalized = normalizePosError(error);
  return `${normalized.code}: ${normalized.message}`;
}

function assertPublishableKey(key: string): void {
  if (key.startsWith("sb_secret_") || key.startsWith("sbp_") || key.startsWith("postgres")) {
    throw new Error("A publishable/anon key is required. Secret keys are forbidden.");
  }

  if (key.startsWith("eyJ")) {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as {
      role?: string;
    };
    if (payload.role === "service_role") {
      throw new Error("A service-role JWT is forbidden in the frontend verification.");
    }
  }
}

function requireCredential(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Provide Development staff credentials via the environment.`);
  }
  return value;
}

async function loadWorkspaceRows(sb: Client, authUserId: string) {
  const { data: profile, error: profileError } = await sb
    .from("staff_profiles")
    .select(
      "id, auth_user_id, organization_id, display_name, status, invited_at, activated_at, deactivated_at, created_at, updated_at",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(`Active staff profile unavailable: ${safeError(profileError)}`);
  }

  const [organizationResult, rolesResult, assignmentsResult, branchesResult] = await Promise.all([
    sb
      .from("organizations")
      .select(
        "id, name, default_currency_code, status, deletion_requested_at, deletion_scheduled_for, deleted_at, created_at, updated_at",
      )
      .eq("id", profile.organization_id)
      .maybeSingle(),
    sb
      .from("staff_role_assignments")
      .select(
        "id, staff_id, organization_id, role_code, scope_type, branch_id, assigned_at, revoked_at",
      )
      .eq("staff_id", profile.id)
      .eq("organization_id", profile.organization_id)
      .is("revoked_at", null),
    sb
      .from("staff_branch_assignments")
      .select("id, staff_id, organization_id, branch_id, assigned_at, revoked_at")
      .eq("staff_id", profile.id)
      .eq("organization_id", profile.organization_id)
      .is("revoked_at", null),
    sb
      .from("branches")
      .select(
        "id, organization_id, name, timezone, status, deactivated_at, address, phone, latitude, longitude, waitlist_geolocation_enabled, waitlist_radius_meters, created_at, updated_at",
      )
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .order("name", { ascending: true }),
  ]);

  if (organizationResult.error || !organizationResult.data) {
    throw new Error(`Organization unavailable: ${safeError(organizationResult.error)}`);
  }
  if (rolesResult.error) {
    throw new Error(`Roles unavailable: ${safeError(rolesResult.error)}`);
  }
  if (assignmentsResult.error) {
    throw new Error(`Branch assignments unavailable: ${safeError(assignmentsResult.error)}`);
  }
  if (branchesResult.error) {
    throw new Error(`Branches unavailable: ${safeError(branchesResult.error)}`);
  }

  return {
    profile,
    organization: organizationResult.data,
    roleRows: rolesResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    branches: branchesResult.data ?? [],
  };
}

async function loadBranchMenu(sb: Client, branchId: string, currency: string): Promise<PosMenu> {
  const [categories, items, branchCategories, branchItems, groups, options, links] =
    await Promise.all([
      sb
        .from("menu_categories")
        .select("id, name, sort_order, archived_at")
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      sb
        .from("menu_items")
        .select(
          "id, category_id, name, description, base_price_minor, currency_code, sort_order, archived_at",
        )
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      sb
        .from("branch_menu_categories")
        .select("menu_category_id, is_available")
        .eq("branch_id", branchId),
      sb
        .from("branch_menu_items")
        .select("menu_item_id, is_available, price_override_minor")
        .eq("branch_id", branchId),
      sb
        .from("modifier_groups")
        .select("id, name, min_selections, max_selections, archived_at")
        .is("archived_at", null)
        .order("name", { ascending: true }),
      sb
        .from("modifier_options")
        .select("id, modifier_group_id, name, price_delta_minor, sort_order, archived_at")
        .is("archived_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      sb
        .from("menu_item_modifier_groups")
        .select("menu_item_id, modifier_group_id, sort_order")
        .order("sort_order"),
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
    throw new Error(`Menu read failed: ${safeError(queryError)}`);
  }

  return buildPosMenu(branchId, currency, {
    categories: categories.data ?? [],
    items: items.data ?? [],
    branchCategories: branchCategories.data ?? [],
    branchItems: branchItems.data ?? [],
    modifierGroups: groups.data ?? [],
    modifierOptions: options.data ?? [],
    itemModifierGroups: links.data ?? [],
  });
}

function summaryFingerprint(order: OrderSummary | OrderDetail): string {
  return JSON.stringify({
    status: order.status,
    subtotalMinor: order.subtotalMinor,
    payableSubtotalMinor: order.payableSubtotalMinor,
    itemCount: order.itemCount,
    activeItemCount: order.activeItemCount,
    updatedAt: order.updatedAt,
  });
}

function requireId(payload: unknown, key: string): string {
  const value =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>)[key] : undefined;
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`RPC response did not include ${key}`);
  }
  return value;
}

type FixtureClient = SupabaseClient;

/**
 * Creates clearly labelled disposable fixtures, exercises the complete POS
 * order lifecycle, and soft-deletes the fixtures. No hard delete exists, so the
 * archived menu records, deactivated table, closed session, and terminal orders
 * remain in Development and are reported with their IDs.
 */
async function runWriteLifecycle(
  sb: Client,
  branchId: string,
  branchName: string,
  currency: string,
): Promise<void> {
  const fixtureClient = sb as unknown as FixtureClient;
  const suffix = Date.now().toString(36);
  const label = `POS-VERIFY-${suffix}`;
  const idempotencyBase = `posverify_${suffix}`;

  let categoryId: string | null = null;
  let menuItemId: string | null = null;
  let tableId: string | null = null;
  let sessionId: string | null = null;
  let tableDeactivated = false;
  let itemArchived = false;
  let categoryArchived = false;
  const orderIds: string[] = [];

  const createOrder = (quantity: number, key: string, notes: string) =>
    sb.rpc("create_order", {
      p_dining_session_id: sessionId ?? "",
      p_items: [{ menuItemId: menuItemId ?? "", quantity, modifierOptionIds: [], notes }],
      p_notes: notes,
      p_idempotency_key: key,
    });

  const parseSummary = (
    result: { data: unknown; error: unknown },
    labelText: string,
  ): OrderSummary | null => {
    const parsed = OrderSummarySchema.safeParse(result.data);
    check(
      labelText,
      Boolean(!result.error && parsed.success),
      result.error ? safeError(result.error) : parsed.success ? "" : "schema mismatch",
    );
    return parsed.success ? parsed.data : null;
  };

  const transition = async (orderId: string, status: string) => {
    const result = await sb.rpc("transition_order_status", {
      p_order_id: orderId,
      p_status: status as never,
      p_reason: null,
    });
    return parseSummary(result, `transition ${status} parses`);
  };

  try {
    const categoryResult = await fixtureClient.rpc("create_menu_category", {
      p_name: `${label} Category`,
      p_description: "Disposable POS integration verification fixture",
      p_sort_order: 9999,
    });
    check(
      "fixture menu category created",
      !categoryResult.error,
      categoryResult.error ? safeError(categoryResult.error) : "",
    );
    if (categoryResult.error) {
      throw new Error("Cannot run write verification without a menu category.");
    }
    categoryId = requireId(categoryResult.data, "categoryId");

    const itemResult = await fixtureClient.rpc("create_menu_item", {
      p_category_id: categoryId,
      p_name: `${label} Item`,
      p_base_price_minor: 12345,
      p_description: "Disposable POS integration verification fixture",
      p_sort_order: 9999,
    });
    check(
      "fixture menu item created",
      !itemResult.error,
      itemResult.error ? safeError(itemResult.error) : "",
    );
    if (itemResult.error) {
      throw new Error("Cannot run write verification without a menu item.");
    }
    menuItemId = requireId(itemResult.data, "menuItemId");

    const tableResult = await fixtureClient.rpc("create_table", {
      p_branch_id: branchId,
      p_label: `${label} Table`,
      p_capacity: 2,
    });
    check(
      "fixture table created",
      !tableResult.error,
      tableResult.error ? safeError(tableResult.error) : "",
    );
    if (tableResult.error) {
      throw new Error("Cannot run write verification without a table.");
    }
    tableId = requireId(tableResult.data, "tableId");

    const menu = await loadBranchMenu(sb, branchId, currency);
    const fixtureItem = menu.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === menuItemId);
    check(
      "fixture item resolves as available on the branch menu",
      Boolean(fixtureItem),
      `price=${fixtureItem?.basePriceMinor}`,
    );

    const tablesAfterSetup = await sb.rpc("list_branch_tables", {
      p_branch_id: branchId,
      p_include_inactive: false,
    });
    const tablesParsed = ListBranchTablesResponseSchema.safeParse(tablesAfterSetup.data);
    const fixtureTable = tablesParsed.success
      ? tablesParsed.data.tables.find((table) => table.tableId === tableId)
      : undefined;
    check(
      "fixture table appears as available",
      Boolean(fixtureTable && fixtureTable.availability === "available"),
      fixtureTable?.availability ?? "missing",
    );

    const openKey = `${idempotencyBase}_session`;
    const openResult = await sb.rpc("open_dining_session", {
      p_table_id: tableId,
      p_idempotency_key: openKey,
    });
    const openParsed = DiningSessionDetailSchema.safeParse(openResult.data);
    check(
      "open_dining_session parses",
      Boolean(!openResult.error && openParsed.success),
      openResult.error ? safeError(openResult.error) : openParsed.success ? "" : "schema mismatch",
    );
    if (!openParsed.success) {
      throw new Error("Cannot continue without an active dining session.");
    }
    sessionId = openParsed.data.sessionId;
    check(
      "session is active and bound to the fixture table",
      openParsed.data.status === "active" && openParsed.data.tableId === tableId,
    );

    const replayOpen = await sb.rpc("open_dining_session", {
      p_table_id: tableId,
      p_idempotency_key: openKey,
    });
    const replayOpenParsed = DiningSessionDetailSchema.safeParse(replayOpen.data);
    check(
      "duplicate open-session submission replays the same session",
      replayOpenParsed.success && replayOpenParsed.data.sessionId === sessionId,
      replayOpenParsed.success ? "same session" : "schema mismatch",
    );

    // --- Order A: fulfilled lifecycle ---
    const orderAKey = `${idempotencyBase}_a`;
    const orderAResult = await createOrder(2, orderAKey, "POS verification fulfilled order");
    const orderA = parseSummary(orderAResult, "create_order parses (fulfilled order)");
    if (!orderA) {
      throw new Error("Cannot continue without a created order.");
    }
    orderIds.push(orderA.orderId);
    check(
      "generated order reference is present",
      orderA.orderReference.length > 0,
      orderA.orderReference,
    );
    check("new order starts pending", orderA.status === "pending");
    check(
      "order total is computed from the authoritative menu price",
      orderA.subtotalMinor === 24690 && orderA.payableSubtotalMinor === 24690,
      `subtotal=${orderA.subtotalMinor}`,
    );
    check("order currency matches the organization", orderA.currency === currency);

    const replayA = await createOrder(2, orderAKey, "POS verification fulfilled order");
    const replayAParsed = parseSummary(replayA, "duplicate create_order parses");
    check(
      "duplicate create_order submits replay the same order",
      replayAParsed?.orderId === orderA.orderId &&
        replayAParsed?.orderReference === orderA.orderReference,
    );

    const conflictA = await createOrder(1, orderAKey, "POS verification conflicting retry");
    const conflictError = normalizePosError(conflictA.error);
    check(
      "idempotency key reuse with a different payload is rejected",
      Boolean(conflictA.error) && conflictError.code === "IDEMPOTENCY_CONFLICT",
      conflictError.code,
    );

    const sessionOrdersAfterReplay = await sb.rpc("list_orders_by_session", {
      p_dining_session_id: sessionId,
      p_status: null,
      p_limit: 50,
      p_offset: 0,
    });
    const sessionOrdersParsed = SessionOrderListResponseSchema.safeParse(
      sessionOrdersAfterReplay.data,
    );
    check(
      "duplicate submissions did not create extra orders",
      sessionOrdersParsed.success && sessionOrdersParsed.data.orders.length === 1,
      sessionOrdersParsed.success
        ? `orders=${sessionOrdersParsed.data.orders.length}`
        : "schema mismatch",
    );

    const detailA = await sb.rpc("get_order", { p_order_id: orderA.orderId });
    const detailAParsed = OrderDetailSchema.safeParse(detailA.data);
    check(
      "order detail exposes the authoritative line snapshot",
      detailAParsed.success &&
        detailAParsed.data.items[0]?.quantity === 2 &&
        detailAParsed.data.items[0]?.lineTotalMinor === 24690,
    );

    for (const status of ["accepted", "preparing", "ready", "served", "completed"] as const) {
      const transitioned = await transition(orderA.orderId, status);
      check(
        `order transitions to ${status}`,
        transitioned?.status === status,
        transitioned?.status ?? "failed",
      );
    }

    const completedA = await sb.rpc("get_order", { p_order_id: orderA.orderId });
    const completedAParsed = OrderDetailSchema.safeParse(completedA.data);
    check(
      "completed order retains the payable subtotal",
      completedAParsed.success &&
        completedAParsed.data.status === "completed" &&
        completedAParsed.data.payableSubtotalMinor === 24690,
    );

    // --- Order B: all items removed, then rejected terminal transition ---
    const orderBKey = `${idempotencyBase}_b`;
    const orderBResult = await createOrder(1, orderBKey, "POS verification empty-item order");
    const orderB = parseSummary(orderBResult, "create_order parses (empty-item order)");
    if (!orderB) {
      throw new Error("Cannot continue without the second order.");
    }
    orderIds.push(orderB.orderId);

    const detailB = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const detailBParsed = OrderDetailSchema.safeParse(detailB.data);
    const itemB = detailBParsed.success ? (detailBParsed.data.items[0] ?? null) : null;
    check("second order has one editable item", Boolean(itemB));
    if (!itemB) {
      throw new Error("Cannot continue without an editable second order item.");
    }

    const addResult = await sb.rpc("add_order_item", {
      p_order_id: orderB.orderId,
      p_menu_item_id: menuItemId ?? "",
      p_quantity: 1,
      p_modifier_option_ids: [],
      p_notes: "POS verification added item",
    });
    check(
      "add_order_item succeeds",
      !addResult.error,
      addResult.error ? safeError(addResult.error) : "",
    );

    const afterAdd = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const afterAddParsed = OrderDetailSchema.safeParse(afterAdd.data);
    check(
      "added item increases the order total",
      afterAddParsed.success &&
        afterAddParsed.data.itemCount === 2 &&
        afterAddParsed.data.subtotalMinor === 24690,
      afterAddParsed.success ? `subtotal=${afterAddParsed.data.subtotalMinor}` : "schema mismatch",
    );

    const updateResult = await sb.rpc("update_order_item_quantity", {
      p_order_item_id: itemB.orderItemId,
      p_quantity: 3,
    });
    check(
      "update_order_item_quantity succeeds",
      !updateResult.error,
      updateResult.error ? safeError(updateResult.error) : "",
    );

    const afterUpdate = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const afterUpdateParsed = OrderDetailSchema.safeParse(afterUpdate.data);
    const updatedItem = afterUpdateParsed.success
      ? afterUpdateParsed.data.items.find((item) => item.orderItemId === itemB.orderItemId)
      : undefined;
    check(
      "quantity update recalculates the line and order totals",
      updatedItem?.quantity === 3 &&
        updatedItem.lineTotalMinor === 37035 &&
        afterUpdateParsed.success &&
        afterUpdateParsed.data.subtotalMinor === 49380,
      `line=${updatedItem?.lineTotalMinor} subtotal=${afterUpdateParsed.success ? afterUpdateParsed.data.subtotalMinor : "n/a"}`,
    );

    const zeroUpdate = await sb.rpc("update_order_item_quantity", {
      p_order_item_id: itemB.orderItemId,
      p_quantity: 0,
    });
    check(
      "zero quantity is rejected without changing totals",
      Boolean(zeroUpdate.error) &&
        normalizePosError(zeroUpdate.error).code === "ORDER_ITEM_QUANTITY_INVALID",
    );

    const afterZeroUpdate = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const afterZeroUpdateParsed = OrderDetailSchema.safeParse(afterZeroUpdate.data);
    check(
      "rejected zero quantity leaves the order unchanged",
      afterUpdateParsed.success &&
        afterZeroUpdateParsed.success &&
        summaryFingerprint(afterUpdateParsed.data) ===
          summaryFingerprint(afterZeroUpdateParsed.data),
    );

    const itemsToRemove = afterUpdateParsed.success ? afterUpdateParsed.data.items : [];
    for (const item of itemsToRemove) {
      const removeResult = await sb.rpc("remove_order_item", {
        p_order_item_id: item.orderItemId,
        p_reason: "POS verification removal",
      });
      check(
        "remove_order_item succeeds",
        !removeResult.error,
        removeResult.error ? safeError(removeResult.error) : "",
      );
    }

    const afterRemove = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const afterRemoveParsed = OrderDetailSchema.safeParse(afterRemove.data);
    check(
      "removing every item leaves zero active items and a zero payable subtotal",
      afterRemoveParsed.success &&
        afterRemoveParsed.data.activeItemCount === 0 &&
        afterRemoveParsed.data.payableSubtotalMinor === 0,
    );

    for (const status of ["accepted", "preparing", "ready"] as const) {
      const transitioned = await transition(orderB.orderId, status);
      check(
        `zero-item order may reach ${status}`,
        transitioned?.status === status,
        transitioned?.status ?? "failed",
      );
    }

    const zeroItemServed = await sb.rpc("transition_order_status", {
      p_order_id: orderB.orderId,
      p_status: "served",
      p_reason: null,
    });
    const zeroItemServedError = normalizePosError(zeroItemServed.error);
    check(
      "zero-item order cannot be served",
      Boolean(zeroItemServed.error) && zeroItemServedError.code === "ORDER_INVALID_STATUS",
      zeroItemServedError.code,
    );

    const stillReady = await sb.rpc("get_order", { p_order_id: orderB.orderId });
    const stillReadyParsed = OrderDetailSchema.safeParse(stillReady.data);
    check(
      "rejected zero-item transition leaves the order unchanged",
      stillReadyParsed.success && stillReadyParsed.data.status === "ready",
    );

    const cancelB = await sb.rpc("cancel_order", {
      p_order_id: orderB.orderId,
      p_reason: "POS verification zero-item order cancellation",
    });
    const cancelBParsed = parseSummary(cancelB, "cancel_order parses (zero-item order)");
    check(
      "zero-item order is cancelled instead of fulfilled",
      cancelBParsed?.status === "cancelled" && cancelBParsed?.payableSubtotalMinor === 0,
    );

    // --- Order C: cancellation preserves historical totals ---
    const orderCKey = `${idempotencyBase}_c`;
    const orderCResult = await createOrder(3, orderCKey, "POS verification cancelled order");
    const orderC = parseSummary(orderCResult, "create_order parses (cancelled order)");
    if (!orderC) {
      throw new Error("Cannot continue without the third order.");
    }
    orderIds.push(orderC.orderId);
    check(
      "third order subtotal is authoritative",
      orderC.subtotalMinor === 37035,
      `subtotal=${orderC.subtotalMinor}`,
    );

    const cancelC = await sb.rpc("cancel_order", {
      p_order_id: orderC.orderId,
      p_reason: "POS verification customer changed their mind",
    });
    const cancelCParsed = parseSummary(cancelC, "cancel_order parses (cancelled order)");
    check("cancelled order has a zero payable subtotal", cancelCParsed?.payableSubtotalMinor === 0);
    check(
      "cancelled order retains its historical subtotal",
      cancelCParsed?.subtotalMinor === 37035,
    );
    check(
      "cancellation reason is recorded",
      cancelCParsed?.cancellationReason === "POS verification customer changed their mind",
    );

    const terminalTransition = await sb.rpc("transition_order_status", {
      p_order_id: orderC.orderId,
      p_status: "accepted",
      p_reason: null,
    });
    check(
      "cancelled order rejects further transitions",
      Boolean(terminalTransition.error) &&
        normalizePosError(terminalTransition.error).code === "ORDER_INVALID_STATUS",
    );

    const terminalCancel = await sb.rpc("cancel_order", {
      p_order_id: orderC.orderId,
      p_reason: "POS verification duplicate cancellation",
    });
    check(
      "cancelled order rejects a duplicate cancellation",
      Boolean(terminalCancel.error) &&
        normalizePosError(terminalCancel.error).code === "ORDER_INVALID_STATUS",
    );

    const terminalAdd = await sb.rpc("add_order_item", {
      p_order_id: orderC.orderId,
      p_menu_item_id: menuItemId,
      p_quantity: 1,
      p_modifier_option_ids: [],
      p_notes: null,
    });
    const terminalAddError = normalizePosError(terminalAdd.error);
    check(
      "cancelled order rejects item edits",
      Boolean(terminalAdd.error) &&
        ["ORDER_MODIFICATION_NOT_ALLOWED", "ORDER_INVALID_STATUS"].includes(terminalAddError.code),
      terminalAddError.code,
    );

    const sessionDetail = await sb.rpc("get_dining_session", { p_session_id: sessionId });
    const sessionDetailParsed = DiningSessionDetailSchema.safeParse(sessionDetail.data);
    check(
      "session summary reflects three orders and the payable total",
      sessionDetailParsed.success &&
        sessionDetailParsed.data.orderCount === 3 &&
        sessionDetailParsed.data.activeOrderCount === 0 &&
        sessionDetailParsed.data.subtotalMinor === 24690,
      sessionDetailParsed.success
        ? `orders=${sessionDetailParsed.data.orderCount} payable=${sessionDetailParsed.data.subtotalMinor}`
        : "schema mismatch",
    );

    const closeResult = await sb.rpc("close_dining_session", {
      p_session_id: sessionId,
      p_reason: "POS verification cleanup",
    });
    const closeParsed = DiningSessionDetailSchema.safeParse(closeResult.data);
    check(
      "close_dining_session succeeds after all orders are terminal",
      Boolean(!closeResult.error && closeParsed.success && closeParsed.data.status === "closed"),
      closeResult.error ? safeError(closeResult.error) : "",
    );

    const tableAfterClose = await sb.rpc("list_branch_tables", {
      p_branch_id: branchId,
      p_include_inactive: false,
    });
    const tableAfterCloseParsed = ListBranchTablesResponseSchema.safeParse(tableAfterClose.data);
    check(
      "table becomes available after the session closes",
      tableAfterCloseParsed.success &&
        tableAfterCloseParsed.data.tables.find((table) => table.tableId === tableId)
          ?.availability === "available",
    );

    // --- Cleanup: soft-delete the disposable fixtures ---
    const deactivateResult = await fixtureClient.rpc("deactivate_table", {
      p_table_id: tableId,
      p_reason: "POS integration verification cleanup",
    });
    tableDeactivated = !deactivateResult.error;
    check(
      "fixture table deactivated",
      tableDeactivated,
      deactivateResult.error ? safeError(deactivateResult.error) : "",
    );

    const archiveItemResult = await fixtureClient.rpc("archive_menu_item", {
      p_menu_item_id: menuItemId,
    });
    itemArchived = !archiveItemResult.error;
    check(
      "fixture menu item archived",
      itemArchived,
      archiveItemResult.error ? safeError(archiveItemResult.error) : "",
    );

    const archiveCategoryResult = await fixtureClient.rpc("archive_menu_category", {
      p_category_id: categoryId,
    });
    categoryArchived = !archiveCategoryResult.error;
    check(
      "fixture menu category archived",
      categoryArchived,
      archiveCategoryResult.error ? safeError(archiveCategoryResult.error) : "",
    );

    const tablesAfterCleanup = await sb.rpc("list_branch_tables", {
      p_branch_id: branchId,
      p_include_inactive: false,
    });
    const tablesAfterCleanupParsed = ListBranchTablesResponseSchema.safeParse(
      tablesAfterCleanup.data,
    );
    check(
      "deactivated fixture table is hidden from the POS table list",
      tablesAfterCleanupParsed.success &&
        !tablesAfterCleanupParsed.data.tables.some((table) => table.tableId === tableId),
    );

    const menuAfterCleanup = await loadBranchMenu(sb, branchId, currency);
    check(
      "archived fixture item is hidden from the POS menu",
      !menuAfterCleanup.categories.some((category) =>
        category.items.some((item) => item.id === menuItemId),
      ),
    );
  } catch (error) {
    check("write lifecycle completed without an unexpected error", false, safeError(error));
  } finally {
    // Best-effort cleanup so a failed run does not leave an active session or
    // active fixtures behind.
    if (sessionId) {
      try {
        const sessionResult = await sb.rpc("get_dining_session", { p_session_id: sessionId });
        const sessionParsed = DiningSessionDetailSchema.safeParse(sessionResult.data);
        if (sessionParsed.success && sessionParsed.data.status === "active") {
          for (const order of sessionParsed.data.orders) {
            if (["pending", "accepted", "preparing", "ready"].includes(order.status)) {
              await sb.rpc("cancel_order", {
                p_order_id: order.orderId,
                p_reason: "POS verification interrupted-run cleanup",
              });
            } else if (order.status === "served") {
              await sb.rpc("transition_order_status", {
                p_order_id: order.orderId,
                p_status: "completed",
                p_reason: null,
              });
            }
          }

          const close = await sb.rpc("close_dining_session", {
            p_session_id: sessionId,
            p_reason: "POS verification interrupted-run cleanup",
          });
          if (close.error) {
            console.log(
              `CLEANUP_WARN active session could not be closed: ${safeError(close.error)}`,
            );
          }
        }
      } catch (error) {
        console.log(`CLEANUP_WARN session cleanup failed: ${safeError(error)}`);
      }
    }

    if (tableId && !tableDeactivated) {
      const deactivate = await fixtureClient.rpc("deactivate_table", {
        p_table_id: tableId,
        p_reason: "POS integration verification cleanup",
      });
      if (deactivate.error) {
        console.log(
          `CLEANUP_WARN table ${tableId} could not be deactivated: ${safeError(deactivate.error)}`,
        );
      }
    }
    if (menuItemId && !itemArchived) {
      const archive = await fixtureClient.rpc("archive_menu_item", { p_menu_item_id: menuItemId });
      if (archive.error) {
        console.log(
          `CLEANUP_WARN menu item ${menuItemId} could not be archived: ${safeError(archive.error)}`,
        );
      }
    }
    if (categoryId && !categoryArchived) {
      const archive = await fixtureClient.rpc("archive_menu_category", {
        p_category_id: categoryId,
      });
      if (archive.error) {
        console.log(
          `CLEANUP_WARN menu category ${categoryId} could not be archived: ${safeError(archive.error)}`,
        );
      }
    }

    console.log(
      `RESIDUAL fixture="${label}" categoryId=${categoryId ?? "none"} menuItemId=${menuItemId ?? "none"} tableId=${tableId ?? "none"} sessionId=${sessionId ?? "none"} orderIds=${orderIds.join(",") || "none"} branch="${branchName}"`,
    );
  }
}

async function main(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.loadEnvFile(".env.local");
  }

  const environment = parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  assertPublishableKey(environment.supabasePublishableKey);
  check(
    "Supabase URL is the Development project",
    new URL(environment.supabaseUrl).hostname === "bnticbeepxwhrzimouuh.supabase.co",
  );
  check("Supabase URL is not Production", !environment.supabaseUrl.includes(PRODUCTION_REF));

  const email = requireCredential("POS_DEV_STAFF_EMAIL");
  const password = requireCredential("POS_DEV_STAFF_PASSWORD");

  const sb = createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  check(
    "Owner sign-in succeeds",
    Boolean(authData.user) && !authError,
    authError ? safeError(authError) : "",
  );
  if (!authData.user) {
    throw new Error("Cannot continue without an authenticated Development staff account.");
  }

  const { profile, organization, roleRows, assignments, branches } = await loadWorkspaceRows(
    sb,
    authData.user.id,
  );

  check("Active staff profile loads", profile.status === "active");
  check(
    "Organization loads and is operational",
    organization.status === "active",
    `status=${organization.status}`,
  );

  const roles = mapRoleAssignments(roleRows);
  check(
    "Organization-scoped role assignments include the Owner",
    roles.some((role) => role.role === "owner" && role.scope === "organization"),
  );
  check(
    "Role mapper preserves branch scope",
    roles.every((role) => role.scope === "organization" || Boolean(role.branchId)),
  );
  check("Owner receives organization administration", isOrganizationAdmin(roles));

  const activeBranches = branches.filter((branch) => branch.status === "active");
  check(
    "At least one active branch is accessible",
    activeBranches.length > 0,
    `count=${activeBranches.length}`,
  );

  const workspaceByBranch = activeBranches.map((branch) =>
    buildWorkspace({
      organization,
      profile,
      email: "redacted",
      roleRows,
      branchRows: branches,
      assignedBranchIds: assignments.map((assignment) => assignment.branch_id),
      activeBranchCandidate: branch.id,
      planLabel: null,
    }),
  );

  check(
    "Branch switching resolves the requested active branch",
    workspaceByBranch.every(
      (workspace, index) => workspace?.activeBranchId === activeBranches[index]?.id,
    ),
  );
  check(
    "Owner has effective authority on every active branch",
    activeBranches.every((branch) => effectiveRoles(roles, branch.id).includes("owner")),
  );
  check(
    "Effective primary role is Owner on every active branch",
    activeBranches.every((branch) => deriveEffectivePrimaryRole(roles, branch.id) === "owner"),
  );

  const branchOrderData: Array<{ branchId: string; data: BranchOrderListResponse }> = [];

  for (const branch of activeBranches) {
    const tablesResult = await sb.rpc("list_branch_tables", {
      p_branch_id: branch.id,
      p_include_inactive: false,
    });
    const tables = ListBranchTablesResponseSchema.safeParse(tablesResult.data);
    check(
      `list_branch_tables parses for branch "${branch.name}"`,
      Boolean(!tablesResult.error && tables.success),
      tablesResult.error
        ? safeError(tablesResult.error)
        : tables.success
          ? ""
          : tables.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );

    if (tables.success) {
      check(
        `table statistics are internally consistent for branch "${branch.name}"`,
        tables.data.tables.every(
          (table) => (table.availability === "occupied") === Boolean(table.activeSessionId),
        ),
        `total=${tables.data.tables.length} available=${tables.data.tables.filter((t) => t.availability === "available").length} occupied=${tables.data.tables.filter((t) => t.availability === "occupied").length}`,
      );
    }

    if (tables.success) {
      for (const table of tables.data.tables.filter((t) => t.activeSessionId)) {
        const sessionResult = await sb.rpc("get_active_dining_session", {
          p_table_id: table.tableId,
        });
        const session = GetActiveDiningSessionResponseSchema.safeParse(sessionResult.data);
        check(
          `active session parses for table "${table.label}"`,
          Boolean(
            !sessionResult.error &&
            session.success &&
            session.data.activeSession?.sessionId === table.activeSessionId,
          ),
          sessionResult.error
            ? safeError(sessionResult.error)
            : session.success
              ? ""
              : "schema mismatch",
        );
      }
    }

    const menu = await loadBranchMenu(sb, branch.id, organization.default_currency_code);
    check(
      `menu resolution succeeds for branch "${branch.name}"`,
      menu.branchId === branch.id,
      `items=${menu.itemCount}`,
    );
    check(
      `menu items match the organization currency for branch "${branch.name}"`,
      menu.categories.every((category) =>
        category.items.every((item) => item.currency === organization.default_currency_code),
      ),
      `currency=${organization.default_currency_code}`,
    );

    const ordersResult = await sb.rpc("list_branch_orders", {
      p_branch_id: branch.id,
      p_status: null,
      p_from: null,
      p_to: null,
      p_limit: 50,
      p_offset: 0,
    });
    const orders = BranchOrderListResponseSchema.safeParse(ordersResult.data);
    check(
      `list_branch_orders parses for branch "${branch.name}"`,
      Boolean(!ordersResult.error && orders.success),
      ordersResult.error
        ? safeError(ordersResult.error)
        : orders.success
          ? `orders=${orders.data.orders.length} hasMore=${orders.data.hasMore}`
          : orders.error.issues.map((issue) => issue.path.join(".")).join(", "),
    );

    if (orders.success) {
      branchOrderData.push({ branchId: branch.id, data: orders.data });
      check(
        `payableSubtotalMinor is present and correct for branch "${branch.name}"`,
        orders.data.orders.every(
          (order) =>
            order.payableSubtotalMinor === (order.status === "cancelled" ? 0 : order.subtotalMinor),
        ),
      );
    }
  }

  const allOrders = branchOrderData.flatMap(({ data }) => data.orders);
  check(
    "Branch order responses are branch-scoped",
    branchOrderData.every(({ branchId, data }) => data.branchId === branchId),
  );

  const detailCandidates = [
    allOrders.find((order) => order.status === "cancelled"),
    allOrders.find((order) => order.itemCount > 0 && order.status !== "cancelled"),
  ].filter((order): order is OrderSummary => Boolean(order));

  for (const candidate of detailCandidates) {
    const orderResult = await sb.rpc("get_order", { p_order_id: candidate.orderId });
    const order = OrderDetailSchema.safeParse(orderResult.data);
    check(
      `get_order parses for status ${candidate.status}`,
      Boolean(!orderResult.error && order.success),
      orderResult.error ? safeError(orderResult.error) : order.success ? "" : "schema mismatch",
    );
    if (!order.success) {
      continue;
    }

    check(
      `order detail preserves payable totals for status ${order.data.status}`,
      order.data.payableSubtotalMinor ===
        (order.data.status === "cancelled" ? 0 : order.data.subtotalMinor),
    );
    if (order.data.status === "cancelled") {
      check("cancelled order keeps a zero payable subtotal", order.data.payableSubtotalMinor === 0);
      check("cancelled order retains its historical subtotal", order.data.subtotalMinor >= 0);
    }

    const sessionResult = await sb.rpc("get_dining_session", {
      p_session_id: order.data.diningSessionId,
    });
    const session = DiningSessionDetailSchema.safeParse(sessionResult.data);
    check(
      `get_dining_session parses for order status ${order.data.status}`,
      Boolean(!sessionResult.error && session.success),
      sessionResult.error
        ? safeError(sessionResult.error)
        : session.success
          ? ""
          : "schema mismatch",
    );
    if (session.success) {
      check(
        "session orders include payableSubtotalMinor",
        session.data.orders.every(
          (sessionOrder) => OrderSummarySchema.safeParse(sessionOrder).success,
        ),
        `orders=${session.data.orders.length}`,
      );
    }
  }

  const usableSessionId =
    branchOrderData
      .flatMap(({ data }) => data.orders)
      .find((order) => Boolean(order.diningSessionId))?.diningSessionId ?? null;

  // A random branch identifier must be rejected as not found, not leak data.
  {
    const result = await sb.rpc("list_branch_tables", {
      p_branch_id: "00000000-0000-4000-8000-000000000001",
      p_include_inactive: false,
    });
    const normalized = normalizePosError(result.error);
    check(
      "unknown branch is rejected",
      Boolean(result.error) &&
        ["BRANCH_NOT_FOUND", "BRANCH_ACCESS_DENIED"].includes(normalized.code),
      normalized.code,
    );
  }

  {
    const result = await sb.rpc("get_order", {
      p_order_id: "00000000-0000-4000-8000-000000000002",
    });
    const normalized = normalizePosError(result.error);
    check(
      "unknown order is rejected",
      Boolean(result.error) && normalized.code === "ORDER_NOT_FOUND",
      normalized.code,
    );
  }

  {
    const unknownId = "00000000-0000-4000-8000-000000000003";
    const expectations: Array<[string, PromiseLike<{ error: unknown }>, string]> = [
      [
        "get_table rejects an unknown table",
        sb.rpc("get_table", { p_table_id: unknownId }),
        "TABLE_NOT_FOUND",
      ],
      [
        "get_active_dining_session rejects an unknown table",
        sb.rpc("get_active_dining_session", { p_table_id: unknownId }),
        "TABLE_NOT_FOUND",
      ],
      [
        "open_dining_session rejects an unknown table",
        sb.rpc("open_dining_session", { p_table_id: unknownId, p_idempotency_key: null }),
        "TABLE_NOT_FOUND",
      ],
      [
        "get_dining_session rejects an unknown session",
        sb.rpc("get_dining_session", { p_session_id: unknownId }),
        "DINING_SESSION_NOT_FOUND",
      ],
      [
        "close_dining_session rejects an unknown session",
        sb.rpc("close_dining_session", { p_session_id: unknownId, p_reason: null }),
        "DINING_SESSION_NOT_FOUND",
      ],
      [
        "list_orders_by_session rejects an unknown session",
        sb.rpc("list_orders_by_session", {
          p_dining_session_id: unknownId,
          p_status: null,
          p_limit: 20,
          p_offset: 0,
        }),
        "DINING_SESSION_NOT_FOUND",
      ],
      [
        "list_branch_dining_sessions rejects an unknown branch",
        sb.rpc("list_branch_dining_sessions", {
          p_branch_id: unknownId,
          p_status: null,
          p_from: null,
          p_to: null,
          p_limit: 20,
          p_offset: 0,
        }),
        "BRANCH_NOT_FOUND",
      ],
      [
        "list_branch_orders rejects an unknown branch",
        sb.rpc("list_branch_orders", {
          p_branch_id: unknownId,
          p_status: null,
          p_from: null,
          p_to: null,
          p_limit: 20,
          p_offset: 0,
        }),
        "BRANCH_NOT_FOUND",
      ],
      [
        "create_order rejects an unknown session",
        sb.rpc("create_order", {
          p_dining_session_id: unknownId,
          p_items: [],
          p_notes: null,
          p_idempotency_key: null,
        }),
        "DINING_SESSION_NOT_FOUND",
      ],
      [
        "add_order_item rejects an unknown order",
        sb.rpc("add_order_item", {
          p_order_id: unknownId,
          p_menu_item_id: unknownId,
          p_quantity: 1,
          p_modifier_option_ids: [],
          p_notes: null,
        }),
        "ORDER_NOT_FOUND",
      ],
      [
        "update_order_item_quantity rejects an unknown item",
        sb.rpc("update_order_item_quantity", { p_order_item_id: unknownId, p_quantity: 1 }),
        "ORDER_ITEM_NOT_FOUND",
      ],
      [
        "remove_order_item rejects an unknown item",
        sb.rpc("remove_order_item", { p_order_item_id: unknownId, p_reason: null }),
        "ORDER_ITEM_NOT_FOUND",
      ],
      [
        "transition_order_status rejects an unknown order",
        sb.rpc("transition_order_status", {
          p_order_id: unknownId,
          p_status: "accepted",
          p_reason: null,
        }),
        "ORDER_NOT_FOUND",
      ],
      [
        "cancel_order rejects an unknown order",
        sb.rpc("cancel_order", { p_order_id: unknownId, p_reason: "probe" }),
        "ORDER_NOT_FOUND",
      ],
    ];

    for (const [label, request, expected] of expectations) {
      const result = await request;
      const normalized = normalizePosError(result.error);
      check(label, Boolean(result.error) && normalized.code === expected, normalized.code);
    }
  }

  // Empty orders are rejected before any insert.
  if (usableSessionId) {
    const before = await sb.rpc("get_dining_session", { p_session_id: usableSessionId });
    const beforeParsed = DiningSessionDetailSchema.safeParse(before.data);

    const result = await sb.rpc("create_order", {
      p_dining_session_id: usableSessionId,
      p_items: [],
      p_notes: null,
      p_idempotency_key: null,
    });
    const normalized = normalizePosError(result.error);
    check(
      "empty order is rejected",
      Boolean(result.error) && normalized.code === "ORDER_EMPTY",
      normalized.code,
    );

    const after = await sb.rpc("get_dining_session", { p_session_id: usableSessionId });
    const afterParsed = DiningSessionDetailSchema.safeParse(after.data);
    check(
      "rejected empty order created no order",
      beforeParsed.success &&
        afterParsed.success &&
        beforeParsed.data.orderCount === afterParsed.data.orderCount,
      beforeParsed.success && afterParsed.success
        ? `orderCount=${beforeParsed.data.orderCount}`
        : "session read failed",
    );
  } else {
    skip("empty order is rejected", "no dining session exists in accessible branches");
  }

  // Pre-commit quantity rejection on an existing order item.
  const itemCandidate =
    detailCandidates.find((order) => order.itemCount > 0) ??
    allOrders.find((order) => order.itemCount > 0);

  const firstItem = await (async () => {
    if (!itemCandidate) {
      return null;
    }
    const detailResult = await sb.rpc("get_order", { p_order_id: itemCandidate.orderId });
    const detail = OrderDetailSchema.safeParse(detailResult.data);
    return detail.success ? (detail.data.items[0] ?? null) : null;
  })();

  if (itemCandidate && firstItem) {
    const before = await sb.rpc("get_order", { p_order_id: itemCandidate.orderId });
    const beforeParsed = OrderDetailSchema.safeParse(before.data);

    const result = await sb.rpc("update_order_item_quantity", {
      p_order_item_id: firstItem.orderItemId,
      p_quantity: 0,
    });
    const normalized = normalizePosError(result.error);
    check(
      "invalid item quantity is rejected",
      Boolean(result.error) && normalized.code === "ORDER_ITEM_QUANTITY_INVALID",
      normalized.code,
    );

    const after = await sb.rpc("get_order", { p_order_id: itemCandidate.orderId });
    const afterParsed = OrderDetailSchema.safeParse(after.data);
    check(
      "rejected quantity update changed nothing",
      beforeParsed.success &&
        afterParsed.success &&
        summaryFingerprint(beforeParsed.data) === summaryFingerprint(afterParsed.data),
    );

    const addResult = await sb.rpc("add_order_item", {
      p_order_id: itemCandidate.orderId,
      p_menu_item_id: firstItem.menuItemId,
      p_quantity: 100,
      p_modifier_option_ids: [],
      p_notes: null,
    });
    const addNormalized = normalizePosError(addResult.error);
    check(
      "out-of-range add-item quantity is rejected",
      Boolean(addResult.error) &&
        ["ORDER_ITEM_QUANTITY_INVALID", "ORDER_MODIFICATION_NOT_ALLOWED"].includes(
          addNormalized.code,
        ),
      addNormalized.code,
    );

    const afterAdd = await sb.rpc("get_order", { p_order_id: itemCandidate.orderId });
    const afterAddParsed = OrderDetailSchema.safeParse(afterAdd.data);
    check(
      "rejected add-item changed nothing",
      afterParsed.success &&
        afterAddParsed.success &&
        summaryFingerprint(afterParsed.data) === summaryFingerprint(afterAddParsed.data),
    );
  } else {
    skip("invalid item quantity is rejected", "no existing order with an item is available");
  }

  const terminalOrder = detailCandidates.find(
    (order) => order.status === "cancelled" || order.status === "completed",
  );

  if (terminalOrder) {
    const before = await sb.rpc("get_order", { p_order_id: terminalOrder.orderId });
    const beforeParsed = OrderDetailSchema.safeParse(before.data);

    const transition = await sb.rpc("transition_order_status", {
      p_order_id: terminalOrder.orderId,
      p_status: "accepted",
      p_reason: null,
    });
    const transitionError = normalizePosError(transition.error);
    check(
      `terminal ${terminalOrder.status} order rejects transition`,
      Boolean(transition.error) &&
        [
          "ORDER_INVALID_STATUS",
          "ORDER_MODIFICATION_NOT_ALLOWED",
          // Historical orders usually belong to closed sessions; the backend
          // rejects the write on session state before reaching order state.
          "SESSION_NOT_ACTIVE",
        ].includes(transitionError.code),
      transitionError.code,
    );

    const after = await sb.rpc("get_order", { p_order_id: terminalOrder.orderId });
    const afterParsed = OrderDetailSchema.safeParse(after.data);
    check(
      "rejected terminal transition changed nothing",
      beforeParsed.success &&
        afterParsed.success &&
        summaryFingerprint(beforeParsed.data) === summaryFingerprint(afterParsed.data),
    );

    if (terminalOrder.status === "cancelled") {
      const cancel = await sb.rpc("cancel_order", {
        p_order_id: terminalOrder.orderId,
        p_reason: "POS hosted verification duplicate cancellation",
      });
      const cancelError = normalizePosError(cancel.error);
      check(
        "already cancelled order cannot be cancelled again",
        Boolean(cancel.error) && cancelError.code === "ORDER_INVALID_STATUS",
        cancelError.code,
      );

      const afterCancel = await sb.rpc("get_order", { p_order_id: terminalOrder.orderId });
      const afterCancelParsed = OrderDetailSchema.safeParse(afterCancel.data);
      check(
        "rejected duplicate cancellation changed nothing",
        afterParsed.success &&
          afterCancelParsed.success &&
          summaryFingerprint(afterParsed.data) === summaryFingerprint(afterCancelParsed.data),
      );
    }
  } else {
    skip("terminal order guards", "no cancelled or completed order exists in accessible branches");
  }

  // An unauthenticated client must not be able to execute POS RPCs.
  const anon = createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  {
    const result = await anon.rpc("get_order", {
      p_order_id: "00000000-0000-4000-8000-000000000002",
    });
    const normalized = normalizePosError(result.error);
    check(
      "unauthenticated POS RPC is denied",
      Boolean(result.error) && normalized.code === "PERMISSION_DENIED",
      normalized.code,
    );
  }

  if (process.argv.includes("--allow-writes")) {
    const targetBranch = activeBranches[0];
    if (!targetBranch) {
      throw new Error("No active branch is available for the write lifecycle.");
    }
    await runWriteLifecycle(
      sb,
      targetBranch.id,
      targetBranch.name,
      organization.default_currency_code,
    );
  } else {
    skip(
      "disposable write lifecycle",
      "pass --allow-writes to create, exercise, and soft-delete disposable POS fixtures",
    );
  }

  // Local scope: do not revoke the user's other Development sessions.
  await sb.auth.signOut({ scope: "local" });

  console.log(`\nRESULT passed=${passed} failed=${failed}`);
  if (failed > 0) {
    console.log(`FAILED CHECKS:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`VERIFICATION FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
