import { effectiveRoles } from "@/features/workspace/access";
import type { WorkspaceLoadResult } from "@/features/workspace/types";

import type { KitchenViewer, KitchenViewerResult } from "./types";

/**
 * Converts the workspace result into kitchen viewer state. Only a genuinely
 * unauthenticated session redirects to login; transient workspace failures
 * remain retryable.
 */
export function resolveKitchenViewerResult(result: WorkspaceLoadResult): KitchenViewerResult {
  if (result.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (result.status === "auth_error") {
    if (result.error.confirmedAuthFailure) {
      return { status: "unauthenticated" };
    }

    return {
      status: "unavailable",
      error: {
        code: result.error.transient ? "SERVICE_UNAVAILABLE" : "WORKSPACE_NOT_READY",
        message: result.error.message,
        retryable: true,
      },
    };
  }

  if (result.status === "error") {
    return {
      status: "unavailable",
      error: {
        code: result.error.transient ? "SERVICE_UNAVAILABLE" : "WORKSPACE_NOT_READY",
        message: result.error.message,
        retryable: result.error.transient,
      },
    };
  }

  if (result.status !== "ready") {
    return {
      status: "unavailable",
      error: {
        code: "WORKSPACE_NOT_READY",
        message: "The workspace is not ready for kitchen operations.",
        retryable: true,
      },
    };
  }

  const workspace = result.workspace;
  const roles = effectiveRoles(workspace.user.roles, workspace.activeBranch.id);
  const viewer: KitchenViewer = {
    roles,
    branchId: workspace.activeBranch.id,
    branchName: workspace.activeBranch.name,
    timezone: workspace.activeBranch.timezone,
    isOrganizationScoped: workspace.isOrganizationScoped,
    isOrgAdmin: workspace.isOrgAdmin,
  };

  // Pages render an explicit unauthorized state when the role set cannot read
  // kitchen data. The backend remains the security boundary either way.
  return { status: "ready", viewer };
}
