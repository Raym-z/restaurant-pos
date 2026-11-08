import type { StaffMember, StaffRole, StaffRoleAssignment, StaffStatus } from "./types";

export interface StaffFilters {
  query: string;
  role: StaffRole | "all";
  branchId: string | "all";
  status: StaffStatus | "all";
}

export function primaryAssignment(member: StaffMember): StaffRoleAssignment | undefined {
  return member.assignments[0];
}

export function isOrganizationScoped(member: StaffMember): boolean {
  return member.assignments.some((assignment) => assignment.scope === "organization");
}

export function filterStaff(
  staff: StaffMember[],
  { query, role, branchId, status }: StaffFilters,
): StaffMember[] {
  const normalized = query.trim().toLowerCase();
  return staff.filter((member) => {
    if (status !== "all" && member.status !== status) {
      return false;
    }
    if (role !== "all" && !member.assignments.some((assignment) => assignment.role === role)) {
      return false;
    }
    if (
      branchId !== "all" &&
      !member.assignments.some(
        (assignment) => assignment.scope === "branch" && assignment.branchId === branchId,
      )
    ) {
      return false;
    }
    if (!normalized) {
      return true;
    }
    return [member.fullName, member.email, member.phone].some((value) =>
      value.toLowerCase().includes(normalized),
    );
  });
}
