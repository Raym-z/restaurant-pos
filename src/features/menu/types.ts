import type { IsoInstant, Money, Uuid } from "@/features/shared/domain";

export type MenuCategoryStatus = "active" | "archived";

export type MenuContentLocale = "id" | "en";

export interface MenuText {
  name: string;
  description: string;
}

export interface MenuCategory {
  id: Uuid;
  organizationId: Uuid;
  name: string;
  description: string;
  /** Optional localized content for seeded demo data. User-authored content falls back to name/description. */
  translations?: Partial<Record<MenuContentLocale, MenuText>>;
  sortOrder: number;
  status: MenuCategoryStatus;
  createdAt: IsoInstant;
}

export type MenuItemStatus = "available" | "unavailable" | "archived";

export interface MenuItemVariant {
  id: Uuid;
  name: string;
  price: Money;
}

export interface ModifierOption {
  id: Uuid;
  name: string;
  priceDelta: Money;
}

export interface ModifierGroup {
  id: Uuid;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface BranchMenuAvailability {
  branchId: Uuid;
  /**
   * Explicit availability. A missing entry for a branch defaults to available,
   * so new branches inherit existing menu items; only `false` hides an item.
   */
  isAvailable: boolean;
  /** Branch-specific price override; null uses the menu item base price. */
  priceOverride: Money | null;
}

export interface MenuItem {
  id: Uuid;
  organizationId: Uuid;
  categoryId: Uuid;
  name: string;
  description: string;
  /** Optional localized content for seeded demo data. User-authored content falls back to name/description. */
  translations?: Partial<Record<MenuContentLocale, MenuText>>;
  basePrice: Money;
  status: MenuItemStatus;
  tags: string[];
  variants: MenuItemVariant[];
  modifierGroups: ModifierGroup[];
  branchAvailability: BranchMenuAvailability[];
  createdAt: IsoInstant;
  updatedAt: IsoInstant;
}

export interface MenuCategoryInput {
  name: string;
  description: string;
  status: MenuCategoryStatus;
  /** Locale in which name/description were edited. */
  contentLocale: MenuContentLocale;
}

export interface MenuItemInput {
  categoryId: Uuid;
  name: string;
  description: string;
  basePriceMinor: number;
  status: MenuItemStatus;
  tags: string[];
  /** Branch ids where the item is not available. */
  unavailableBranchIds: Uuid[];
  /** Locale in which name/description were edited. */
  contentLocale: MenuContentLocale;
}

export const MENU_CATEGORY_STATUS_LABELS: Record<MenuCategoryStatus, string> = {
  active: "Active",
  archived: "Archived",
};

export const MENU_ITEM_STATUS_LABELS: Record<MenuItemStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  archived: "Archived",
};
