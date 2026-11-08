import { formatCurrency, formatDate, getInitials } from "@/lib/format";
import type { CurrencyCode, IsoInstant, LocalTime, Money } from "./domain";

const DEFAULT_LOCALE = "en-US";

/** Formats a backend-shaped `Money` value (integer minor units). */
export function formatMoney(money: Money, locale = DEFAULT_LOCALE): string {
  return formatCurrency(money.amountMinor / 100, money.currency, locale);
}

export function formatMinorUnits(
  amountMinor: number,
  currency: CurrencyCode,
  locale = DEFAULT_LOCALE,
): string {
  return formatCurrency(amountMinor / 100, currency, locale);
}

export function formatDateTime(
  instant: IsoInstant,
  timeZone?: string,
  locale = DEFAULT_LOCALE,
): string {
  return formatDate(instant, { dateStyle: "medium", timeStyle: "short", timeZone }, locale);
}

export function formatDateOnly(date: string, timeZone?: string, locale = DEFAULT_LOCALE): string {
  return formatDate(date, { dateStyle: "medium", timeZone }, locale);
}

export function formatLocalTime(value: LocalTime): string {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours ?? 0, minutes ?? 0);
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSignedPercent(value: number, locale = DEFAULT_LOCALE): string {
  const formatted = formatPercent(Math.abs(value), locale);
  return value >= 0 ? `+${formatted}` : `−${formatted}`;
}

export { getInitials };
