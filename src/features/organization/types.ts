import type { CurrencyCode, IanaTimezone, IsoInstant, Uuid } from "@/features/shared/domain";

export type OrganizationStatus = "active" | "inactive";

export interface OrganizationAddress {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Organization {
  id: Uuid;
  name: string;
  slug: string;
  legalName: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  timezone: IanaTimezone;
  currency: CurrencyCode;
  address: OrganizationAddress;
  status: OrganizationStatus;
  createdAt: IsoInstant;
}

/** Editable organization profile fields surfaced by the management form. */
export type OrganizationProfileInput = Pick<
  Organization,
  | "name"
  | "legalName"
  | "description"
  | "email"
  | "phone"
  | "website"
  | "timezone"
  | "currency"
  | "address"
>;
