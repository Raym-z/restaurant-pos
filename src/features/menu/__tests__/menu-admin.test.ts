import assert from "node:assert/strict";
import test from "node:test";

import {
  MenuCategoryInputSchema,
  MenuCategoryRowSchema,
  MenuItemInputSchema,
  MenuItemRowSchema,
} from "../contracts";
import { normalizeMenuError } from "../errors";
import { validateCategoryForm, validateItemForm } from "../form-validation";
import { buildCategoryViews, buildItemViews, nextSortOrder } from "../models";

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const CATEGORY_ID = "00000000-0000-4000-8000-000000000101";
const ARCHIVED_CATEGORY_ID = "00000000-0000-4000-8000-000000000102";
const ITEM_ID = "00000000-0000-4000-8000-000000000201";
const SECOND_ITEM_ID = "00000000-0000-4000-8000-000000000202";
const BRANCH_A = "00000000-0000-4000-8000-000000000301";
const BRANCH_B = "00000000-0000-4000-8000-000000000302";
const INSTANT = "2026-11-09T10:00:00Z";

const categoryRow = {
  id: CATEGORY_ID,
  organization_id: ORG_ID,
  name: "Mains",
  description: "Main dishes",
  sort_order: 1,
  archived_at: null,
  created_at: INSTANT,
  updated_at: INSTANT,
};

const archivedCategoryRow = {
  ...categoryRow,
  id: ARCHIVED_CATEGORY_ID,
  name: "Old menu",
  sort_order: 2,
  archived_at: INSTANT,
};

const itemRow = {
  id: ITEM_ID,
  organization_id: ORG_ID,
  category_id: CATEGORY_ID,
  name: "Lamb Kofta",
  description: null,
  base_price_minor: 145000,
  currency_code: "IDR",
  sort_order: 1,
  archived_at: null,
  created_at: INSTANT,
  updated_at: INSTANT,
};

const archivedItemRow = {
  ...itemRow,
  id: SECOND_ITEM_ID,
  name: "Retired dish",
  sort_order: 2,
  archived_at: INSTANT,
};

test("menu row contracts accept the public table shape", () => {
  assert.equal(MenuCategoryRowSchema.safeParse(categoryRow).success, true);
  assert.equal(MenuItemRowSchema.safeParse(itemRow).success, true);
  assert.equal(MenuItemRowSchema.safeParse({ ...itemRow, base_price_minor: -1 }).success, false);
  assert.equal(MenuItemRowSchema.safeParse({ ...itemRow, currency_code: "idr" }).success, false);
});

test("write inputs require a positive price and valid sort order", () => {
  const base = {
    categoryId: CATEGORY_ID,
    name: "New item",
    description: "",
    sortOrder: 0,
  };

  assert.equal(MenuItemInputSchema.safeParse({ ...base, basePriceMinor: 1 }).success, true);
  assert.equal(MenuItemInputSchema.safeParse({ ...base, basePriceMinor: 0 }).success, false);
  assert.equal(MenuItemInputSchema.safeParse({ ...base, basePriceMinor: 1.5 }).success, false);
  assert.equal(
    MenuItemInputSchema.safeParse({ ...base, basePriceMinor: 1, sortOrder: -1 }).success,
    false,
  );
  assert.equal(
    MenuCategoryInputSchema.safeParse({ name: "  ", description: "", sortOrder: 0 }).success,
    false,
  );
});

test("category views count active and archived items", () => {
  const views = buildCategoryViews([categoryRow, archivedCategoryRow], [itemRow, archivedItemRow]);

  assert.equal(views[0]?.status, "active");
  assert.equal(views[0]?.itemCount, 2);
  assert.equal(views[0]?.activeItemCount, 1);
  assert.equal(views[1]?.status, "archived");
  assert.equal(nextSortOrder(views), 3);
});

