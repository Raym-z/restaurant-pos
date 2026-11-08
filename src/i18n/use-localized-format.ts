"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import type { Money } from "@/lib/currency";
import {
  formatDateOnly,
  formatDateTime,
  formatLocalTime,
  formatMonthDay,
  formatNumber,
  formatPercent,
  formatShortWeekday,
  formatSignedPercent,
  formatWeekdayName,
} from "@/lib/format";
import { formatCurrencyAmount, formatMoney } from "@/lib/currency";
import { toIntlLocale } from "./config";

/**
 * Locale-bound presentation helpers for client components.
 *
 * Currency uses its own presentation locale (IDR always renders as
 * `Rp 25.000`). Dates, weekdays, and plain numbers follow the selected
 * interface language.
 */
export function useLocalizedFormat() {
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);

  return useMemo(
    () => ({
      money: (money: Money) => formatMoney(money),
      currencyAmount: (amountMinor: number, currency: string) =>
        formatCurrencyAmount(amountMinor, currency),
      number: (value: number) => formatNumber(value, intlLocale),
      percent: (value: number) => formatPercent(value, intlLocale),
      signedPercent: (value: number) => formatSignedPercent(value, intlLocale),
      dateOnly: (date: string, timeZone?: string) => formatDateOnly(date, timeZone, intlLocale),
      dateTime: (date: string, timeZone?: string) => formatDateTime(date, timeZone, intlLocale),
      localTime: (value: string) => formatLocalTime(value, intlLocale),
      weekday: (day: string) => formatWeekdayName(day, intlLocale),
      shortWeekday: (date: string) => formatShortWeekday(date, intlLocale),
      monthDay: (date: string) => formatMonthDay(date, intlLocale),
    }),
    [intlLocale],
  );
}
