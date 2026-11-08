import type { BusinessHours } from "../types";
import type { Branch } from "../types";

const standardHours: BusinessHours[] = [
  { day: "monday", isClosed: false, open: "11:00", close: "21:30" },
  { day: "tuesday", isClosed: false, open: "11:00", close: "21:30" },
  { day: "wednesday", isClosed: false, open: "11:00", close: "21:30" },
  { day: "thursday", isClosed: false, open: "11:00", close: "22:00" },
  { day: "friday", isClosed: false, open: "11:00", close: "23:00" },
  { day: "saturday", isClosed: false, open: "10:00", close: "23:00" },
  { day: "sunday", isClosed: false, open: "10:00", close: "20:00" },
];

/**
 * Sample branches. IDs match the shell workspace mock so the branch switcher
 * and management screens describe the same organization.
 */
export const mockBranches: Branch[] = [
  {
    id: "branch_downtown",
    organizationId: "org_terrace_vine",
    name: "Downtown",
    code: "PDX-DT",
    addressLine1: "1210 NW Everett Street",
    addressLine2: "Ground floor",
    city: "Portland",
    region: "OR",
    postalCode: "97209",
    country: "United States",
    phone: "+15035550142",
    email: "downtown@terraceandvine.example",
    timezone: "America/Los_Angeles",
    status: "active",
    managerId: "b5c6d7e8-f90a-4b1c-8d2e-3f4a5b6c7d81",
    openingDate: "2023-03-14T14:22:00Z",
    businessHours: standardHours,
    createdAt: "2023-03-14T14:22:00Z",
  },
  {
    id: "branch_harbour",
    organizationId: "org_terrace_vine",
    name: "Harbour",
    code: "SEA-HB",
    addressLine1: "88 waterfront Avenue",
    addressLine2: "Pavilion B",
    city: "Seattle",
    region: "WA",
    postalCode: "98101",
    country: "United States",
    phone: "+12065550167",
    email: "harbour@terraceandvine.example",
    timezone: "America/Los_Angeles",
    status: "active",
    managerId: null,
    openingDate: "2025-09-02T13:00:00Z",
    businessHours: standardHours,
    createdAt: "2025-07-18T16:05:00Z",
  },
];
