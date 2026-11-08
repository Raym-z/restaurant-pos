import type { CurrencyCode } from "@/lib/currency";
import type { StaffRole } from "@/types/roles";

import type { DiningSessionDetail, OrderDetail, TableSummary } from "./contracts";

/** Verified read model for the branch menu used by the order builder. */
export interface PosMenuOption {
  id: string;
  name: string;
  priceDeltaMinor: number;
}

export interface PosMenuGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: PosMenuOption[];
}

export interface PosMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  /** Base price after branch override, excluding modifiers. */
  basePriceMinor: number;
  currency: CurrencyCode;
  sortOrder: number;
  modifierGroups: PosMenuGroup[];
}

export interface PosMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: PosMenuItem[];
}

export interface PosMenu {
  branchId: string;
  categories: PosMenuCategory[];
  itemCount: number;
}

/** One editable line in the order builder, before it is submitted. */
export interface DraftOrderLine {
  key: string;
  menuItemId: string;
  name: string;
  quantity: number;
  modifierOptionIds: string[];
  modifierLabels: string[];
  basePriceMinor: number;
  unitPriceMinor: number;
  currency: CurrencyCode;
  notes: string;
}

export interface PosActionError {
  code: string;
  message: string;
  /** True when retrying the same request may succeed. */
  retryable: boolean;
}

export type PosActionResult<T> =
  { ok: true; data: T; committed: true } | { ok: false; error: PosActionError; committed: boolean };

export type PosLoadResult<T> = { ok: true; data: T } | { ok: false; error: PosActionError };

export interface TableOverviewStats {
  total: number;
  available: number;
  occupied: number;
}

export interface TableOverviewData {
  branchId: string;
  tables: TableSummary[];
  stats: TableOverviewStats;
}

export interface TableDetailData {
  table: TableSummary;
  activeSession: DiningSessionDetail | null;
  menu: PosMenu | null;
}

export interface OrderDetailData {
  order: OrderDetail;
  session: DiningSessionDetail | null;
  menu: PosMenu | null;
  /** Present when the menu read failed; order viewing still succeeds. */
  menuError: PosActionError | null;
}

export interface PosViewer {
  roles: readonly StaffRole[];
  branchId: string;
  timezone: string;
  currency: CurrencyCode;
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}
