import assert from "node:assert/strict";
import { test } from "node:test";

import {
  availableBranchCount,
  buildBranchAvailability,
  effectivePriceMinor,
  isMenuItemAvailableAtBranch,
  toggleUnavailableBranch,
  unavailableBranchIdsForItem,
} from "../availability";
import { filterMenuItems } from "../selectors";
import type { BranchMenuAvailability, MenuItem } from "../types";

const BASE_PRICE = 100000;

function menuItem(branchAvailability: BranchMenuAvailability[]): MenuItem {
  return {
    id: "item-1",
    organizationId: "org-1",
    categoryId: "category-1",
    name: "Lamb Kofta Plate",
    description: "Charred lamb kofta with tahini and grilled pita.",
    translations: {
      id: { name: "Piring Kofta Domba", description: "Kofta domba bakar." },
    },
    basePrice: { amountMinor: BASE_PRICE, currency: "IDR" },
    status: "available",
    tags: ["signature"],
    variants: [],
    modifierGroups: [],
    branchAvailability,
    createdAt: "2026-01-12T10:40:00Z",
    updatedAt: "2026-10-28T18:12:00Z",
  };
}

function filterByBranch(item: MenuItem, branchId: string) {
  return filterMenuItems([item], {
    query: "",
    categoryId: "all",
    status: "all",
    branchId,
    locale: "en",
  });
}

test("a new branch sees existing items when no availability entry exists", () => {
  const item = menuItem([
    { branchId: "branch-a", isAvailable: true, priceOverride: null },
    { branchId: "branch-b", isAvailable: false, priceOverride: null },
  ]);

  assert.equal(isMenuItemAvailableAtBranch(item, "branch-new"), true);
  assert.equal(filterByBranch(item, "branch-new").length, 1);
});

test("explicitly unavailable items remain hidden", () => {
  const item = menuItem([{ branchId: "branch-b", isAvailable: false, priceOverride: null }]);

  assert.equal(isMenuItemAvailableAtBranch(item, "branch-b"), false);
  assert.equal(filterByBranch(item, "branch-b").length, 0);
});

test("explicitly available items remain visible", () => {
  const item = menuItem([{ branchId: "branch-a", isAvailable: true, priceOverride: null }]);

  assert.equal(isMenuItemAvailableAtBranch(item, "branch-a"), true);
  assert.equal(filterByBranch(item, "branch-a").length, 1);
});

test("editing one branch does not modify another branch setting", () => {
  const item = menuItem([
    { branchId: "branch-a", isAvailable: false, priceOverride: null },
    { branchId: "branch-b", isAvailable: true, priceOverride: null },
  ]);
  const branchIds = ["branch-a", "branch-b", "branch-c"];
  const existing = new Map(item.branchAvailability.map((entry) => [entry.branchId, entry]));

  // Start from the form's draft: only branch-a is explicitly unavailable.
  let draft = unavailableBranchIdsForItem(item);
  assert.deepEqual(draft, ["branch-a"]);

  // Disable branch-c. branch-a stays disabled and branch-b stays available.
  draft = toggleUnavailableBranch(draft, "branch-c", false);
  let next = buildBranchAvailability(branchIds, draft, existing);
  assert.equal(next.find((entry) => entry.branchId === "branch-a")?.isAvailable, false);
  assert.equal(next.find((entry) => entry.branchId === "branch-b")?.isAvailable, true);
  assert.equal(next.find((entry) => entry.branchId === "branch-c")?.isAvailable, false);

  // Disable branch-b. branch-a must remain disabled.
  draft = toggleUnavailableBranch(draft, "branch-b", false);
  next = buildBranchAvailability(branchIds, draft, existing);
  assert.equal(next.find((entry) => entry.branchId === "branch-a")?.isAvailable, false);
  assert.equal(next.find((entry) => entry.branchId === "branch-b")?.isAvailable, false);

  // Re-enable branch-a. branch-b must remain disabled.
  draft = toggleUnavailableBranch(draft, "branch-a", true);
  next = buildBranchAvailability(branchIds, draft, existing);
  assert.equal(next.find((entry) => entry.branchId === "branch-a")?.isAvailable, true);
  assert.equal(next.find((entry) => entry.branchId === "branch-b")?.isAvailable, false);
});

test("existing branch filtering and availability counts remain correct", () => {
  const item = menuItem([
    {
      branchId: "branch-a",
      isAvailable: true,
      priceOverride: { amountMinor: 120000, currency: "IDR" },
    },
    { branchId: "branch-b", isAvailable: false, priceOverride: null },
  ]);

  assert.equal(filterByBranch(item, "branch-a").length, 1);
  assert.equal(filterByBranch(item, "branch-b").length, 0);
  assert.equal(filterByBranch(item, "branch-c").length, 1);
  assert.equal(filterByBranch(item, "all").length, 1);

  assert.equal(availableBranchCount(item, ["branch-a", "branch-b", "branch-c"]), 2);

  // Missing and explicit-available entries use the base price; overrides win.
  assert.equal(effectivePriceMinor(item, "branch-a"), 120000);
  assert.equal(effectivePriceMinor(item, "branch-b"), BASE_PRICE);
  assert.equal(effectivePriceMinor(item, "branch-c"), BASE_PRICE);
  assert.equal(effectivePriceMinor(item, "branch-new"), BASE_PRICE);
});
