import type { IanaTimezone, IsoInstant, LocalTime, Uuid } from "@/features/shared/domain";

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface BusinessHours {
  day: Weekday;
  isClosed: boolean;
  open: LocalTime | null;
  close: LocalTime | null;
}

export type BranchStatus = "active" | "opening_soon" | "inactive";

export interface Branch {
  id: Uuid;
  organizationId: Uuid;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  timezone: IanaTimezone;
  status: BranchStatus;
  /** Staff member currently accountable for day-to-day branch operations. */
  managerId: Uuid | null;
  openingDate: IsoInstant;
  businessHours: BusinessHours[];
  createdAt: IsoInstant;
}

/** Editable branch fields surfaced by the branch create/edit form. */
export type BranchInput = Omit<Branch, "id" | "organizationId" | "createdAt">;

export const BRANCH_STATUS_LABELS: Record<BranchStatus, string> = {
  active: "Active",
  opening_soon: "Opening soon",
  inactive: "Inactive",
};
