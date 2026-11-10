import type { TableSummary } from "./contracts";

export type TableSelectionMode = "open" | "resume" | "blocked";

/**
 * Determines the safe UI action for a table:
 * - `resume` when an active session already exists (never open a duplicate);
 * - `blocked` for inactive tables;
 * - `open` when the table is active and has no active session.
 */
export function tableSelectionMode(
  table: Pick<TableSummary, "status" | "availability" | "activeSessionId">,
): TableSelectionMode {
  if (table.status !== "active" || table.availability === "inactive") {
    return "blocked";
  }

  return table.activeSessionId ? "resume" : "open";
}

/** The POS is branch-scoped; a table from another branch must never be used. */
export function tableBelongsToBranch(
  table: Pick<TableSummary, "branchId">,
  branchId: string,
): boolean {
  return table.branchId === branchId;
}
