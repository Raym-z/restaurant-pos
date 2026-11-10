import {
  isBlank,
  validateRequired,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";

import type { TableAvailability, TableSummary } from "./contracts";
import type { TableOverviewStats } from "./types";

export type TableAvailabilityFilter = TableAvailability | "all";

export interface TableFormValues {
  label: string;
  capacity: string;
}

const MAX_TABLE_CAPACITY = 32767;

/**
 * The backend deactivation guard rejects a table with an active dining
 * session. Mirror that rule for UX so the confirmation cannot be submitted
 * accidentally; the backend remains authoritative.
 */
export function canDeactivateTable(
  table: Pick<TableSummary, "status" | "activeSessionId">,
): boolean {
  return table.status === "active" && table.activeSessionId === null;
}

export function tableOverviewStats(tables: readonly TableSummary[]): TableOverviewStats {
  return {
    total: tables.length,
    available: tables.filter((table) => table.availability === "available").length,
    occupied: tables.filter((table) => table.availability === "occupied").length,
    inactive: tables.filter((table) => table.status === "inactive").length,
  };
}

export function filterTables(
  tables: readonly TableSummary[],
  query: string,
  availability: TableAvailabilityFilter,
): TableSummary[] {
  const normalized = query.trim().toLowerCase();

  return tables.filter((table) => {
    const matchesQuery =
      !normalized ||
      table.label.toLowerCase().includes(normalized) ||
      (table.activeSessionId ?? "").toLowerCase().includes(normalized);
    const matchesAvailability = availability === "all" || table.availability === availability;
    return matchesQuery && matchesAvailability;
  });
}

export function validateTableForm(
  values: TableFormValues,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const label = validateRequired(values.label, "fields.tableLabel", t, 80);
  if (label) {
    errors.label = label;
  }

  if (isBlank(values.capacity)) {
    errors.capacity = t("required", { field: t("fields.tableCapacity") });
  } else {
    const capacity = Number(values.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_TABLE_CAPACITY) {
      errors.capacity = t("invalidTableCapacity", { max: MAX_TABLE_CAPACITY });
    }
  }

  return errors;
}
