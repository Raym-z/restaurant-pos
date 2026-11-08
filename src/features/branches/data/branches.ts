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
    name: "Senopati",
    code: "JKT-SNP",
    addressLine1: "Jl. Senopati No. 8",
    addressLine2: "Lantai dasar",
    city: "Jakarta",
    region: "DKI Jakarta",
    postalCode: "12190",
    country: "Indonesia",
    phone: "+62215550142",
    email: "senopati@terraceandvine.example",
    timezone: "Asia/Jakarta",
    status: "active",
    managerId: "b5c6d7e8-f90a-4b1c-8d2e-3f4a5b6c7d81",
    openingDate: "2023-03-14T14:22:00Z",
    businessHours: standardHours,
    createdAt: "2023-03-14T14:22:00Z",
  },
  {
    id: "branch_harbour",
    organizationId: "org_terrace_vine",
    name: "Dago",
    code: "BDG-DGO",
    addressLine1: "Jl. Ir. H. Juanda No. 88",
    addressLine2: "Paviliun B",
    city: "Bandung",
    region: "Jawa Barat",
    postalCode: "40135",
    country: "Indonesia",
    phone: "+62225550167",
    email: "dago@terraceandvine.example",
    timezone: "Asia/Jakarta",
    status: "active",
    managerId: null,
    openingDate: "2025-09-02T13:00:00Z",
    businessHours: standardHours,
    createdAt: "2025-07-18T16:05:00Z",
  },
];
