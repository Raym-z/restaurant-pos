import { isMenuItemAvailableAtBranch } from "./availability";
import type { MenuCategory, MenuItem, MenuItemStatus, MenuText } from "./types";

export {
  availableBranchCount,
  effectivePriceMinor,
  findBranchAvailability,
  isMenuItemAvailableAtBranch,
} from "./availability";

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
  /** Interface locale used to include the matching localized content. */
  locale?: string;
  /** Localizes tag identifiers for search, e.g. `gluten-free` → `Bebas gluten`. */
  tagLabel?: (tag: string) => string;
}

/**
 * Text fields considered by menu search.
 *
 * The canonical base content is always searchable. When an interface locale is
 * supplied, the matching localized name and description are included as well,
 * along with raw and translated tag labels.
 */
export function menuItemSearchValues(
  item: MenuItem,
  { locale, tagLabel }: Pick<MenuItemFilters, "locale" | "tagLabel"> = {},
): string[] {
  const values = [item.name, item.description];

  if (locale) {
    const translation = item.translations?.[locale as "id" | "en"];
    if (translation) {
      values.push(translation.name, translation.description);
    }
  }

  for (const tag of item.tags) {
    values.push(tag);
    if (tagLabel) {
      values.push(tagLabel(tag));
    }
  }

  return values.filter((value) => value.length > 0);
}

export function filterMenuItems(
  items: MenuItem[],
  { query, categoryId, status, branchId, locale, tagLabel }: MenuItemFilters,
): MenuItem[] {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryId !== ALL_CATEGORIES && item.categoryId !== categoryId) {
      return false;
    }
    if (status !== "all" && item.status !== status) {
      return false;
    }
    if (branchId !== ALL_BRANCHES && !isMenuItemAvailableAtBranch(item, branchId)) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return menuItemSearchValues(item, { locale, tagLabel }).some((value) =>
      value.toLowerCase().includes(normalized),
    );
  });
}
