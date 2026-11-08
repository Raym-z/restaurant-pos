import assert from "node:assert/strict";
import { test } from "node:test";

import { filterMenuItems, menuItemSearchValues } from "../selectors";
import type { MenuItem } from "../types";

function menuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "item-1",
    organizationId: "org-1",
    categoryId: "category-1",
    name: "Charred Eggplant Dip",
    description: "Smoked eggplant, tahini, lemon, and pomegranate seeds with warm pita.",
    translations: {
      id: {
        name: "Saus Terong Bakar",
        description: "Terong asap, tahini, lemon, dan biji delima dengan pita hangat.",
      },
    },
    basePrice: { amountMinor: 65000, currency: "IDR" },
    status: "available",
    tags: ["vegetarian", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: [{ branchId: "branch-1", isAvailable: true, priceOverride: null }],
    createdAt: "2026-01-12T10:20:00Z",
    updatedAt: "2026-10-02T09:15:00Z",
    ...overrides,
  };
}

const tagLabels: Record<string, string> = {
  vegetarian: "Vegetarian",
  "gluten-free": "Bebas gluten",
};

function search(query: string, locale: string) {
  return filterMenuItems([menuItem()], {
    query,
    categoryId: "all",
    status: "all",
    branchId: "all",
    locale,
    tagLabel: (tag) => tagLabels[tag] ?? tag,
  });
}

test("Indonesian search matches localized menu names and descriptions", () => {
  assert.equal(search("terong", "id").length, 1);
  assert.equal(search("biji delima", "id").length, 1);
});

test("English search matches base menu content", () => {
  assert.equal(search("eggplant", "en").length, 1);
  assert.equal(search("pomegranate", "en").length, 1);
});

test("base content remains searchable in Indonesian", () => {
  assert.equal(search("charred", "id").length, 1);
  assert.equal(search("flatbread", "id").length, 0);
});

test("search is case-insensitive", () => {
  assert.equal(search("TERONG", "id").length, 1);
  assert.equal(search("EgGpLaNt", "en").length, 1);
});

test("empty search returns every item", () => {
  assert.equal(search("", "id").length, 1);
  assert.equal(search("   ", "id").length, 1);
});

test("localized tag labels are searchable", () => {
  assert.equal(search("bebas gluten", "id").length, 1);
  assert.equal(search("gluten-free", "id").length, 1);
});

test("search values include base content, the selected translation, and tags", () => {
  const values = menuItemSearchValues(menuItem(), {
    locale: "id",
    tagLabel: (tag) => tagLabels[tag] ?? tag,
  });

  assert.ok(values.includes("Charred Eggplant Dip"));
  assert.ok(values.includes("Saus Terong Bakar"));
  assert.ok(values.includes("vegetarian"));
  assert.ok(values.includes("Bebas gluten"));
  assert.ok(!values.includes("Gluten-free pita"));
});
