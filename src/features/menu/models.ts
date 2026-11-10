import type { CurrencyCode } from "@/lib/currency";

import type { BranchMenuItemRow, MenuCategoryRow, MenuItemRow } from "./contracts";

export type MenuStatus = "active" | "archived";

export interface MenuBranch {
  id: string;
  name: string;
  timezone: string;
}

export interface MenuBranchAvailability {
  branchId: string;
  branchName: string;
  isAvailable: boolean;
  priceOverrideMinor: number | null;
  effectivePriceMinor: number;
  /** UI hint: the current staff role can change availability for this branch. */
  canManageAvailability: boolean;
}

export interface MenuCategoryView {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  archivedAt: string | null;
  status: MenuStatus;
  itemCount: number;
  activeItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemView {
  id: string;
  categoryId: string;
  categoryName: string | null;
  categoryArchived: boolean;
  name: string;
  description: string | null;
  basePriceMinor: number;
  currency: CurrencyCode;
  sortOrder: number;
  archivedAt: string | null;
  status: MenuStatus;
  availability: MenuBranchAvailability[];
  availableBranchCount: number;
  hasPriceOverride: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuOverviewData {
  categories: MenuCategoryView[];
  items: MenuItemView[];
  branches: MenuBranch[];
  currency: CurrencyCode;
  timezone: string;
  canManage: boolean;
}

function bySortOrderThenName(
  left: { sortOrder: number; name: string },
  right: { sortOrder: number; name: string },
): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.name.localeCompare(right.name);
}

export function menuStatus(archivedAt: string | null): MenuStatus {
  return archivedAt === null ? "active" : "archived";
}

export function buildCategoryViews(
  categories: readonly MenuCategoryRow[],
  items: readonly MenuItemRow[],
): MenuCategoryView[] {
  const counts = new Map<string, { total: number; active: number }>();
  for (const item of items) {
    const current = counts.get(item.category_id) ?? { total: 0, active: 0 };
    current.total += 1;
    if (item.archived_at === null) {
      current.active += 1;
    }
    counts.set(item.category_id, current);
  }

  return categories
    .map((category) => {
      const count = counts.get(category.id) ?? { total: 0, active: 0 };
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        sortOrder: category.sort_order,
        archivedAt: category.archived_at,
        status: menuStatus(category.archived_at),
        itemCount: count.total,
        activeItemCount: count.active,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      };
    })
    .sort(bySortOrderThenName);
}

export function buildItemViews(
  items: readonly MenuItemRow[],
  categories: readonly MenuCategoryView[],
  branchItems: readonly BranchMenuItemRow[],
  branches: readonly MenuBranch[],
  manageableBranchIds: readonly string[] = [],
): MenuItemView[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const manageableBranchIdSet = new Set(manageableBranchIds);
  const branchItemByKey = new Map(
    branchItems.map((entry) => [`${entry.branch_id}:${entry.menu_item_id}`, entry]),
  );

  return items
    .map((item) => {
      const category = categoryById.get(item.category_id);
      const availability = branches.map((branch) => {
        const branchItem = branchItemByKey.get(`${branch.id}:${item.id}`);
        return {
          branchId: branch.id,
          branchName: branch.name,
          isAvailable: branchItem ? branchItem.is_available : true,
          priceOverrideMinor: branchItem?.price_override_minor ?? null,
          effectivePriceMinor: branchItem?.price_override_minor ?? item.base_price_minor,
          canManageAvailability: manageableBranchIdSet.has(branch.id),
        };
      });

      return {
        id: item.id,
        categoryId: item.category_id,
        categoryName: category?.name ?? null,
        categoryArchived: category?.status !== "active",
        name: item.name,
        description: item.description,
        basePriceMinor: item.base_price_minor,
        currency: item.currency_code as CurrencyCode,
        sortOrder: item.sort_order,
        archivedAt: item.archived_at,
        status: menuStatus(item.archived_at),
        availability,
        availableBranchCount: availability.filter((entry) => entry.isAvailable).length,
        hasPriceOverride: availability.some((entry) => entry.priceOverrideMinor !== null),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    })
    .sort(bySortOrderThenName);
}

export function nextSortOrder(rows: readonly { sortOrder: number }[]): number {
  return rows.reduce((highest, row) => Math.max(highest, row.sortOrder), 0) + 1;
}
