import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildPosMenu,
  modifierDeltaMinor,
  selectedModifierLabels,
  validateModifierSelection,
  type BranchMenuSource,
} from "../menu";

const source = (): BranchMenuSource => ({
  categories: [
    { id: "cat-1", name: "Mains", sort_order: 1, archived_at: null },
    { id: "cat-2", name: "Drinks", sort_order: 2, archived_at: null },
  ],
  items: [
    {
      id: "item-1",
      category_id: "cat-1",
      name: "Nasi Goreng",
      description: "Fried rice",
      base_price_minor: 50000,
      currency_code: "IDR",
      sort_order: 1,
      archived_at: null,
    },
    {
      id: "item-2",
      category_id: "cat-1",
      name: "Mie Goreng",
      description: "Fried noodles",
      base_price_minor: 45000,
      currency_code: "IDR",
      sort_order: 2,
      archived_at: null,
    },
    {
      id: "item-3",
      category_id: "cat-2",
      name: "Es Teh",
      description: null,
      base_price_minor: 15000,
      currency_code: "IDR",
      sort_order: 1,
      archived_at: null,
    },
    {
      id: "item-4",
      category_id: "cat-1",
      name: "Archived special",
      description: null,
      base_price_minor: 99000,
      currency_code: "IDR",
      sort_order: 3,
      archived_at: "2026-01-01T00:00:00Z",
    },
  ],
  branchCategories: [],
  branchItems: [],
  modifierGroups: [
    {
      id: "group-1",
      name: "Spice level",
      min_selections: 1,
      max_selections: 1,
      archived_at: null,
    },
  ],
  modifierOptions: [
    {
      id: "option-1",
      modifier_group_id: "group-1",
      name: "Mild",
      price_delta_minor: 0,
      sort_order: 2,
      archived_at: null,
    },
    {
      id: "option-2",
      modifier_group_id: "group-1",
      name: "Hot",
      price_delta_minor: 5000,
      sort_order: 1,
      archived_at: null,
    },
    {
      id: "option-3",
      modifier_group_id: "group-1",
      name: "Archived",
      price_delta_minor: 0,
      sort_order: 0,
      archived_at: "2026-01-01T00:00:00Z",
    },
  ],
  itemModifierGroups: [{ menu_item_id: "item-1", modifier_group_id: "group-1", sort_order: 1 }],
});

test("builds a branch menu with available items and modifier groups", () => {
  const menu = buildPosMenu("branch-1", source());

  assert.equal(menu.itemCount, 3);
  assert.deepEqual(
    menu.categories.map((category) => category.name),
    ["Mains", "Drinks"],
  );
  assert.deepEqual(
    menu.categories[0]?.items.map((item) => item.name),
    ["Nasi Goreng", "Mie Goreng"],
  );

  const item = menu.categories[0]?.items[0];
  assert.equal(item?.basePriceMinor, 50000);
  assert.equal(item?.modifierGroups.length, 1);
  assert.deepEqual(
    item?.modifierGroups[0]?.options.map((option) => option.name),
    ["Hot", "Mild"],
  );
});

test("explicit branch availability blocks categories and items", () => {
  const blockedItem = source();
  blockedItem.branchItems = [
    { menu_item_id: "item-2", is_available: false, price_override_minor: null },
  ];
  const menu = buildPosMenu("branch-1", blockedItem);
  assert.deepEqual(
    menu.categories[0]?.items.map((item) => item.name),
    ["Nasi Goreng"],
  );
});

test("explicit branch category availability blocks every item in the category", () => {
  const blockedCategory = source();
  blockedCategory.branchCategories = [{ menu_category_id: "cat-1", is_available: false }];
  const menu = buildPosMenu("branch-1", blockedCategory);

  assert.deepEqual(
    menu.categories.map((category) => category.name),
    ["Drinks"],
  );
});

test("branch price overrides replace the organization base price", () => {
  const overridden = source();
  overridden.branchItems = [
    { menu_item_id: "item-1", is_available: true, price_override_minor: 65000 },
  ];
  const menu = buildPosMenu("branch-1", overridden);
  assert.equal(menu.categories[0]?.items[0]?.basePriceMinor, 65000);
});

test("modifier helpers calculate deltas and validate required groups", () => {
  const menu = buildPosMenu("branch-1", source());
  const item = menu.categories[0]?.items[0];
  assert.ok(item);

  assert.equal(modifierDeltaMinor(item, ["option-2"]), 5000);
  assert.equal(modifierDeltaMinor(item, ["option-1", "option-2"]), 5000);
  assert.deepEqual(selectedModifierLabels(item, ["option-2"]), ["Hot"]);

  const missing = validateModifierSelection(item, []);
  assert.equal(missing?.issue, "min");
  assert.equal(missing?.requiredMin, 1);

  assert.equal(validateModifierSelection(item, ["option-1"]), null);

  const unknown = validateModifierSelection(item, ["not-an-option"]);
  assert.equal(unknown?.issue, "unknown");
});

test("empty categories are omitted after availability resolution", () => {
  const empty = source();
  empty.branchCategories = [
    { menu_category_id: "cat-1", is_available: false },
    { menu_category_id: "cat-2", is_available: false },
  ];
  const menu = buildPosMenu("branch-1", empty);
  assert.equal(menu.itemCount, 0);
  assert.equal(menu.categories.length, 0);
});
