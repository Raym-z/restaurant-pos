import type { CurrencyCode } from "@/lib/currency";

import type { PosMenu, PosMenuCategory, PosMenuGroup, PosMenuItem } from "./types";

/**
 * Mirrors the authoritative M3 availability/pricing rule used by
 * `private.resolve_menu_item_for_branch`:
 *
 * - archived items and categories are unavailable;
 * - an explicit branch_menu_categories(is_available = false) row blocks the category;
 * - an explicit branch_menu_items(is_available = false) row blocks the item;
 * - otherwise the item is available and inherits the organization price;
 * - an explicit branch price override is authoritative.
 *
 * This resolver is for display only. The order RPCs re-resolve prices and
 * availability from the database and reject any mismatch.
 */
export interface MenuCategorySource {
  id: string;
  name: string;
  sort_order: number;
  archived_at: string | null;
}

export interface MenuItemSource {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price_minor: number;
  currency_code: string;
  sort_order: number;
  archived_at: string | null;
}

export interface BranchCategorySource {
  menu_category_id: string;
  is_available: boolean;
}

export interface BranchItemSource {
  menu_item_id: string;
  is_available: boolean;
  price_override_minor: number | null;
}

export interface ModifierGroupSource {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  archived_at: string | null;
}

export interface ModifierOptionSource {
  id: string;
  modifier_group_id: string;
  name: string;
  price_delta_minor: number;
  sort_order: number;
  archived_at: string | null;
}

export interface MenuItemModifierGroupSource {
  menu_item_id: string;
  modifier_group_id: string;
  sort_order: number;
}

export interface BranchMenuSource {
  categories: readonly MenuCategorySource[];
  items: readonly MenuItemSource[];
  branchCategories: readonly BranchCategorySource[];
  branchItems: readonly BranchItemSource[];
  modifierGroups: readonly ModifierGroupSource[];
  modifierOptions: readonly ModifierOptionSource[];
  itemModifierGroups: readonly MenuItemModifierGroupSource[];
}

function bySortOrderThenName(
  left: { sort_order: number; name: string },
  right: { sort_order: number; name: string },
): number {
  if (left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }

  return left.name.localeCompare(right.name);
}

