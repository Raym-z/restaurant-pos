/**
 * Small, framework-agnostic validation helpers.
 *
 * Rules mirror documented shared contract constraints (email shape, E.164
 * phone numbers, three-letter currency codes, IANA timezones). They validate
 * form input for user experience only; the backend remains the authority.
 *
 * Validators receive a translator bound to the `validation` namespace so all
 * feedback follows the selected interface language.
 */

export type ValidationErrors = Record<string, string>;

export type ValidationTranslator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

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

export function validateRequired(
  value: string,
  fieldKey: string,
  t: ValidationTranslator,
  maxLength = 200,
): string | null {
  if (isBlank(value)) {
    return t("required", { field: t(fieldKey) });
  }
  if (value.trim().length > maxLength) {
    return t("maxLength", { field: t(fieldKey), max: maxLength });
  }
  return null;
}

export function validateEmail(
  value: string,
  fieldKey: string,
  t: ValidationTranslator,
): string | null {
  const required = validateRequired(value, fieldKey, t, 320);
  if (required) {
    return required;
  }
  return EMAIL_PATTERN.test(value.trim()) ? null : t("invalidEmail");
}

export function validatePhone(
  value: string,
  fieldKey: string,
  t: ValidationTranslator,
): string | null {
  const required = validateRequired(value, fieldKey, t, 16);
  if (required) {
    return required;
  }
  return PHONE_E164_PATTERN.test(value.trim())
    ? null
    : t("invalidPhone", { example: "+6281234567890" });
}

export function validateOptionalUrl(value: string, t: ValidationTranslator): string | null {
  if (isBlank(value)) {
    return null;
  }
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? null : t("invalidHttpUrl");
  } catch {
    return t("invalidUrl");
  }
}

export function validateCurrency(value: string, t: ValidationTranslator): string | null {
  return CURRENCY_PATTERN.test(value.trim()) ? null : t("invalidCurrency");
}

export function validateTimezone(value: string, t: ValidationTranslator): string | null {
  return IANA_TIMEZONE_PATTERN.test(value.trim()) ? null : t("invalidTimezone");
}

export function validateBranchCode(value: string, t: ValidationTranslator): string | null {
  if (isBlank(value)) {
    return t("required", { field: t("fields.branchCode") });
  }
  return BRANCH_CODE_PATTERN.test(value.trim().toUpperCase()) ? null : t("invalidBranchCode");
}

export function validateLocalTime(value: string, t: ValidationTranslator): string | null {
  return LOCAL_TIME_PATTERN.test(value) ? null : t("invalidTime");
}

export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Converts a `YYYY-MM-DD` date input value to an ISO-8601 UTC instant. */
export function dateInputToInstant(value: string): string {
  return new Date(`${value}T12:00:00Z`).toISOString();
}

/** Converts an ISO-8601 instant to a `YYYY-MM-DD` date input value. */
export function instantToDateInput(value: string): string {
  return value.slice(0, 10);
}
