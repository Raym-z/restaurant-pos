import type { WorkspaceSnapshot } from "@/types/workspace";

/**
 * MOCK DATA — SHELL PREVIEW ONLY.
 *
 * Authentication and organization/branch resolution are Phase 2 concerns.
 * This snapshot lets the application shell render before Supabase integration.
 * Never use mock data to make authorization decisions, and replace this file
 * with the authenticated workspace context once backend contracts are final.
 */
export const mockWorkspace: WorkspaceSnapshot = {
  organization: {
    id: "org_terrace_vine",
    name: "Terrace & Vine",
    planLabel: "Growth plan",
    branches: [
      {
        id: "branch_downtown",
        name: "Terrace & Vine — Downtown",
        shortName: "Downtown",
        city: "Portland, OR",
        timezone: "America/Los_Angeles",
        currency: "USD",
      },
      {
        id: "branch_harbour",
        name: "Terrace & Vine — Harbour",
        shortName: "Harbour",
        city: "Seattle, WA",
        timezone: "America/Los_Angeles",
        currency: "USD",
      },
    ],
  },
  user: {
    id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c40",
    name: "Amara Okafor",
    email: "amara.okafor@terraceandvine.example",
    role: "owner",
  },
  defaultBranchId: "branch_downtown",
};
