import { mockBranches } from "@/features/branches/data/branches";
import { mockOrganization } from "@/features/organization/data/organization";
import type { WorkspaceSnapshot } from "@/types/workspace";

/**
 * MOCK DATA — SHELL PREVIEW ONLY.
 *
 * Authentication and organization/branch resolution are Phase 2 concerns.
 * This snapshot lets the application shell render before Supabase integration.
 * Never use mock data to make authorization decisions, and replace this file
 * with the authenticated workspace context once backend contracts are final.
 *
 * The workspace provider owns this data at runtime. Branch CRUD mutates the
 * same collection consumed by the shell switcher.
 */
export const mockWorkspace: WorkspaceSnapshot = {
  organization: mockOrganization,
  branches: mockBranches,
  planLabel: "Growth plan",
  user: {
    id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c40",
    name: "Amara Okafor",
    email: "amara.okafor@terraceandvine.example",
    role: "owner",
  },
  defaultBranchId: "branch_downtown",
};
