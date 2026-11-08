import type { StaffInput, StaffMember, StaffRoleAssignment } from "./types";
import { BRANCH_SCOPED_ROLES, ORGANIZATION_SCOPED_ROLES } from "./types";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  type ValidationErrors,
  type ValidationTranslator,
} from "@/features/shared/validation";

export function validateStaff(
  input: StaffInput,
  existingStaff: StaffMember[],
  currentStaffId: string | undefined,
  t: ValidationTranslator,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const fullName = validateRequired(input.fullName, "fields.fullName", t, 120);
  if (fullName) errors.fullName = fullName;

  const email = validateEmail(input.email, "fields.staffEmail", t);
  if (email) {
    errors.email = email;
  } else {
    const duplicate = existingStaff.some(
      (member) =>
        member.id !== currentStaffId &&
        member.email.toLowerCase() === input.email.trim().toLowerCase(),
    );
    if (duplicate) {
      errors.email = t("duplicateEmail");
    }
  }

  const phone = validatePhone(input.phone, "fields.staffPhone", t);
  if (phone) errors.phone = phone;

  if (input.assignments.length !== 1) {
    errors.assignments = t("assignmentCount");
  }

  input.assignments.forEach((assignment, index) => {
    const scopeError = validateAssignment(assignment, t);
    if (scopeError) {
      errors[`assignments.${index}`] = scopeError;
    }
  });

  return errors;
}

export function validateAssignment(
  assignment: StaffRoleAssignment,
  t: ValidationTranslator,
): string | null {
  if (ORGANIZATION_SCOPED_ROLES.includes(assignment.role)) {
    return assignment.scope === "organization" && assignment.branchId === null
      ? null
      : t("ownerScope");
  }

  if (assignment.role === "admin") {
    if (assignment.scope === "organization") {
      return assignment.branchId === null ? null : t("adminScope");
    }
    return assignment.branchId ? null : t("adminBranch");
  }

  if (BRANCH_SCOPED_ROLES.includes(assignment.role)) {
    if (assignment.scope !== "branch") {
      return t("roleBranch");
    }
    return assignment.branchId ? null : t("branchRequired");
  }

  return t("invalidRole");
}