test("item views default to available and honour branch overrides", () => {
  const categories = buildCategoryViews([categoryRow], [itemRow]);
  const views = buildItemViews(
    [itemRow, archivedItemRow],
    categories,
    [
      {
        branch_id: BRANCH_A,
        menu_item_id: ITEM_ID,
        is_available: false,
        price_override_minor: null,
      },
      {
        branch_id: BRANCH_B,
        menu_item_id: ITEM_ID,
        is_available: true,
        price_override_minor: 150000,
      },
    ],
    [
      { id: BRANCH_A, name: "Branch A", timezone: "Asia/Jakarta" },
      { id: BRANCH_B, name: "Branch B", timezone: "Asia/Jakarta" },
    ],
    [BRANCH_B],
  );

  const item = views.find((entry) => entry.id === ITEM_ID);
  assert.ok(item);
  assert.equal(item.status, "active");
  assert.equal(item.availableBranchCount, 1);
  assert.equal(item.hasPriceOverride, true);
  assert.equal(item.availability[0]?.isAvailable, false);
  assert.equal(item.availability[0]?.canManageAvailability, false);
  assert.equal(item.availability[1]?.effectivePriceMinor, 150000);
  assert.equal(item.availability[1]?.canManageAvailability, true);
  assert.equal(item.categoryName, "Mains");
  assert.equal(item.categoryArchived, false);

  const archived = views.find((entry) => entry.id === SECOND_ITEM_ID);
  assert.ok(archived);
  assert.equal(archived.status, "archived");
  // Missing branch rows default to available; archive is the global stop.
  assert.equal(archived.availableBranchCount, 2);
});

test("category validation rejects duplicate names but allows the current record", () => {
  const categories = buildCategoryViews([categoryRow, archivedCategoryRow], []);
  const t = (key: string) => key;

  assert.equal(
    validateCategoryForm(
      { name: "Mains", description: "", sortOrder: "1" },
      categories,
      undefined,
      t,
    ).name,
    "duplicateCategory",
  );
  assert.equal(
    validateCategoryForm(
      { name: "Mains", description: "", sortOrder: "1" },
      categories,
      CATEGORY_ID,
      t,
    ).name,
    undefined,
  );
  assert.equal(
    validateCategoryForm(
      { name: "Mains", description: "", sortOrder: "not-a-number" },
      categories,
      CATEGORY_ID,
      t,
    ).sortOrder,
    "invalidSortOrder",
  );
});

test("item validation rejects zero prices and duplicate names in a category", () => {
  const categories = buildCategoryViews([categoryRow, archivedCategoryRow], []);
  const items = buildItemViews([itemRow, archivedItemRow], categories, [], []);
  const t = (key: string) => key;

  const duplicate = validateItemForm(
    {
      categoryId: CATEGORY_ID,
      name: "Lamb Kofta",
      description: "",
      basePriceMinor: 1000,
      sortOrder: "1",
    },
    items,
    undefined,
    t,
    "IDR",
  );
  assert.equal(duplicate.name, "duplicateItem");

  const zeroPrice = validateItemForm(
    {
      categoryId: CATEGORY_ID,
      name: "New dish",
      description: "",
      basePriceMinor: 0,
      sortOrder: "0",
    },
    items,
    undefined,
    t,
    "IDR",
  );
  assert.equal(zeroPrice.basePriceMinor, "pricePositive");
});

test("menu error normalization understands application and PostgREST codes", () => {
  assert.deepEqual(normalizeMenuError({ message: "MENU_ITEM_NOT_FOUND", details: "Missing" }), {
    code: "MENU_ITEM_NOT_FOUND",
    message: "Missing",
    retryable: false,
  });
  assert.equal(
    normalizeMenuError({ code: "42501", message: "permission denied" }).code,
    "PERMISSION_DENIED",
  );
  assert.equal(
    normalizeMenuError({ code: "23505", message: "duplicate" }).code,
    "RESOURCE_CONFLICT",
  );
  assert.equal(normalizeMenuError({ message: "RATE_LIMIT_EXCEEDED" }).retryable, true);
});
