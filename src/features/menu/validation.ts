import type { MenuCategory, MenuCategoryInput, MenuItem, MenuItemInput } from "./types";
import { validateRequired, type ValidationErrors } from "@/features/shared/validation";

export function validateMenuCategory(
  input: MenuCategoryInput,
  existingCategories: MenuCategory[],
  currentCategoryId?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "Category name", 80);
  if (name) {
    errors.name = name;
  } else {
    const duplicate = existingCategories.some(
      (category) =>
        category.id !== currentCategoryId &&
        category.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = "Another category already uses this name.";
    }
  }

  if (input.description.trim().length > 240) {
    errors.description = "Description must be 240 characters or fewer.";
  }

  return errors;
}

export function validateMenuItem(
  input: MenuItemInput,
  existingItems: MenuItem[],
  currentItemId?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.categoryId) {
    errors.categoryId = "Choose a menu category.";
  }

  const name = validateRequired(input.name, "Item name", 120);
  if (name) {
    errors.name = name;
  } else {
    const duplicate = existingItems.some(
      (item) =>
        item.id !== currentItemId &&
        item.categoryId === input.categoryId &&
        item.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = "This category already contains an item with that name.";
    }
  }

  if (input.description.trim().length > 400) {
    errors.description = "Description must be 400 characters or fewer.";
  }

  if (!Number.isInteger(input.basePriceMinor) || input.basePriceMinor <= 0) {
    errors.basePriceMinor = "Enter a price greater than zero, for example 12.50.";
  }

  if (input.tags.some((tag) => tag.trim().length === 0)) {
    errors.tags = "Tags cannot be empty.";
  }

  return errors;
}
