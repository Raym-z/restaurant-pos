import type { OrganizationProfileInput } from "./types";
import {
  validateCurrency,
  validateEmail,
  validateOptionalUrl,
  validatePhone,
  validateRequired,
  validateTimezone,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";

export function validateOrganizationProfile(
  input: OrganizationProfileInput,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = validateRequired(input.name, "fields.organizationName", t, 120);
  if (name) errors.name = name;

  const legalName = validateRequired(input.legalName, "fields.legalName", t, 160);
  if (legalName) errors.legalName = legalName;

  if (input.description.trim().length > 500) {
    errors.description = t("maxLength", {
      field: t("fields.description"),
      max: 500,
    });
  }

  const email = validateEmail(input.email, "fields.email", t);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone, "fields.phone", t);
  if (phone) errors.phone = phone;

  const website = validateOptionalUrl(input.website, t);
  if (website) errors.website = website;

  const timezone = validateTimezone(input.timezone, t);
  if (timezone) errors.timezone = timezone;

  const currency = validateCurrency(input.currency, t);
  if (currency) errors.currency = currency;

  const line1 = validateRequired(input.address.line1, "fields.streetAddress", t, 160);
  if (line1) errors["address.line1"] = line1;

  const city = validateRequired(input.address.city, "fields.city", t, 80);
  if (city) errors["address.city"] = city;

  const region = validateRequired(input.address.region, "fields.region", t, 80);
  if (region) errors["address.region"] = region;

  const postalCode = validateRequired(input.address.postalCode, "fields.postalCode", t, 20);
  if (postalCode) errors["address.postalCode"] = postalCode;

  const country = validateRequired(input.address.country, "fields.country", t, 80);
  if (country) errors["address.country"] = country;

  return errors;
}
