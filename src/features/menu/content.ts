/**
 * Pure menu content helpers.
 *
 * The edit forms capture the content locale once at mount. Submission always
 * targets that captured locale, never the current interface locale, so changing
 * the interface language while a form is open cannot write Indonesian text into
 * the English translation (or the reverse).
 *
 * The canonical/base `name` and `description` remain the English fallback for
 * seeded content. Localized overrides live in `translations`.
 */

import { localizeMenuCategory, localizeMenuItem } from "./selectors";
import type { MenuCategory, MenuContentLocale, MenuItem, MenuText } from "./types";

export interface MenuContentEdit {
  name: string;
  description: string;
  contentLocale: MenuContentLocale;
}

/** Maps an interface locale to the locale whose content can be edited. */
export function resolveContentLocale(interfaceLocale: string): MenuContentLocale {
  return interfaceLocale === "en" ? "en" : "id";
}

/** Initial draft for an item, captured in the editing locale at mount time. */
export function createMenuItemContentDraft(
  item: MenuItem,
  editingLocale: MenuContentLocale,
): MenuText {
  return localizeMenuItem(item, editingLocale);
}

/** Initial draft for a category, captured in the editing locale at mount time. */
export function createMenuCategoryContentDraft(
  category: MenuCategory,
  editingLocale: MenuContentLocale,
): MenuText {
  return localizeMenuCategory(category, editingLocale);
}

function applyLocalizedContent(
  base: { name: string; description: string },
  translations: Partial<Record<MenuContentLocale, MenuText>> | undefined,
  edit: MenuContentEdit,
): {
  name: string;
  description: string;
  translations: Partial<Record<MenuContentLocale, MenuText>>;
} {
  const nextTranslations: Partial<Record<MenuContentLocale, MenuText>> = {
    ...translations,
    [edit.contentLocale]: {
      name: edit.name,
      description: edit.description,
    },
  };

  if (edit.contentLocale === "en") {
    return {
      name: edit.name,
      description: edit.description,
      translations: nextTranslations,
    };
  }

  return {
    name: base.name,
    description: base.description,
    translations: nextTranslations,
  };
}

export function applyMenuCategoryContent(
  category: MenuCategory,
  edit: MenuContentEdit,
): Pick<MenuCategory, "name" | "description" | "translations"> {
  return applyLocalizedContent(category, category.translations, edit);
}

export function applyMenuItemContent(
  item: MenuItem,
  edit: MenuContentEdit,
): Pick<MenuItem, "name" | "description" | "translations"> {
  return applyLocalizedContent(item, item.translations, edit);
}
