import type { MenuCategory, MenuItem, MenuItemStatus, MenuText } from "./types";

export const ALL_CATEGORIES = "all";
export const ALL_BRANCHES = "all";
export const ALL_STATUSES = "all";

export function localizedMenuText(
  content: { name: string; description: string; translations?: Partial<Record<string, MenuText>> },
  locale: string,
): MenuText {
  const translation = content.translations?.[locale];
  return translation ?? { name: content.name, description: content.description };
}

export function localizeMenuCategory(category: MenuCategory, locale: string): MenuText {
  return localizedMenuText(category, locale);
}

export function localizeMenuItem(item: MenuItem, locale: string): MenuText {
  return localizedMenuText(item, locale);
}

export interface MenuItemFilters {
  query: string;
  categoryId: string;
  status: MenuItemStatus | "all";
  branchId: string;
}

export function filterMenuItems(
  items: MenuItem[],
  { query, categoryId, status, branchId }: MenuItemFilters,
): MenuItem[] {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryId !== ALL_CATEGORIES && item.categoryId !== categoryId) {
      return false;
    }
    if (status !== "all" && item.status !== status) {
      return false;
    }
    if (branchId !== ALL_BRANCHES) {
      const availability = item.branchAvailability.find((entry) => entry.branchId === branchId);
      if (!availability?.isAvailable) {
        return false;
      }
    }
    if (!normalized) {
      return true;
    }
    return [item.name, item.description, ...item.tags].some((value) =>
      value.toLowerCase().includes(normalized),
    );
  });
}

export function effectivePriceMinor(item: MenuItem, branchId: string): number {
  const availability = item.branchAvailability.find((entry) => entry.branchId === branchId);
  return availability?.priceOverride?.amountMinor ?? item.basePrice.amountMinor;
}
