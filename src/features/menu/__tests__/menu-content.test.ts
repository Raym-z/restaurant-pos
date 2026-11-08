import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyMenuCategoryContent,
  applyMenuItemContent,
  createMenuCategoryContentDraft,
  createMenuItemContentDraft,
  resolveContentLocale,
} from "../content";
import type { MenuCategory, MenuItem } from "../types";

function menuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "item-1",
    organizationId: "org-1",
    categoryId: "category-1",
    name: "Lamb Kofta Plate",
    description: "Charred lamb kofta, green tahini, sumac onions, and grilled pita.",
    translations: {
      id: {
        name: "Piring Kofta Domba",
        description: "Kofta domba bakar, tahini hijau, bawang sumac, dan pita panggang.",
      },
    },
    basePrice: { amountMinor: 145000, currency: "IDR" },
    status: "available",
    tags: ["signature"],
    variants: [],
    modifierGroups: [],
    branchAvailability: [],
    createdAt: "2026-01-12T10:40:00Z",
    updatedAt: "2026-10-28T18:12:00Z",
    ...overrides,
  };
}

function menuCategory(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id: "category-1",
    organizationId: "org-1",
    name: "Wood-Fired Mains",
    description: "Plates finished over oak and olive wood.",
    translations: {
      id: {
        name: "Hidangan Utama Bakar",
        description: "Hidangan yang dimasak di atas kayu ek dan kayu zaitun.",
      },
    },
    sortOrder: 2,
    status: "active",
    createdAt: "2026-01-12T10:05:00Z",
    ...overrides,
  };
}

test("resolveContentLocale maps unknown interface locales to Indonesian", () => {
  assert.equal(resolveContentLocale("en"), "en");
  assert.equal(resolveContentLocale("id"), "id");
  assert.equal(resolveContentLocale("fr"), "id");
});

test("changing the interface locale does not retarget an open Indonesian edit", () => {
  const item = menuItem();

  // Form mount: interface is Indonesian, so the editing locale is captured.
  const editingLocale = resolveContentLocale("id");
  const initialDraft = createMenuItemContentDraft(item, editingLocale);
  assert.equal(initialDraft.name, "Piring Kofta Domba");

  // The interface switches to English while the form stays mounted. The
  // captured editing locale and the draft must not change.
  const interfaceLocaleAfterSwitch = resolveContentLocale("en");
  assert.equal(interfaceLocaleAfterSwitch, "en");
  assert.equal(editingLocale, "id");
  assert.equal(initialDraft.name, "Piring Kofta Domba");

  const updated = applyMenuItemContent(item, {
    contentLocale: editingLocale,
    name: "Piring Kofta Domba Spesial",
    description: "Kofta domba bakar dengan bumbu spesial.",
  });

  // Indonesian content changed...
  assert.equal(updated.translations?.id?.name, "Piring Kofta Domba Spesial");
  // ...while the canonical English fallback is untouched.
  assert.equal(updated.name, "Lamb Kofta Plate");
  assert.equal(updated.description, item.description);

  // Reopening in English still shows the original English content.
  assert.equal(createMenuItemContentDraft({ ...item, ...updated }, "en").name, "Lamb Kofta Plate");
  // Reopening in Indonesian shows the edit.
  assert.equal(
    createMenuItemContentDraft({ ...item, ...updated }, "id").name,
    "Piring Kofta Domba Spesial",
  );
});

test("editing English preserves an existing Indonesian translation", () => {
  const item = menuItem({
    translations: {
      id: { name: "Piring Kofta Domba", description: "Deskripsi Indonesia." },
      en: { name: "Lamb Kofta Plate", description: "English description." },
    },
  });

  const updated = applyMenuItemContent(item, {
    contentLocale: "en",
    name: "Lamb Kofta Plate Deluxe",
    description: "Updated English description.",
  });

  assert.equal(updated.name, "Lamb Kofta Plate Deluxe");
  assert.equal(updated.translations?.en?.name, "Lamb Kofta Plate Deluxe");
  assert.equal(updated.translations?.id?.name, "Piring Kofta Domba");
  assert.equal(updated.translations?.id?.description, "Deskripsi Indonesia.");
});

test("category edits follow the same captured-locale rules", () => {
  const category = menuCategory();
  const editingLocale = resolveContentLocale("id");
  const draft = createMenuCategoryContentDraft(category, editingLocale);
  assert.equal(draft.name, "Hidangan Utama Bakar");

  const updated = applyMenuCategoryContent(category, {
    contentLocale: editingLocale,
    name: "Hidangan Utama Bakar Spesial",
    description: "Deskripsi baru.",
  });

  assert.equal(updated.name, "Wood-Fired Mains");
  assert.equal(updated.translations?.id?.name, "Hidangan Utama Bakar Spesial");

  const english = applyMenuCategoryContent(
    { ...category, ...updated },
    {
      contentLocale: "en",
      name: "Wood-Fired Mains Deluxe",
      description: "Updated English description.",
    },
  );

  assert.equal(english.name, "Wood-Fired Mains Deluxe");
  assert.equal(english.translations?.en?.name, "Wood-Fired Mains Deluxe");
  assert.equal(english.translations?.id?.name, "Hidangan Utama Bakar Spesial");
});
