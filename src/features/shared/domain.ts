/**
 * Domain primitives used by the mock-backed management features.
 *
 * These mirror the conventions documented by the shared backend contracts
 * (`restaurant-platform-backend/src/contracts/common`): UUID identifiers,
 * ISO-8601 UTC timestamps, IANA timezones, and money represented as integer
 * minor units plus an ISO 4217 currency code.
 *
 * They are intentionally local view-model types. They are not database
 * schemas, and they must be replaced by the generated shared contracts once
 * the backend exposes the corresponding module contracts.
 */

export type Uuid = string;

/** ISO-8601 UTC timestamp ending in `Z`. */
export type IsoInstant = string;

/** ISO 4217 alphabetic currency code, e.g. `USD`. */
export type CurrencyCode = string;

/** IANA timezone name, e.g. `America/Chicago`. */
export type IanaTimezone = string;

/** Branch-local calendar date (`YYYY-MM-DD`). */
export type BranchLocalDate = string;

/** Branch-local wall-clock time (`HH:mm`). */
export type LocalTime = string;

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}
