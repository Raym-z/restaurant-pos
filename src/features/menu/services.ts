import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getWorkspace } from "@/features/workspace/services";
import type { WorkspaceLoadResult } from "@/features/workspace/types";
import type { CurrencyCode } from "@/lib/currency";
import { MANAGER_ROLES } from "@/types/roles";

import {
  BranchMenuItemRowSchema,
  MenuCategoryRowSchema,
  MenuItemRowSchema,
  type BranchMenuItemRow,
  type MenuCategoryRow,
  type MenuItemRow,
} from "./contracts";
import { normalizeMenuError, type MenuActionError, type MenuLoadResult } from "./errors";
import {
  buildCategoryViews,
  buildItemViews,
  type MenuBranch,
  type MenuCategoryView,
  type MenuItemView,
  type MenuOverviewData,
} from "./models";

type MenuClient = SupabaseClient<Database>;

export interface MenuViewer {
  organizationId: string;
  currency: CurrencyCode;
  timezone: string;
  branches: MenuBranch[];
  /** UI hint only. The backend enforces owner/admin authorization on catalog writes. */
  canManage: boolean;
  /** Branches where the current role can change item availability. */
  manageableBranchIds: string[];
}

export type MenuViewerResult =
  | { status: "ready"; viewer: MenuViewer }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: MenuActionError };

export interface MenuCategoryPageData {
  category: MenuCategoryView;
  categories: MenuCategoryView[];
  currency: CurrencyCode;
  canManage: boolean;
}

export interface MenuItemPageData {
  item: MenuItemView;
  items: MenuItemView[];
  categories: MenuCategoryView[];
  branches: MenuBranch[];
  currency: CurrencyCode;
  timezone: string;
  canManage: boolean;
}

interface MenuSnapshot {
  categories: MenuCategoryRow[];
  items: MenuItemRow[];
  branchItems: BranchMenuItemRow[];
}

function failure(error: unknown): MenuLoadResult<never> {
  return { ok: false, error: normalizeMenuError(error) };
}

function missingRecord(message: string): MenuLoadResult<never> {
  return {
    ok: false,
    error: { code: "MENU_ITEM_NOT_FOUND", message, retryable: false },
  };
}

function resolveViewer(result: WorkspaceLoadResult): MenuViewerResult {
  if (result.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (result.status === "auth_error") {
    if (result.error.confirmedAuthFailure) {
      return { status: "unauthenticated" };
    }

    return {
      status: "unavailable",
      error: {
        code: result.error.transient ? "SERVICE_UNAVAILABLE" : "WORKSPACE_NOT_READY",
        message: result.error.message,
        retryable: true,
      },
    };
  }

  if (result.status !== "ready") {
    return {
      status: "unavailable",
      error: {
        code:
          result.status === "error" && result.error.transient
            ? "SERVICE_UNAVAILABLE"
            : "WORKSPACE_NOT_READY",
        message:
          result.status === "error"
            ? result.error.message
            : "The workspace is not ready for menu management.",
        retryable: result.status === "error" ? result.error.transient : true,
      },
    };
  }

  const workspace = result.workspace;
  const manageableBranchIds = workspace.branches
    .filter((branch) =>
      workspace.user.roles.some(
        (assignment) =>
          (assignment.scope === "organization" || assignment.branchId === branch.id) &&
          MANAGER_ROLES.includes(assignment.role),
      ),
    )
    .map((branch) => branch.id);

  return {
    status: "ready",
    viewer: {
      organizationId: workspace.organization.id,
      currency: workspace.organization.defaultCurrencyCode as CurrencyCode,
      timezone: workspace.organization.timezone,
      branches: workspace.branches
        .map((branch) => ({
          id: branch.id,
          name: branch.name,
          timezone: branch.timezone,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      canManage: workspace.isOrgAdmin,
      manageableBranchIds,
    },
  };
}

export async function getMenuViewer(): Promise<MenuViewerResult> {
  return resolveViewer(await getWorkspace());
}

async function loadSnapshot(
  supabase: MenuClient,
  viewer: MenuViewer,
): Promise<MenuLoadResult<MenuSnapshot>> {
  const branchIds = viewer.branches.map((branch) => branch.id);

  const [categoriesResult, itemsResult, branchItemsResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select(
        "id, organization_id, name, description, sort_order, archived_at, created_at, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, organization_id, category_id, name, description, base_price_minor, currency_code, sort_order, archived_at, created_at, updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    branchIds.length > 0
      ? supabase
          .from("branch_menu_items")
          .select("branch_id, menu_item_id, is_available, price_override_minor")
          .in("branch_id", branchIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const queryError = categoriesResult.error ?? itemsResult.error ?? branchItemsResult.error;
  if (queryError) {
    return failure(queryError);
  }

  const categories = MenuCategoryRowSchema.array().safeParse(categoriesResult.data ?? []);
  if (!categories.success) {
    return failure(categories.error);
  }

  const items = MenuItemRowSchema.array().safeParse(itemsResult.data ?? []);
  if (!items.success) {
    return failure(items.error);
  }

  const branchItems = BranchMenuItemRowSchema.array().safeParse(branchItemsResult.data ?? []);
  if (!branchItems.success) {
    return failure(branchItems.error);
  }

  return {
    ok: true,
    data: {
      categories: categories.data,
      items: items.data,
      branchItems: branchItems.data,
    },
  };
}

function buildOverview(viewer: MenuViewer, snapshot: MenuSnapshot): MenuOverviewData {
  const categories = buildCategoryViews(snapshot.categories, snapshot.items);
  const items = buildItemViews(
    snapshot.items,
    categories,
    snapshot.branchItems,
    viewer.branches,
    viewer.manageableBranchIds,
  );

  return {
    categories,
    items,
    branches: viewer.branches,
    currency: viewer.currency,
    timezone: viewer.timezone,
    canManage: viewer.canManage,
  };
}

export async function loadMenuOverview(
  viewer: MenuViewer,
): Promise<MenuLoadResult<MenuOverviewData>> {
  const supabase = await createSupabaseServerClient();
  const snapshot = await loadSnapshot(supabase, viewer);
  if (!snapshot.ok) {
    return snapshot;
  }

  return { ok: true, data: buildOverview(viewer, snapshot.data) };
}

export async function loadMenuCategory(
  viewer: MenuViewer,
  categoryId: string,
): Promise<MenuLoadResult<MenuCategoryPageData>> {
  const overview = await loadMenuOverview(viewer);
  if (!overview.ok) {
    return overview;
  }

  const category = overview.data.categories.find((entry) => entry.id === categoryId);
  if (!category) {
    return missingRecord("Menu category was not found.");
  }

  return {
    ok: true,
    data: {
      category,
      categories: overview.data.categories,
      currency: overview.data.currency,
      canManage: overview.data.canManage,
    },
  };
}

export async function loadMenuItem(
  viewer: MenuViewer,
  itemId: string,
): Promise<MenuLoadResult<MenuItemPageData>> {
  const overview = await loadMenuOverview(viewer);
  if (!overview.ok) {
    return overview;
  }

  const item = overview.data.items.find((entry) => entry.id === itemId);
  if (!item) {
    return missingRecord("Menu item was not found.");
  }

  return {
    ok: true,
    data: {
      item,
      items: overview.data.items,
      categories: overview.data.categories,
      branches: overview.data.branches,
      currency: overview.data.currency,
      timezone: overview.data.timezone,
      canManage: overview.data.canManage,
    },
  };
}
