import type { StaffInput, StaffMember, StaffRoleAssignment } from "./types";
import { BRANCH_SCOPED_ROLES, ORGANIZATION_SCOPED_ROLES } from "./types";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  type ValidationErrors,
} from "@/features/shared/validation";

export function validateStaff(
  input: StaffInput,
  existingStaff: StaffMember[],
  currentStaffId?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const fullName = validateRequired(input.fullName, "Full name", 120);
  if (fullName) errors.fullName = fullName;

  const email = validateEmail(input.email);
  if (email) {
    errors.email = email;
  } else {
    const duplicate = existingStaff.some(
      (member) =>
        member.id !== currentStaffId &&
        member.email.toLowerCase() === input.email.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.email = "Another staff member already uses this email address.";
    }
  }

  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;

  if (input.assignments.length !== 1) {
    errors.assignments = "Select exactly one role for this staff member.";
  }

  input.assignments.forEach((assignment, index) => {
    const scopeError = validateAssignment(assignment);
    if (scopeError) {
      errors[`assignments.${index}`] = scopeError;
    }
  });

  return errors;
}

export function validateAssignment(assignment: StaffRoleAssignment): string | null {
  if (ORGANIZATION_SCOPED_ROLES.includes(assignment.role)) {
    return assignment.scope === "organization" && assignment.branchId === null
      ? null
      : "Organization owners must have organization-wide access.";
  }

  if (assignment.role === "admin") {
    if (assignment.scope === "organization") {
      return assignment.branchId === null
        ? null
        : "Organization-scoped admins must not be tied to a single branch.";
    }
    return assignment.branchId ? null : "Choose a branch for this branch-scoped admin.";
  }

  if (BRANCH_SCOPED_ROLES.includes(assignment.role)) {
    if (assignment.scope !== "branch") {
      return "This role must be assigned to a branch.";
    }
    return assignment.branchId ? null : "Choose the branch this staff member belongs to.";
  }

  return "Choose a valid staff role.";
}
