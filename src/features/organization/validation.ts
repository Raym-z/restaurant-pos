import type { OrganizationProfileInput } from "./types";
import {
  validateCurrency,
  validateEmail,
  validateOptionalUrl,
  validatePhone,
  validateRequired,
  validateTimezone,
  type ValidationErrors,
} from "@/features/shared/validation";

export function validateOrganizationProfile(input: OrganizationProfileInput): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "Organization name", 120);
  if (name) errors.name = name;

  const legalName = validateRequired(input.legalName, "Legal name", 160);
  if (legalName) errors.legalName = legalName;

  if (input.description.trim().length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;

  const website = validateOptionalUrl(input.website);
  if (website) errors.website = website;

  const timezone = validateTimezone(input.timezone);
  if (timezone) errors.timezone = timezone;

  const currency = validateCurrency(input.currency);
  if (currency) errors.currency = currency;

  const line1 = validateRequired(input.address.line1, "Street address", 160);
  if (line1) errors["address.line1"] = line1;

  const city = validateRequired(input.address.city, "City", 80);
  if (city) errors["address.city"] = city;

  const region = validateRequired(input.address.region, "State or region", 80);
  if (region) errors["address.region"] = region;

  const postalCode = validateRequired(input.address.postalCode, "Postal code", 20);
  if (postalCode) errors["address.postalCode"] = postalCode;

  const country = validateRequired(input.address.country, "Country", 80);
  if (country) errors["address.country"] = country;

  return errors;
}
