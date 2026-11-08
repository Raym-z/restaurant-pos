import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  WorkspaceBranch,
  WorkspaceContext,
  WorkspaceRoleAssignment,
} from "@/features/workspace/types";

import { resolvePosViewerResult } from "../viewer";

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

test("only unauthenticated or confirmed expired sessions map to login", () => {
  assert.equal(resolvePosViewerResult({ status: "unauthenticated" }).status, "unauthenticated");
  assert.equal(
    resolvePosViewerResult({
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
});

test("temporary workspace failures remain retryable and never redirect to login", () => {
  const transient = resolvePosViewerResult({
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

  const noRoles = resolvePosViewerResult({ status: "no_roles" });
  assert.equal(noRoles.status, "unavailable");
  if (noRoles.status === "unavailable") {
    assert.equal(noRoles.error.code, "WORKSPACE_NOT_READY");
  }

  const inactiveStaff = resolvePosViewerResult({ status: "no_active_staff" });
  assert.equal(inactiveStaff.status, "unavailable");
  if (inactiveStaff.status === "unavailable") {
    assert.equal(inactiveStaff.error.code, "WORKSPACE_NOT_READY");
  }
});

test("POS viewer uses only effective roles for the active branch", () => {
  const result = resolvePosViewerResult({
    status: "ready",
    workspace: workspace({
      user: {
        ...workspace().user,
        roles: [
          assignment("admin", "organization", null),
          assignment("manager", "branch", "branch-a"),
          assignment("cashier", "branch", "branch-b"),
        ],
      },
    }),
  });

  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.deepEqual([...result.viewer.roles].sort(), ["admin", "manager"]);
    assert.equal(result.viewer.branchId, "branch-a");
  }
});
