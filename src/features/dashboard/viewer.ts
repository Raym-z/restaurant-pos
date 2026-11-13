import { effectiveRoles } from "@/features/workspace/access";
import type { WorkspaceLoadResult } from "@/features/workspace/types";

import type { DashboardActionError, DashboardViewer, DashboardViewerResult } from "./types";

function unavailable(error: DashboardActionError): DashboardViewerResult {
  return { status: "unavailable", error };
}

/**
 * Converts the RLS-protected workspace into the dashboard viewer.
 *
 * Branch scope comes from the workspace's accessible branch collection. The
 * dashboard never accepts a branch identifier from a client as proof of
 * access; every read RPC re-authorizes the authenticated staff profile.
 */
export function resolveDashboardViewer(result: WorkspaceLoadResult): DashboardViewerResult {
  if (result.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (result.status === "auth_error") {
    if (result.error.confirmedAuthFailure) {
      return { status: "unauthenticated" };
    }

    return unavailable({
      code: result.error.transient ? "SERVICE_UNAVAILABLE" : "WORKSPACE_NOT_READY",
      message: result.error.message,
      retryable: true,
    });
  }

  if (result.status === "error") {
    return unavailable({
      code: result.error.transient ? "SERVICE_UNAVAILABLE" : "WORKSPACE_NOT_READY",
      message: result.error.message,
      retryable: result.error.transient,
    });
  }

  if (result.status !== "ready") {
    return unavailable({
      code: "WORKSPACE_NOT_READY",
      message: "The workspace is not ready for dashboard operations.",
      retryable: true,
    });
  }

  const workspace = result.workspace;
  const branch = workspace.activeBranch;
  const accessibleBranches = workspace.isOrganizationScoped
    ? workspace.branches
    : workspace.branches.filter((candidate) => workspace.assignedBranchIds.includes(candidate.id));

  if (accessibleBranches.length === 0) {
    return unavailable({
      code: "WORKSPACE_NOT_READY",
      message: "No accessible branch is available for dashboard operations.",
      retryable: true,
    });
  }

  const viewer: DashboardViewer = {
    roles: effectiveRoles(workspace.user.roles, branch.id),
    branchId: branch.id,
    branchName: branch.name,
    branches: accessibleBranches,
    timezone: branch.timezone,
    currency: workspace.organization.defaultCurrencyCode,
    isOrganizationScoped: workspace.isOrganizationScoped,
    isOrgAdmin: workspace.isOrgAdmin,
  };

  return { status: "ready", viewer };
}

/** Returns the branch only when it is part of the viewer's accessible set. */
export function resolveDashboardBranch(
  viewer: DashboardViewer,
  branchId: string,
): DashboardViewer["branches"][number] | null {
  return viewer.branches.find((branch) => branch.id === branchId) ?? null;
}
