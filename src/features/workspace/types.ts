import type { BranchStatus, OrganizationStatus, StaffStatus } from "@/lib/supabase/database.types";
import type { NormalizedError } from "@/lib/supabase/errors";
import type { StaffRole } from "@/types/roles";

export type WorkspaceRoleScope = "organization" | "branch";

export interface WorkspaceRoleAssignment {
  id: string;
  role: StaffRole;
  scope: WorkspaceRoleScope;
  /** Present only for branch-scoped assignments. Null for organization scope. */
  branchId: string | null;
  assignedAt: string;
}

export interface WorkspaceOrganization {
  id: string;
  name: string;
  defaultCurrencyCode: string;
  /** Derived alias for existing currency formatting helpers. */
  currency: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  /** Display timezone derived from the active/first accessible branch. */
  timezone: string;
}

export interface WorkspaceBranch {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  status: BranchStatus;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  waitlistGeolocationEnabled: boolean;
  waitlistRadiusMeters: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceUser {
  id: string;
  authUserId: string;
  organizationId: string;
  displayName: string;
  email: string;
  status: StaffStatus;
  primaryRole: StaffRole;
  roles: WorkspaceRoleAssignment[];
  invitedAt: string | null;
  activatedAt: string | null;
  createdAt: string;
}

export interface WorkspaceContext {
  organization: WorkspaceOrganization;
  user: WorkspaceUser;
  branches: WorkspaceBranch[];
  /** Explicit staff_branch_assignments, distinct from RLS-accessible branches. */
  assignedBranchIds: string[];
  activeBranchId: string;
  activeBranch: WorkspaceBranch;
  /** Effective assignments for the active branch, including organization scope. */
  activeBranchRoles: WorkspaceRoleAssignment[];
  planLabel: string | null;
  isOrganizationScoped: boolean;
  isOrgAdmin: boolean;
}

export type WorkspaceLoadResult =
  | { status: "ready"; workspace: WorkspaceContext }
  | { status: "unauthenticated" }
  | { status: "auth_error"; error: NormalizedError }
  | { status: "no_active_staff" }
  | { status: "no_roles" }
  | {
      status: "no_branches";
      organization: WorkspaceOrganization;
      user: WorkspaceUser;
    }
  | { status: "error"; error: NormalizedError };

export type BranchSwitchResult =
  { ok: true } | { ok: false; error: "BRANCH_ACCESS_DENIED" | "INVALID_BRANCH" | "UNAVAILABLE" };
