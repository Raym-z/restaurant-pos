import type { Organization } from "../types";

/** Sample organization used until the backend organization contract is wired. */
export const mockOrganization: Organization = {
  id: "org_terrace_vine",
  name: "Terrace & Vine",
  slug: "terrace-and-vine",
  legalName: "Terrace & Vine Hospitality LLC",
  description: "Seasonal, wood-fired Mediterranean restaurants serving Portland and Seattle.",
  email: "hello@terraceandvine.example",
  phone: "+15035550118",
  website: "https://terraceandvine.example",
  timezone: "America/Los_Angeles",
  currency: "USD",
  address: {
    line1: "1210 NW Everett Street",
    line2: "Suite 210",
    city: "Portland",
    region: "OR",
    postalCode: "97209",
    country: "United States",
  },
  status: "active",
  createdAt: "2023-03-14T14:22:00Z",
};
