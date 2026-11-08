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
  currentBranchId?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "Branch name", 120);
  if (name) errors.name = name;

  const codeError = validateBranchCode(input.code);
  if (codeError) {
    errors.code = codeError;
  } else {
    const duplicate = existingBranches.some(
      (branch) =>
        branch.id !== currentBranchId &&
        branch.code.toUpperCase() === input.code.trim().toUpperCase(),
    );
    if (duplicate) {
      errors.code = "Another branch already uses this code.";
    }
  }

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;

  const line1 = validateRequired(input.addressLine1, "Street address", 160);
  if (line1) errors.addressLine1 = line1;

  const city = validateRequired(input.city, "City", 80);
  if (city) errors.city = city;

  const region = validateRequired(input.region, "State or region", 80);
  if (region) errors.region = region;

  const postalCode = validateRequired(input.postalCode, "Postal code", 20);
  if (postalCode) errors.postalCode = postalCode;

  const country = validateRequired(input.country, "Country", 80);
  if (country) errors.country = country;

  const timezone = validateTimezone(input.timezone);
  if (timezone) errors.timezone = timezone;

  if (!isValidDateInput(input.openingDate.slice(0, 10))) {
    errors.openingDate = "Choose a valid opening date.";
  }

  for (const day of DAYS) {
    const hours = input.businessHours.find((entry) => entry.day === day);
    if (!hours) {
      errors[`hours.${day}`] = "Business hours are missing for this day.";
      continue;
    }
    if (hours.isClosed) {
      continue;
    }
    if (!hours.open || validateLocalTime(hours.open)) {
      errors[`hours.${day}.open`] = "Enter a valid opening time.";
    }
    if (!hours.close || validateLocalTime(hours.close)) {
      errors[`hours.${day}.close`] = "Enter a valid closing time.";
    }
    if (
      hours.open &&
      hours.close &&
      !validateLocalTime(hours.open) &&
      !validateLocalTime(hours.close) &&
      hours.close !== "00:00" &&
      hours.close <= hours.open
    ) {
      errors[`hours.${day}.close`] = "Closing time must be after opening time.";
    }
  }

  return errors;
}
