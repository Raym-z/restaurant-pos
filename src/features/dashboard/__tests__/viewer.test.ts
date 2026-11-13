import assert from "node:assert/strict";
import test from "node:test";

import type {
  WorkspaceBranch,
  WorkspaceContext,
  WorkspaceRoleAssignment,
} from "@/features/workspace/types";

import { resolveDashboardBranch, resolveDashboardViewer } from "../viewer";

const branchA: WorkspaceBranch = {
  id: "branch-a",
  organizationId: "org-1",
  name: "Senopati",
  timezone: "Asia/Jakarta",
  status: "active",
  address: null,
  phone: null,
  latitude: null,
  longitude: null,
  waitlistGeolocationEnabled: false,
  waitlistRadiusMeters: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const branchB: WorkspaceBranch = {
  ...branchA,
  id: "branch-b",
  name: "Ubud",
  timezone: "Asia/Makassar",
};

function assignment(
  role: WorkspaceRoleAssignment["role"],
  scope: WorkspaceRoleAssignment["scope"],
  branchId: string | null,
): WorkspaceRoleAssignment {
  return {
    id: `${role}-${branchId ?? "org"}`,
    role,
    scope,
    branchId,
    assignedAt: "2026-01-01T00:00:00Z",
  };
}

function workspace(overrides: Partial<WorkspaceContext> = {}): WorkspaceContext {
  return {
    organization: {
      id: "org-1",
      name: "Terrace & Vine",
      defaultCurrencyCode: "IDR",
      currency: "IDR",
      status: "active",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      timezone: "Asia/Jakarta",
    },
    user: {
      id: "staff-1",
      authUserId: "auth-1",
      organizationId: "org-1",
      displayName: "Amara",
      email: "amara@example.com",
      status: "active",
      primaryRole: "manager",
      roles: [assignment("manager", "branch", "branch-a")],
      invitedAt: null,
      activatedAt: "2026-01-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
    },
    branches: [branchA, branchB],
    assignedBranchIds: ["branch-a", "branch-b"],
    activeBranchId: "branch-a",
    activeBranch: branchA,
    activeBranchRoles: [assignment("manager", "branch", "branch-a")],
    planLabel: null,
    isOrganizationScoped: false,
    isOrgAdmin: false,
    ...overrides,
  };
}

test("the dashboard viewer uses only branches from the workspace", () => {
  const result = resolveDashboardViewer({ status: "ready", workspace: workspace() });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") {
    return;
  }

  assert.equal(result.viewer.branchId, "branch-a");
  assert.deepEqual(
    result.viewer.branches.map((branch) => branch.id),
    ["branch-a", "branch-b"],
  );
  assert.deepEqual(result.viewer.roles, ["manager"]);
});

test("branch lookups reject branches outside the workspace collection", () => {
  const result = resolveDashboardViewer({ status: "ready", workspace: workspace() });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") {
    return;
  }

  assert.equal(resolveDashboardBranch(result.viewer, "branch-b")?.name, "Ubud");
  assert.equal(resolveDashboardBranch(result.viewer, "branch-foreign"), null);
});

test("branch-scoped viewers only receive explicitly assigned accessible branches", () => {
  const result = resolveDashboardViewer({
    status: "ready",
    workspace: workspace({ assignedBranchIds: ["branch-a"] }),
  });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") {
    return;
  }

  assert.deepEqual(
    result.viewer.branches.map((branch) => branch.id),
    ["branch-a"],
  );
  assert.equal(resolveDashboardBranch(result.viewer, "branch-b"), null);
});

test("unauthenticated and non-ready workspaces do not produce a viewer", () => {
  assert.equal(resolveDashboardViewer({ status: "unauthenticated" }).status, "unauthenticated");
  assert.equal(resolveDashboardViewer({ status: "no_roles" }).status, "unavailable");
  assert.equal(
    resolveDashboardViewer({
      status: "no_branches",
      organization: workspace().organization,
      user: workspace().user,
    }).status,
    "unavailable",
  );
});

test("confirmed expired sessions map to login while transient failures stay retryable", () => {
  assert.equal(
    resolveDashboardViewer({
      status: "auth_error",
      error: {
        code: "AUTH_SESSION_EXPIRED",
        message: "expired",
        confirmedAuthFailure: true,
        transient: false,
      },
    }).status,
    "unauthenticated",
  );

  const transient = resolveDashboardViewer({
    status: "auth_error",
    error: {
      code: "AUTH_UNAVAILABLE",
      message: "unavailable",
      confirmedAuthFailure: false,
      transient: true,
    },
  });
  assert.equal(transient.status, "unavailable");
  if (transient.status === "unavailable") {
    assert.equal(transient.error.code, "SERVICE_UNAVAILABLE");
    assert.equal(transient.error.retryable, true);
  }
});
