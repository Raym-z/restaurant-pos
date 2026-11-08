import assert from "node:assert/strict";
import { test } from "node:test";

import type { Database } from "@/lib/supabase/database.types";

import { derivePrimaryRole, hasOrganizationScope, isOrganizationAdmin } from "../access";
import { findActiveBranch, resolveActiveBranchId } from "../branch-selection";
import { buildWorkspace, mapBranch, mapOrganization, mapRoleAssignments } from "../mappers";
import type { WorkspaceBranch, WorkspaceRoleAssignment } from "../types";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type BranchRow = Database["public"]["Tables"]["branches"]["Row"];
type StaffProfileRow = Database["public"]["Tables"]["staff_profiles"]["Row"];
type RoleAssignmentRow = Database["public"]["Tables"]["staff_role_assignments"]["Row"];

function branchRow(overrides: Partial<BranchRow> = {}): BranchRow {
  return {
    id: "branch-1",
    organization_id: "org-1",
    name: "Senopati",
    timezone: "Asia/Jakarta",
    status: "active",
    deactivated_at: null,
    address: "Jl. Senopati No. 8",
    phone: "+62215550142",
    latitude: null,
    longitude: null,
    waitlist_geolocation_enabled: false,
    waitlist_radius_meters: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function roleRow(overrides: Partial<RoleAssignmentRow> = {}): RoleAssignmentRow {
  return {
    id: "role-1",
    staff_id: "staff-1",
    organization_id: "org-1",
    role_code: "owner",
    scope_type: "organization",
    assigned_by_staff_id: null,
    assigned_at: "2026-01-01T00:00:00Z",
    revoked_at: null,
    revoked_by_staff_id: null,
    reason: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const organizationRow: OrganizationRow = {
  id: "org-1",
  name: "Terrace & Vine",
  default_currency_code: "IDR",
  status: "active",
  deletion_requested_at: null,
  deletion_scheduled_for: null,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const profileRow: StaffProfileRow = {
  id: "staff-1",
  auth_user_id: "auth-1",
  organization_id: "org-1",
  display_name: "Amara Okafor",
  status: "active",
  invited_at: null,
  activated_at: "2026-01-01T00:00:00Z",
  deactivated_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function workspaceBranch(overrides: Partial<WorkspaceBranch> = {}): WorkspaceBranch {
  return {
    ...mapBranch(branchRow()),
    ...overrides,
  };
}

function role(
  roleCode: "owner" | "admin" | "manager" | "cashier" | "kitchen_staff",
  scope: "organization" | "branch",
): WorkspaceRoleAssignment {
  return {
    id: `role-${roleCode}`,
    role: roleCode,
    scope,
    assignedAt: "2026-01-01T00:00:00Z",
  };
}

test("branch selection accepts only accessible branches and falls back safely", () => {
  const branches = [workspaceBranch(), workspaceBranch({ id: "branch-2", name: "Dago" })];

  assert.equal(resolveActiveBranchId("branch-2", branches), "branch-2");
  assert.equal(resolveActiveBranchId("missing", branches), "branch-1");
  assert.equal(resolveActiveBranchId(null, branches), "branch-1");
  assert.equal(resolveActiveBranchId("missing", []), null);
  assert.equal(findActiveBranch("missing", branches)?.id, "branch-1");
});

test("primary role and scope are derived from all active assignments", () => {
  const roles = [role("cashier", "branch"), role("manager", "branch")];

  assert.equal(derivePrimaryRole(roles), "manager");
  assert.equal(hasOrganizationScope(roles), false);
  assert.equal(isOrganizationAdmin(roles), false);

  const orgRoles = [role("admin", "organization")];
  assert.equal(hasOrganizationScope(orgRoles), true);
  assert.equal(isOrganizationAdmin(orgRoles), true);
});

test("role mapping ignores unknown role codes", () => {
  const roles = mapRoleAssignments([
    roleRow(),
    roleRow({ id: "role-2", role_code: "host", scope_type: "branch" }),
  ]);

  assert.deepEqual(
    roles.map((assignment) => assignment.role),
    ["owner"],
  );
});

test("organization and branch mapping use only backend fields", () => {
  const organization = mapOrganization(organizationRow, "Asia/Jakarta");
  const branch = mapBranch(branchRow());

  assert.equal(organization.currency, "IDR");
  assert.equal(organization.timezone, "Asia/Jakarta");
  assert.equal(branch.address, "Jl. Senopati No. 8");
  assert.equal(branch.timezone, "Asia/Jakarta");
  assert.equal("code" in branch, false);
  assert.equal("city" in branch, false);
});

test("organization-scoped owner gets accessible branches without explicit assignments", () => {
  const workspace = buildWorkspace({
    organization: organizationRow,
    profile: profileRow,
    email: "owner@example.com",
    roleRows: [roleRow()],
    branchRows: [branchRow(), branchRow({ id: "branch-2", name: "Dago" })],
    assignedBranchIds: [],
    activeBranchCandidate: null,
    planLabel: "Free",
  });

  assert.ok(workspace);
  assert.equal(workspace.branches.length, 2);
  assert.deepEqual(workspace.assignedBranchIds, []);
  assert.equal(workspace.isOrganizationScoped, true);
  assert.equal(workspace.isOrgAdmin, true);
  assert.equal(workspace.activeBranch.id, "branch-1");
  assert.equal(workspace.organization.timezone, "Asia/Jakarta");
});

test("branch-scoped manager only receives RLS-returned accessible branches", () => {
  const workspace = buildWorkspace({
    organization: organizationRow,
    profile: profileRow,
    email: "manager@example.com",
    roleRows: [roleRow({ role_code: "manager", scope_type: "branch" })],
    branchRows: [branchRow()],
    assignedBranchIds: ["branch-1"],
    activeBranchCandidate: "branch-1",
    planLabel: null,
  });

  assert.ok(workspace);
  assert.deepEqual(workspace.assignedBranchIds, ["branch-1"]);
  assert.equal(workspace.branches.length, 1);
  assert.equal(workspace.isOrganizationScoped, false);
  assert.equal(workspace.isOrgAdmin, false);
  assert.equal(workspace.planLabel, null);
});

test("invalid active-branch candidate falls back to the first accessible branch", () => {
  const workspace = buildWorkspace({
    organization: organizationRow,
    profile: profileRow,
    email: "owner@example.com",
    roleRows: [roleRow()],
    branchRows: [branchRow({ id: "branch-1" }), branchRow({ id: "branch-2" })],
    assignedBranchIds: [],
    activeBranchCandidate: "branch-999",
    planLabel: null,
  });

  assert.ok(workspace);
  assert.equal(workspace.activeBranchId, "branch-1");
});

test("workspace cannot be built without roles or accessible branches", () => {
  assert.equal(
    buildWorkspace({
      organization: organizationRow,
      profile: profileRow,
      email: "owner@example.com",
      roleRows: [],
      branchRows: [branchRow()],
      assignedBranchIds: [],
      activeBranchCandidate: null,
      planLabel: null,
    }),
    null,
  );

  assert.equal(
    buildWorkspace({
      organization: organizationRow,
      profile: profileRow,
      email: "owner@example.com",
      roleRows: [roleRow()],
      branchRows: [],
      assignedBranchIds: [],
      activeBranchCandidate: null,
      planLabel: null,
    }),
    null,
  );
});
