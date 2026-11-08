import type { Branch, BranchInput } from "./types";
import {
  validateBranchCode,
  validateEmail,
  isValidDateInput,
  validateLocalTime,
  validatePhone,
  validateRequired,
  validateTimezone,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export function validateBranch(
  input: BranchInput,
  existingBranches: Branch[],
  currentBranchId: string | undefined,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "fields.branchName", t, 120);
  if (name) errors.name = name;

  const codeError = validateBranchCode(input.code, t);
  if (codeError) {
    errors.code = codeError;
  } else {
    const duplicate = existingBranches.some(
      (branch) =>
        branch.id !== currentBranchId &&
        branch.code.toUpperCase() === input.code.trim().toUpperCase(),
    );
    if (duplicate) {
      errors.code = t("duplicateBranchCode");
    }
  }

  const email = validateEmail(input.email, "fields.email", t);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone, "fields.phone", t);
  if (phone) errors.phone = phone;

  const line1 = validateRequired(input.addressLine1, "fields.streetAddress", t, 160);
  if (line1) errors.addressLine1 = line1;

  const city = validateRequired(input.city, "fields.city", t, 80);
  if (city) errors.city = city;

  const region = validateRequired(input.region, "fields.region", t, 80);
  if (region) errors.region = region;

  const postalCode = validateRequired(input.postalCode, "fields.postalCode", t, 20);
  if (postalCode) errors.postalCode = postalCode;

  const country = validateRequired(input.country, "fields.country", t, 80);
  if (country) errors.country = country;

  const timezone = validateTimezone(input.timezone, t);
  if (timezone) errors.timezone = timezone;

  if (!isValidDateInput(input.openingDate.slice(0, 10))) {
    errors.openingDate = t("invalidDate");
  }

  for (const day of DAYS) {
    const hours = input.businessHours.find((entry) => entry.day === day);
    if (!hours) {
      errors[`hours.${day}`] = t("hoursMissing");
      continue;
    }
    if (hours.isClosed) {
      continue;
    }
    if (!hours.open || validateLocalTime(hours.open, t)) {
      errors[`hours.${day}.open`] = t("invalidTime");
    }
    if (!hours.close || validateLocalTime(hours.close, t)) {
      errors[`hours.${day}.close`] = t("invalidTime");
    }
    if (
      hours.open &&
      hours.close &&
      !validateLocalTime(hours.open, t) &&
      !validateLocalTime(hours.close, t) &&
      hours.close !== "00:00" &&
      hours.close <= hours.open
    ) {
      errors[`hours.${day}.close`] = t("closeAfterOpen");
    }
  }

  return errors;
}
