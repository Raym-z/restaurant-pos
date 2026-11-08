/**
 * Menu availability semantics.
 *
 * One rule applies everywhere: a missing `branchAvailability` entry means the
 * item is available at that branch. Only an explicit `isAvailable: false`
 * marks it unavailable. This lets new branches inherit existing menu items
 * without requiring a data migration for every item.
 */

import type { BranchMenuAvailability, MenuItem } from "./types";

export function findBranchAvailability(
  item: MenuItem,
  branchId: string,
): BranchMenuAvailability | undefined {
  return item.branchAvailability.find((entry) => entry.branchId === branchId);
}

/** Missing entries default to available; only explicit false is unavailable. */
export function isMenuItemAvailableAtBranch(item: MenuItem, branchId: string): boolean {
  return findBranchAvailability(item, branchId)?.isAvailable !== false;
}

/** Counts available branches, treating unconfigured branches as available. */
export function availableBranchCount(item: MenuItem, branchIds: readonly string[]): number {
  return branchIds.filter((branchId) => isMenuItemAvailableAtBranch(item, branchId)).length;
}

/** Existing branch-specific price override, or the item base price. */
export function effectivePriceMinor(item: MenuItem, branchId: string): number {
  return (
    findBranchAvailability(item, branchId)?.priceOverride?.amountMinor ?? item.basePrice.amountMinor
  );
}

/** Branch ids explicitly marked unavailable on an existing item. */
export function unavailableBranchIdsForItem(item: MenuItem): string[] {
  return item.branchAvailability
    .filter((entry) => entry.isAvailable === false)
    .map((entry) => entry.branchId);
}

/**
 * Applies a draft unavailable-branch set to the current branch collection.
 *
 * Explicit settings for branches outside the draft are preserved through the
 * existing availability map (notably price overrides), while new branches are
 * defaulted to available.
 */
export function buildBranchAvailability(
  branchIds: readonly string[],
  unavailableBranchIds: readonly string[],
  existingByBranch?: ReadonlyMap<string, BranchMenuAvailability>,
): BranchMenuAvailability[] {
  const unavailable = new Set(unavailableBranchIds);
  return branchIds.map((branchId) => ({
    branchId,
    isAvailable: !unavailable.has(branchId),
    priceOverride: existingByBranch?.get(branchId)?.priceOverride ?? null,
  }));
}

/** Immutable update for a single branch in the form's unavailable-id draft. */
export function toggleUnavailableBranch(
  current: readonly string[],
  branchId: string,
  available: boolean,
): string[] {
  if (available) {
    return current.filter((id) => id !== branchId);
  }
  return current.includes(branchId) ? [...current] : [...current, branchId];
}
