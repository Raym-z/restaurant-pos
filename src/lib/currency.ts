/**
 * Central currency configuration and formatting.
 *
 * Money is stored as integer `amountMinor` units for the currency:
 * - IDR: 1 minor unit = 1 Rupiah (no decimals)
 * - USD: 1 minor unit = 1 cent (2 decimals)
 *
 * IDR is the platform default. IDR display always uses Indonesian formatting
 * (`Rp 25.000`) so currency presentation remains independent of the selected
 * interface language. Amounts are never divided by 100 for IDR.
 *
 * Monetary calculations must stay in integer minor units. Conversion to a
 * major-unit number happens only inside Intl formatting for currencies with a
 * non-zero exponent.
 */

export type CurrencyCode = string;

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

interface CurrencyFormatConfig {
  /** Locale used for the currency symbol and grouping. */
  locale: string;
  /** Number of fraction digits shown for normal prices. */
  fractionDigits: number;
}

const CURRENCY_FORMATS: Record<string, CurrencyFormatConfig> = {
  IDR: { locale: "id-ID", fractionDigits: 0 },
  USD: { locale: "en-US", fractionDigits: 2 },
  EUR: { locale: "de-DE", fractionDigits: 2 },
  GBP: { locale: "en-GB", fractionDigits: 2 },
  SGD: { locale: "en-SG", fractionDigits: 2 },
  MYR: { locale: "ms-MY", fractionDigits: 2 },
  AUD: { locale: "en-AU", fractionDigits: 2 },
  JPY: { locale: "ja-JP", fractionDigits: 0 },
  KRW: { locale: "ko-KR", fractionDigits: 0 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "IDR";

export function getCurrencyFormatConfig(currency: CurrencyCode): CurrencyFormatConfig {
  return CURRENCY_FORMATS[currency] ?? { locale: "en-US", fractionDigits: 2 };
}

export function getCurrencyFractionDigits(currency: CurrencyCode): number {
  return getCurrencyFormatConfig(currency).fractionDigits;
}

/** Number of minor units in one major unit, e.g. 100 for USD, 1 for IDR. */
export function getCurrencyMinorUnitScale(currency: CurrencyCode): number {
  return 10 ** getCurrencyFractionDigits(currency);
}

/**
 * Formats integer minor units using Intl.NumberFormat.
 *
 * For IDR, `amountMinor` is already whole Rupiah and is passed directly to
 * Intl with zero fraction digits.
 */
export function formatCurrencyAmount(
  amountMinor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const { locale, fractionDigits } = getCurrencyFormatConfig(currency);
  const scale = 10 ** fractionDigits;
  const majorUnits = fractionDigits === 0 ? amountMinor : amountMinor / scale;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(majorUnits)
    .replace(/\u00A0/g, " ");
}

export function formatMoney(money: Money): string {
  return formatCurrencyAmount(money.amountMinor, money.currency);
}

/**
 * Converts a user-entered major-unit value into integer minor units without
 * floating-point arithmetic.
 *
 * IDR accepts plain digits or Indonesian/English thousands grouping
 * (`25000`, `25.000`, `25,000`). Fractional IDR values are rejected.
 */
export function parseMoneyInput(
  value: string,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): number | null {
  const cleaned = value
    .trim()
    .replace(/^Rp\s*/i, "")
    .replace(/^[A-Za-z]{3}\s*/i, "")
    .replace(/\s/g, "");

  if (!cleaned || cleaned.startsWith("-")) {
    return null;
  }

  const fractionDigits = getCurrencyFractionDigits(currency);

  if (fractionDigits === 0) {
    const isPlainDigits = /^\d+$/.test(cleaned);
    const isGroupedDigits = /^\d{1,3}(?:[.,]\d{3})+$/.test(cleaned);
    if (!isPlainDigits && !isGroupedDigits) {
      return null;
    }
    const amountMinor = Number(cleaned.replace(/[.,]/g, ""));
    return Number.isSafeInteger(amountMinor) ? amountMinor : null;
  }

  const match = new RegExp(`^(\\d+)(?:[.,](\\d{0,${fractionDigits}}))?$`).exec(cleaned);
  if (!match) {
    return null;
  }

  const major = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(fractionDigits, "0");
  const amountMinor = major * 10 ** fractionDigits + Number(fraction);
  return Number.isSafeInteger(amountMinor) ? amountMinor : null;
}

/** Formats integer minor units for an editable price input. */
export function formatMoneyInput(
  amountMinor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const fractionDigits = getCurrencyFractionDigits(currency);
  const sign = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);

  if (fractionDigits === 0) {
    return `${sign}${absolute}`;
  }

  const scale = 10 ** fractionDigits;
  const major = Math.trunc(absolute / scale);
  const fraction = String(absolute % scale).padStart(fractionDigits, "0");
  return `${sign}${major}.${fraction}`;
}
