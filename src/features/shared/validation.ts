/**
 * Small, framework-agnostic validation helpers.
 *
 * Rules mirror documented shared contract constraints (email shape, E.164
 * phone numbers, three-letter currency codes, IANA timezones). They validate
 * form input for user experience only; the backend remains the authority.
 */

export type ValidationErrors = Record<string, string>;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_E164_PATTERN = /^\+[1-9]\d{1,14}$/;
export const CURRENCY_PATTERN = /^[A-Z]{3}$/;
export const IANA_TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BRANCH_CODE_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const LOCAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function validateRequired(value: string, label: string, maxLength = 200): string | null {
  if (isBlank(value)) {
    return `${label} is required.`;
  }
  if (value.trim().length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const required = validateRequired(value, "Email address", 320);
  if (required) {
    return required;
  }
  return EMAIL_PATTERN.test(value.trim()) ? null : "Enter a valid email address.";
}

export function validatePhone(value: string): string | null {
  const required = validateRequired(value, "Phone number", 16);
  if (required) {
    return required;
  }
  return PHONE_E164_PATTERN.test(value.trim())
    ? null
    : "Use an E.164 phone number, for example +13125550142.";
}

export function validateOptionalUrl(value: string): string | null {
  if (isBlank(value)) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? null
      : "Enter a valid HTTP or HTTPS URL.";
  } catch {
    return "Enter a valid URL, for example https://example.com.";
  }
}

export function validateCurrency(value: string): string | null {
  return CURRENCY_PATTERN.test(value.trim())
    ? null
    : "Use a three-letter ISO 4217 currency code, for example USD.";
}

export function validateTimezone(value: string): string | null {
  return IANA_TIMEZONE_PATTERN.test(value.trim())
    ? null
    : "Use a valid IANA timezone, for example America/Chicago.";
}

export function validateBranchCode(value: string): string | null {
  if (isBlank(value)) {
    return "Branch code is required.";
  }
  return BRANCH_CODE_PATTERN.test(value.trim().toUpperCase())
    ? null
    : "Use uppercase letters, numbers, and hyphens, for example CHI-DT.";
}

export function validateLocalTime(value: string): string | null {
  return LOCAL_TIME_PATTERN.test(value) ? null : "Use a 24-hour time, for example 21:30.";
}

export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/**
 * Parses a major-unit price input (`12`, `12.5`, `12.50`) into integer minor
 * units. Returns null for malformed or non-positive values.
 */
export function parsePriceToMinorUnits(value: string): number | null {
  const normalized = value.replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const amountMinor = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(amountMinor) && amountMinor > 0 ? amountMinor : null;
}

/** Formats integer minor units for a price input (`12.50`). */
export function minorUnitsToPriceInput(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

/** Converts a `YYYY-MM-DD` date input value to an ISO-8601 UTC instant. */
export function dateInputToInstant(value: string): string {
  return new Date(`${value}T12:00:00Z`).toISOString();
}

/** Converts an ISO-8601 instant to a `YYYY-MM-DD` date input value. */
export function instantToDateInput(value: string): string {
  return value.slice(0, 10);
}