export function buildPosMenu(
  branchId: string,
  defaultCurrency: string,
  source: BranchMenuSource,
): PosMenu {
  const categoryById = new Map(
    source.categories
      .filter((category) => category.archived_at === null)
      .map((category) => [category.id, category]),
  );
  const blockedCategoryIds = new Set(
    source.branchCategories
      .filter((entry) => !entry.is_available)
      .map((entry) => entry.menu_category_id),
  );
  const branchItemByMenuItemId = new Map(
    source.branchItems.map((entry) => [entry.menu_item_id, entry]),
  );

  const optionsByGroupId = new Map<string, ModifierOptionSource[]>();
  for (const option of source.modifierOptions) {
    if (option.archived_at !== null) {
      continue;
    }

    const groupOptions = optionsByGroupId.get(option.modifier_group_id) ?? [];
    groupOptions.push(option);
    optionsByGroupId.set(option.modifier_group_id, groupOptions);
  }

  const groupById = new Map(
    source.modifierGroups
      .filter((group) => group.archived_at === null)
      .map((group) => [group.id, group]),
  );
  const groupsByItemId = new Map<string, MenuItemModifierGroupSource[]>();
  for (const link of source.itemModifierGroups) {
    if (!groupById.has(link.modifier_group_id)) {
      continue;
    }

    const itemGroups = groupsByItemId.get(link.menu_item_id) ?? [];
    itemGroups.push(link);
    groupsByItemId.set(link.menu_item_id, itemGroups);
  }

  const itemsByCategoryId = new Map<string, PosMenuItem[]>();

  for (const item of source.items) {
    const category = categoryById.get(item.category_id);
    if (!category || item.archived_at !== null) {
      continue;
    }

    // The backend rejects items whose currency differs from the organization
    // default. Hide them from the builder rather than offering an order that
    // is guaranteed to fail server-side.
    if (item.currency_code !== defaultCurrency) {
      continue;
    }

    if (blockedCategoryIds.has(category.id)) {
      continue;
    }

    const branchItem = branchItemByMenuItemId.get(item.id);
    if (branchItem && !branchItem.is_available) {
      continue;
    }

    const modifierGroups: PosMenuGroup[] = (groupsByItemId.get(item.id) ?? [])
      .map((link) => {
        const group = groupById.get(link.modifier_group_id);
        if (!group) {
          return null;
        }

        const options = [...(optionsByGroupId.get(group.id) ?? [])]
          .sort(bySortOrderThenName)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceDeltaMinor: option.price_delta_minor,
          }));

        // Keep groups with zero active options. The backend validates the same
        // active group set, so a required group with no options must remain
        // visible and fail selection validation instead of silently vanishing.
        return {
          id: group.id,
          name: group.name,
          minSelections: group.min_selections,
          maxSelections: group.max_selections,
          options,
          sortOrder: link.sort_order,
        };
      })
      .filter((group): group is PosMenuGroup & { sortOrder: number } => group !== null)
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      })
      .map(({ sortOrder: _sortOrder, ...group }) => group);

    const viewItem: PosMenuItem = {
      id: item.id,
      categoryId: category.id,
      name: item.name,
      description: item.description,
      basePriceMinor: branchItem?.price_override_minor ?? item.base_price_minor,
      currency: item.currency_code as CurrencyCode,
      sortOrder: item.sort_order,
      modifierGroups,
    };

    const categoryItems = itemsByCategoryId.get(category.id) ?? [];
    categoryItems.push(viewItem);
    itemsByCategoryId.set(category.id, categoryItems);
  }

  const categories: PosMenuCategory[] = [...categoryById.values()]
    .sort(bySortOrderThenName)
    .map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sort_order,
      items: (itemsByCategoryId.get(category.id) ?? []).sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      }),
    }))
    .filter((category) => category.items.length > 0);

  return {
    branchId,
    categories,
    itemCount: categories.reduce((total, category) => total + category.items.length, 0),
  };
}

export function modifierDeltaMinor(
  item: PosMenuItem,
  selectedOptionIds: readonly string[],
): number {
  const selected = new Set(selectedOptionIds);
  let delta = 0;

  for (const group of item.modifierGroups) {
    for (const option of group.options) {
      if (selected.has(option.id)) {
        delta += option.priceDeltaMinor;
      }
    }
  }

  return delta;
}

export interface ModifierSelectionIssue {
  groupId: string;
  issue: "min" | "max" | "unknown";
  requiredMin: number;
  allowedMax: number;
}

export function validateModifierSelection(
  item: PosMenuItem,
  selectedOptionIds: readonly string[],
): ModifierSelectionIssue | null {
  const selected = new Set(selectedOptionIds);
  const knownOptionIds = new Set(
    item.modifierGroups.flatMap((group) => group.options.map((option) => option.id)),
  );

  for (const optionId of selected) {
    if (!knownOptionIds.has(optionId)) {
      return {
        groupId: "",
        issue: "unknown",
        requiredMin: 0,
        allowedMax: 0,
      };
    }
  }

  for (const group of item.modifierGroups) {
    const count = group.options.filter((option) => selected.has(option.id)).length;
    if (count < group.minSelections) {
      return {
        groupId: group.id,
        issue: "min",
        requiredMin: group.minSelections,
        allowedMax: group.maxSelections,
      };
    }
    if (count > group.maxSelections) {
      return {
        groupId: group.id,
        issue: "max",
        requiredMin: group.minSelections,
        allowedMax: group.maxSelections,
      };
    }
  }

  return null;
}

export function selectedModifierLabels(
  item: PosMenuItem,
  selectedOptionIds: readonly string[],
): string[] {
  const selected = new Set(selectedOptionIds);
  return item.modifierGroups.flatMap((group) =>
    group.options.filter((option) => selected.has(option.id)).map((option) => option.name),
  );
}
