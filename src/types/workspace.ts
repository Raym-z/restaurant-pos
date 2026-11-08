/**
 * Workspace view models.
 *
 * These are temporary frontend-facing shapes used by the application shell
 * while authentication and backend contracts are being finalized. They are
 * intentionally small and must not be treated as database schema definitions.
 * Replace them with shared backend types in Phase 2.
 */

import type { Branch } from "@/features/branches/types";
import type { Organization } from "@/features/organization/types";

import type { StaffRole } from "./roles";

export type { StaffRole } from "./roles";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

/**
 * Seed snapshot for the mock workspace.
 *
 * The workspace provider owns organization, user, branches, and the active
 * branch after hydration. `planLabel` is shell presentation only; subscription
 * data will come from the backend in a later phase.
 */
export interface WorkspaceSnapshot {
  organization: Organization;
  branches: Branch[];
  user: StaffUser;
  defaultBranchId: string;
  planLabel: string;
}
