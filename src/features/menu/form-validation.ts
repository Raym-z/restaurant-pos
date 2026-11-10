import { formatCurrencyAmount } from "@/lib/currency";
import {
  isBlank,
  validateRequired,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";

import type { MenuCategoryView, MenuItemView } from "./models";

interface CategoryFormValues {
  name: string;
  description: string;
  sortOrder: string;
}

interface ItemFormValues {
  categoryId: string;
  name: string;
  description: string;
  basePriceMinor: number | null;
  sortOrder: string;
}

function validateSortOrder(value: string, t: ValidationTranslator): string | null {
  if (isBlank(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100_000
    ? null
    : t("invalidSortOrder");
}

export function validateCategoryForm(
  values: CategoryFormValues,
  existingCategories: readonly MenuCategoryView[],
  currentCategoryId: string | undefined,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(values.name, "fields.categoryName", t, 80);
  if (name) {
    errors.name = name;
  } else {
    const duplicate = existingCategories.some(
      (category) =>
        category.id !== currentCategoryId &&
        category.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = t("duplicateCategory");
    }
  }

  if (values.description.trim().length > 240) {
    errors.description = t("maxLength", {
      field: t("fields.categoryDescription"),
      max: 240,
    });
  }

  const sortOrder = validateSortOrder(values.sortOrder, t);
  if (sortOrder) {
    errors.sortOrder = sortOrder;
  }

  return errors;
}

export function validateItemForm(
  values: ItemFormValues,
  existingItems: readonly MenuItemView[],
  currentItemId: string | undefined,
  t: ValidationTranslator,
  currency: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.categoryId) {
    errors.categoryId = t("required", { field: t("fields.categoryName") });
  }

  const name = validateRequired(values.name, "fields.itemName", t, 120);
  if (name) {
    errors.name = name;
  } else if (values.categoryId) {
    const duplicate = existingItems.some(
      (item) =>
        item.id !== currentItemId &&
        item.categoryId === values.categoryId &&
        item.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = t("duplicateItem");
    }
  }

  if (values.description.trim().length > 400) {
    errors.description = t("maxLength", {
      field: t("fields.itemDescription"),
      max: 400,
    });
  }

  if (
    values.basePriceMinor === null ||
    !Number.isInteger(values.basePriceMinor) ||
    values.basePriceMinor <= 0
  ) {
    errors.basePriceMinor = t("pricePositive", {
      example: formatCurrencyAmount(25_000, currency),
    });
  }

  const sortOrder = validateSortOrder(values.sortOrder, t);
  if (sortOrder) {
    errors.sortOrder = sortOrder;
  }

  return errors;
}
