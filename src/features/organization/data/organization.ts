import type { Organization } from "../types";

/** Sample organization used until the backend organization contract is wired. */
export const mockOrganization: Organization = {
  id: "org_terrace_vine",
  name: "Terrace & Vine",
  slug: "terrace-and-vine",
  legalName: "PT Terrace & Vine Hospitality Indonesia",
  description: "Seasonal, wood-fired Mediterranean restaurants serving Jakarta and Bandung.",
  email: "halo@terraceandvine.example",
  phone: "+62215550118",
  website: "https://terraceandvine.example",
  timezone: "Asia/Jakarta",
  currency: "IDR",
  address: {
    line1: "Jl. Senopati No. 8",
    line2: "Lantai 2",
    city: "Jakarta",
    region: "DKI Jakarta",
    postalCode: "12190",
    country: "Indonesia",
  },
  status: "active",
  createdAt: "2023-03-14T14:22:00Z",
};
