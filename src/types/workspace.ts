/**
 * Workspace view models.
 *
 * These are temporary frontend-facing shapes used by the application shell
 * while authentication and backend contracts are being finalized. They are
 * intentionally small and must not be treated as database schema definitions.
 * Replace them with shared backend types in Phase 2.
 */

export const STAFF_ROLES = [
  "owner",
  "org_admin",
  "branch_manager",
  "cashier",
  "kitchen",
  "host",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Organization owner",
  org_admin: "Organization administrator",
  branch_manager: "Branch manager",
  cashier: "Cashier",
  kitchen: "Kitchen staff",
  host: "Host",
};

export interface BranchSummary {
  id: string;
  name: string;
  shortName: string;
  city: string;
  timezone: string;
  currency: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  planLabel: string;
  branches: BranchSummary[];
}

export interface WorkspaceSnapshot {
  organization: OrganizationSummary;
  user: StaffUser;
  defaultBranchId: string;
}
