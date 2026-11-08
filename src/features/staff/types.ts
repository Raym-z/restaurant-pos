import type { IsoInstant, Uuid } from "@/features/shared/domain";

/**
 * The five initial staff roles defined by the shared role contract. Custom
 * roles are not part of the initial release (see docs/roles-and-permissions.md).
 */
export const STAFF_ROLES = ["owner", "admin", "manager", "cashier", "kitchen_staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export type RoleScope = "organization" | "branch";

export interface StaffRoleAssignment {
  role: StaffRole;
  scope: RoleScope;
  /** Required for branch-scoped assignments, null for organization scope. */
  branchId: Uuid | null;
}

export type StaffStatus = "active" | "invited" | "inactive";

export interface StaffMember {
  id: Uuid;
  organizationId: Uuid;
  fullName: string;
  email: string;
  phone: string;
  assignments: StaffRoleAssignment[];
  status: StaffStatus;
  joinedAt: IsoInstant;
  lastActiveAt: IsoInstant | null;
}

export interface StaffInput {
  fullName: string;
  email: string;
  phone: string;
  assignments: StaffRoleAssignment[];
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Organization owner",
  admin: "Organization admin",
  manager: "Branch manager",
  cashier: "Cashier",
  kitchen_staff: "Kitchen staff",
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

/**
 * Roles that are always organization-scoped, and roles that are branch-scoped,
 * following the shared role contract. Admin may use either scope.
 */
export const ORGANIZATION_SCOPED_ROLES: readonly StaffRole[] = ["owner"];
export const BRANCH_SCOPED_ROLES: readonly StaffRole[] = ["manager", "cashier", "kitchen_staff"];
