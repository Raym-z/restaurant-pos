import type { MenuCategory, MenuCategoryInput, MenuItem, MenuItemInput } from "./types";
import {
  validateRequired,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";
import { DEFAULT_CURRENCY, formatMoney, type CurrencyCode } from "@/lib/currency";
import { localizeMenuCategory, localizeMenuItem } from "./selectors";

export function validateMenuCategory(
  input: MenuCategoryInput,
  existingCategories: MenuCategory[],
  currentCategoryId: string | undefined,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "fields.categoryName", t, 80);
  if (name) {
    errors.name = name;
  } else {
    const duplicate = existingCategories.some(
      (category) =>
        category.id !== currentCategoryId &&
        localizeMenuCategory(category, input.contentLocale).name.trim().toLowerCase() ===
          input.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = t("duplicateCategory");
    }
  }

  if (input.description.trim().length > 240) {
    errors.description = t("maxLength", {
      field: t("fields.categoryDescription"),
      max: 240,
    });
  }

  return errors;
}

export function validateMenuItem(
  input: MenuItemInput,
  existingItems: MenuItem[],
  currentItemId: string | undefined,
  t: ValidationTranslator,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.categoryId) {
    errors.categoryId = t("required", { field: t("fields.categoryName") });
  }

  const name = validateRequired(input.name, "fields.itemName", t, 120);
  if (name) {
    errors.name = name;
  } else {
    const duplicate = existingItems.some(
      (item) =>
        item.id !== currentItemId &&
        item.categoryId === input.categoryId &&
        localizeMenuItem(item, input.contentLocale).name.trim().toLowerCase() ===
          input.name.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.name = t("duplicateItem");
    }
  }

  if (input.description.trim().length > 400) {
    errors.description = t("maxLength", {
      field: t("fields.itemDescription"),
      max: 400,
    });
  }

  if (!Number.isInteger(input.basePriceMinor) || input.basePriceMinor <= 0) {
    errors.basePriceMinor = t("pricePositive", {
      example: formatMoney({ amountMinor: 25000, currency }),
    });
  }

  if (input.tags.some((tag) => tag.trim().length === 0)) {
    errors.tags = t("tagsEmpty");
  }

  return errors;
}
