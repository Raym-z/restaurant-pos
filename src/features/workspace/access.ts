import { STAFF_ROLES, type StaffRole } from "@/types/roles";

import type { WorkspaceRoleAssignment } from "./types";

const ROLE_PRECEDENCE: readonly StaffRole[] = [
  "owner",
  "admin",
  "manager",
  "cashier",
  "kitchen_staff",
];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export function derivePrimaryRole(roles: readonly WorkspaceRoleAssignment[]): StaffRole {
  for (const role of ROLE_PRECEDENCE) {
    if (roles.some((assignment) => assignment.role === role)) {
      return role;
    }
  }

  return "kitchen_staff";
}

export function hasOrganizationScope(roles: readonly WorkspaceRoleAssignment[]): boolean {
  return roles.some((assignment) => assignment.scope === "organization");
}

export function isOrganizationAdmin(roles: readonly WorkspaceRoleAssignment[]): boolean {
  return roles.some(
    (assignment) =>
      assignment.scope === "organization" &&
      (assignment.role === "owner" || assignment.role === "admin"),
  );
}

export function uniqueRoles(roles: readonly WorkspaceRoleAssignment[]): StaffRole[] {
  return [...new Set(roles.map((assignment) => assignment.role))];
}
