import { APP_TIMEZONE } from "@/i18n/config";
import type { Database } from "@/lib/supabase/database.types";

import {
  deriveEffectivePrimaryRole,
  derivePrimaryRole,
  effectiveRoleAssignments,
  hasOrganizationScope,
  isOrganizationAdmin,
  isStaffRole,
} from "./access";
import { resolveActiveBranchId } from "./branch-selection";
import type {
  WorkspaceBranch,
  WorkspaceContext,
  WorkspaceOrganization,
  WorkspaceRoleAssignment,
  WorkspaceUser,
} from "./types";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
type StaffProfileRow = Database["public"]["Tables"]["staff_profiles"]["Row"];

/** The subset selected by the workspace loader. */
export interface RoleAssignmentSource {
  id: string;
  role_code: string;
  scope_type: "organization" | "branch";
  branch_id: string | null;
  assigned_at: string;
}

export function mapOrganization(row: OrganizationRow, timezone: string): WorkspaceOrganization {
  return {
    id: row.id,
    name: row.name,
    defaultCurrencyCode: row.default_currency_code,
    currency: row.default_currency_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timezone,
  };
}

export function mapBranch(row: BranchRow): WorkspaceBranch {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    timezone: row.timezone,
    status: row.status,
    address: row.address,
    phone: row.phone,
    latitude: row.latitude,
    longitude: row.longitude,
    waitlistGeolocationEnabled: row.waitlist_geolocation_enabled,
    waitlistRadiusMeters: row.waitlist_radius_meters,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRoleAssignments(
  rows: readonly RoleAssignmentSource[],
): WorkspaceRoleAssignment[] {
  return rows.flatMap((row) => {
    if (!isStaffRole(row.role_code)) {
      return [];
    }

    return [
      {
        id: row.id,
        role: row.role_code,
        scope: row.scope_type,
        branchId: row.scope_type === "branch" ? row.branch_id : null,
        assignedAt: row.assigned_at,
      },
    ];
  });
}

export function mapUser(
  profile: StaffProfileRow,
  email: string,
  roles: readonly WorkspaceRoleAssignment[],
): WorkspaceUser {
  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    organizationId: profile.organization_id,
    displayName: profile.display_name,
    email,
    status: profile.status,
    primaryRole: derivePrimaryRole(roles),
    roles: [...roles],
    invitedAt: profile.invited_at,
    activatedAt: profile.activated_at,
    createdAt: profile.created_at,
  };
}

export interface BuildWorkspaceInput {
  organization: OrganizationRow;
  profile: StaffProfileRow;
  email: string;
  roleRows: readonly RoleAssignmentSource[];
  branchRows: readonly BranchRow[];
  assignedBranchIds: readonly string[];
  activeBranchCandidate: string | null;
  planLabel: string | null;
}

export function buildWorkspace({
  organization,
  profile,
  email,
  roleRows,
  branchRows,
  assignedBranchIds,
  activeBranchCandidate,
  planLabel,
}: BuildWorkspaceInput): WorkspaceContext | null {
  const roles = mapRoleAssignments(roleRows);
  if (roles.length === 0) {
    return null;
  }

  const branches = branchRows.map(mapBranch);
  if (branches.length === 0) {
    return null;
  }

  const activeBranchId = resolveActiveBranchId(activeBranchCandidate, branches);
  if (!activeBranchId) {
    return null;
  }

  const activeBranch = branches.find((branch) => branch.id === activeBranchId) ?? branches[0];
  if (!activeBranch) {
    return null;
  }

  const displayTimezone = activeBranch.timezone || APP_TIMEZONE;
  const organizationView = mapOrganization(organization, displayTimezone);
  const activeBranchRoles = effectiveRoleAssignments(roles, activeBranchId);
  const userView = {
    ...mapUser(profile, email, roles),
    primaryRole: deriveEffectivePrimaryRole(roles, activeBranchId),
  };

  return {
    organization: organizationView,
    user: userView,
    branches,
    assignedBranchIds: [...new Set(assignedBranchIds)],
    activeBranchId,
    activeBranch,
    activeBranchRoles,
    planLabel,
    isOrganizationScoped: hasOrganizationScope(roles),
    isOrgAdmin: isOrganizationAdmin(roles),
  };
}
