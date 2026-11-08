import { formatCurrencyAmount, type CurrencyCode } from "@/lib/currency";

/** Formats a modifier delta without producing a double negative sign. */
export function formatCurrencyDelta(amountMinor: number, currency: CurrencyCode): string {
  if (amountMinor === 0) {
    return formatCurrencyAmount(0, currency);
  }

  const sign = amountMinor > 0 ? "+" : "−";
  return `${sign} ${formatCurrencyAmount(Math.abs(amountMinor), currency)}`;
}
