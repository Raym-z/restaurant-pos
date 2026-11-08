/**
 * Domain primitives used by the mock-backed management features.
 *
 * Money and currency primitives are owned by `@/lib/currency` so all feature
 * modules share one representation.
 */

export type { CurrencyCode, Money } from "@/lib/currency";

export type Uuid = string;

/** ISO-8601 UTC timestamp ending in `Z`. */
export type IsoInstant = string;

/** IANA timezone name, e.g. `Asia/Jakarta`. */
export type IanaTimezone = string;

/** Branch-local calendar date (`YYYY-MM-DD`). */
export type BranchLocalDate = string;

/** Branch-local wall-clock time (`HH:mm`). */
export type LocalTime = string;
