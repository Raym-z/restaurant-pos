import { effectiveRoles } from "@/features/workspace/access";
import type { WorkspaceLoadResult } from "@/features/workspace/types";

import type { PosActionError, PosViewer } from "./types";

export type PosViewerResult =
  | { status: "ready"; viewer: PosViewer }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: PosActionError };

/**
 * Converts the workspace result into POS viewer state.
 *
 * Only a genuinely unauthenticated session redirects to login. Temporary
 * workspace/backend failures remain retryable errors, and non-ready access
 * states surface an administrator-actionable message.
 */
export function resolvePosViewerResult(result: WorkspaceLoadResult): PosViewerResult {
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
        message: "The workspace is not ready for this operation.",
        retryable: true,
      },
    };
  }

  return {
    status: "ready",
    viewer: {
      roles: effectiveRoles(result.workspace.user.roles, result.workspace.activeBranch.id),
      branchId: result.workspace.activeBranch.id,
      timezone: result.workspace.activeBranch.timezone,
      currency: result.workspace.organization.defaultCurrencyCode,
      isOrganizationScoped: result.workspace.isOrganizationScoped,
      isOrgAdmin: result.workspace.isOrgAdmin,
    },
  };
}
