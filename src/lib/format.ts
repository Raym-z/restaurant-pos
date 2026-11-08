/**
 * Shared locale-aware formatting helpers.
 *
 * Currency itself is formatted by `@/lib/currency` using the currency's own
 * presentation locale. Dates, plain numbers, weekdays, and percentages use the
 * selected interface locale.
 */

import { DEFAULT_CURRENCY, getCurrencyFormatConfig, type CurrencyCode } from "./currency";

export { formatCurrencyAmount, formatMoney } from "./currency";

export const DEFAULT_INTL_LOCALE = "id-ID";

export function getInitials(name: string, maxCharacters = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
  return `${first.charAt(0)}${last.charAt(0)}`.slice(0, maxCharacters).toUpperCase();
}

/**
 * Formats a major-unit amount. Prefer `formatMoney` for Money view models so
 * integer minor units are handled correctly.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  locale = getCurrencyFormatConfig(currency).locale,
): string {
  const { fractionDigits } = getCurrencyFormatConfig(currency);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(amount)
    .replace(/\u00A0/g, " ");
}

export function formatCompactNumber(value: number, locale = DEFAULT_INTL_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number, locale = DEFAULT_INTL_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = DEFAULT_INTL_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSignedPercent(value: number, locale = DEFAULT_INTL_LOCALE): string {
  const formatted = formatPercent(Math.abs(value), locale);
  return value >= 0 ? `+${formatted}` : `−${formatted}`;
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = DEFAULT_INTL_LOCALE,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { timeStyle: "short" },
  locale = DEFAULT_INTL_LOCALE,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(
  instant: string,
  timeZone?: string,
  locale = DEFAULT_INTL_LOCALE,
): string {
  return formatDate(instant, { dateStyle: "medium", timeStyle: "short", timeZone }, locale);
}

export function formatDateOnly(
  date: string,
  timeZone?: string,
  locale = DEFAULT_INTL_LOCALE,
): string {
  return formatDate(date, { dateStyle: "medium", timeZone }, locale);
}

export function formatLocalTime(value: string, locale = DEFAULT_INTL_LOCALE): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const WEEKDAY_ANCHORS: Record<string, string> = {
  monday: "2024-01-01T12:00:00Z",
  tuesday: "2024-01-02T12:00:00Z",
  wednesday: "2024-01-03T12:00:00Z",
  thursday: "2024-01-04T12:00:00Z",
  friday: "2024-01-05T12:00:00Z",
  saturday: "2024-01-06T12:00:00Z",
  sunday: "2024-01-07T12:00:00Z",
};

export function formatWeekdayName(day: string, locale = DEFAULT_INTL_LOCALE): string {
  const anchor = WEEKDAY_ANCHORS[day.toLowerCase()];
  if (!anchor) {
    return day;
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(anchor));
}

export function formatShortWeekday(date: string, locale = DEFAULT_INTL_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatMonthDay(date: string, locale = DEFAULT_INTL_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export type { CurrencyCode };
