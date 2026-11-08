import type { IsoInstant, Uuid } from "@/features/shared/domain";
import {
  BRANCH_SCOPED_ROLES,
  ORGANIZATION_SCOPED_ROLES,
  STAFF_ROLES,
  STAFF_ROLE_LABELS,
  type StaffRole,
} from "@/types/roles";

export { BRANCH_SCOPED_ROLES, ORGANIZATION_SCOPED_ROLES, STAFF_ROLES, STAFF_ROLE_LABELS };
export type { StaffRole };

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

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};
