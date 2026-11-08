export const APP_LOCALES = ["id", "en"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "id";
export const LOCALE_COOKIE_NAME = "pos_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const INTL_LOCALES: Record<AppLocale, string> = {
  id: "id-ID",
  en: "en-US",
};

export const APP_TIMEZONE = "Asia/Jakarta";

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "id" || value === "en";
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export function toIntlLocale(locale: string): string {
  return isAppLocale(locale) ? INTL_LOCALES[locale] : INTL_LOCALES[DEFAULT_LOCALE];
}
