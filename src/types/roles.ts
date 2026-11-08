/**
 * Canonical staff role identifiers.
 *
 * These identifiers are language-neutral and shared by the shell, navigation,
 * staff features, and mock data. Display labels live in the translation
 * dictionaries, not in this module.
 *
 * The initial release supports exactly five roles. Do not add legacy aliases
 * such as `org_admin`, `branch_manager`, `kitchen`, or `host`.
 */

export const STAFF_ROLES = ["owner", "admin", "manager", "cashier", "kitchen_staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Organization owner",
  admin: "Organization administrator",
  manager: "Branch manager",
  cashier: "Cashier",
  kitchen_staff: "Kitchen staff",
};

/** Roles that are always organization-scoped. */
export const ORGANIZATION_SCOPED_ROLES: readonly StaffRole[] = ["owner"];

/** Roles that are always branch-scoped. Admin may use either scope. */
export const BRANCH_SCOPED_ROLES: readonly StaffRole[] = ["manager", "cashier", "kitchen_staff"];

/** Roles with management-level navigation visibility. */
export const MANAGER_ROLES: readonly StaffRole[] = ["owner", "admin", "manager"];
