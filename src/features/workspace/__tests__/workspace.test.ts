import assert from "node:assert/strict";
import { test } from "node:test";

import { getNavigationForContext } from "../../../config/navigation";
import type { Database } from "@/lib/supabase/database.types";

import {
  canManageBranches,
  deriveEffectivePrimaryRole,
  derivePrimaryRole,
  effectiveRoleAssignments,
  effectiveRoles,
  hasOrganizationScope,
  isOrganizationAdmin,
} from "../access";
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
    branch_id: null,
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
  branchId: string | null = scope === "branch" ? "branch-1" : null,
): WorkspaceRoleAssignment {
  return {
    id: `role-${roleCode}-${branchId ?? "org"}`,
    role: roleCode,
    scope,
    branchId,
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

test("effective roles include organization scope and only the active branch", () => {
  const assignments = [
    role("manager", "branch", "branch-a"),
    role("cashier", "branch", "branch-b"),
    role("admin", "organization"),
  ];

  assert.deepEqual(effectiveRoles(assignments, "branch-a").sort(), ["admin", "manager"]);
  assert.deepEqual(effectiveRoles(assignments, "branch-b").sort(), ["admin", "cashier"]);
  assert.deepEqual(effectiveRoles(assignments, "branch-c"), ["admin"]);
  assert.equal(deriveEffectivePrimaryRole(assignments, "branch-a"), "admin");
  assert.equal(
    deriveEffectivePrimaryRole(
      [role("manager", "branch", "branch-a"), role("cashier", "branch", "branch-b")],
      "branch-a",
    ),
    "manager",
  );
  assert.equal(
    deriveEffectivePrimaryRole(
      [role("manager", "branch", "branch-a"), role("cashier", "branch", "branch-b")],
      "branch-b",
    ),
    "cashier",
  );
});

test("branch-scoped admin never receives organization-admin capabilities", () => {
  const assignments = [role("admin", "branch", "branch-a")];

  assert.equal(isOrganizationAdmin(assignments), false);
  assert.equal(hasOrganizationScope(assignments), false);
  assert.equal(canManageBranches(effectiveRoles(assignments, "branch-a")), true);
  assert.equal(canManageBranches(effectiveRoles(assignments, "branch-b")), false);
});

test("a user with no role at the active branch has no effective roles", () => {
  const assignments = [role("manager", "branch", "branch-a")];

  assert.deepEqual(effectiveRoles(assignments, "branch-b"), []);
  assert.deepEqual(effectiveRoleAssignments(assignments, "branch-b"), []);
  assert.equal(deriveEffectivePrimaryRole(assignments, "branch-b"), "kitchen_staff");
  assert.equal(canManageBranches(effectiveRoles(assignments, "branch-b")), false);
});

test("branch switching updates the effective primary role", () => {
  const assignments = [
    role("manager", "branch", "branch-a"),
    role("kitchen_staff", "branch", "branch-b"),
  ];

  assert.equal(deriveEffectivePrimaryRole(assignments, "branch-a"), "manager");
  assert.equal(deriveEffectivePrimaryRole(assignments, "branch-b"), "kitchen_staff");
  assert.deepEqual(effectiveRoles(assignments, "branch-a"), ["manager"]);
  assert.deepEqual(effectiveRoles(assignments, "branch-b"), ["kitchen_staff"]);
});

test("navigation uses effective roles and hides branch operations with no active role", () => {
  const assignments = [role("manager", "branch", "branch-a")];
  const hrefs = getNavigationForContext({
    roles: effectiveRoles(assignments, "branch-b"),
    isOrganizationScoped: false,
    isOrgAdmin: false,
  }).flatMap((section) => section.items.map((item) => item.href));

  assert.ok(!hrefs.includes("/tables"));
  assert.ok(!hrefs.includes("/orders"));
  assert.ok(!hrefs.includes("/branches"));
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

test("role mapping preserves the branch identifier from M2.1", () => {
  const roles = mapRoleAssignments([
    roleRow({ id: "role-org", scope_type: "organization", branch_id: null }),
    roleRow({
      id: "role-branch",
      role_code: "cashier",
      scope_type: "branch",
      branch_id: "branch-2",
    }),
  ]);

  assert.equal(roles[0]?.branchId, null);
  assert.equal(roles[1]?.branchId, "branch-2");
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
  assert.deepEqual(
    workspace.activeBranchRoles.map((assignment) => assignment.role),
    ["owner"],
  );
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
    roleRows: [roleRow({ role_code: "manager", scope_type: "branch", branch_id: "branch-1" })],
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
